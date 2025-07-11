/* eslint-disable no-return-assign */
/* eslint-disable no-sequences */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_COMMANDS } from '../lib/commands.js'
import type { DocsJson } from '../lib/types.js'
import packageJson from '../package.json'

const processVersion = (version: string) => {
  if (version.startsWith('^') || version.startsWith('~')) {
    version = version.slice(1)
  }

  return version
}

const json: DocsJson = {
  version: packageJson.version,
  discordjsVersion: processVersion(packageJson.dependencies['discord.js']),
  commands: [],
}

// ./dist/docgen.js
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (p: string) => path.resolve(__dirname, '..', p)

const commandsTs = fs
  .readFileSync(resolvePath('lib/commands.ts'), 'utf8')
  .split('\n')

const commandImports = Object.fromEntries(
  commandsTs
    .filter((line) => /^import COMMAND_/.test(line))
    .map(
      (line) =>
        /^import COMMAND_([^ ]+) from '\.\/([^']+)'$/.exec(
          line.replace(/\.js'$/, ".ts'")
        )!
    )
    .map((match) => [match[1], `lib/${match[2]}`])
)

const commandNames = commandsTs.flatMap(
  (line) => /^\s+COMMAND_([^,\n]+),$/.exec(line)?.at(1) ?? []
)

for (const [i, command] of DEFAULT_COMMANDS.entries()) {
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
}

fs.mkdirSync(resolvePath('docs'), { recursive: true })
const file = resolvePath(`docs/${json.version}.json`)
fs.writeFileSync(file, JSON.stringify(json))

console.log(`Wrote documentation for v${json.version} to ${file}`)

const latest = resolvePath('docs/latest.json')
if (fs.existsSync(latest)) {
  fs.unlinkSync(latest)
}
fs.symlinkSync(`${json.version}.json`, latest)

console.log(`Linked v${json.version}.json to latest.json`)
