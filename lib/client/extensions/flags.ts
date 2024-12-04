import { FlagsGame } from '../../models/FlagsGame.js'
import { MultiplayerGameExtension } from '../../models/MutliplayerGameExtension.js'
import { GamerbotClient } from '../GamerbotClient.js'

export default class FlagsExtension extends MultiplayerGameExtension<FlagsGame> {
  constructor(client: GamerbotClient) {
    super(client, FlagsGame, 'flags')
  }
}
