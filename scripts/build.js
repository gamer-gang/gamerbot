#!/usr/bin/env node
/* eslint-disable no-console */
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin'
import * as dotenv from 'dotenv'
import * as esbuild from 'esbuild'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import parse from 'yargs-parser'
import { createReleaseName, getVersion } from '../lib/version.js'

dotenv.config()

const argv = parse(process.argv.slice(2), {
  boolean: ['minify', 'watch', 'production', 'sentry'],
  string: ['outdir', 'release'],
})

if (!argv._.length) {
  console.log('build.js: no entrypoints specified')
  process.exit(2)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const releaseName = argv.release || (await createReleaseName())
/**
 * @satisfies {import('esbuild').BuildOptions}
 */
const options = {
  banner: {
    js: `globalThis.GAMERBOT_VERSION='${await getVersion()}';globalThis.SENTRY_RELEASE=${
      argv.production ? `'${releaseName}'` : 'undefined'
    };`,
  },
  target: 'esnext',
  format: 'esm',
  platform: 'node',
  bundle: true,
  external: ['discord.js', './node_modules/*', '@wiisportsresorts/cowsay'],
  sourcemap: true,
  entryPoints: argv._.map((entry) => entry.toString()),
  minify: argv.minify,
  outdir: argv.outdir,
  absWorkingDir: argv.absWorkingDir,
  plugins: [
    argv.sentry &&
      sentryEsbuildPlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: './dist/**',
        },
        release: releaseName,
        finalize: true,
        deploy: {
          env: argv.production ? 'production' : 'development',
        },
      }),
  ].filter(Boolean),
}

await mkdir(path.resolve(__dirname, '..', 'dist'), { recursive: true })
if (argv.watch) {
  const context = await esbuild.context(options)
  await context.watch()
} else {
  await esbuild.build(options)
}
