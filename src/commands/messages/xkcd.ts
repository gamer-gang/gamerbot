import axios from 'axios'
import command from '../command.js'

const COMMAND_XKCD = command('CHAT_INPUT', {
  name: 'xkcd',
  description: 'Gives a link to a random xkcd comic.',

  async run(context) {
    const { interaction } = context

    await axios
      .get('https://xkcd.com/info.0.json')
      .then(async ({ data }: { data: XKCDResponse }) => {
        const { num } = data
        await interaction.reply(`https://xkcd.com/${Math.ceil(Math.random() * num)}`)
      })
  },
})

export default COMMAND_XKCD

export interface XKCDResponse {
  month: string
  num: number
  link: string
  year: string
  news: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  safe_title: string
  transcript: string
  alt: string
  img: string
  title: string
  day: string
}
