import { exec } from 'child_process'
import packageJson from '../package.json' assert { type: 'json' }

exec('git tag --points-at HEAD', (err, stdout, stderr) => {
  if (!stdout.trim()) {
    exec('git rev-parse --short HEAD', (err, stdout, stderr) => {
      console.log(`${packageJson.version}+${stdout.trim()}`)
    })
  } else {
    console.log(packageJson.version)
  }
})
