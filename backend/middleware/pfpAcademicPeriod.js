const contract = import('../domain/academicPeriod.mjs')

// Validate the whole payload before a handler can perform any write.
async function normalizePfpRequest(req, res, next) {
  const period = await contract
  req.academicPeriod = period
  try {
    let body = req.body
    if (body && Object.hasOwn(body, 'year')) {
      body = { ...body, year: period.requireAcademicYear(body.year) }
    }
    if (Array.isArray(body?.results)) {
      const keys = new Set()
      const results = body.results.map((row) => {
        const year = period.requireAcademicYear(row?.year)
        const key = JSON.stringify([row.user_id, row.pfp_type, year])
        if (keys.has(key)) {
          throw new Error('Plusieurs résultats pour le même étudiant, PFP et année académique.')
        }
        keys.add(key)
        return { ...row, year }
      })
      body = { ...body, results }
    }
    if (body && Object.hasOwn(body, 'persist') && typeof body.persist !== 'boolean') {
      throw new Error('Le mode persist doit être un booléen explicite.')
    }
    req.body = body
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message })
  }
  next()
}

module.exports = { normalizePfpRequest }
