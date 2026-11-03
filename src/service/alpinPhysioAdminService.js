import { supabase } from '@/supabase'

const ALPIN_TYPE = 'alpinphysio'

const assertSuccess = (error) => {
  if (error) throw error
}

export const mapAlpinEvent = (row = {}) => ({
  ...row,
  startDate: row.start_date,
  endDate: row.end_date,
  image: row.image_url,
  admin: row.admin_uid,
})

export async function listAlpinEvents({ publicOnly = false } = {}) {
  let query = supabase
    .from('events_with_counts')
    .select('*')
    .eq('type', ALPIN_TYPE)
    .order('start_date', { ascending: true })

  if (publicOnly) {
    query = query
      .eq('status', 'published')
      .eq('show_on_public_site', true)
      .gte('end_date', new Date().toISOString())
  }

  const { data, error } = await query
  assertSuccess(error)
  return (data || []).map(mapAlpinEvent)
}

async function syncFeedPost(event) {
  if (!event?.id) return

  if (event.status !== 'published' || !event.show_in_feed) {
    const { error } = await supabase.from('posts').delete().eq('event_id', event.id)
    assertSuccess(error)
    return
  }

  const date = new Intl.DateTimeFormat('fr-CH', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(event.start_date))
  const location = event.lieu ? ` · ${event.lieu}` : ''
  const content = `<p><strong>${event.title}</strong></p><p>${date}${location}</p><p>${event.description || ''}</p><p><a href="/events">Répondre à l’événement</a></p>`
  const post = {
    event_id: event.id,
    user_id: event.admin_uid,
    author_name: "Alp'in Physio",
    content,
    hashtags: { alpinphysio: true, evenement: true },
    mentions: {},
    community_id: null,
  }

  const { error } = await supabase.from('posts').upsert(post, { onConflict: 'event_id' })
  assertSuccess(error)
}

export async function saveAlpinEvent(input, userId) {
  const payload = {
    title: input.title?.trim(),
    description: input.description?.trim() || '',
    lieu: input.lieu?.trim() || '',
    meeting_point: input.meeting_point?.trim() || null,
    contact_email: input.contact_email?.trim() || null,
    start_date: input.start_date,
    end_date: input.end_date,
    registration_deadline: input.registration_deadline || null,
    capacity: input.capacity ? Number(input.capacity) : null,
    type: ALPIN_TYPE,
    association_id: ALPIN_TYPE,
    admin_uid: userId,
    image_url: input.image_url || null,
    status: input.status || 'draft',
    show_on_public_site: Boolean(input.show_on_public_site),
    show_in_feed: Boolean(input.show_in_feed),
    published_at: input.status === 'published' ? (input.published_at || new Date().toISOString()) : null,
    cancelled_at: input.status === 'cancelled' ? new Date().toISOString() : null,
  }

  const request = input.id
    ? supabase.from('events').update(payload).eq('id', input.id)
    : supabase.from('events').insert(payload)
  const { data, error } = await request.select('*').single()
  assertSuccess(error)
  await syncFeedPost(data)
  return mapAlpinEvent(data)
}

export async function deleteAlpinEvent(eventId) {
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  assertSuccess(error)
}

export async function setAttendance(eventId, response, profile = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Connexion requise pour répondre.')

  const payload = {
    event_id: eventId,
    user_uid: user.id,
    user_nom: profile.family_name || profile.nom || '',
    user_prenom: profile.forname || profile.prenom || '',
    user_photo_url: profile.avatar_url || profile.photoURL || null,
    response,
    note: profile.note || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('event_registrations')
    .upsert(payload, { onConflict: 'event_id,user_uid' })
    .select('*')
    .single()
  assertSuccess(error)
  return data
}

export async function getMyAttendance(eventIds) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !eventIds?.length) return []
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('user_uid', user.id)
    .in('event_id', eventIds)
  assertSuccess(error)
  return data || []
}

export async function listAttendance(eventId) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('user_nom', { ascending: true })
  assertSuccess(error)
  return data || []
}

export async function listMaterials(eventId) {
  if (!eventId) return []
  const { data, error } = await supabase
    .from('event_material_items')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order')
    .order('created_at')
  assertSuccess(error)
  return data || []
}

export async function saveMaterial(item) {
  const payload = {
    event_id: item.event_id,
    label: item.label?.trim(),
    quantity: Number(item.quantity || 1),
    status: item.status || 'to_prepare',
    notes: item.notes?.trim() || null,
    assigned_to: item.assigned_to?.trim() || null,
    sort_order: Number(item.sort_order || 0),
  }
  const request = item.id
    ? supabase.from('event_material_items').update(payload).eq('id', item.id)
    : supabase.from('event_material_items').insert(payload)
  const { data, error } = await request.select('*').single()
  assertSuccess(error)
  return data
}

export async function deleteMaterial(itemId) {
  const { error } = await supabase.from('event_material_items').delete().eq('id', itemId)
  assertSuccess(error)
}

export async function getSiteContent() {
  const { data, error } = await supabase
    .from('alpinphysio_site_content')
    .select('content, is_published, updated_at')
    .eq('id', 'main')
    .maybeSingle()
  assertSuccess(error)
  return data || { content: {}, is_published: true }
}

export async function saveSiteContent(content, userId) {
  const { data, error } = await supabase
    .from('alpinphysio_site_content')
    .upsert({ id: 'main', content, is_published: true, updated_by: userId }, { onConflict: 'id' })
    .select('*')
    .single()
  assertSuccess(error)
  return data
}

export async function listAlpinTeam() {
  const { data: roles, error: roleError } = await supabase
    .from('user_track_roles')
    .select('id,user_id,role,is_active,granted_at')
    .eq('track_id', 'ALPIN')
    .eq('is_active', true)
    .order('granted_at')
  assertSuccess(roleError)
  if (!roles?.length) return []

  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id,email,forname,family_name,display_name,avatar_url')
    .in('user_id', roles.map((row) => row.user_id))
  assertSuccess(profileError)
  const profilesById = new Map((profiles || []).map((profile) => [profile.user_id, profile]))
  return roles.map((role) => ({ ...role, ...(profilesById.get(role.user_id) || {}) }))
}

export async function addAlpinTeamMember(email, grantedBy) {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id,email')
    .ilike('email', email.trim())
    .maybeSingle()
  assertSuccess(profileError)
  if (!profile) throw new Error('Aucun compte ne correspond à cette adresse email.')

  const { data, error } = await supabase
    .from('user_track_roles')
    .upsert({ user_id: profile.user_id, track_id: 'ALPIN', role: 'COORDINATOR', is_active: true, granted_by: grantedBy }, { onConflict: 'user_id,track_id,role' })
    .select('*')
    .single()
  assertSuccess(error)
  return data
}

export async function deactivateAlpinTeamMember(roleId) {
  const { error } = await supabase.from('user_track_roles').update({ is_active: false }).eq('id', roleId).eq('track_id', 'ALPIN')
  assertSuccess(error)
}
