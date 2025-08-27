const { Router } = require('express');
const supabase = require('../supabaseClient');

const router = Router();

// GET top-level folders (parent_id IS NULL)
router.get('/folders/top', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_physio_folders')
      .select('*')
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET one folder by id (basic info)
router.get('/folders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_physio_folders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Folder not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET subfolders of a folder
router.get('/folders/:id/children', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_physio_folders')
      .select('*')
      .eq('parent_id', req.params.id)
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET files in a folder
router.get('/folders/:id/files', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_physio_files')
      .select('*')
      .eq('folder_id', req.params.id)
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET one file by id
router.get('/files/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_physio_files')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'File not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Convenience: GET folder with children + files in one call
router.get('/folders/:id/full', async (req, res) => {
  try {
    const id = req.params.id;

    const [{ data: folder, error: e1 }, { data: children, error: e2 }, { data: files, error: e3 }] = await Promise.all([
      supabase.from('file_physio_folders').select('*').eq('id', id).single(),
      supabase.from('file_physio_folders').select('*').eq('parent_id', id).order('name', { ascending: true }),
      supabase.from('file_physio_files').select('*').eq('folder_id', id).order('name', { ascending: true }),
    ]);

    if (e1) throw e1;
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    if (e2) throw e2;
    if (e3) throw e3;

    res.json({ folder, children: children || [], files: files || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;