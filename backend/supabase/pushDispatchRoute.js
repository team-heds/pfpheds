const express = require('express')
const { runOnce } = require('../workers/pushOutboxWorker')

const router = express.Router()

// Protège cette route si nécessaire (clé admin / JWT admin)
router.post('/dispatch', async (req, res) => {
  try {
    const r = await runOnce()
    res.json({ ok: true, ...r })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

module.exports = router
