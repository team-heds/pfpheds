const express = require('express');
const rateLimit = require('express-rate-limit');
const webpush = require('web-push');
const { supabaseAdmin } = require('../supabaseClient');

const {
  VAPID_PUBLIC,
  VAPID_PRIVATE,
  ADMIN_PUSH_KEY,
  ALLOWED_ORIGINS
} = process.env;

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.warn('[PUSH] VAPID_PUBLIC / VAPID_PRIVATE manquants – l’envoi échouera.');
}

webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const router = express.Router();

// CORS fin (si tu veux limiter spécifiquement cette route)
router.use((req, res, next) => {
  if (!ALLOWED_ORIGINS) return next();
  const allow = ALLOWED_ORIGINS.split(',').map(s => s.trim());
  const origin = req.headers.origin;
  if (origin && allow.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-push-key');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Anti-abus minimal
const limiter = rateLimit({ windowMs: 60_000, max: 30 });
router.use('/send', limiter);

// Protection simple par clé admin (recommandé si appelé depuis un back-office)
function requireAdminKey(req, res, next) {
  if (!ADMIN_PUSH_KEY) return next(); // pas activé → accès ouvert (dev)
  const k = req.header('x-admin-push-key');
  if (k !== ADMIN_PUSH_KEY) return res.status(401).json({ ok:false, error:'Unauthorized' });
  next();
}

/**
 * POST /api/push/send
 * body: { user_id?: string|null, title?: string, body?: string, url?: string, filter?: { platform?: 'ios'|'android'|'web' } }
 */
router.post('/send', requireAdminKey, async (req, res) => {
  try {
    const { user_id = null, title = 'Notification', body = '', url = '/', filter = null } = req.body || {};
    if (typeof title !== 'string' || typeof body !== 'string') {
      return res.status(400).json({ ok:false, error:'Invalid payload' });
    }

    // Récupère les abonnements
    let q = supabaseAdmin.from('push_subscriptions').select('*');
    if (user_id) q = q.eq('user_id', user_id);
    if (filter?.platform) q = q.eq('platform', filter.platform);

    const { data: subs, error } = await q;
    if (error) return res.status(500).json({ ok:false, error: String(error.message || error) });

    const payload = JSON.stringify({ title, body, url });
    const results = await Promise.allSettled(
      (subs || []).map(s =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    );

    // Nettoyage des endpoints invalides (404/410 Gone)
    const toDelete = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const msg = String(r.reason || '').toLowerCase();
        if (msg.includes('410') || msg.includes('404') || msg.includes('gone') || msg.includes('notfound')) {
          toDelete.push(subs[i].endpoint);
        }
      }
    });
    if (toDelete.length) {
      await supabaseAdmin.from('push_subscriptions').delete().in('endpoint', toDelete);
    }

    return res.json({ ok:true, sent: subs?.length ?? 0, cleaned: toDelete.length });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
});

module.exports = router;
