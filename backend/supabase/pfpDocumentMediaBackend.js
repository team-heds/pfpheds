const { Router } = require('express')
const multer = require('multer')
const fs = require('fs')
const { randomUUID } = require('crypto')
const { requireAdmin } = require('../middleware/auth')
const { createDiskStorage, cleanupUploadedFiles, validateUploadedFile } = require('../uploads/fileValidation')
const { getPublicStorageBaseUrl, toPublicStorageUrl } = require('./storageUrls')

const PFP_DOCUMENTS_BUCKET = 'pfp-documents'
const MAX_PDF_SIZE = 20 * 1024 * 1024

function documentPath(url, storageBaseUrl) {
  try {
    const parsed = new URL(url)
    if (parsed.origin !== new URL(storageBaseUrl).origin || parsed.search || parsed.hash) return null
    const prefix = `/storage/v1/object/authenticated/${PFP_DOCUMENTS_BUCKET}/`
    if (!parsed.pathname.startsWith(prefix)) return null
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length))
    if (!/^(institutions|places)\/[A-Za-z0-9_-]{1,160}\/[a-f0-9-]+\.pdf$/.test(path)) return null
    return path
  } catch { return null }
}

function createPfpDocumentMediaRouter(options = {}) {
  const client = options.client || require('../supabaseClient').supabaseAdmin
  const router = Router()
  const storage = client.storage.from(PFP_DOCUMENTS_BUCKET)
  const publicBaseUrl = options.publicStorageBaseUrl || getPublicStorageBaseUrl()
  const upload = multer({ storage: createDiskStorage(multer), limits: { fileSize: MAX_PDF_SIZE, files: 1, fields: 0 } })
  router.use((req, res, next) => req.auth?.userId ? next() : res.status(401).json({ error: 'Authentification requise.' }))

  router.post('/upload/:kind/:id', requireAdmin, (req, res) => {
    if (!['institutions', 'places'].includes(req.params.kind) || !/^[A-Za-z0-9_-]{1,160}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Référence du document invalide.' })
    }
    upload.single('file')(req, res, async uploadError => {
      try {
        if (uploadError) return res.status(400).json({ error: uploadError.code === 'LIMIT_FILE_SIZE' ? 'Le fichier dépasse la limite de 20 Mo.' : 'Téléversement invalide.' })
        if (!req.file || !req.file.size) return res.status(400).json({ error: 'Sélectionnez un fichier PDF non vide.' })
        await validateUploadedFile(req.file, new Set(['application/pdf']))
        const path = `${req.params.kind}/${req.params.id}/${randomUUID()}.pdf`
        const { error } = await storage.upload(path, await fs.promises.readFile(req.file.path), { contentType: 'application/pdf', cacheControl: '300', upsert: false })
        if (error) return res.status(502).json({ error: 'Impossible de téléverser le document.' })
        const { data } = storage.getPublicUrl(path)
        const url = toPublicStorageUrl(data.publicUrl, publicBaseUrl).replace(`/object/public/${PFP_DOCUMENTS_BUCKET}/`, `/object/authenticated/${PFP_DOCUMENTS_BUCKET}/`)
        return res.status(201).json({ file: { path, url, name: req.file.originalname } })
      } catch (error) {
        return res.status(error.status || 500).json({ error: error.status === 400 ? error.message : 'Impossible de téléverser le document.' })
      } finally {
        await cleanupUploadedFiles(req.file ? [req.file] : [])
      }
    })
  })

  // Only files referenced by a visible institution/place can be signed. A
  // guessed object path, orphaned upload, or another Storage bucket is rejected.
  router.get('/download', async (req, res) => {
    try {
      const url = String(req.query.url || '')
      const { data: base } = storage.getPublicUrl('')
      const path = documentPath(url, toPublicStorageUrl(base.publicUrl, publicBaseUrl))
      if (!path) return res.status(400).json({ error: 'Adresse du document invalide.' })
      const [kind, id] = path.split('/')
      const table = kind === 'institutions' ? 'institutions' : 'places'
      const idColumn = kind === 'institutions' ? 'InstitutionId' : 'PlaceId'
      const columns = kind === 'institutions' ? 'CyberleanURL, CyberlearnURL, is_hidden' : 'fileurl, InstitutionId'
      const { data: row, error } = await client.from(table).select(columns).eq(idColumn, id).maybeSingle()
      if (error) return res.status(502).json({ error: 'Impossible de charger le document.' })
      if (!row || row.is_hidden || !(kind === 'institutions' ? [row.CyberleanURL, row.CyberlearnURL] : [row.fileurl]).includes(url)) {
        return res.status(404).json({ error: 'Document introuvable.' })
      }
      if (kind === 'places') {
        const { data: institution, error: institutionError } = await client.from('institutions').select('is_hidden').eq('InstitutionId', row.InstitutionId).maybeSingle()
        if (institutionError) return res.status(502).json({ error: 'Impossible de charger le document.' })
        if (!institution || institution.is_hidden) return res.status(404).json({ error: 'Document introuvable.' })
      }
      const { data, error: signError } = await storage.createSignedUrl(path, 300)
      if (signError || !data?.signedUrl) return res.status(502).json({ error: 'Impossible d’ouvrir le document.' })
      res.set('Cache-Control', 'no-store')
      return res.json({ url: toPublicStorageUrl(data.signedUrl, publicBaseUrl), expiresIn: 300 })
    } catch { return res.status(500).json({ error: 'Impossible d’ouvrir le document.' }) }
  })
  return router
}

module.exports = { PFP_DOCUMENTS_BUCKET, MAX_PDF_SIZE, documentPath, createPfpDocumentMediaRouter }
