import { Image } from '@napi-rs/canvas'
import { stripIndent } from 'common-tags'
import { ApplicationCommandOptionType, ApplicationCommandType, Formatters } from 'discord.js'
import type { HypixelCacheResponse } from 'hypixel-cache'
import assert from 'node:assert'
import { performance } from 'node:perf_hooks'
import { IS_DEVELOPMENT } from '../../constants.js'
import { interactionReplySafe } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import { formatBytes } from '../../util/format.js'
import { usernameRegex, uuidRegex } from '../../util/regex.js'
import command, { CommandResult } from '../command.js'
import STATS_PROVIDER_BEDWARS from './_bedwars.js'

const AVATAR_SIZE = 165

const STATS_PROVIDERS = [STATS_PROVIDER_BEDWARS]

const COMMAND_STATS = command(ApplicationCommandType.ChatInput, {
  name: 'stats',
  description: 'Show stats for Hypixel games.',
  examples: [
    {
      options: { gamemode: 'bedwars', username: 'ConnorLinfoot' },
      description: 'Get Bedwars stats for ConnorLinfoot.',
    },
    {
      options: { gamemode: 'bedwars' },
      description:
        'Get Bedwars stats for yourself, provided you have set your username/UUID with /username.',
    },
    {
      options: { gamemode: 'bedwarsdream', username: 'gamerboy80', debug: true },
      description: 'Get Bedwars Dream stats for gamerboy80, with debug info.',
    },
  ],
  options: [
    {
      name: 'gamemode',
      description: 'Gamemode to get stats for.',
      type: ApplicationCommandOptionType.String,
      choices: STATS_PROVIDERS.map((provider) => ({
        name: provider.displayName,
        value: provider.name,
      })),
    },
    {
      name: 'username',
      description: 'Username/UUID to get stats for.',
      type: ApplicationCommandOptionType.String,
    },
    {
      name: 'debug',
      description: 'Show debug information.',
      type: ApplicationCommandOptionType.Boolean,
    },
  ],

  async run(context) {
    const { interaction, prisma, client, options } = context

    if (process.env.HYPIXEL_CACHE_URL == null || process.env.HYPIXEL_CACHE_SECRET == null) {
      await interaction.reply({
        embeds: [
          Embed.error(
            '**This command is disabled**',
            'HYPIXEL_CACHE_URL or HYPIXEL_CACHE_SECRET is not present in the server environment.'
          ),
        ],
        ephemeral: true,
      })
      return CommandResult.Failure
    }

    const timers = {
      resolve: 0,
      data: 0,
      cache: 0,
      avatar: 0,
      image: 0,
      total: 0,
    }

    timers.total = performance.now()
    timers.resolve = performance.now()

    const gamemode = options.getString('gamemode') ?? 'bedwars'
    let identifier = options.getString('username')
    const debug = IS_DEVELOPMENT || options.getBoolean('debug') != null

    if (identifier == null) {
      // try to find username/UUID in database
      const user = await prisma.minecraftPlayer.findFirst({
        where: { userId: interaction.user.id },
      })
      if (user != null) {
        identifier = user.minecraftIdentifier
      } else {
        await interaction.reply({
          embeds: [
            Embed.error(
              'No username specified; could not find your username.',
              'Please supply a username/UUID or set one with the /username command.'
            ),
          ],
          ephemeral: true,
        })
        return CommandResult.Success
      }
    }

    assert(identifier, 'Expected identifier to be set after checking input and database')

    if (!usernameRegex.test(identifier) && !uuidRegex.test(identifier)) {
      await interaction.reply({
        embeds: [Embed.error('Invalid username/UUID')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const provider = STATS_PROVIDERS.find((provider) => provider.name === gamemode)

    if (provider == null) {
      await interaction.editReply({
        embeds: [Embed.error('Invalid gamemode.')],
      })
      return CommandResult.Success
    }

    timers.resolve = Math.round(performance.now() - timers.resolve)

    await interaction.deferReply()
    try {
      const inputType = uuidRegex.test(identifier) ? 'uuid' : 'name'

      timers.data = performance.now()

      const response = await fetch(`${process.env.HYPIXEL_CACHE_URL}/${inputType}/${identifier}`, {
        headers: { 'X-Secret': process.env.HYPIXEL_CACHE_SECRET },
      })

      if (response.status === 429) {
        await interaction.editReply({
          embeds: [Embed.error('Too many requests', 'Please try again later.')],
        })
        return CommandResult.Failure
      }

      if (response.status !== 200) {
        await interaction.editReply({
          embeds: [
            Embed.error(
              'Received non-200 status code from cache service',
              `${response.status} ${response.statusText}`
            ),
          ],
        })
        return CommandResult.Failure
      }

      const responseData = (await response.json()) as HypixelCacheResponse

      if (!responseData.success) {
        await interaction.editReply({
          embeds: [Embed.error(responseData.error ?? JSON.stringify(responseData))],
        })
        return CommandResult.Failure
      }
      timers.cache = Math.round(
        parseFloat(response.headers.get('x-response-time')!.replace(/ms/g, ''))
      )

      timers.data = Math.round(performance.now() - timers.data)

      const player = responseData.player

      if (player == null) {
        await interaction.editReply({
          embeds: [
            Embed.error('Could not find player.').setFooter({
              text: `data ${Math.round(timers.data / 1000)}ms (cache ${timers.cache}ms)`,
            }),
          ],
        })
        return CommandResult.Success
      }

      timers.avatar = performance.now()
      // TODO improve avatar fetching
      const avatarResponse = await fetch(
        `https://crafatar.com/avatars/${player.uuid}?size=${AVATAR_SIZE}&overlay`
      )
      const avatar = new Image(AVATAR_SIZE, AVATAR_SIZE)
      avatar.src = Buffer.from(await avatarResponse.arrayBuffer())
      timers.avatar = Math.round(performance.now() - timers.avatar)

      timers.image = performance.now()
      const { image, metadata } = await provider.makeStats(
        player,
        avatarResponse.status >= 200 && avatarResponse.status < 300 ? avatar : undefined
      )
      timers.image = Math.round(performance.now() - timers.image)

      timers.total = Math.round(performance.now() - timers.total)

      const debugInfo = stripIndent`
        resolve ${timers.resolve}ms
        data ${timers.data}ms
          cache ${timers.cache}ms
        avatar ${timers.avatar}ms
        image ${timers.image}ms
          provider ${provider.name}
          format ${metadata.format}
          size ${Math.round(metadata.width)}x${Math.round(metadata.height)}
          space ${formatBytes(metadata.bytes)}
        total ${timers.total}ms
      `

      await interaction.editReply({
        embeds: debug ? [Embed.info('Debug information', Formatters.codeBlock(debugInfo))] : [],
        files: [{ name: 'stats.png', attachment: image }],
      })
      return CommandResult.Success
    } catch (err) {
      client.getLogger('/stats').error(err)
      await interactionReplySafe(interaction, { embeds: [Embed.error(err)] })
      return CommandResult.Failure
    }
  },
})

export default COMMAND_STATS
