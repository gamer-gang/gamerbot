import assert from 'node:assert'
import { uuidRegex } from './regex.js'

interface MojangProfileResponse {
  name?: string
  id?: string
  error?: string
  errorMessage?: string
  legacy?: true
  demo?: true
}

interface UuidCacheEntry {
  uuid: string
  name: string
  timestamp: number
}

const uuidCache = new Map<string, UuidCacheEntry>()

export const resolveMinecraftUuid = async (usernameOrUuid: string): Promise<string | undefined> => {
  // check if it's a valid uuid
  if (uuidRegex.test(usernameOrUuid)) {
    return usernameOrUuid
  }

  const cached = uuidCache.get(usernameOrUuid)
  // check if it's in the cache and less than an hour old
  if (cached && Date.now() - cached.timestamp < 60 * 60_000) {
    assert.strictEqual(
      usernameOrUuid.toLowerCase(),
      cached.name.toLowerCase(),
      'Provided username does not match cached username'
    )
    return cached.uuid
  }

  const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${usernameOrUuid}`)
  const data = (await response.json()) as MojangProfileResponse

  if (response.status === 204 || data.demo) {
    return undefined
  }

  if (data.error) {
    throw new Error(`UUID resolution failed: ${data.error}: ${data.errorMessage}`)
  }

  const { id, name: username } = data as Required<MojangProfileResponse>

  assert.strictEqual(
    usernameOrUuid.toLowerCase(),
    username.toLowerCase(),
    'Provided username does not match resolved username'
  )

  uuidCache.set(username, { uuid: id, name: username, timestamp: Date.now() })

  return id
}
