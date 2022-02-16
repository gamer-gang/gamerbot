/* eslint-disable no-return-assign */
/* eslint-disable no-sequences */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import packageJson from '../package.json'
import { DEFAULT_COMMANDS } from './commands.js'
import { DocsJson } from './types.js'
import { resolvePath } from './util/path.js'
const json: DocsJson = { version: packageJson.version, commands: [] }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const commandsTs = fs.readFileSync(path.resolve(__dirname, 'commands.ts'), 'utf8').split('\n')

const commandImports = commandsTs
  .filter((line) => /^import COMMAND_/.test(line))
  .map(
    (line) => /^import COMMAND_([^ ]+) from '\.\/([^']+)'$/.exec(line.replace(/\.js'$/, ".ts'"))!
  )
  .reduce<Record<string, string>>((obj, match) => ((obj[match[1]] = `src/${match[2]}`), obj), {})

const commandNames = commandsTs.flatMap((line) => /^\s+COMMAND_([^,\n]+),$/.exec(line)?.at(1) ?? [])

DEFAULT_COMMANDS.forEach((command, i) => {
  const {
    name,
    description,
    examples,
    botPermissions,
    userPermissions,
    guildOnly,
    logUsage,
    longDescription,
    type,
  } = command

  json.commands.push({
    name,
    type,
    description,
    longDescription: longDescription ?? description,
    examples: examples ?? [],
    botPermissions: botPermissions ?? [],
    userPermissions: userPermissions ?? [],
    guildOnly: guildOnly ?? false,
    logUsage: logUsage ?? false,
    options: (command as any).options ?? [],
    sourceLocation: commandImports[commandNames[i]],
  })
})

fs.mkdirSync(resolvePath('docs'), { recursive: true })
const file = resolvePath(`docs/${json.version}.json`)
fs.writeFileSync(file, JSON.stringify(json))

console.log(`Wrote documentation for v${json.version} to ${file}`)
