const express = require('express');

const supabaseClient = require('../supabaseClient.js');
const supabaseAdmin = supabaseClient.supabaseAdmin || supabaseClient;

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractFirstJsonObject(text) {
  const t = String(text || '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return safeJsonParse(t.slice(start, end + 1));
}

function buildEvaluationPrompt(feedbacka, studentAnswer) {
  const criteria = Array.isArray(feedbacka.criteria) ? feedbacka.criteria : feedbacka.criteria || [];
  const scoringEnabled = !!feedbacka.scoring_enabled;
  const maxScore = feedbacka.max_score ?? null;

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
        score: scoringEnabled ? { value: 0, max: maxScore || 10, rationale: 'string' } : null,
      },
      null,
      2
    ),
  ].join('\n');
}

async function evaluateAnswer(feedbacka, studentAnswer) {
  const prompt = buildEvaluationPrompt(feedbacka, studentAnswer);

  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const raw = String(response.text || '').trim();
    return extractFirstJsonObject(raw) || { raw };
  }

  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Tu produis uniquement du JSON valide.' },
        { role: 'user', content: prompt },
      ],
    });
    const raw = resp?.choices?.[0]?.message?.content;
    return safeJsonParse(raw) || extractFirstJsonObject(raw) || { raw };
  }

  const answerLen = String(studentAnswer || '').trim().length;
  const base = answerLen > 400 ? 8 : answerLen > 200 ? 6 : answerLen > 80 ? 4 : 2;
  const max = feedbacka.max_score || 10;
  const value = Math.max(0, Math.min(max, Math.round((base / 10) * max)));

  return {
    strengths: ['Réponse structurée (mock).'],
    weaknesses: ['Manque de détails sur certains points (mock).'],
    improvements: ['Ajoute des exemples concrets.', 'Vérifie la structure (introduction, développement, conclusion).'],
    suggested_rewrite: 'Proposition de reformulation (mock) : ...',
    score: feedbacka.scoring_enabled ? { value, max, rationale: 'Score basé sur la longueur et la clarté (mock).' } : null,
  };
}

const router = express.Router();

router.get('/', async (req, res) => {
  const { status, author_id } = req.query;

  if (!author_id && status !== 'published') {
    return res.status(400).json({ error: 'author_id is required unless status=published.' });
  }

  try {
    let query = supabaseAdmin
      .from('feedbackas')
      .select('*, feedbacka_submissions(count)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (author_id) query = query.eq('author_id', author_id);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch feedbackas: ${error.message}` });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { author_id } = req.query;

  try {
    const { data, error } = await supabaseAdmin
      .from('feedbackas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (data?.status !== 'published' && author_id !== data?.author_id) {
      return res.status(404).json({ error: 'Feedbacka not found.' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch feedbacka: ${error.message}` });
  }
});

router.post('/', async (req, res) => {
  const payload = req.body;
  if (!payload?.title || !payload?.question || !payload?.author_id) {
    return res.status(400).json({ error: 'title, question and author_id are required.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('feedbackas')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to create feedbacka: ${error.message}` });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('feedbackas')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to update feedbacka: ${error.message}` });
  }
});

router.post('/:id/test', async (req, res) => {
  const { id } = req.params;
  const { answer_text } = req.body;
  const { author_id } = req.query;

  if (!answer_text) return res.status(400).json({ error: 'answer_text is required.' });

  try {
    const { data: feedbacka, error } = await supabaseAdmin
      .from('feedbackas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (author_id !== feedbacka.author_id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const aiResult = await evaluateAnswer(feedbacka, answer_text);
    res.json({ ai_result: aiResult });
  } catch (error) {
    res.status(500).json({ error: `Failed to test evaluation: ${error.message}` });
  }
});

router.post('/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { student_id, answer_text } = req.body;

  if (!student_id || !answer_text) {
    return res.status(400).json({ error: 'student_id and answer_text are required.' });
  }

  try {
    const { data: feedbacka, error: feedbackaError } = await supabaseAdmin
      .from('feedbackas')
      .select('*')
      .eq('id', id)
      .single();

    if (feedbackaError) throw feedbackaError;

    if (feedbacka?.status !== 'published') {
      return res.status(403).json({ error: 'Feedbacka is not published.' });
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('feedbacka_submissions')
      .insert({ feedbacka_id: id, student_id, answer_text, status: 'pending' })
      .select()
      .single();

    if (submissionError) throw submissionError;

    try {
      const aiResult = await evaluateAnswer(feedbacka, answer_text);
      const scoreValue = aiResult?.score?.value ?? null;

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('feedbacka_submissions')
        .update({
          status: 'done',
          ai_result: aiResult,
          score: scoreValue,
          evaluated_at: new Date().toISOString(),
        })
        .eq('id', submission.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return res.json(updated);
    } catch (e) {
      const { data: errored } = await supabaseAdmin
        .from('feedbacka_submissions')
        .update({ status: 'error', error_message: e.message, evaluated_at: new Date().toISOString() })
        .eq('id', submission.id)
        .select()
        .single();

      return res.status(200).json(errored);
    }
  } catch (error) {
    res.status(500).json({ error: `Failed to submit answer: ${error.message}` });
  }
});

router.get('/:id/submissions', async (req, res) => {
  const { id } = req.params;
  const { author_id } = req.query;

  if (!author_id) {
    return res.status(400).json({ error: 'author_id is required.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('feedbacka_submissions')
      .select('*')
      .eq('feedbacka_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch submissions: ${error.message}` });
  }
});

module.exports = router;
