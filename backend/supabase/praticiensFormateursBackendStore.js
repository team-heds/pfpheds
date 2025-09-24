// supabase/praticiensFormateursBackendStore.js
const { Router } = require('express')
const { supabaseAdmin } = require('../supabaseClient') // client service = bypass RLS

const router = Router()
const supabase = supabaseAdmin

function hasRealError(err) {
  return !!(err && (err.message || err.code))
}

// GET all
router.get('/', async (_req, res) => {
  try {
    console.log('📋 [GET ALL] praticiens_formateurs...')
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('id, nom, prenom, mail, institution, localite') // on récupère id OU Id si existe
      .limit(200)

    if (hasRealError(error)) {
      console.error('[Supabase] list error:', error)
      return res.status(502).json({ error: error.message, code: error.code || null })
    }

    // Normaliser: toujours exposer "id"
    const normalized = (data || []).map(r => ({
      id: r.id  ?? null,
      nom: r.nom,
      prenom: r.prenom,
      mail: r.mail,
      institution: r.institution,
      localite: r.localite
    }))

    console.log('📋 [GET ALL] found', normalized.length)
    res.json(normalized)
  } catch (e) {
    console.error('GET /api/praticiens-formateurs failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()

    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('id,  nom, prenom, mail, institution, localite')
      .or(`id.eq.${id}`)
      .maybeSingle()

    if (hasRealError(error)) {
      console.error('[Supabase] get error:', error)
      return res.status(502).json({ error: error.message, code: error.code || null })
    }
    if (!data) return res.status(404).json({ error: 'Not found' })

    const row = {
      id: data.id ?? null,
      nom: data.nom,
      prenom: data.prenom,
      mail: data.mail,
      institution: data.institution,
      localite: data.localite
    }
    res.json(row)
  } catch (e) {
    console.error('GET /api/praticiens-formateurs/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// CREATE
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .insert([req.body])
      .select('id,  nom, prenom, mail, institution, localite')
      .maybeSingle()

    if (hasRealError(error)) {
      console.error('[Supabase] create error:', error)
      return res.status(400).json({ error: error.message, code: error.code || null })
    }
    if (!data) return res.status(400).json({ error: 'Insert failed' })

    const row = {
      id: data.id ?? null,
      nom: data.nom,
      prenom: data.prenom,
      mail: data.mail,
      institution: data.institution,
      localite: data.localite
    }
    res.status(201).json(row)
  } catch (e) {
    console.error('POST /api/praticiens-formateurs failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// UPDATE (PUT)
router.put('/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    console.log('🔧 [UPDATE] praticiens_formateurs id:', id)

    const allow = ['nom', 'prenom', 'mail', 'institution', 'localite']
    const payload = {}
    for (const k of allow) if (k in req.body) payload[k] = req.body[k]

    if (typeof payload.nom === 'string') payload.nom = payload.nom.replace(/[0-9]/g, '').trim()
    if (typeof payload.prenom === 'string') payload.prenom = payload.prenom.replace(/[0-9]/g, '').trim()

    if (!Object.keys(payload).length) {
      return res.status(400).json({ error: 'No updatable fields provided' })
    }

    // 1) tenter l’update en tolérant id/Id
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .update(payload)
      .select('id,  nom, prenom, mail, institution, localite')
      .maybeSingle()

    if (hasRealError(error)) {
      console.error('[Supabase] update error:', error)
      return res.status(400).json({ error: error.message, code: error.code || null })
    }

    // 2) si rien n’est renvoyé, on vérifie l’existence → no-op vs not found
    if (!data) {
      const check = await supabase
        .from('praticiens_formateurs')
        .select('id,  nom, prenom, mail, institution, localite')
        .or(`id.eq.${id},Id.eq.${id}`)
        .maybeSingle()

      if (hasRealError(check.error)) {
        console.error('[Supabase] follow-up select error:', check.error)
        return res.status(400).json({ error: check.error.message, code: check.error.code || null })
      }

      if (!check.data) {
        return res.status(404).json({ error: 'Praticien formateur not found' })
      }

      // no-op : on renvoie l’état courant
      const row = {
        id: check.data.id  ?? null,
        nom: check.data.nom,
        prenom: check.data.prenom,
        mail: check.data.mail,
        institution: check.data.institution,
        localite: check.data.localite
      }
      return res.json({ data: row, meta: { noop: true } })
    }

    const row = {
      id: data.id  ?? null,
      nom: data.nom,
      prenom: data.prenom,
      mail: data.mail,
      institution: data.institution,
      localite: data.localite
    }
    return res.json(row)
  } catch (e) {
    console.error('PUT /api/praticiens-formateurs/:id failed:', e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    const { error } = await supabase
      .from('praticiens_formateurs')
      .delete()
      .or(`id.eq.${id}`)

    if (hasRealError(error)) {
      console.error('[Supabase] delete error:', error)
      return res.status(400).json({ error: error.message, code: error.code || null })
    }
    res.status(204).send()
  } catch (e) {
    console.error('DELETE /api/praticiens-formateurs/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
