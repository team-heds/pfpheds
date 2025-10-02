// server/workers/pushOutboxWorker.js
const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VAPID_PUBLIC,
  VAPID_PRIVATE,

  // réglages worker
  PUSH_WORKER_BATCH = '50',           // nb max jobs par cycle
  PUSH_WORKER_INTERVAL_MS = '10000',  // 10s entre cycles si daemon
  PUSH_WORKER_BROADCAST_LIMIT = '500' // limite de subs en broadcast par job (pagination simple)
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[pushOutboxWorker] ❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants')
  process.exit(1)
}
if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('[pushOutboxWorker] ❌ VAPID_PUBLIC / VAPID_PRIVATE manquants')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

webpush.setVapidDetails('mailto:admin@example.com', VAPID_PUBLIC, VAPID_PRIVATE)

async function claimJob(jobId) {
  // Marque atomiquement un job en "processing" seulement s'il n’est plus "pending"/"retrying"
  const { data, error } = await supabase
    .from('push_outbox')
    .update({ status: 'processing' })
    .eq('id', jobId)
    .in('status', ['pending', 'retrying'])
    .select('*')
    .single()

  if (error) return null
  return data // null si déjà pris par un autre worker
}

function backoffDelaySeconds(attempts) {
  // 10s, 30s, 2m, 5m, 15m, max 15m
  const seq = [10, 30, 120, 300, 900]
  return seq[Math.min(attempts, seq.length - 1)]
}

async function finalizeJobSuccess(jobId, sentCount) {
  return supabase
    .from('push_outbox')
    .update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: sentCount })
    .eq('id', jobId)
}

async function finalizeJobFailure(job, lastError) {
  const attempts = (job.attempts || 0) + 1
  const delay = backoffDelaySeconds(attempts)
  const next = new Date(Date.now() + delay * 1000).toISOString()
  const status = attempts >= 5 ? 'failed' : 'retrying'

  return supabase
    .from('push_outbox')
    .update({
      status,
      attempts,
      last_error: String(lastError).slice(0, 2000),
      next_retry_at: status === 'retrying' ? next : null
    })
    .eq('id', job.id)
}

async function fetchPendingJobs(limit) {
  const { data, error } = await supabase
    .from('push_outbox')
    .select('*')
    .in('status', ['pending', 'retrying'])
    .or('next_retry_at.is.null,next_retry_at.lte.now()')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

async function fetchSubscriptions(userId, limit, offset = 0) {
  let q = supabase.from('push_subscriptions').select('*').order('created_at', { ascending: true }).limit(limit).range(offset, offset + limit - 1)
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

async function deleteInvalidEndpoints(endpoints) {
  if (!endpoints.length) return
  await supabase.from('push_subscriptions').delete().in('endpoint', endpoints)
}

async function sendToSubscriptions(subs, payload) {
  const results = await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  )

  let sent = 0
  const toDelete = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      sent++
    } else {
      const msg = String(r.reason || '').toLowerCase()
      if (msg.includes('410') || msg.includes('404') || msg.includes('gone') || msg.includes('notfound')) {
        toDelete.push(subs[i].endpoint)
      }
    }
  })

  if (toDelete.length) await deleteInvalidEndpoints(toDelete)
  return sent
}

async function processJob(job) {
  // Claim
  const claimed = await claimJob(job.id)
  if (!claimed) return { skipped: true }

  const payload = JSON.stringify({ title: job.title, body: job.body, url: job.url || '/' })

  try {
    let totalSent = 0
    let offset = 0
    const pageSize = parseInt(PUSH_WORKER_BROADCAST_LIMIT, 10)

    // Diffuser à un user (userId) ou broadcast (null)
    while (true) {
      const batch = await fetchSubscriptions(job.user_id || null, pageSize, offset)
      if (!batch.length) break

      const sent = await sendToSubscriptions(batch, payload)
      totalSent += sent

      if (batch.length < pageSize) break
      offset += pageSize
    }

    await finalizeJobSuccess(job.id, totalSent)
    return { ok: true, sent: totalSent }
  } catch (err) {
    await finalizeJobFailure(job, err)
    return { ok: false, error: String(err) }
  }
}

async function runOnce() {
  const batch = parseInt(PUSH_WORKER_BATCH, 10)
  const jobs = await fetchPendingJobs(batch)
  if (!jobs.length) return { processed: 0 }

  let ok = 0, fail = 0, skipped = 0, totalSent = 0
  for (const job of jobs) {
    const r = await processJob(job)
    if (r.skipped) { skipped++; continue }
    if (r.ok) { ok++; totalSent += r.sent || 0 } else { fail++ }
  }
  return { processed: jobs.length, ok, fail, skipped, totalSent }
}

// Boucle daemon si lancé directement
if (require.main === module) {
  const loop = async () => {
    try {
      const r = await runOnce()
      if (r.processed) {
        console.log(`[pushOutboxWorker] cycle:`, r)
      }
    } catch (e) {
      console.error('[pushOutboxWorker] cycle error:', e)
    } finally {
      setTimeout(loop, parseInt(PUSH_WORKER_INTERVAL_MS, 10))
    }
  }
  loop()
}

module.exports = { runOnce }
