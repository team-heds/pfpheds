const { Router } = require('express')
const multer = require('multer')
const fs = require('fs')
const { randomUUID } = require('crypto')
const { requireAdmin } = require('../middleware/auth')
const { createDiskStorage, cleanupUploadedFiles } = require('../uploads/fileValidation')
const { validateDocument } = require('../uploads/documentValidation')
const { getPublicStorageBaseUrl, toPublicStorageUrl } = require('./storageUrls')

const FILE_PHYSIO_BUCKET = 'file-physio'
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024
const SIGNED_URL_LIFETIME = 300

function privateDocumentPath(url, storageBaseUrl) {
  try {
    const parsed = new URL(url)
    if (parsed.origin !== new URL(storageBaseUrl).origin) return null
    const prefix = `/storage/v1/object/authenticated/${FILE_PHYSIO_BUCKET}/`
    if (!parsed.pathname.startsWith(prefix) || parsed.search || parsed.hash) return null
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length))
    if (!path || path.split('/').some(part => !part || part === '.' || part === '..') || /[\\\x00-\x1f]/.test(path)) return null
    return path
  } catch {
    return null
  }
}

function createFilePhysioMediaRouter(options = {}) {
  const client = options.client || require('../supabaseClient').supabaseAdmin
  const publicBaseUrl = options.publicStorageBaseUrl || getPublicStorageBaseUrl()
  const router = Router()
  const storage = client.storage.from(FILE_PHYSIO_BUCKET)
  const upload = multer({
    storage: createDiskStorage(multer),
    limits: { fileSize: MAX_DOCUMENT_SIZE, files: 1, fields: 0 }
  })

  // This router is mounted after API authentication, but protects itself too so
  // it remains safe if mounted independently in a future application.
  router.use((req, res, next) => req.auth?.userId
    ? next()
    : res.status(401).json({ error: 'Authentification requise.' }))

  router.post('/files/upload', requireAdmin, (req, res) => {
    upload.single('file')(req, res, async uploadError => {
      try {
        if (uploadError) {
          return res.status(400).json({ error: uploadError.code === 'LIMIT_FILE_SIZE'
            ? 'Le fichier dépasse la limite de 20 Mo.' : 'Fichier non valide ou limite de téléversement dépassée.' })
        }
        if (!req.file || req.file.size === 0) return res.status(400).json({ error: 'Sélectionnez un fichier non vide.' })
        const { mimeType, extension } = await validateDocument(req.file)
        const path = `documents/${randomUUID()}.${extension}`
        const { error } = await storage.upload(path, await fs.promises.readFile(req.file.path), {
          contentType: mimeType,
          cacheControl: '300',
          upsert: false
        })
        if (error) return res.status(502).json({ error: 'Impossible de téléverser le document. Réessayez.' })
        const { data } = storage.getPublicUrl(path)
        const url = toPublicStorageUrl(data.publicUrl, publicBaseUrl)
          .replace(`/object/public/${FILE_PHYSIO_BUCKET}/`, `/object/authenticated/${FILE_PHYSIO_BUCKET}/`)
        return res.status(201).json({ file: { path, url, name: req.file.originalname } })
      } catch (error) {
        return res.status(error.status || 500).json({ error: error.status === 400 ? error.message : 'Impossible de téléverser le document.' })
      } finally {
        await cleanupUploadedFiles(req.file ? [req.file] : [])
      }
    })
  })

  router.post('/files/:id/download', async (req, res) => {
    try {
      const { data: file, error } = await client.from('file_physio_files')
        .select('id, url').eq('id', req.params.id).maybeSingle()
      if (error) return res.status(502).json({ error: 'Impossible de charger le document.' })
      if (!file) return res.status(404).json({ error: 'Document introuvable.' })
      const path = privateDocumentPath(file.url, publicBaseUrl)
      if (!path) return res.status(400).json({ error: 'Ce document ne se trouve pas dans le stockage sécurisé.' })
      const { data, error: signingError } = await storage.createSignedUrl(path, SIGNED_URL_LIFETIME)
      if (signingError || !data?.signedUrl) return res.status(502).json({ error: 'Impossible d’ouvrir le document. Réessayez.' })
      res.set('Cache-Control', 'no-store')
      return res.json({ url: toPublicStorageUrl(data.signedUrl, publicBaseUrl), expiresIn: SIGNED_URL_LIFETIME })
    } catch {
      return res.status(500).json({ error: 'Impossible d’ouvrir le document.' })
    }
  })
  return router
}

module.exports = { FILE_PHYSIO_BUCKET, MAX_DOCUMENT_SIZE, privateDocumentPath, createFilePhysioMediaRouter }
