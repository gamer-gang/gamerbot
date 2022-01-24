import { EggLeaderboard } from '@prisma/client'
import { MessageActionRow, MessageButton } from 'discord.js'
import _ from 'lodash'
import assert from 'node:assert'
import { prisma } from '../../prisma.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const makeEmbed = ({
  pages,
  pageNumber,
  totalEggers,
  totalEggs,
  type,
}: {
  pages: Array<Array<Pick<EggLeaderboard, 'collected' | 'balance' | 'userTag' | 'userId'>>>
  pageNumber: number
  totalEggers: string
  totalEggs: string
  type: 'collected' | 'balance'
}): Embed => {
  if (pages.length === 0) {
    return Embed.info(`🥚 Top eggers (${type})`, 'No eggers! Get egging!!!')
  }

  const page = pages[pageNumber]

  const formattedList = page
    .map(
      (lb, index) =>
        `${pageNumber * 20 + index + 1}. **${lb.userTag}** with **${lb[
          type
        ].toLocaleString()}** egg${BigInt(lb[type]) > 1n ? 's' : ''}`
    )
    .join('\n')

  const embed = Embed.info(
    `🥚 Top eggers (${type})`,
    `Total eggers: **${totalEggers}**\nTotal eggs: **${totalEggs}**\n\n${formattedList}`
  )

  if (pages.length > 1) {
    embed.setFooter({ text: `Page ${pageNumber + 1}/${pages.length}` })
  }

  return embed
}

const COMMAND_EGGLEADERBOARD = command('CHAT_INPUT', {
  name: 'eggleaderboard',
  description: 'Show top egg olders',
  options: [
    {
      name: 'type',
      description: 'Type of eggs',
      type: 'STRING',
      choices: [
        { name: 'collected', value: 'collected' },
        { name: 'balance', value: 'balance' },
      ],
    },
    {
      name: 'user',
      description: 'User to show',
      type: 'USER',
    },
  ],
  async run(context) {
    const { interaction, client, options } = context

    const type = options.getString('type') ?? 'collected'
    assert(type === 'collected' || type === 'balance', 'Invalid type')

    const userInput = options.getUser('user')

    if (interaction.channel == null) {
      await interaction.reply('Please use this command in a channel.')
      return CommandResult.Success
    }

    const eggers = _.sortBy((await prisma.eggLeaderboard.findMany()) ?? [], type)

    // eggers.sort((a, b) => {
    //   const aVal = a[type]
    //   const bVal = b[type]
    //   if (aVal > bVal) return -1
    //   if (aVal < bVal) return 1
    //   return 0
    // })

    if (userInput != null) {
      const user = client.users.resolve(userInput)

      if (user == null) {
        await interaction.reply({
          embeds: [Embed.error('Could not resolve user')],
          ephemeral: true,
        })
        return CommandResult.Success
      }

      if (client.user.id === user.id) {
        await interaction.reply({ embeds: [Embed.error("I don't have any eggs :(")] })
        return CommandResult.Success
      }

      const ranking = eggers.findIndex((lb) => lb.userId === user.id)

      if (ranking === -1) {
        await interaction.reply({
          embeds: [Embed.error('No data/invalid user', 'Get egging!!')],
          ephemeral: true,
        })
        return CommandResult.Success
      }

      const eggs = BigInt(eggers[ranking][type])

      const embed = Embed.info(
        `**${eggers[ranking].userTag}** is ranked **#${
          ranking + 1
        }** out of **${eggers.length.toLocaleString()}** in the world for ${
          type === 'collected' ? 'lifetime collected eggs' : 'egg balance'
        } with **${eggs.toLocaleString()}** egg${eggs > 1 ? 's' : ''}`
      )

      await interaction.reply({ embeds: [embed] })
      return CommandResult.Success
    }

    const totalEggers = eggers.length.toLocaleString()
    const totalEggs = eggers.reduce((a, b) => a + BigInt(b[type]), 0n).toLocaleString()

    const pages = _.chunk(eggers, 20)

    let pageNumber = 0

    if (pages.length === 1) {
      await interaction.reply({
        embeds: [makeEmbed({ pages, totalEggers, totalEggs, pageNumber, type })],
      })
      return CommandResult.Success
    }
    const row = new MessageActionRow({
      components: [
        new MessageButton({
          customId: 'prev',
          style: 'SECONDARY',
          emoji: '◀️',
        }),
        new MessageButton({
          customId: 'next',
          style: 'SECONDARY',
          emoji: '▶️',
        }),
      ],
    })

    await interaction.reply({
      embeds: [makeEmbed({ pages, totalEggers, totalEggs, pageNumber, type })],
      components: [row],
    })

    const reply = interaction.channel.messages.cache.get((await interaction.fetchReply()).id)!

    const collector = reply.createMessageComponentCollector({
      idle: 1000 * 60 * 5,
    })

    collector.on('collect', (interaction) => {
      if (interaction.customId === 'next') {
        pageNumber++
        if (pageNumber === pages.length) pageNumber = 0
      } else {
        pageNumber--
        if (pageNumber === -1) pageNumber = pages.length - 1
      }

      void interaction.update({
        embeds: [makeEmbed({ pages, totalEggers, totalEggs, pageNumber, type })],
        components: [row],
      })
    })

    collector.on('end', () => {
      void reply.edit({
        embeds: [makeEmbed({ pages, totalEggers, totalEggs, pageNumber, type })],
        components: [],
      })
    })

    return CommandResult.Success
  },
})

export default COMMAND_EGGLEADERBOARD
