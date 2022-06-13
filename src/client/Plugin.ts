import type { Command } from '../commands/command.js'

export abstract class Plugin {
  abstract id: string
  commands: Command[] = []
}
