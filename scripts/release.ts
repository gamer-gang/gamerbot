#!/usr/bin/env node
import { spawn } from 'child_process'

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

console.log('release.js: running release')

const tag = await exec(`git tag --points-at HEAD`)
if (tag.trim()) {
  console.log(`skipping tag, already tagged as ${tag}`)
} else {
  console.log('release.js: tagging commit')
  await exec(`bun git:tag`)
}

console.log('release.js: running publish')
await exec(`bun run publish`)

console.log('release.js: pushing commit')
await exec(`git push`)

console.log('release.js: pushing tags')
await exec(`git push --tags`)

const { REVALIDATE_URL } = process.env
if (!REVALIDATE_URL) {
  console.log('release.js: REVALIDATE_URL not set, skipping revalidation')
} else {
  console.log('release.js: revalidating website')

  const res = await fetch(REVALIDATE_URL)
  const body = await res.json()
  if (!res.ok) {
    console.log('release.js: revalidation failed')
    console.log(body.message)
    console.log(body.error)
  } else {
    console.log('release.js: revalidation successful')
  }
}

console.log('release.js: done')
