import { TODPlayerOrder } from '@prisma/client'
import {
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ApplicationCommandSubCommandData,
  ApplicationCommandSubGroupData,
  ApplicationCommandType,
} from 'discord.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'
import { CommandContext } from '../context.js'
import { truthOrDareEnd } from './_truthordare/end.js'
import { truthOrDareKick } from './_truthordare/kick.js'
import { truthOrDareNew } from './_truthordare/new.js'
import { truthOrDareQuit } from './_truthordare/quit.js'
import { truthOrDareSettings } from './_truthordare/settings.js'
import { truthOrDareSkip } from './_truthordare/skip.js'
import { truthOrDareVotekick } from './_truthordare/votekick.js'
import { truthOrDareVoteskip } from './_truthordare/voteskip.js'

const globalToggle = (): Exclude<
  ApplicationCommandOptionData,
  ApplicationCommandSubGroupData | ApplicationCommandSubCommandData
> => ({
  name: 'global',
  description: 'Whether to set this option globally (admin only) or for this game only.',
  type: ApplicationCommandOptionType.Boolean,
})

const COMMAND_TRUTHORDARE = command(ApplicationCommandType.ChatInput, {
  name: 'truthordare',
  description: 'Play/manage truth or dare games.',
  guildOnly: true,
  botPermissions: ['ManageRoles', 'ManageMessages', 'SendMessages'],
  options: [
    {
      name: 'settings',
      description: 'Manage truth or dare settings.',
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        // {
        //   name: 'autorole',
        //   description:
        //     'Allow gamerbot to automatically create and assign game-specific roles to active players.',
        //   type: ApplicationCommandOptionType.Subcommand,
        //   options: [
        //     {
        //       name: 'enable',
        //       description: 'Enable this option.',
        //       type: ApplicationCommandOptionType.Boolean,
        //     },
        //     globalToggle(),
        //   ],
        // },
        // {
        //   name: 'autopin',
        //   description: 'Allow gamerbot to automatically pin game messages.',
        //   type: ApplicationCommandOptionType.Subcommand,
        //   options: [
        //     {
        //       name: 'enable',
        //       description: 'Enable this option.',
        //       type: ApplicationCommandOptionType.Boolean,
        //     },
        //     globalToggle(),
        //   ],
        // },
        // {
        //   name: 'ask-timeout',
        //   description: 'The amount of time to wait for a player to formulate a question.',
        //   type: ApplicationCommandOptionType.Subcommand,
        //   options: [
        //     {
        //       name: 'value',
        //       description: 'Timeout, in seconds.',
        //       type: ApplicationCommandOptionType.Integer,
        //     },
        //     globalToggle(),
        //   ],
        // },
        // {
        //   name: 'respond-timeout',
        //   description: 'The amount of time to wait for a player to respond to a question.',
        //   type: ApplicationCommandOptionType.Subcommand,
        //   options: [
        //     {
        //       name: 'value',
        //       description: 'Timeout, in seconds.',
        //       type: ApplicationCommandOptionType.Integer,
        //     },
        //     globalToggle(),
        //   ],
        // },
        // {
        //   name: 'prepare-timeout',
        //   description: 'The amount of time to wait for players to join a game.',
        //   type: ApplicationCommandOptionType.Subcommand,
        //   options: [
        //     {
        //       name: 'value',
        //       description: 'Timeout, in seconds.',
        //       type: ApplicationCommandOptionType.Integer,
        //     },
        //     globalToggle(),
        //   ],
        // },
        {
          name: 'max-players',
          description: 'The maximum number of players allowed in a game.',
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'value',
              description: 'Maximum number of players (max: 25).',
              type: ApplicationCommandOptionType.Integer,
            },
            globalToggle(),
          ],
        },
        // {
        //   name: 'rounds',
        //   description: 'The number of rounds to play in a game.',
        //   type: ApplicationCommandOptionType.Subcommand,
        //   options: [
        //     {
        //       name: 'value',
        //       description: 'Number of rounds.',
        //       type: ApplicationCommandOptionType.Integer,
        //     },
        //     globalToggle(),
        //   ],
        // },
        {
          name: 'player-order',
          description: 'The order in which players will be asked questions.',
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'value',
              description: 'Order of players.',
              type: ApplicationCommandOptionType.String,
              choices: [
                { name: 'Random', value: TODPlayerOrder.Random },
                { name: 'Oldest first', value: TODPlayerOrder.OldestFirst },
                { name: 'Youngest first', value: TODPlayerOrder.YoungestFirst },
                { name: 'Manual', value: TODPlayerOrder.Manual },
              ],
            },
            globalToggle(),
          ],
        },
        // {
        //   name: 'mode',
        //   description: 'The style of game to play.',
        //   type: ApplicationCommandOptionType.Subcommand,
        //   options: [
        //     {
        //       name: 'value',
        //       description: 'Game mode.',
        //       type: ApplicationCommandOptionType.String,
        //       choices: [
        //         { name: 'Truth or dare', value: TODGameMode.Normal },
        //         { name: 'Truth only', value: TODGameMode.TruthOnly },
        //         { name: 'Dare only', value: TODGameMode.DareOnly },
        //       ],
        //     },
        //   ],
        // },
      ],
    },
    {
      name: 'new',
      description: 'Create a new truth or dare game in the current channel. One game per channel.',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'end',
      description:
        'End an ongoing game. Can only be run by a server administrator or the game creator.',
      type: ApplicationCommandOptionType.Subcommand,
    },
    // {
    //   name: 'quit',
    //   description:
    //     'Leave an ongoing game. If you are the owner, control will be passed to someone at random.',
    //   type: ApplicationCommandOptionType.Subcommand,
    // },
    // {
    //   name: 'voteskip',
    //   description: 'Vote to skip the current turn.',
    //   type: ApplicationCommandOptionType.Subcommand,
    // },
    // {
    //   name: 'skip',
    //   description:
    //     'Skip the current turn. Can only be run by server administrators or the game creator.',
    //   type: ApplicationCommandOptionType.Subcommand,
    // },
    // {
    //   name: 'votekick',
    //   description: 'Vote to kick a player from the game.',
    //   type: ApplicationCommandOptionType.Subcommand,
    //   options: [
    //     {
    //       name: 'player',
    //       description: 'The player to kick.',
    //       type: ApplicationCommandOptionType.User,
    //       required: true,
    //     },
    //   ],
    // },
    // {
    //   name: 'kick',
    //   description:
    //     'Kick a player from the game. Can only be run by server administrators or the game creator.',
    //   type: ApplicationCommandOptionType.Subcommand,
    //   options: [
    //     {
    //       name: 'player',
    //       description: 'The player to kick.',
    //       type: ApplicationCommandOptionType.User,
    //       required: true,
    //     },
    //   ],
    // },
  ],

  async run(context) {
    const { interaction } = context
    const group = interaction.options.getSubcommandGroup(false)
    if (group === 'settings') {
      return await truthOrDareSettings(context)
    }

    const subcommand = interaction.options.getSubcommand(false)
    const handlers: { [key: string]: (context: CommandContext) => Promise<CommandResult> } = {
      new: truthOrDareNew,
      end: truthOrDareEnd,
      quit: truthOrDareQuit,
      voteskip: truthOrDareVoteskip,
      skip: truthOrDareSkip,
      votekick: truthOrDareVotekick,
      kick: truthOrDareKick,
    }

    const result = await handlers[subcommand!](context)
    if (!interaction.replied) {
      await interaction.reply({ embeds: [Embed.error('Not implemented.')] })
    }
    return result
  },
})

export default COMMAND_TRUTHORDARE
