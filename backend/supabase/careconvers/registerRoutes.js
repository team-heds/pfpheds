const { supabaseAdmin } = require('../../supabaseClient');
const { normalizeUserId } = require('./utils');
const { createPersistenceService } = require('./persistenceService');
const { getIntent } = require('./intentService');
const { processConversationStep } = require('./conversationStepEngine');

const persistence = createPersistenceService(supabaseAdmin);

function registerCareConversStoreRoutes(app) {
  console.log('[ROUTES] careconversStoreBackend mounted');

  const conversationStates = {};
  const isbarProgress = {};
  const quizProgress = {};
  const opqrstProgress = {};

  app.post('/api/chat', async (req, res) => {
    let { prompt, userId } = req.body;
    const currentUser = normalizeUserId(userId);

    if (!currentUser) {
      return res.status(400).json({ error: 'User identifier is missing.' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is missing.' });
    }

    prompt = prompt.trim();

    if (persistence.isPersistenceAvailable()) {
      const persisted = await persistence.loadSessionState(currentUser);
      conversationStates[currentUser] = persisted.currentStep;
      opqrstProgress[currentUser] = persisted.opqrstCount;
      isbarProgress[currentUser] = new Set(persisted.isbarParts);
      if (persisted.quizState) {
        quizProgress[currentUser] = persisted.quizState;
      } else {
        delete quizProgress[currentUser];
      }
    } else {
      if (!Number.isInteger(conversationStates[currentUser])) {
        conversationStates[currentUser] = 1;
      }
      if (!Number.isInteger(opqrstProgress[currentUser])) {
        opqrstProgress[currentUser] = 0;
      }
      if (!isbarProgress[currentUser]) {
        isbarProgress[currentUser] = new Set();
      }
    }

    const currentStep = conversationStates[currentUser] || 1;
    const intentResult = await getIntent(prompt, currentStep);
    const intent = intentResult?.intent || 'unknown';
    const intentSource = intentResult?.intentSource || 'unknown';
    const intentDebug = intentResult?.debug || null;

    const { responseText, nextStep, media } = processConversationStep({
      currentStep,
      intent,
      prompt,
      currentUser,
      isbarProgress,
      quizProgress,
      opqrstProgress,
    });

    conversationStates[currentUser] = nextStep;

    await persistence.saveSessionState(currentUser, {
      currentStep: conversationStates[currentUser] || 1,
      opqrstCount: opqrstProgress[currentUser] || 0,
      isbarParts: isbarProgress[currentUser] ? Array.from(isbarProgress[currentUser]) : [],
      quizState: quizProgress[currentUser] || null,
    });

    console.log(`[CareConvers] Sending response - step: ${currentStep} -> ${nextStep}, response: "${responseText.substring(0, 50)}..."`);

    await persistence.saveInteraction({
      user_id: currentUser,
      prompt_text: prompt,
      detected_intent: intent,
      step_before: currentStep,
      step_after: nextStep,
      response_text: responseText,
      media_image_url: media?.imageUrl || null,
      media_caption: media?.caption || null,
      metadata: {
        has_media: !!media,
        intent_source: intentSource,
        gemini_used: intentSource === 'gemini',
        intent_debug: process.env.CARECONVERS_INTENT_DEBUG === 'true' ? intentDebug : null,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      response: responseText,
      nextStep,
      media,
      intentSource,
      geminiUsed: intentSource === 'gemini',
      debugIntent: process.env.CARECONVERS_INTENT_DEBUG === 'true' ? intentDebug : null,
    });
  });

  app.post('/api/reset', (req, res) => {
    const { userId } = req.body;
    const currentUser = normalizeUserId(userId);

    if (!currentUser) {
      return res.status(400).json({ success: false, error: 'User identifier is missing.' });
    }

    delete conversationStates[currentUser];
    delete isbarProgress[currentUser];
    delete quizProgress[currentUser];
    opqrstProgress[currentUser] = 0;

    persistence.deleteSessionState(currentUser).catch((e) => {
      console.error('[CareConvers] Erreur suppression session persistée:', e?.message || e);
    });

    console.log(`[CareConvers] Reset conversation for user: ${currentUser}`);
    res.json({ success: true, message: 'Conversation reset successfully', nextStep: 1 });
  });
}

module.exports = registerCareConversStoreRoutes;
