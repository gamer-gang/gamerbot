#!/usr/bin/env node
import { exec as _exec } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { createReleaseName, getVersion } from '../lib/version.js'

const exec = promisify(_exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const releaseName = await createReleaseName(true)
const version = await getVersion()

console.log(`publish.js: building release ${releaseName}`)

console.log('publish.js: building docker container')
const context = path.resolve(__dirname, '..')
await exec(
  `docker build ${context} -t ghcr.io/gamer-gang/gamerbot:latest --build-arg RELEASE_NAME=${releaseName} --build-arg GAMERBOT_VERSION=${version}`
)

console.log('publish.js: tagging container')
await exec(
  `docker tag ghcr.io/gamer-gang/gamerbot:latest ghcr.io/gamer-gang/gamerbot:${releaseName}`
)

console.log('publish.js: pushing containers')
await exec(`docker push ghcr.io/gamer-gang/gamerbot:latest`)
await exec(`docker push ghcr.io/gamer-gang/gamerbot:${releaseName}`)

console.log('publish.js: done')
