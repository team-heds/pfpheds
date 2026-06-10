// supabase/institutionsStoreBackend.js
const { Router } = require('express')
const supabase = require('../supabaseClient')
const { supabaseAdmin } = require('../supabaseClient')
const multer = require('multer')
const { randomUUID } = require('crypto')
 
const router = Router()
const upload = multer({ storage: multer.memoryStorage() })
const INSTITUTIONS_BUCKET = 'institutions'

function getPublicUrl(path) {
  const { data } = supabaseAdmin.storage.from(INSTITUTIONS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function extractSupabaseStoragePath(url) {
  if (!url || typeof url !== 'string') return null

  try {
    const parsed = new URL(url)
    const marker = `/storage/v1/object/public/${INSTITUTIONS_BUCKET}/`
    const index = parsed.pathname.indexOf(marker)
    if (index === -1) return null
    return decodeURIComponent(parsed.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

router.post('/:id/images', upload.array('images'), async (req, res) => {
  try {
    const institutionId = String(req.params.id || '').trim()
    const files = req.files || []

    if (!institutionId) {
      return res.status(400).json({ error: 'InstitutionId manquant' })
    }
    if (!files.length) {
      return res.status(400).json({ error: 'Aucune image reçue' })
    }

    const uploaded = []

    for (const file of files) {
      const ext = file.originalname?.includes('.') ? file.originalname.split('.').pop() : 'jpg'
      const path = `${institutionId}/${Date.now()}-${randomUUID()}.${ext}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from(INSTITUTIONS_BUCKET)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('[Supabase] institutions image upload error:', uploadError)
        return res.status(400).json({ error: uploadError.message })
      }

      uploaded.push({
        path,
        url: getPublicUrl(path),
        name: file.originalname
      })
    }

    return res.status(201).json({ files: uploaded })
  } catch (e) {
    console.error('POST /api/institutions/:id/images failed:', e)
    return res.status(500).json({ error: e?.message || 'Internal Server Error' })
  }
})

router.delete('/:id/images', async (req, res) => {
  try {
    const rawUrl = req.body?.url
    const storagePath = extractSupabaseStoragePath(rawUrl)

    if (!storagePath) {
      return res.status(400).json({ error: 'URL image invalide' })
    }

    const { error } = await supabaseAdmin.storage
      .from(INSTITUTIONS_BUCKET)
      .remove([storagePath])

    if (error) {
      console.error('[Supabase] institutions image delete error:', error)
      return res.status(400).json({ error: error.message })
    }

    return res.status(204).send()
  } catch (e) {
    console.error('DELETE /api/institutions/:id/images failed:', e)
    return res.status(500).json({ error: e?.message || 'Internal Server Error' })
  }
})
 
// GET all
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('institutions').select('*')
    if (error) {
      console.error('[Supabase] institutions list error:', error)
      return res.status(502).json({ error: error.message })
    }
    res.json(data)
  } catch (e) {
    console.error('GET /api/institutions failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
 
// GET by ID (InstitutionId logique)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('InstitutionId', req.params.id)
      .single()
    if (error) {
      console.error('[Supabase] institutions get error:', error)
      return res.status(error.code === 'PGRST116' ? 404 : 502).json({ error: error.message })
    }
    res.json(data)
  } catch (e) {
    console.error('GET /api/institutions/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
 
// CREATE
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .insert([req.body])
      .select()
      .single()
    if (error) {
      console.error('[Supabase] institutions create error:', error)
      return res.status(400).json({ error: error.message })
    }
    res.status(201).json(data)
  } catch (e) {
    console.error('POST /api/institutions failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
 
// UPDATE (PUT) institutions
router.put('/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    console.log('🔧 PUT institutions for InstitutionId:', id)
 
    // Build payload from body, but never allow changing the primary key
    const payload = { ...req.body }
    delete payload.InstitutionId
 
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' })
    }
 
    const { data, error } = await supabase
      .from('institutions')
      .update(payload)
      .eq('InstitutionId', id)
      .select('*')
      .maybeSingle()
 
    // Handle real errors returned by Supabase
    const hasRealError = !!(error && (error.message || error.code))
    if (hasRealError) {
      console.error('[Supabase] institutions update error:', error)
      return res.status(400).json({
        error: error.message || 'Supabase update failed',
        code: error.code || null
      })
    }
 
    // Not found
    if (!data) {
      // Double-check existence
      const chk = await supabase
        .from('institutions')
        .select('InstitutionId')
        .eq('InstitutionId', id)
        .maybeSingle()
      if (!chk.data) return res.status(404).json({ error: 'Institution not found' })
      // If exists but nothing returned, send current state
      return res.json(chk.data)
    }
 
    return res.json(data)
  } catch (e) {
    console.error('PUT /api/institutions/:id failed:', e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})
 
 
// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('institutions')
      .delete()
      .eq('InstitutionId', req.params.id)
    if (error) {
      console.error('[Supabase] institutions delete error:', error)
      return res.status(400).json({ error: error.message })
    }
    res.status(204).send()
  } catch (e) {
    console.error('DELETE /api/institutions/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
 
module.exports = router
 
 
