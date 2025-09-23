// supabase/praticiensFormateursBackendStore.js
const { Router } = require('express')
const supabase = require('../supabaseClient')

const router = Router()

// GET all
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('praticiens_formateurs').select('*')
    
    // Optional: Add search functionality based on a query parameter, e.g., 'q'
    const { q } = req.query;
    if (q) {
      // Searching in 'nom', 'prenom', and 'institution' fields
      query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,institution.ilike.%${q}%`);
    }
    
    const { data, error } = await query.order('nom', { ascending: true })
    if (error) {
      console.error('[Supabase] praticiens_formateurs list error:', error)
      // If table doesn't exist, return empty array for now
      if (error.code === '42P01') {
        console.log('Table praticiens_formateurs does not exist yet, returning empty array')
        return res.json([])
      }
      return res.status(502).json({ error: error.message })
    }
    res.json(data)
  } catch (e) {
    console.error('GET /api/praticiens_formateurs failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) {
      console.error('[Supabase] praticiens_formateurs get error:', error)
      return res.status(error.code === 'PGRST116' ? 404 : 502).json({ error: error.message })
    }
    res.json(data)
  } catch (e) {
    console.error('GET /api/praticiens_formateurs/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// CREATE
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .insert([req.body])
      .select()
      .single()
    if (error) {
      console.error('[Supabase] praticiens_formateurs create error:', error)
      return res.status(400).json({ error: error.message })
    }
    res.status(201).json(data)
  } catch (e) {
    console.error('POST /api/praticiens_formateurs failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// UPDATE (PATCH)
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) {
      console.error('[Supabase] praticiens_formateurs update error:', error)
      return res.status(400).json({ error: error.message })
    }
    res.json(data)
  } catch (e) {
    console.error('PUT /api/praticiens_formateurs/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('praticiens_formateurs')
      .delete()
      .eq('id', req.params.id)
    if (error) {
      console.error('[Supabase] praticiens_formateurs delete error:', error)
      return res.status(400).json({ error: error.message })
    }
    res.status(204).send()
  } catch (e) {
    console.error('DELETE /api/praticiens_formateurs/:id failed:', e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
