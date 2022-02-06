/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs'
import packageJson from '../package.json'
import { GamerbotClient } from './GamerbotClient.js'
import { DocsJson } from './types.js'
import { resolvePath } from './util/path.js'
const commands = GamerbotClient.DEFAULT_COMMANDS

const json: DocsJson = { version: packageJson.version, commands: [] }

for (const command of commands) {
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
  })
}

fs.mkdirSync(resolvePath('docs'), { recursive: true })
const file = resolvePath(`docs/${json.version}.json`)
fs.writeFileSync(file, JSON.stringify(json))

console.log(`Wrote documentation for v${json.version} to ${file}`)
