import COMMAND_CONFIG from './commands/config/config.js'
import COMMAND_CONNECT4 from './commands/games/connect4.js'
import COMMAND_DICE from './commands/games/dice.js'
import COMMAND_RPS from './commands/games/rps.js'
import COMMAND_TRIVIA from './commands/games/trivia.js'
import COMMAND_TRUTHORDARE from './commands/games/truthordare.js'
import COMMAND_ABOUT from './commands/general/about.js'
import COMMAND_ANALYTICS from './commands/general/analytics.js'
import COMMAND_AVATAR from './commands/general/avatar.js'
import COMMAND_GETAVATAR from './commands/general/getavatar.js'
import COMMAND_SERVERICON from './commands/general/servericon.js'
import COMMAND_SERVERINFO from './commands/general/serverinfo.js'
import COMMAND_UPTIME from './commands/general/uptime.js'
import COMMAND_COWSAY from './commands/messages/cowsay.js'
import COMMAND_EGGLEADERBOARD from './commands/messages/eggleaderboard.js'
import COMMAND_JOKE from './commands/messages/joke.js'
import COMMAND_LMGTFY from './commands/messages/lmgtfy.js'
import COMMAND_MARKOV from './commands/messages/markov.js'
import COMMAND_URBAN from './commands/messages/urban.js'
import COMMAND_WIKI from './commands/messages/wiki.js'
import COMMAND_XKCD from './commands/messages/xkcd.js'
import COMMAND_SKIN from './commands/minecraft/skin.js'
import COMMAND_STATS from './commands/minecraft/stats.js'
import COMMAND_USERNAME from './commands/minecraft/username.js'
import COMMAND_BAN from './commands/moderation/ban.js'
import COMMAND_KICK from './commands/moderation/kick.js'
import COMMAND_PURGE from './commands/moderation/purge.js'
import COMMAND_PURGETOHERE from './commands/moderation/purgetohere.js'
import COMMAND_ROLE from './commands/moderation/role.js'
import COMMAND_UNBAN from './commands/moderation/unban.js'
import COMMAND_APIMESSAGE from './commands/utility/apimessage.js'
import COMMAND_CHARACTER from './commands/utility/character.js'
import COMMAND_COLOR from './commands/utility/color.js'
import COMMAND_LATEX from './commands/utility/latex.js'
import COMMAND_MATH from './commands/utility/math.js'
import COMMAND_PING from './commands/utility/ping.js'
import COMMAND_RUN from './commands/utility/run.js'
import COMMAND_TIME from './commands/utility/time.js'
import COMMAND_TIMESTAMP from './commands/utility/timestamp.js'

export const DEFAULT_COMMANDS = [
  // config
  COMMAND_CONFIG,
  // games
  COMMAND_CONNECT4,
  COMMAND_DICE,
  COMMAND_RPS,
  COMMAND_TRIVIA,
  COMMAND_TRUTHORDARE,
  // general
  COMMAND_ABOUT,
  COMMAND_ANALYTICS,
  COMMAND_AVATAR,
  COMMAND_GETAVATAR,
  COMMAND_SERVERICON,
  COMMAND_SERVERINFO,
  COMMAND_UPTIME,
  // messages
  COMMAND_COWSAY,
  COMMAND_EGGLEADERBOARD,
  COMMAND_JOKE,
  COMMAND_LMGTFY,
  COMMAND_MARKOV,
  COMMAND_URBAN,
  COMMAND_WIKI,
  COMMAND_XKCD,
  // minecraft
  COMMAND_SKIN,
  COMMAND_STATS,
  COMMAND_USERNAME,
  // moderation
  COMMAND_BAN,
  COMMAND_KICK,
  COMMAND_PURGE,
  COMMAND_PURGETOHERE,
  COMMAND_ROLE,
  COMMAND_UNBAN,
  // utility
  COMMAND_APIMESSAGE,
  COMMAND_CHARACTER,
  COMMAND_COLOR,
  COMMAND_LATEX,
  COMMAND_MATH,
  COMMAND_PING,
  COMMAND_RUN,
  COMMAND_TIME,
  COMMAND_TIMESTAMP,
]
