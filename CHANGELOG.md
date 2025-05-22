# v2.13.0

## Changes

- Make `/markov` scope limited to guild

## Fixes

- Fix `$$<id>.eval` not working
- Fix deploys when entrypoint command is present

# v2.12.2

## Fixes

- Fix winning eggs on failure to bid in `/dice`

# v2.12.1

## Fixes

- Fix `/urban` too many definitions in search box
- Fix release script with Bun

# v2.12.0

## Features

- Add egg captcha
- Add `/flag` name on skip

## Changes

- Switch to Bun

## Fixes

- Fix negative egg wagers

# v2.11.0

## Features

- Improve `/dice` UX and visuals
- Use custom emojis for embeds and `/dice`
- Improve `$$<id>.eval` object logging

## Fixes

- Fix `/purge` and `Purge to here` once and for all
- Fix snowflake ID timestamp calculation

# v2.10.2

## Changes

- Set release name on tagged commits to version only

## Fixes

- Add mkdirp on dist directory before build

# v2.10.1

## Changes

- Remove analytics subsystem (we have Sentry now)
- Internal cleanup

## Fixes

- Fix .env file not being loaded correctly

# v2.10.0

## Features

- Add `$$<id>.eval` admin command
- Add `/flags` game

## Changes

- Use t3-env for environment validation
- Completely rework build system
  - esbuild, sentry, and docker
- Add Sentry error and performance monitoring
- Use UNIX sockets for database

# v2.9.0

## Features

- Support autocompletion in `/urban`

## Changes

- Return 25 autocompletions instead of 5 in `/wiki`
- Remove message components from `/urban` after idle timeout

# v2.8.0

## Features

- Add `/urban` command

# v2.7.0

## Features

- Add `/wiki` command

# v2.6.1

## Changes

- Update packages to latest versions

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
