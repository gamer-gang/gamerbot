import axios from 'axios'
import command from '../command.js'

const COMMAND_XKCD = command('CHAT_INPUT', {
  name: 'xkcd',
  description: 'Gives a link to a random xkcd comic.',

  async run(context) {
    const { interaction } = context

    const res = await axios.get('https://xkcd.com/info.0.json')
    const data: XKCDResponse = res.data

    await interaction.reply(`https://xkcd.com/${Math.ceil(Math.random() * data.num)}`)
  },
})

export default COMMAND_XKCD

interface XKCDResponse {
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
