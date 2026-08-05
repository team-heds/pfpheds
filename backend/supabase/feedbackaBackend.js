const express = require('express')
const rateLimit = require('express-rate-limit')
const { isAdmin, requireAnyPermission } = require('../middleware/auth')

const supabaseClient = require('../supabaseClient.js')
const supabaseAdmin = supabaseClient.supabaseAdmin || supabaseClient

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractFirstJsonObject(text) {
  const t = String(text || '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return safeJsonParse(t.slice(start, end + 1))
}

function buildEvaluationPrompt(feedbacka, studentAnswer) {
  const criteria = Array.isArray(feedbacka.criteria) ? feedbacka.criteria : feedbacka.criteria || []
  const scoringEnabled = !!feedbacka.scoring_enabled
  const maxScore = feedbacka.max_score ?? null

  return [
    'Tu es un correcteur pédagogique. Tu corriges une réponse étudiante à une question ouverte.',
    'Tu dois produire un feedback structuré et actionnable, sans inventer de faits.',
    'Réponds STRICTEMENT en JSON valide, sans texte autour.',
    '',
    `Titre: ${feedbacka.title}`,
    `Question: ${feedbacka.question}`,
    `Contexte: ${feedbacka.context || ''}`,
    `Consignes: ${feedbacka.instructions || ''}`,
    `Prompt de correction: ${feedbacka.correction_prompt || ''}`,
    `Exemple de réponse attendue: ${feedbacka.expected_answer || ''}`,
    `Critères: ${JSON.stringify(criteria)}`,
    '',
    `Réponse étudiant: ${studentAnswer}`,
    '',
    'Schéma JSON attendu:',
    JSON.stringify(
      {
        strengths: ['string'],
        weaknesses: ['string'],
        improvements: ['string'],
        suggested_rewrite: 'string',
        score: scoringEnabled ? { value: 0, max: maxScore || 10, rationale: 'string' } : null
      },
      null,
      2
    )
  ].join('\n')
}

async function evaluateAnswer(feedbacka, studentAnswer) {
  const prompt = buildEvaluationPrompt(feedbacka, studentAnswer)

  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenAI } = require('@google/genai')
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    })
    const raw = String(response.text || '').trim()
    return extractFirstJsonObject(raw) || { raw }
  }

  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Tu produis uniquement du JSON valide.' },
        { role: 'user', content: prompt }
      ]
    })
    const raw = resp?.choices?.[0]?.message?.content
    return safeJsonParse(raw) || extractFirstJsonObject(raw) || { raw }
  }

  const answerLen = String(studentAnswer || '').trim().length
  const base = answerLen > 400 ? 8 : answerLen > 200 ? 6 : answerLen > 80 ? 4 : 2
  const max = feedbacka.max_score || 10
  const value = Math.max(0, Math.min(max, Math.round((base / 10) * max)))

  return {
    strengths: ['Réponse structurée (mock).'],
    weaknesses: ['Manque de détails sur certains points (mock).'],
    improvements: [
      'Ajoute des exemples concrets.',
      'Vérifie la structure (introduction, développement, conclusion).'
    ],
    suggested_rewrite: 'Proposition de reformulation (mock) : ...',
    score: feedbacka.scoring_enabled
      ? { value, max, rationale: 'Score basé sur la longueur et la clarté (mock).' }
      : null
  }
}

const router = express.Router()
const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
})
const dailyAiLimit = Math.max(1, Number(process.env.FEEDBACKA_DAILY_AI_LIMIT) || 50)
const editFeedbacka = requireAnyPermission(
  'editor',
  'teacher',
  'enseignantsoins',
  'enseignantphysio'
)
const editableFields = [
  'title',
  'question',
  'context',
  'instructions',
  'correction_prompt',
  'expected_answer',
  'criteria',
  'status',
  'language',
  'level',
  'expected_length',
  'scoring_enabled',
  'max_score',
  'tone',
  'course_id',
  'class_id'
]

function sanitizeFeedbackaPayload(body) {
  return Object.fromEntries(
    editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
  )
}

function isValidAnswer(answer) {
  return typeof answer === 'string' && answer.trim().length > 0 && answer.length <= 20_000
}

async function getOwnedFeedbacka(id, req) {
  const { data, error } = await supabaseAdmin.from('feedbackas').select('*').eq('id', id).single()
  if (error) throw error
  if (data.author_id !== req.auth.userId && !isAdmin(req.auth)) return null
  return data
}

async function consumeAiQuota(userId, feature) {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const { count, error: countError } = await supabaseAdmin
    .from('ai_usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
  if (countError) throw countError
  if ((count || 0) >= dailyAiLimit) {
    const error = new Error('Daily AI quota reached.')
    error.status = 429
    throw error
  }
  const { error: insertError } = await supabaseAdmin
    .from('ai_usage_events')
    .insert({ user_id: userId, feature })
  if (insertError) throw insertError
}

router.get('/', async (req, res) => {
  const { status } = req.query

  try {
    let query = supabaseAdmin
      .from('feedbackas')
      .select('*, feedbacka_submissions(count)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (status !== 'published' && !isAdmin(req.auth)) query = query.eq('author_id', req.auth.userId)

    const { data, error } = await query
    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('[FEEDBACKA] List failed:', error.message)
    res.status(500).json({ error: 'Failed to fetch feedbackas.' })
  }
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const { data, error } = await supabaseAdmin.from('feedbackas').select('*').eq('id', id).single()

    if (error) throw error

    if (data?.status !== 'published' && req.auth.userId !== data?.author_id && !isAdmin(req.auth)) {
      return res.status(404).json({ error: 'Feedbacka not found.' })
    }
    res.json(data)
  } catch (error) {
    console.error('[FEEDBACKA] Fetch failed:', error.message)
    res.status(500).json({ error: 'Failed to fetch feedbacka.' })
  }
})

router.post('/', editFeedbacka, async (req, res) => {
  const payload = { ...sanitizeFeedbackaPayload(req.body), author_id: req.auth.userId }
  if (!payload?.title || !payload?.question) {
    return res.status(400).json({ error: 'title and question are required.' })
  }

  try {
    const { data, error } = await supabaseAdmin.from('feedbackas').insert(payload).select().single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('[FEEDBACKA] Create failed:', error.message)
    res.status(500).json({ error: 'Failed to create feedbacka.' })
  }
})

router.put('/:id', editFeedbacka, async (req, res) => {
  const { id } = req.params
  const payload = sanitizeFeedbackaPayload(req.body)

  try {
    const owned = await getOwnedFeedbacka(id, req)
    if (!owned) return res.status(403).json({ error: 'Forbidden.' })

    const { data, error } = await supabaseAdmin
      .from('feedbackas')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('[FEEDBACKA] Update failed:', error.message)
    res.status(500).json({ error: 'Failed to update feedbacka.' })
  }
})

router.post('/:id/test', editFeedbacka, aiLimiter, async (req, res) => {
  const { id } = req.params
  const { answer_text } = req.body
  if (!isValidAnswer(answer_text))
    return res
      .status(400)
      .json({ error: 'answer_text is required and must not exceed 20,000 characters.' })

  try {
    const feedbacka = await getOwnedFeedbacka(id, req)
    if (!feedbacka) return res.status(403).json({ error: 'Forbidden.' })

    await consumeAiQuota(req.auth.userId, 'feedbacka_test')
    const aiResult = await evaluateAnswer(feedbacka, answer_text)
    res.json({ ai_result: aiResult })
  } catch (error) {
    console.error('[FEEDBACKA] Test failed:', error.message)
    res
      .status(error.status || 500)
      .json({ error: error.status === 429 ? error.message : 'Failed to test evaluation.' })
  }
})

router.post('/:id/submit', aiLimiter, async (req, res) => {
  const { id } = req.params
  const { answer_text } = req.body

  if (!isValidAnswer(answer_text)) {
    return res
      .status(400)
      .json({ error: 'answer_text is required and must not exceed 20,000 characters.' })
  }

  try {
    const { data: feedbacka, error: feedbackaError } = await supabaseAdmin
      .from('feedbackas')
      .select('*')
      .eq('id', id)
      .single()

    if (feedbackaError) throw feedbackaError

    if (feedbacka?.status !== 'published') {
      return res.status(403).json({ error: 'Feedbacka is not published.' })
    }

    await consumeAiQuota(req.auth.userId, 'feedbacka_submit')
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('feedbacka_submissions')
      .insert({ feedbacka_id: id, student_id: req.auth.userId, answer_text, status: 'pending' })
      .select()
      .single()

    if (submissionError) throw submissionError

    try {
      const aiResult = await evaluateAnswer(feedbacka, answer_text)
      const scoreValue = aiResult?.score?.value ?? null

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('feedbacka_submissions')
        .update({
          status: 'done',
          ai_result: aiResult,
          score: scoreValue,
          evaluated_at: new Date().toISOString()
        })
        .eq('id', submission.id)
        .select()
        .single()

      if (updateError) throw updateError
      return res.json(updated)
    } catch (e) {
      const { data: errored } = await supabaseAdmin
        .from('feedbacka_submissions')
        .update({
          status: 'error',
          error_message: 'Evaluation service unavailable.',
          evaluated_at: new Date().toISOString()
        })
        .eq('id', submission.id)
        .select()
        .single()

      return res.status(200).json(errored)
    }
  } catch (error) {
    console.error('[FEEDBACKA] Submission failed:', error.message)
    res
      .status(error.status || 500)
      .json({ error: error.status === 429 ? error.message : 'Failed to submit answer.' })
  }
})

router.get('/:id/submissions', editFeedbacka, async (req, res) => {
  const { id } = req.params
  try {
    const feedbacka = await getOwnedFeedbacka(id, req)
    if (!feedbacka) return res.status(403).json({ error: 'Forbidden.' })
    const { data, error } = await supabaseAdmin
      .from('feedbacka_submissions')
      .select('*')
      .eq('feedbacka_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('[FEEDBACKA] Submissions fetch failed:', error.message)
    res.status(500).json({ error: 'Failed to fetch submissions.' })
  }
})

module.exports = router
