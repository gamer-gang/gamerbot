import { Image } from '@napi-rs/canvas'
import axios from 'axios'
import { stripIndent, stripIndents } from 'common-tags'
import { HypixelCacheResponse } from 'hypixel-cache'
import assert from 'node:assert'
import { IS_DEVELOPMENT } from '../../constants.js'
import { formatBytes } from '../../util.js'
import { interactionReplySafe } from '../../util/discord.js'
import { Embed } from '../../util/embed.js'
import { usernameRegex, uuidRegex } from '../../util/regex.js'
import command, { CommandResult } from '../command.js'
import STATS_PROVIDER_BEDWARS from './_bedwars.js'

const AVATAR_SIZE = 165

const STATS_PROVIDERS = [STATS_PROVIDER_BEDWARS]

const COMMAND_STATS = command('CHAT_INPUT', {
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
      type: 'STRING',
      choices: STATS_PROVIDERS.map((provider) => ({
        name: provider.displayName,
        value: provider.name,
      })),
    },
    {
      name: 'username',
      description: 'Username/UUID to get stats for.',
      type: 'STRING',
    },
    {
      name: 'debug',
      description: 'Show debug information.',
      type: 'BOOLEAN',
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
      resolveNs: 0n,
      dataNs: 0n,
      cacheMs: 0,
      avatarNs: 0n,
      imageNs: 0n,
      totalNs: 0n,
    }

    timers.totalNs = process.hrtime.bigint()
    timers.resolveNs = process.hrtime.bigint()

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
    timers.resolveNs = process.hrtime.bigint() - timers.resolveNs

    const provider = STATS_PROVIDERS.find((provider) => provider.name === gamemode)

    if (provider == null) {
      await interaction.editReply({
        embeds: [Embed.error('Invalid gamemode.')],
      })
      return CommandResult.Success
    }

    await interaction.deferReply()
    try {
      const inputType = uuidRegex.test(identifier) ? 'uuid' : 'name'
      timers.dataNs = process.hrtime.bigint()
      const response = await axios.get<HypixelCacheResponse>(
        `${process.env.HYPIXEL_CACHE_URL}/${inputType}/${identifier}`,
        {
          headers: { 'X-Secret': process.env.HYPIXEL_CACHE_SECRET },
          validateStatus: () => true,
        }
      )

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

      if (!response.data.success) {
        await interaction.editReply({
          embeds: [Embed.error(response.data.error ?? JSON.stringify(response.data))],
        })
        return CommandResult.Failure
      }
      timers.cacheMs = Math.round(
        parseFloat(response.headers['x-response-time'].replace(/ms/g, ''))
      )
      timers.dataNs = process.hrtime.bigint() - timers.dataNs

      const player = response.data.player

      if (player == null) {
        await interaction.editReply({
          embeds: [
            Embed.error('Could not find player.').setFooter(stripIndents`
            Cache time: ${timers.cacheMs}ms
            Data time: ${timers.dataNs / 1000n}ms`),
          ],
        })
        return CommandResult.Success
      }

      timers.avatarNs = process.hrtime.bigint()
      // TODO improve avatar fetching
      const avatarResponse = await axios.get(
        `https://crafatar.com/avatars/${player.uuid}?size=${AVATAR_SIZE}&overlay`,
        { responseType: 'arraybuffer', validateStatus: () => true }
      )
      const avatar = new Image(AVATAR_SIZE, AVATAR_SIZE)
      avatar.src = avatarResponse.data

      const isAvatarSuccess = (status: number): boolean => {
        return status >= 200 && status < 300
      }

      timers.avatarNs = process.hrtime.bigint() - timers.avatarNs

      timers.imageNs = process.hrtime.bigint()
      const { image, metadata } = await provider.makeStats(
        player,
        isAvatarSuccess(avatarResponse.status) ? avatar : undefined
      )
      timers.imageNs = process.hrtime.bigint() - timers.imageNs

      timers.totalNs = process.hrtime.bigint() - timers.totalNs

      const debugInfo = stripIndent`
        resolve ${timers.resolveNs / 1_000_000n}ms
        data ${timers.dataNs / 1_000_000n}ms
          cache ${timers.cacheMs}ms
        avatar ${timers.avatarNs / 1_000_000n}ms
        image ${timers.imageNs / 1_000_000n}ms
          provider ${provider.name}
          format ${metadata.format}
          size ${Math.round(metadata.width)}x${Math.round(metadata.height)}
          space ${formatBytes(metadata.bytes)}
        total ${timers.totalNs / 1_000_000n}ms
      `

      await interaction.editReply({
        embeds: debug ? [Embed.info('Debug information', `\`\`\`${debugInfo}\`\`\``)] : [],
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
