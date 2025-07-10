#!/usr/bin/env node
import { exec as _exec } from 'child_process'
import { promisify } from 'util'

const exec = (command: string) => {
  console.log('+', command)
  return promisify(_exec)(command)
}

console.log('release.js: running release')

const { stdout: tag } = await exec(`git tag --points-at HEAD`)
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
