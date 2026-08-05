const { Router } = require('express')

const router = Router()
const VIMEO_API_BASE = 'https://api.vimeo.com'

function getToken() {
  return process.env.VIMEO_ACCESS_TOKEN
}

async function vimeoRequest(pathname) {
  const token = getToken()
  if (!token) {
    const error = new Error('Vimeo is not configured on the server.')
    error.status = 503
    throw error
  }
  const response = await fetch(`${VIMEO_API_BASE}${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
  })
  if (!response.ok) {
    const error = new Error(`Vimeo request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return response.json()
}

function mapVideo(video) {
  return {
    id: video.uri?.split('/').pop(),
    name: video.name,
    description: video.description,
    duration: video.duration,
    pictures: video.pictures?.sizes || [],
    link: video.link,
    privacy: video.privacy?.view || 'unknown',
    domains: video.privacy?.embed?.domains || [],
    created_time: video.created_time,
    tags: video.tags || [],
  }
}

router.get('/videos', async (req, res) => {
  try {
    const perPage = Math.min(Math.max(Number(req.query.perPage) || 50, 1), 100)
    const maxPages = Math.min(Math.max(Number(req.query.maxPages) || 10, 1), 20)
    const query = String(req.query.query || '').trim()
    const videos = []
    for (let page = 1; page <= maxPages; page += 1) {
      const params = new URLSearchParams({ per_page: String(perPage), page: String(page) })
      if (query) params.set('query', query)
      const payload = await vimeoRequest(`/me/videos?${params}`)
      videos.push(...(payload.data || []).map(mapVideo))
      if (!payload.paging?.next) break
    }
    return res.json(videos)
  } catch (error) {
    return res.status(error.status || 502).json({ error: error.message })
  }
})

router.get('/videos/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid Vimeo ID.' })
  try {
    return res.json(mapVideo(await vimeoRequest(`/videos/${req.params.id}`)))
  } catch (error) {
    return res.status(error.status || 502).json({ error: error.message })
  }
})

router.get('/auth-test', async (_req, res) => {
  try {
    const me = await vimeoRequest('/me')
    return res.json({ ok: true, user: { name: me.name, uri: me.uri } })
  } catch (error) {
    return res.status(error.status || 502).json({ ok: false, error: error.message })
  }
})

module.exports = router
