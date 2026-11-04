// This transformation is only used by the TEST overlay image. Keep the running
// backend's other routes intact instead of copying a possibly divergent index.
const fs = require('node:fs')
const file = '/app/index.js'
const source = fs.readFileSync(file, 'utf8')
const anchor = "  'https://api2.hedsvs.ch'"
if (source.includes("'https://test.hedsvs.ch'")) process.exit(0)
if (source.split(anchor).length !== 2) throw new Error('Unexpected CORS configuration; stop deployment.')
fs.writeFileSync(file, source.replace(anchor, `${anchor},\n  'https://test.hedsvs.ch'`))
