import axios from 'axios'
import type { MessageAttachment } from 'discord.js'
import type { Runtime } from 'piston-client'
import { CommandResult } from '../../command.js'
import type { CommandContext } from '../../context.js'
import askForCode from './askForCode.js'
import { isValidCodeAttachment } from './util.js'

interface GetCodeResult {
  attachment?: MessageAttachment
  code?: string
  result?: CommandResult
  error?: string
}

const getCode = async (context: CommandContext, runtime: Runtime): Promise<GetCodeResult> => {
  const { options } = context

  const code = options.getString('code')
  if (code) return { code }

  const attachment = options.getAttachment('code-file')
  if (attachment) {
    if (!isValidCodeAttachment(attachment)) {
      return { result: CommandResult.Success, error: 'Only text attachments are allowed.' }
    }

    const code = await axios.get(attachment.url, { responseType: 'text' }).then((r) => r.data)
    return { code, attachment }
  }

  const askResult = await askForCode(context, runtime)
  if (typeof askResult === 'number') return { result: askResult }

  return { code: askResult }
}

export default getCode
