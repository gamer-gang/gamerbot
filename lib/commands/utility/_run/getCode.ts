import type { Attachment } from 'discord.js'
import type { Runtime } from 'piston-client'
import { CommandResult } from '../../command.js'
import type { CommandContext } from '../../context.js'
import askForCode from './askForCode.js'
import { isValidCodeAttachment } from './util.js'

interface GetCodeResult {
  attachment?: Attachment
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

    const code = await fetch(attachment.url).then((r) => r.text())
    return { code, attachment }
  }

  const askResult = await askForCode(context, runtime)
  if (typeof askResult === 'number') return { result: askResult }

  return { code: askResult }
}

export default getCode
