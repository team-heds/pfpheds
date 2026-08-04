const { Router } = require('express')
const { supabaseAdmin } = require('../supabaseClient')

const router = Router()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizePermissions(value) {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .map((permission) => String(permission).trim())
        .filter((permission) => permission && permission.length <= 100)
    )
  ].slice(0, 100)
}

router.post('/', async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase()
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
    user_metadata: { forname, family_name: familyName, display_name: displayName }
  })
  if (authError) return res.status(400).json({ error: authError.message })

  const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert(
    {
      user_id: authData.user.id,
      email,
      forname,
      family_name: familyName,
      display_name: displayName,
      role,
      permissions,
      is_active: true
    },
    { onConflict: 'user_id' }
  )

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return res.status(400).json({ error: profileError.message })
  }

  return res.status(201).json({ id: authData.user.id, email, displayName })
})

router.get('/:id/permissions', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id))
    return res.status(400).json({ error: 'Identifiant utilisateur invalide.' })
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('permissions')
    .eq('user_id', req.params.id)
    .maybeSingle()
  if (error) return res.status(400).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Utilisateur introuvable.' })
  return res.json({ permissions: normalizePermissions(data.permissions) })
})

router.put('/:id/permissions', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id))
    return res.status(400).json({ error: 'Identifiant utilisateur invalide.' })
  const permissions = normalizePermissions(req.body?.permissions)
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .update({ permissions, updated_at: new Date().toISOString() })
    .eq('user_id', req.params.id)
    .select('user_id, permissions')
    .maybeSingle()
  if (error) return res.status(400).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Utilisateur introuvable.' })

  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
    app_metadata: { permissions }
  })
  if (metadataError) return res.status(400).json({ error: metadataError.message })
  return res.json({ permissions })
})

router.delete('/:id', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id))
    return res.status(400).json({ error: 'Identifiant utilisateur invalide.' })
  if (req.params.id === req.auth.userId)
    return res
      .status(400)
      .json({ error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' })
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
  if (authError) return res.status(400).json({ error: authError.message })
  await supabaseAdmin.from('user_profiles').delete().eq('user_id', req.params.id)
  return res.status(204).send()
})

module.exports = router
