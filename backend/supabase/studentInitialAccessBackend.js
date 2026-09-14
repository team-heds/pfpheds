const { Router } = require('express')
const { supabaseAdmin } = require('../supabaseClient')
const {
  createStudentInitialAccessService,
  StudentInitialAccessError
} = require('./studentInitialAccessService')

function respondWithError(res, error) {
  if (error instanceof StudentInitialAccessError) {
    return res.status(error.status).json({ error: error.message, code: error.code })
  }
  return res
    .status(500)
    .json({ error: 'Le suivi du premier accès a échoué.', code: 'internal_error' })
}

function createStudentInitialAccessRouters(options = {}) {
  const service =
    options.service ||
    createStudentInitialAccessService({
      client: options.client || supabaseAdmin,
      authClient: options.authClient || supabaseAdmin.auth,
      environment: options.environment
    })
  const adminRouter = Router()
  const selfRouter = Router()

  adminRouter.get('/initial-access', async (_req, res) => {
    try {
      return res.json({ items: await service.listStates() })
    } catch (error) {
      return respondWithError(res, error)
    }
  })

  adminRouter.post('/:id/initial-access', async (req, res) => {
    try {
      const state = await service.send({
        userId: req.params.id,
        actorUserId: req.auth.userId,
        requestId: req.id
      })
      return res.status(202).json(state)
    } catch (error) {
      return respondWithError(res, error)
    }
  })

  selfRouter.post('/initial-access/used', async (req, res) => {
    try {
      return res.json(await service.markUsed({ userId: req.auth.userId, requestId: req.id }))
    } catch (error) {
      return respondWithError(res, error)
    }
  })

  return { adminRouter, selfRouter }
}

module.exports = { createStudentInitialAccessRouters, respondWithError }
