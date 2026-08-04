const express = require('express')
const router = express.Router()
const { supabaseAdmin: supabase } = require('../supabaseClient')

// GET all communities
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('communities').select('*')
    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching communities:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET a single community by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase.from('communities').select('*').eq('id', id).single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Community not found' })
    res.json(data)
  } catch (error) {
    console.error(`Error fetching community ${req.params.id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// POST a new community
router.post('/', async (req, res) => {
  try {
    const { body: communityData } = req
    // Ensure the 'id' field is not present or is null, so Supabase can generate it if needed
    // Or handle UUID generation here if you prefer client-side IDs
    const { data, error } = await supabase
      .from('communities')
      .insert([communityData])
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating community:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT to update a community
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { body: communityData } = req
    const { data, error } = await supabase
      .from('communities')
      .update(communityData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error(`Error updating community ${req.params.id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE a community
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('communities').delete().eq('id', id)
    if (error) throw error
    res.status(204).send()
  } catch (error) {
    console.error(`Error deleting community ${req.params.id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
