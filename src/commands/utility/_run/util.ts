import type { Attachment } from 'discord.js'

const ALLOWED_CONTENT_TYPES = [
  'video/MP2T; charset=utf-8', // typescript
]

export const isValidCodeAttachment = (attachment: Attachment): boolean => {
  return (
    attachment.contentType != null &&
    (attachment.contentType.startsWith('text/') ||
      attachment.contentType.startsWith('application/') ||
      ALLOWED_CONTENT_TYPES.includes(attachment.contentType))
  )
}
