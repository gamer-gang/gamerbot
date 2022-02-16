# v2.2.0

## Features

- Add [`/trivia`](https://gamerbot.dev/commands#command-trivia)

## Changes

- Send `/run` output as file if output is over 40 lines long
- Fix order of eggers in `/eggleaderboard`
- Add source locations for commands to generated documentation JSON

## Bugfixes

No notable bugfixes.

# v2.1.0

## Features

- Add [`/skin`](https://gamerbot.dev/commands#command-skin)
- Add [`/uptime`](https://gamerbot.dev/commands#command-uptime)

## Changes

- Cache user and guild counts in a `CountManager` to reduce API calls + improve performance

## Bugfixes

- `/run`: output >=64 KB not displayed if an error occurs
- `/run`: gist url not escaped

# v2.0.0

Initial release of v2
