/* eslint-disable no-console */
import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import packageJson from '../package.json' assert { type: 'json' }

const exec = promisify(_exec)

export async function getVersion(versionOnly = false) {
  if (versionOnly) {
    return packageJson.version
  }

  try {
    const { stdout: tag } = await exec('git tag --points-at HEAD')
    if (tag.trim()) {
      return packageJson.version
    }

    const { stdout: commit } = await exec('git rev-parse --short HEAD')
    return `${packageJson.version}+${commit.trim()}`
  } catch (err) {
    return packageJson.version
  }
}

export async function createReleaseName(production = false): Promise<string> {
  const date = new Date()
  // format date to YYYYMMDD-HHMMSS
  const formattedDate = date
    .toISOString()
    .replace(/-/g, '-')
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace(/T/, '_')

  const { stdout: tag } = await exec('git tag --points-at HEAD')
  if (tag.trim()) {
    return packageJson.version
  }

  return `${(await getVersion()).replace(/\+/g, '_')}${production ? '' : '-dev'}_${formattedDate}`
}
