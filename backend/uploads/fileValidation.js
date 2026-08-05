const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')

const uploadDirectory = path.join(os.tmpdir(), 'pfpheds-uploads')
fs.mkdirSync(uploadDirectory, { recursive: true })

function createDiskStorage(multer) {
  return multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path
        .extname(file.originalname || '')
        .toLowerCase()
        .slice(0, 12)
      callback(null, `${Date.now()}-${randomUUID()}${extension}`)
    }
  })
}

async function readHeader(filePath, length = 32) {
  const handle = await fs.promises.open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buffer, 0, length, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

async function detectMimeType(filePath) {
  const header = await readHeader(filePath)
  if (header.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf'
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff)
    return 'image/jpeg'
  if (
    header.length >= 8 &&
    header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png'
  if (
    header.length >= 12 &&
    header.subarray(0, 4).toString('ascii') === 'RIFF' &&
    header.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp'

  const sample = await fs.promises.readFile(filePath)
  if (!sample.includes(0) && !sample.toString('utf8').includes('\ufffd')) return 'text/plain'
  return null
}

async function validateUploadedFile(file, allowedMimeTypes) {
  const detectedMimeType = await detectMimeType(file.path)
  if (!detectedMimeType || !allowedMimeTypes.has(detectedMimeType)) {
    const error = new Error('Le contenu réel du fichier n’est pas autorisé.')
    error.status = 400
    throw error
  }
  file.detectedMimeType = detectedMimeType
  return file
}

async function cleanupUploadedFiles(files = []) {
  await Promise.all(
    files.map(async (file) => {
      if (!file?.path) return
      try {
        await fs.promises.unlink(file.path)
      } catch (error) {
        if (error.code !== 'ENOENT')
          console.warn('[UPLOAD] Temporary file cleanup failed:', error.message)
      }
    })
  )
}

module.exports = {
  cleanupUploadedFiles,
  createDiskStorage,
  detectMimeType,
  validateUploadedFile
}
