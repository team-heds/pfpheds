const { Router } = require('express')
const supabase = require('../supabaseClient')

const router = Router()

// Middleware pour extraire le user depuis le token JWT (Authorization: Bearer <token>)
const setUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    req.user = null
    return next() // Pas de token, on continue sans user
  }
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error) throw error
    req.user = data.user
  } catch (e) {
    req.user = null // Token invalide ou expiré
  }
  next()
}

// Appliquer le middleware à toutes les routes de ce fichier
router.use(setUser)

// Route pour mettre à jour le profil du user connecté
router.put('/profile', async (req, res) => {
  // 1. Vérifier si le user est authentifié (via middleware)
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Authentification requise' })
  }

  // 2. Préparer la ligne à upsert
  const profileData = {
    user_id: req.user.id, // On force l'user_id à celui du token
    ...req.body,
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return res.json({ ok: true, record: data })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
})

module.exports = router