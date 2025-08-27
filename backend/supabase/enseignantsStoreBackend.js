const { Router } = require('express');
const supabase = require('../supabaseClient');

const router = Router();

// GET all enseignants
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('enseignants').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET one enseignant by id (TEXT PK from Firebase)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enseignants')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Enseignant not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create enseignant (expects id + email; first_name and last_name optional)
router.post('/', async (req, res) => {
  try {
    const { id, first_name, last_name, email } = req.body || {};
    if (!id) return res.status(400).json({ error: "Field 'id' is required" });
    if (!email) return res.status(400).json({ error: "Field 'email' is required" });

    const payload = { id, first_name: first_name || null, last_name: last_name || null, email };
    const { data, error } = await supabase
      .from('enseignants')
      .insert([payload])
      .select()
      .single();

    if (error) {
      // Handle unique violation on email
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update enseignant by id
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['first_name', 'last_name', 'email'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    const { data, error } = await supabase
      .from('enseignants')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Enseignant not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE enseignant by id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('enseignants')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;