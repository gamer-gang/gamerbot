import command from '../command.js'

const COMMAND_XKCD = command('CHAT_INPUT', {
  name: 'xkcd',
  description: 'Gives a link to a random xkcd comic.',

  async run(context) {
    const { interaction } = context

    await interaction.reply(`https://xkcd.com/${Math.floor(Math.random() * 2544) + 1}`)
  },
})

export default COMMAND_XKCD
