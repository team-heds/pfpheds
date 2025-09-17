const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET all praticiens formateurs (with search)
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('praticiens_formateurs').select('*');

    // Optional: Add search functionality based on a query parameter, e.g., 'q'
    const { q } = req.query;
    if (q) {
      // Searching in 'nom', 'prenom', and 'institution' fields
      query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,institution.ilike.%${q}%`);
    }

    const { data, error } = await query.order('nom', { ascending: true });

    if (error) {
      console.error('Error fetching praticiens:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET a single praticien formateur by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching praticien ${id}:`, error.message);
      return res.status(404).json({ error: 'Praticien non trouvé' });
    }
    res.json(data);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST (create) a new praticien formateur
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, mail, institution, localite } = req.body;

    if (!nom || !prenom) {
        return res.status(400).json({ error: 'Le nom et le prénom sont requis.' });
    }

    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .insert([{ nom, prenom, mail, institution, localite }])
      .select()
      .single();

    if (error) {
      console.error('Error creating praticien:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT (update) a praticien formateur
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, mail, institution, localite } = req.body;

    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .update({ nom, prenom, mail, institution, localite })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating praticien ${id}:`, error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a praticien formateur
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('praticiens_formateurs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting praticien ${id}:`, error.message);
      return res.status(500).json({ error: error.message });
    }
    res.status(204).send(); // No content
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
