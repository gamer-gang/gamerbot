#!/usr/bin/env node
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createReleaseName, getVersion } from '../lib/version.js'

function exec(command: string): Promise<string> {
  console.log('+', command)
  const cmd = spawn(command, {
    shell: '/bin/bash',
    stdio: 'pipe',
  })
  let output = ''
  cmd.stdout.on('data', (data) => {
    output += data
    process.stdout.write(data)
  })
  cmd.stderr.pipe(process.stderr as any)
  return new Promise<string>((resolve, reject) => {
    cmd.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${command}`))
      } else {
        resolve(output)
      }
    })
  })
}

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
