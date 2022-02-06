/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import packageJson from '../../package.json'
import { GamerbotClient } from '../GamerbotClient.js'
import { DocsJson } from '../types.js'

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

console.log(JSON.stringify(json))
