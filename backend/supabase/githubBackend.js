const { Router } = require('express')

const router = Router()
const GITHUB_API_BASE = 'https://api.github.com'

function parseRepository(repoUrl) {
  const parsed = new URL(repoUrl)
  if (parsed.hostname !== 'github.com') throw new Error('Invalid GitHub repository URL.')
  const [owner, repo] = parsed.pathname.split('/').filter(Boolean)
  if (!owner || !repo) throw new Error('Invalid GitHub repository URL.')
  const normalizedRepo = repo.replace(/\.git$/, '')
  const allowedRepositories = String(process.env.GITHUB_ALLOWED_REPOSITORIES || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  if (allowedRepositories.length === 0) {
    const error = new Error('GitHub repository access is not configured on the server.')
    error.status = 503
    throw error
  }
  if (!allowedRepositories.includes(`${owner}/${normalizedRepo}`.toLowerCase())) {
    const error = new Error('Repository not allowed.')
    error.status = 403
    throw error
  }
  return { owner, repo: normalizedRepo }
}

async function githubRequest(pathname, options = {}) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    const error = new Error('GitHub is not configured on the server.')
    error.status = 503
    throw error
  }
  const response = await fetch(`${GITHUB_API_BASE}${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message || `GitHub request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return payload
}

router.get('/status', async (_req, res) => {
  try {
    const user = await githubRequest('/user')
    return res.json({ valid: true, username: user.login, name: user.name, avatar: user.avatar_url })
  } catch (error) {
    return res.status(error.status || 502).json({ valid: false, error: error.message })
  }
})

router.get('/branches', async (req, res) => {
  try {
    const { owner, repo } = parseRepository(String(req.query.repoUrl || ''))
    return res.json(await githubRequest(`/repos/${owner}/${repo}/branches`))
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message })
  }
})

router.post('/branches', async (req, res) => {
  try {
    const { owner, repo } = parseRepository(String(req.body.repoUrl || ''))
    const branchName = String(req.body.branchName || '').trim()
    const baseBranch = String(req.body.baseBranch || 'main').trim()
    if (!/^[A-Za-z0-9._/-]{1,120}$/.test(branchName)) throw new Error('Invalid branch name.')
    const reference = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`)
    const created = await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: reference.object.sha }),
    })
    return res.status(201).json({ success: true, branch: branchName, sha: created.object.sha, url: created.url })
  } catch (error) {
    return res.status(error.status || 400).json({ success: false, error: error.message })
  }
})

router.post('/pull-requests', async (req, res) => {
  try {
    const { owner, repo } = parseRepository(String(req.body.repoUrl || ''))
    const created = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: String(req.body.title || '').slice(0, 200),
        head: req.body.headBranch,
        base: req.body.baseBranch,
        body: String(req.body.body || '').slice(0, 20_000),
      }),
    })
    return res.status(201).json({ success: true, number: created.number, url: created.html_url, title: created.title })
  } catch (error) {
    return res.status(error.status || 400).json({ success: false, error: error.message })
  }
})

module.exports = router
