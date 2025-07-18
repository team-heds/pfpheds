require('dotenv').config()
const express = require('express')
const supabase = require('./supabaseClient');
const app = express()
app.use(express.json())

app.get('/api/ping', (req, res) => {
  res.send('pingpong')
})

app.get('/api/pong', (req, res) => {
  res.send('aller')
})

// Exemple de route test Supabase

app.get('/api/chapters', async (req, res) => {
  const { data, error } = await supabase.from('chapters').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Lancement du serveur sur toutes les interfaces réseau
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
