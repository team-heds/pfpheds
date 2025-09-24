// 
// .js
const { Router } = require('express')
const supabase = require('../supabaseClient') // 👈 le même client que pour institutions

const router = Router()

// GET all (+ recherche optionnelle ?q=)
router.get('/', async (req, res) => {
  try {
    console.log('📋 [GET ALL] praticiens...')
    const q = (req.query.q || '').trim()
    let query = supabase
      .from('praticiens')
      .select('id, nom, prenom, mail, institution, localite, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (q) {
      // petit filtre simple sur nom/prenom/mail
      query = query.or(
        `nom.ilike.%${q}%,prenom.ilike.%${q}%,mail.ilike.%${q}%`
      )
    }

    const { data, error } = await query
    if (error) {
      console.error('[Supabase] praticiens list error:', error)
      return res.status(502).json({ error: error.message })
    }
    res.json(data ?? [])
  } catch (e) {
    console.error('GET /api/praticiens failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('praticiens')
      .select('id, nom, prenom, mail, institution, localite, created_at')
      .eq('id', req.params.id)
      .single()

    if (error) {
      console.error('[Supabase] praticiens get error:', error)
      return res.status(error.code === 'PGRST116' ? 404 : 502).json({ error: error.message })
    }
    res.json(data)
  } catch (e) {
    console.error('GET /api/praticiens/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// CREATE
router.post('/', async (req, res) => {
  try {
    // on laisse Postgres générer id (uuid) et created_at (now())
    const payload = {
      nom: req.body.nom,
      prenom: req.body.prenom,
      mail: req.body.mail ?? null,
      institution: req.body.institution ?? null,
      localite: req.body.localite ?? null,
    }

    const { data, error } = await supabase
      .from('praticiens')
      .insert([payload])
      .select('id, nom, prenom, mail, institution, localite, created_at')
      .single()

    if (error) {
      console.error('[Supabase] praticiens create error:', error)
      return res.status(400).json({ error: error.message })
    }
    res.status(201).json(data)
  } catch (e) {
    console.error('POST /api/praticiens failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// UPDATE (PUT)
// UPDATE (PUT)
router.put('/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    console.log('🔧 PUT praticiens for id:', id)
    console.log('🔧 RAW body =', req.body)

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid UUID' })
    }

    const allow = ['nom', 'prenom', 'mail', 'institution', 'localite']
    const payload = {}
    for (const k of allow) if (k in req.body) payload[k] = req.body[k]

    if (typeof payload.nom === 'string')    payload.nom    = payload.nom.replace(/[0-9]/g, '').trim()
    if (typeof payload.prenom === 'string') payload.prenom = payload.prenom.replace(/[0-9]/g, '').trim()

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' })
    }

    console.log('🔧 UPDATE payload =', payload)

    const { data, error } = await supabase
      .from('praticiens')
      .update(payload)
      .eq('id', id)
      .select('id, nom, prenom, mail, institution, localite, created_at')
      .maybeSingle()

    console.log('🔧 Supabase update result:', { data, error })

    if (!data && !error) {
      return res.status(404).json({ error: 'Praticien not found' })
    }
    if (error) {
      return res.status(400).json({
        error: error.message || 'Supabase update failed',
        code: error.code || null,
        details: error.details || null,
        hint: error.hint || null
      })
    }

    return res.json(data)
  } catch (e) {
    console.error('PUT /api/praticiens/:id failed:', e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})



// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('praticiens')
      .delete()
      .eq('id', req.params.id)

    if (error) {
      console.error('[Supabase] praticiens delete error:', error)
      return res.status(400).json({ error: error.message })
    }
    res.status(204).send()
  } catch (e) {
    console.error('DELETE /api/praticiens/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
