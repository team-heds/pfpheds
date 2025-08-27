const { Router } = require('express');
const supabase = require('../supabaseClient');

const router = Router();

// GET all institutions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('institutions').select('*');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET a single institution by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('InstitutionId', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST (create) a new institution
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT (update) an institution by ID
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .update(req.body)
      .eq('InstitutionId', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE an institution by ID
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('institutions')
      .delete()
      .eq('InstitutionId', req.params.id);
    if (error) throw error;
    res.status(204).send(); // No content
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
