const { Router } = require('express')
const { supabaseAdmin } = require('../supabaseClient')

const router = Router()

router.post('/', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const forname = String(req.body?.forname || '').trim()
  const familyName = String(req.body?.familyName || '').trim()
  const displayName = String(req.body?.displayName || `${forname} ${familyName}`).trim()
  const role = String(req.body?.role || 'student').trim()
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : []

  if (!email.includes('@') || password.length < 8 || !forname || !familyName) {
    return res.status(400).json({ error: 'Données utilisateur invalides.' })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { forname, family_name: familyName, display_name: displayName },
  })
  if (authError) return res.status(400).json({ error: authError.message })

  const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert({
    user_id: authData.user.id,
    email,
    forname,
    family_name: familyName,
    display_name: displayName,
    role,
    permissions,
    is_active: true,
  }, { onConflict: 'user_id' })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return res.status(400).json({ error: profileError.message })
  }

  return res.status(201).json({ id: authData.user.id, email, displayName })
})

module.exports = router
