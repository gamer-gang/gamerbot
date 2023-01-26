# v2.6.0

## Features

- Add `/joke` command
- Add `/markov` command
- Add internal storage manager for filesystem storage

## Changes

- Update packages to latest versions

## Fixes

- Fix canvas errors in `/stats`
- Fix path errors

# v2.5.0

## Changes

- Update to discord.js v14
- Update to Node.js v18
- Switch to esbuild for building
- Switch to native fetch API for HTTP requests
- Add `discordjsVersion` to docs.json

## Fixes

- Fix `/stats` `ctx.canvas` error

# v2.4.0

## Features

- Support attaching files for code and stdin in `/run`

## Changes

- Update Yarn to v3.2.1
- Update discord.js to v13.7.0
- Update packages to latest versions

# v2.3.0

## Features

- Add [`/connect4`](https://gamerbot.dev/commands#command-connect4)

## Bug Fixes

- Fix game interaction handling

# v2.2.3

## Changes

- Update Yarn to v3.2.0

## Bugfixes

- Fix `/latex` errors not appearing because of missing fonts
- Fix docs `latest.json` symlink

# v2.2.2

## Changes

- Prefix module names with `gamerbot/` in types package

## Bugfixes

- Fix crash when using `/stats` on a non-ranked player

# v2.2.1

## Bugfixes

- Correct .js extensions to .ts in generated documentation JSON

# v2.2.0

## Features

- Add [`/trivia`](https://gamerbot.dev/commands#command-trivia)

## Changes

- Send `/run` output as file if output is over 40 lines long
- Add source locations for commands to generated documentation JSON

## Bugfixes

- Fix order of eggers in `/eggleaderboard`

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
