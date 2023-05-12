#!/usr/bin/env node
/* eslint-disable no-console */
import { getVersion } from '../lib/version.js'

console.log(await getVersion(process.argv[2] === '--version-only'))
