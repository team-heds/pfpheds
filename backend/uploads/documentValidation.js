const fs = require('fs')
const { detectMimeType } = require('./fileValidation')

const DOCUMENT_EXTENSIONS = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/plain': 'txt'
}

// Inspect ZIP central-directory entries rather than trusting the supplied MIME
// type or filename. Only ordinary, non-encrypted Office documents are accepted.
function detectOfficeMimeType(buffer) {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) return null
  let end = -1
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index--) {
    if (buffer.readUInt32LE(index) === 0x06054b50 && index + 22 + buffer.readUInt16LE(index + 20) === buffer.length) {
      end = index
      break
    }
  }
  if (end < 0 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) return null
  const count = buffer.readUInt16LE(end + 10)
  const size = buffer.readUInt32LE(end + 12)
  let offset = buffer.readUInt32LE(end + 16)
  const limit = offset + size
  if (!count || count === 65535 || limit > end) return null
  const names = new Set()
  for (let index = 0; index < count; index++) {
    if (offset + 46 > limit || buffer.readUInt32LE(offset) !== 0x02014b50) return null
    if (buffer.readUInt16LE(offset + 8) & 1) return null
    const nameLength = buffer.readUInt16LE(offset + 28)
    const next = offset + 46 + nameLength + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32)
    if (next > limit) return null
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    if (name.includes('..') || name.startsWith('/') || name.includes('\\') || /vbaproject\.bin$/i.test(name)) return null
    names.add(name)
    offset = next
  }
  if (offset !== limit || !names.has('[Content_Types].xml') || !names.has('_rels/.rels')) return null
  if (names.has('word/document.xml')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (names.has('xl/workbook.xml')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (names.has('ppt/presentation.xml')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  return null
}

async function validateDocument(file) {
  let mimeType = await detectMimeType(file.path)
  if (!mimeType) mimeType = detectOfficeMimeType(await fs.promises.readFile(file.path))
  if (!DOCUMENT_EXTENSIONS[mimeType]) {
    const error = new Error('Format non pris en charge. Utilisez PDF, DOCX, XLSX, PPTX, JPG, PNG, WEBP ou TXT.')
    error.status = 400
    throw error
  }
  return { mimeType, extension: DOCUMENT_EXTENSIONS[mimeType] }
}

module.exports = { DOCUMENT_EXTENSIONS, detectOfficeMimeType, validateDocument }
