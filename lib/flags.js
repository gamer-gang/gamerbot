/* eslint-disable no-console */
import { load } from 'cheerio'
import { userAgent } from '../src/types/wikipedia.js'

const url = 'https://commons.wikimedia.org/w/rest.php/v1/page/Dependent_territory_flags/html'
const html = await fetch(url, { headers: { 'User-Agent': userAgent } }).then((res) => res.text())
const $ = load(html)

const images = $('img')

console.log(
  JSON.stringify({
    flags: [...images].map((image) => {
      const [prefix, filename] = image.attribs.src
        .replaceAll('https://upload.wikimedia.org/wikipedia/commons/thumb/', '')
        .replaceAll(/\.svg\/.+$/g, '.svg')
        .replaceAll(/^.\//g, '')
        .split('/')

      return {
        name: image.attribs.alt,
        prefix,
        image: filename,
      }
    }),
  })
)
