import { stripIndent } from 'common-tags'
import { Formatters } from 'discord.js'
import assert from 'node:assert'
import { performance } from 'node:perf_hooks'
import { IS_DEVELOPMENT } from '../../constants.js'
import { Embed } from '../../util/embed.js'
import { resolveMinecraftUuid } from '../../util/minecraft.js'
import { usernameRegex, uuidRegex } from '../../util/regex.js'
import command, { CommandResult } from '../command.js'

type SkinTypes = 'body' | 'head' | 'avatar' | 'skin'
type SkinTypeMap = {
  [key in SkinTypes]: {
    visage: (uuid: string) => string
    crafatar: (uuid: string) => string
  }
}

const VISAGE_URL = 'https://visage.surgeplay.com'
const CRAFATAR_URL = 'https://crafatar.com'
const skinTypes: SkinTypeMap = {
  body: {
    visage: (uuid) => `${VISAGE_URL}/full/${uuid}`,
    crafatar: (uuid) => `${CRAFATAR_URL}/renders/body/${uuid}?overlay`,
  },
  head: {
    visage: (uuid) => `${VISAGE_URL}/head/${uuid}`,
    crafatar: (uuid) => `${CRAFATAR_URL}/renders/head/${uuid}?overlay`,
  },
  avatar: {
    visage: (uuid) => `${VISAGE_URL}/face/${uuid}`,
    crafatar: (uuid) => `${CRAFATAR_URL}/avatars/${uuid}?overlay`,
  },
  skin: {
    visage: (uuid) => `${VISAGE_URL}/skin/${uuid}`,
    crafatar: (uuid) => `${CRAFATAR_URL}/skins/${uuid}?overlay`,
  },
}

const COMMAND_SKIN = command('CHAT_INPUT', {
  name: 'skin',
  description: 'Display a Minecraft skin.',
  longDescription: stripIndent`
    Display a Minecraft skin. Skins can be of type \`body\` (3D body render), \`head\` (3D head render), \`avatar\` (2d face), or \`skin\` (original skin texture).
    The default skin type is body render.
    Skins are fetched from [visage.surgeplay.com](https://visage.surgeplay.com), or [crafatar.com](https://crafatar.com) if the \`use-craftar\` option is set.
  `,
  examples: [
    {
      options: { identifier: 'hypixel', type: 'body' },
      description: 'Display the 3D body render of the player with the username `hypixel`.',
    },
    {
      options: { type: 'avatar', 'use-craftar': true, debug: true },
      description:
        'Display the 2d face for the current user (provided it was set by /username) from Crafatar with debug information.',
    },
  ],
  options: [
    {
      name: 'identifier',
      description: 'Username/UUID to get the skin of.',
      type: 'STRING',
    },
    {
      name: 'debug',
      description: 'Show debug information.',
      type: 'BOOLEAN',
    },
    {
      name: 'type',
      description: 'Type of skin to get.',
      type: 'STRING',
      choices: [
        {
          name: 'Body render',
          value: 'body',
        },
        {
          name: 'Head render',
          value: 'head',
        },
        {
          name: 'Avatar',
          value: 'avatar',
        },
        {
          name: 'Skin texture',
          value: 'skin',
        },
      ],
    },
    {
      name: 'use-craftar',
      description: 'Use https://crafatar.com to fetch skins.',
      type: 'BOOLEAN',
    },
  ],

  async run(context) {
    const { interaction, options, prisma } = context

    const timers = {
      total: performance.now(),
      resolve: 0,
      uuid: 0,
    }

    timers.resolve = performance.now()

    let identifier = options.getString('identifier')
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

    const useCraftar = options.getBoolean('use-craftar') ?? false
    const debug = IS_DEVELOPMENT || options.getBoolean('debug') != null
    const type = (options.getString('type') ?? 'body') as SkinTypes
    const resolvers = skinTypes[type]
    if (resolvers == null) {
      await interaction.editReply({
        embeds: [Embed.error('Invalid skin type.')],
      })

      return CommandResult.Success
    }

    timers.resolve = Math.round(performance.now() - timers.resolve)

    await interaction.deferReply()

    timers.uuid = performance.now()
    const uuid = await resolveMinecraftUuid(identifier)
    if (uuid == null) {
      await interaction.editReply({
        embeds: [Embed.error('Player not found.')],
      })

      return CommandResult.Success
    }
    timers.uuid = Math.round(performance.now() - timers.uuid)

    // TODO faster way to do this?
    // const visageResponse = await axios.get(`${VISAGE_URL}/full/X-Steve`, {
    //   responseType: 'arraybuffer',
    //   validateStatus: () => true,
    //   timeout: 5000,
    // })
    // const isVisageOnline = visageResponse.status === 200 && visageResponse.data.byteLength > 0
    // const url = isVisageOnline ? resolvers.visage(uuid) : resolvers.crafatar(uuid)

    const url = useCraftar ? resolvers.crafatar(uuid) : resolvers.visage(uuid)

    const embed = new Embed({
      title: `Skin (${type})`,
      image: { url },
    })

    embed.setAuthorToProfile(interaction.user.username, interaction.user)

    timers.total = Math.round(performance.now() - timers.total)

    let debugEmbed: Embed | undefined
    if (debug) {
      const debugInfo = stripIndent`
        resolve ${timers.resolve}ms
          input ${identifier}
          uuid ${uuid}
        uuid ${timers.uuid}ms
        provider ${url.startsWith(CRAFATAR_URL) ? 'crafatar' : 'visage'}
        url ${url}
        total ${timers.total}ms
      `

      debugEmbed = Embed.info('Debug information', Formatters.codeBlock(debugInfo))
    }

    await interaction.editReply({
      embeds: [embed, debugEmbed].filter(Boolean) as Embed[],
    })

    return CommandResult.Success
  },
})

export default COMMAND_SKIN
