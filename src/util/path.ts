import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(
  process.env.DOCKER != null ? 'file:///app/src/util/path.ts' : import.meta.url
)
const __dirname = path.dirname(__filename)

export const resolvePath = (dir: string): string => {
  return path.resolve(__dirname, '../', dir)
}
