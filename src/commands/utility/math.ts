import { Formatters } from 'discord.js'
import { evaluate } from 'mathjs'
import assert from 'node:assert'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'
const cleanExpression = (expr: string): string | false => {
  const cleaned = expr //
    .replace(/^`([^`]+)`$/, '$1')
    .replace(/\\([*_\\])/gi, '$1')

  if (/(?:[`\\])/gi.test(cleaned)) {
    // invalid characters
    return false
  }

  return cleaned
}

const COMMAND_MATH = command('CHAT_INPUT', {
  name: 'math',
  description: 'Evaluate mathematical expressions.',
  options: [
    {
      type: 'STRING',
      name: 'expression',
      description: 'The expression to evaluate.',
      required: true,
      autocomplete: true,
    },
  ],

  async autocomplete(interaction) {
    const option = interaction.options.getFocused(true)

    if (option.name !== 'expression') {
      return []
    }

    assert(typeof option.value === 'string', 'expression is not a string')

    if (option.value.length === 0 || option.value.trim().length === 0) {
      return [{ name: 'Enter an expression', value: '' }]
    }

    const expression = cleanExpression(option.value)

    if (expression === false) {
      return [{ name: 'Invalid expression', value: '' }]
    }

    const scope = {}
    let result: unknown

    try {
      result = evaluate(expression, scope)
    } catch (err) {
      return [{ name: `MathError: ${err.message}`, value: '' }]
    }

    return [{ name: `${expression}: ${result}`, value: expression }]
  },

  async run(context) {
    const { interaction, options } = context

    const expression = cleanExpression(options.getString('expression', true))

    let invalid = !expression

    if (typeof expression === 'string' && expression.trim().length === 0) {
      invalid = true
    }

    if (invalid) {
      await interaction.reply({ embeds: [Embed.error('No expression provided.')], ephemeral: true })
      return CommandResult.Success
    }

    assert(typeof expression === 'string', 'expression is not a string')

    const scope: { [key: string]: unknown } = {}
    let result: unknown

    try {
      result = evaluate(expression, scope)
    } catch (err) {
      await interaction.reply({
        embeds: [Embed.error(`MathError: ${err.message}`)],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const variables = Object.keys(scope)
      .map((k) => `${k} => \`${scope[k]}\``)
      .join('\n')

    await interaction.reply({
      embeds: [
        Embed.info(
          `Expression: ${Formatters.inlineCode(expression)}\n Result: ${Formatters.inlineCode(
            `${result}`
          )}`,
          variables !== '' ? Formatters.codeBlock(variables) : undefined
        ),
      ],
    })

    return CommandResult.Success
  },
})

export default COMMAND_MATH
