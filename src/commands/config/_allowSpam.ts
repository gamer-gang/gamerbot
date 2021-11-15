import { configOption } from './_configOption.js'

const CONFIG_OPTION_ALLOWSPAM = configOption({
  internalName: 'allow-spam',
  displayName: 'allow spam commands',
  description: 'Allow spam commands like /lorem',
  type: 'BOOLEAN',

  async handle(context) {
    await context.interaction.reply('pam')
  },
})

export default CONFIG_OPTION_ALLOWSPAM
