import { CowFunction, say } from '@wiisportsresorts/cowsay'
import * as cows from '@wiisportsresorts/cowsay/lib/cows.js'
import { stripIndent } from 'common-tags'
import command, { CommandResult } from '../command.js'

const COMMAND_COWSAY = command('CHAT_INPUT', {
  name: 'cowsay',
  description: 'Make the cow say the funny',
  examples: [
    {
      options: { text: 'Hello' },
      description: stripIndent`
        Make the cow say "Hello":
        \`\`\`
         _______
        < Hello >
         -------
                \\   ^__^
                 \\  (oo)\\_______
                    (__)\\       )\\/\\
                        ||----w |
                        ||     ||
      \`\`\``,
    },
    {
      options: { text: 'calcium', cow: 'milk' },
      description: stripIndent`
      Make a milk carton say "calcium":
      \`\`\`
       _________
      < Calcium >
       ---------
       \\     ____________
        \\    |__________|
            /           /\\
           /           /  \\
          /___________/___/|
          |          |     |
          |  ==\\ /== |     |
          |   o   o  | \\ \\ |
          |     <    |  \\ \\|
         /|          |   \\ \\
        / |  \\_____/ |   / /
       / /|          |  / /|
      /||\\|          | /||\\/
          -------------|
              | |    | |
             <__/    \\__>
      \`\`\``,
    },
  ],
  options: [
    {
      name: 'text',
      description: 'The text to make the cow say',
      type: 'STRING',
      required: true,
    },
    {
      name: 'cow',
      description: 'The cow to use',
      type: 'STRING',
      autocomplete: true,
    },
  ],

  async autocomplete(interaction) {
    const input = interaction.options.getFocused(true)
    if (input.name === 'cow') {
      const matches = Object.keys(cows).filter((cow) => cow.includes(input.value.toString().trim()))

      if (matches.length === 0) {
        return [{ name: 'No results found.', value: '-' }]
      }

      return matches.slice(0, 25).map((cow) => ({ name: cow, value: cow }))
    }

    return []
  },

  async run(context) {
    const { interaction, options } = context

    const text = options.getString('text')
    if (text == null) {
      await interaction.reply('You need to specify a text to make the cow say')
      return CommandResult.Success
    }

    const cowInput = options.getString('cow')
    let cow = cows.default_cow
    if (cowInput != null) {
      const userCow = (cows as { [key: string]: CowFunction })[cowInput]
      if (userCow == null) {
        await interaction.reply(`Unknown cow: ${cowInput}`)
        return CommandResult.Success
      }

      cow = userCow
    }

    await interaction.reply(`\`\`\`${say(text, { W: 48, cow }).replace(/```/g, "'''")}\n\`\`\``)
    return CommandResult.Success
  },
})

export default COMMAND_COWSAY
