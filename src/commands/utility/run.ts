/* eslint-disable import/no-named-as-default */
import { APIMessage } from 'discord-api-types'
import { FileOptions, Formatters, Message, Util } from 'discord.js'
import _ from 'lodash'
import assert from 'node:assert'
import piston, { ExecuteErrorResult, ExecuteSuccessResult } from 'piston-client'
import { matchString } from '../../util.js'
import { COLORS, Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'
import askForCode from './_run/askForCode.js'
import askForStdin from './_run/askForStdin.js'

const pistonClient = piston()
const RUNTIMES = await pistonClient.runtimes()
const LANGUAGES = RUNTIMES.map((runtime) => runtime.language)
const ALIASES = RUNTIMES.flatMap((runtime) => runtime.aliases)
const LANGUAGES_WITH_ALIASES = _.uniq([...LANGUAGES, ...ALIASES])

const COMMAND_RUN = command('CHAT_INPUT', {
  name: 'run',
  description: 'Run a snippet of code.',
  longDescription:
    'Run a snippet of code. If code is not provided in the initial command, you will be asked to provide it.',
  examples: [
    {
      options: { language: '`typescript`', code: '`console.log("Hello World!")`' },
      description: 'Run `console.log("Hello World!")` in TypeScript.',
    },
    {
      options: {
        language: '`python`',
        version: RUNTIMES.filter((l) => l.language === 'python').sort((a, b) =>
          b.version.localeCompare(a.version)
        )[0].version,
        stdin: '`foo bar baz`',
        args: '`foo bar baz`',
      },
      description: 'Run a Python script with stdin and arguments (prompting for code).',
    },
    {
      options: {
        language: '`c++`',
        'ask-stdin': true,
        'output-format': '`json`',
      },
      description:
        'Run a C++ program and highlight the output as JSON (prompting for code and stdin).',
    },
  ],
  options: [
    {
      name: 'language',
      description: 'The language to run the code in.',
      type: 'STRING',
      required: true,
      autocomplete: true,
    },
    {
      name: 'version',
      description: 'The version of the language to run the code in.',
      type: 'STRING',
      autocomplete: true,
    },
    {
      name: 'code',
      description: 'The code to run; if not provided, you will be asked to provide it.',
      type: 'STRING',
    },
    {
      name: 'stdin',
      description:
        'stdin to provide to the program; specify ask-stdin instead to be prompted for it.',
      type: 'STRING',
    },
    {
      name: 'ask-stdin',
      description: 'Whether to ask for stdin.',
      type: 'BOOLEAN',
    },
    {
      name: 'args',
      description: 'Arguments to pass to the program, separated by spaces.',
      type: 'STRING',
    },
    {
      name: 'output-syntax',
      description: "Syntax highlighting language for your code's output.",
      type: 'STRING',
    },
  ],

  async autocomplete(interaction) {
    const { options } = interaction

    const focused = options.getFocused(true)

    if (focused.name === 'language') {
      if (!focused.value.toString()) {
        // pick 25 random languages
        const languages = _.sortBy(_.sampleSize(LANGUAGES, 25), 'language')
        return languages.map((language) => ({ name: language, value: language }))
      }

      return matchString(focused.value.toString(), LANGUAGES_WITH_ALIASES)
    } else if (focused.name === 'version') {
      const language = options.getString('language')

      if (!language) {
        return [{ name: 'Enter a language first.', value: '' }]
      }

      const versions = RUNTIMES.filter((runtime) => runtime.language === language).map(
        (runtime) => runtime.version
      )

      return matchString(focused.value.toString(), versions)
    }

    return []
  },

  async run(context) {
    const { interaction, options } = context

    const language = options.getString('language', true)
    let version = options.getString('version')

    const runtimes = RUNTIMES.filter(
      (runtime) => runtime.language === language || runtime.aliases.includes(language)
    )

    if (runtimes.length === 0) {
      await interaction.reply({
        embeds: [Embed.error('Invalid language.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    if (!version) {
      // find the latest version
      version = [...runtimes]
        .map((runtime) => runtime.version)
        .sort((a, b) => b.localeCompare(a))[0]
    }

    const runtime = runtimes.find(
      (runtime) =>
        runtime.version === version &&
        (runtime.language === language || runtime.aliases.includes(language))
    )

    if (!runtime) {
      await interaction.reply({
        embeds: [Embed.error('Invalid version.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    await interaction.deferReply()

    let code: string | number | undefined = options.getString('code') ?? undefined
    code ??= await askForCode(context, runtime)
    if (typeof code === 'number') return code // CommandResult

    if (!options.getString('code')) {
      await interaction.editReply({
        embeds: [new Embed({ title: `Run code: ${runtime.language} v${runtime.version}` })],
        components: [],
      })
    }

    let stdin: string | number | undefined = options.getString('stdin') ?? undefined
    if (options.getBoolean('ask-stdin')) stdin ??= (await askForStdin(context, runtime)) ?? ''
    if (typeof stdin === 'number') return stdin // CommandResult

    if (!code) {
      await interaction.followUp({
        embeds: [Embed.error('No code provided.')],
      })
      return CommandResult.Success
    }

    assert(interaction.channel, 'Interaction has no channel')

    let outputMessage: APIMessage | Message
    if (
      !options.getString('code') ||
      (!options.getString('stdin') && options.getBoolean('ask-stdin'))
    ) {
      outputMessage = await interaction.followUp({
        embeds: [
          Embed.info('Running code...')
            .setColor(COLORS.orange.asNumber)
            .setTitle(`Run code: ${runtime.language} v${runtime.version}`),
        ],
      })
    } else {
      outputMessage = await interaction.editReply({
        embeds: [
          Embed.info('Running code...')
            .setColor(COLORS.orange.asNumber)
            .setTitle(`Run code: ${runtime.language} v${runtime.version}`),
        ],
      })
    }

    const codeResult = await pistonClient.execute({
      language: runtime.language,
      version: runtime.version,
      files: [{ content: code }],
      stdin,
      args: options.getString('args')?.trim().split(' ') ?? [],
    })

    const error = (codeResult as ExecuteErrorResult).error
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
    if (error || (codeResult as ExecuteErrorResult).success === false) {
      throw new Error(`Code execution failed: ${error ? error.message : 'reason unknown'}`, {
        cause: error,
      })
    }

    const { compile, run } = codeResult as ExecuteSuccessResult

    const output = `${compile?.stderr ?? ''}${run.output}`.replace('`', '`\u200b').trim()
    const outputLanguage = options.getString('output-syntax') ?? 'txt'
    const formattedOutput = Formatters.codeBlock(outputLanguage, output)
    const files: FileOptions[] = []

    let embed: Embed
    if (run.signal) {
      embed = Embed.error(
        `Process killed by ${run.signal} (probably timed out or OOM).`,
        output.length ? formattedOutput : undefined
      )
    } else if (!compile?.stderr && !run.stdout && !run.stderr) {
      embed = Embed.info('Execution completed with no output.')
    } else if (compile?.stderr) {
      embed = Embed.error('Compilation errored:', formattedOutput)
    } else if (!run.stdout && run.stderr) {
      if (output.length > 1500) {
        embed = Embed.warning('Execution only produced stderr, output is attached.')
        files.push({
          name: 'output.txt',
          attachment: Buffer.from(output, 'utf8'),
        })
      } else {
        embed = Embed.warning('Execution only produced stderr:', formattedOutput)
      }
    } else if (output.length > 1000) {
      embed = Embed.success('Execution completed, output is attached.')
      files.push({
        name: `output.${outputLanguage}`,
        attachment: Buffer.from(output, 'utf8'),
      })
    } else {
      embed = Embed.success('Execution completed, output:', formattedOutput)
    }

    embed.setAuthorToProfile(interaction.user.username, interaction.user)
    embed.setTitle(`Run code: ${runtime.language} v${runtime.version}`)

    if (run.signal && !(embed.description ?? 'OOM').includes('OOM')) {
      embed.addField('Process killed by', run.signal, true)
    }

    if (run.code !== 0 && run.code != null) {
      embed.addField('Exit code', run.code.toString(), true)
    }

    if (options.getString('code') && options.getString('code')!.length < 300) {
      // add code to the embed
      embed.setDescription(
        `${Formatters.codeBlock(runtime.language, Util.escapeCodeBlock(code))}\n${
          embed.description
        }`
      )
    }

    if (outputMessage) {
      const resolved = interaction.channel.messages.resolve(outputMessage.id)
      if (resolved) {
        await resolved.edit({
          embeds: [embed],
          allowedMentions: { parse: [] },
          files,
        })
        return CommandResult.Success
      }
    }

    await interaction.followUp({
      embeds: [embed],
      allowedMentions: { parse: [] },
      files,
    })

    return CommandResult.Success
  },
})

export default COMMAND_RUN
