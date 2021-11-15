/* eslint-disable @typescript-eslint/naming-convention */
import { CowFunction, say } from '@wiisportsresorts/cowsay'
import * as cows from '@wiisportsresorts/cowsay/lib/cows.js'
import command from '../command.js'

const COMMAND_COWSAY = command('CHAT_INPUT', {
  name: 'cowsay',
  description: 'Make the cow say the funny',
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
      required: false,
    },
  ],

  async run(context) {
    const { interaction } = context

    const text = interaction.options.getString('text')
    if (text == null) {
      return await interaction.reply('You need to specify a text to make the cow say')
    }

    const cowInput = interaction.options.getString('cow')
    let cow = cows.default_cow
    if (cowInput != null) {
      // eslint-disable-next-line import/namespace
      const userCow = (cows as { [key: string]: CowFunction })[cowInput]
      if (userCow == null) {
        return await interaction.reply(`Unknown cow: ${cowInput}`)
      }

      cow = userCow
    }

    await interaction.reply(`\`\`\`${say(text, { W: 48, cow }).replace(/```/g, "'''")}\n\`\`\``)
  },
})

export default COMMAND_COWSAY
