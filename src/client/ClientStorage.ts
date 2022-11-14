import fs from 'node:fs/promises'
import { resolvePath } from '../util/path.js'

export class ClientStorage {
  constructor() {
    fs.mkdir(resolvePath('storage'), { recursive: true })
  }

  async read<T>(key: string, encoding: BufferEncoding = 'utf-8'): Promise<T | undefined> {
    if (key.includes('/')) throw new Error('Invalid storage key')
    const path = resolvePath(`storage/${key}`)
    const data = await fs.readFile(path, encoding).catch(() => undefined)
    return data as T | undefined
  }

  async write(
    key: string,
    data: Parameters<typeof fs.writeFile>[1],
    encoding: BufferEncoding = 'utf-8'
  ): Promise<void> {
    if (key.includes('/')) throw new Error('Invalid storage key')
    const path = resolvePath(`storage/${key}`)
    await fs.writeFile(path, data, encoding)
  }

  delete(key: string): Promise<boolean> {
    if (key.includes('/')) throw new Error('Invalid storage key')
    const path = resolvePath(`storage/${key}`)
    return fs
      .rm(path)
      .then(() => true)
      .catch(() => false)
  }

  list(): Promise<string[]> {
    const path = resolvePath('storage')
    return fs.readdir(path)
  }

  stat(key: string): Promise<import('fs').Stats | undefined> {
    if (key.includes('/')) throw new Error('Invalid storage key')
    const path = resolvePath(`storage/${key}`)
    return fs.stat(path).catch(() => undefined)
  }

  exists(key: string): Promise<boolean> {
    if (key.includes('/')) throw new Error('Invalid storage key')
    const path = resolvePath(`storage/${key}`)
    return fs
      .access(path)
      .then(() => true)
      .catch(() => false)
  }
}
