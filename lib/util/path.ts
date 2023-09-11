import path from 'node:path'
import { fileURLToPath } from 'node:url'
import env from '../env.js'

let __filename = fileURLToPath(env.DOCKER ? 'file:///app/src/util/path.ts' : import.meta.url)

if (__filename.endsWith('dist/index.js')) {
  __filename = __filename.replace('dist/index.js', 'src/util/path.ts')
}

const __dirname = path.dirname(__filename)

export const resolvePath = (dir: string): string => {
  return path.resolve(__dirname, '../../', dir)
}
