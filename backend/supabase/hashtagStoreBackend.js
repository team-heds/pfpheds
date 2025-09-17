const express = require('express')
const { supabase } = require('../supabaseClient.js')

const router = express.Router()

// GET all hashtags
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('hashtags').select('*')
    if (error) {
      throw error
    }
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST a new hashtag
router.post('/', async (req, res) => {
  const { code, active } = req.body;
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .insert([{ code, active }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) a hashtag by code
router.put('/:code', async (req, res) => {
  const { code } = req.params;
  const { active } = req.body;
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .update({ active })
      .eq('code', code)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Hashtag not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a hashtag by code
router.delete('/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .delete()
      .eq('code', code)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Hashtag not found' });

    res.status(200).json({ message: 'Hashtag deleted successfully', record: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router
