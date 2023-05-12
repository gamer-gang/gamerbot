#!/usr/bin/env node
import { exec as _exec } from 'child_process'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { createReleaseName } from '../lib/version.js'

dotenv.config()

const exec = promisify(_exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const releaseName = await createReleaseName(true)

console.log(`publish.js: building release ${releaseName}`)

console.log('publish.js: building js, publishing sourcemaps')
const buildScript = path.join(__dirname, 'build.js')
const dist = path.resolve(__dirname, '..', 'dist')
await exec(
  `${buildScript} --outdir=${dist} --production --minify --sentry --release='${releaseName}' src/index.ts src/docgen.ts`
)

console.log('publish.js: building docker container')
await exec(`docker build ${path.resolve(__dirname, '..')} -t ghcr.io/gamer-gang/gamerbot:latest`)

console.log('publish.js: tagging container')
await exec(
  `docker tag ghcr.io/gamer-gang/gamerbot:latest ghcr.io/gamer-gang/gamerbot:${releaseName}`
)

console.log('publish.js: pushing containers')
await exec(`docker push ghcr.io/gamer-gang/gamerbot:latest`)
await exec(`docker push ghcr.io/gamer-gang/gamerbot:${releaseName}`)

console.log('publish.js: done')
