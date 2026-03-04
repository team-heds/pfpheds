// CareConvers stateful chat routes
// Mount with: const registerCareConversStoreRoutes = require('./supabase/careconversStoreBackend');
// in your main backend (index.js): registerCareConversStoreRoutes(app);

const { supabaseAdmin } = require('../supabaseClient');

function normalizeUserId(userId) {
  if (typeof userId !== 'string') return '';
  return userId.trim();
}

const CARECONVERS_SESSIONS_TABLE = 'careconvers_sessions';
const CARECONVERS_INTERACTIONS_TABLE = 'careconvers_interactions';
let persistenceAvailable = true;
let interactionLoggingAvailable = true;

function getDefaultSessionState() {
  return {
    currentStep: 1,
    opqrstCount: 0,
    isbarParts: [],
    quizState: null,
  };
}

async function loadSessionState(userId) {
  if (!persistenceAvailable) return getDefaultSessionState();

  try {
    const { data, error } = await supabaseAdmin
      .from(CARECONVERS_SESSIONS_TABLE)
      .select('current_step, opqrst_count, isbar_parts, quiz_state')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        persistenceAvailable = false;
        console.warn(`[CareConvers] Table "${CARECONVERS_SESSIONS_TABLE}" introuvable. Retour au mode mémoire.`);
      } else {
        console.error('[CareConvers] Erreur chargement session Supabase:', error.message || error);
      }
      return getDefaultSessionState();
    }

    if (!data) return getDefaultSessionState();

    return {
      currentStep: Number.isInteger(data.current_step) ? data.current_step : 1,
      opqrstCount: Number.isInteger(data.opqrst_count) ? data.opqrst_count : 0,
      isbarParts: Array.isArray(data.isbar_parts) ? data.isbar_parts : [],
      quizState: data.quiz_state || null,
    };
  } catch (e) {
    console.error('[CareConvers] Exception chargement session:', e?.message || e);
    return getDefaultSessionState();
  }
}

async function saveSessionState(userId, state) {
  if (!persistenceAvailable) return;

  const payload = {
    user_id: userId,
    current_step: state.currentStep,
    opqrst_count: state.opqrstCount,
    isbar_parts: state.isbarParts,
    quiz_state: state.quizState,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from(CARECONVERS_SESSIONS_TABLE)
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    if (error.code === '42P01') {
      persistenceAvailable = false;
      console.warn(`[CareConvers] Table "${CARECONVERS_SESSIONS_TABLE}" introuvable. Retour au mode mémoire.`);
      return;
    }
    console.error('[CareConvers] Erreur sauvegarde session Supabase:', error.message || error);
  }
}

async function deleteSessionState(userId) {
  if (!persistenceAvailable) return;

  const { error } = await supabaseAdmin
    .from(CARECONVERS_SESSIONS_TABLE)
    .delete()
    .eq('user_id', userId);

  if (error && error.code !== '42P01') {
    console.error('[CareConvers] Erreur suppression session Supabase:', error.message || error);
  }
}

async function saveInteraction(interaction) {
  if (!interactionLoggingAvailable) return;

  const { error } = await supabaseAdmin
    .from(CARECONVERS_INTERACTIONS_TABLE)
    .insert(interaction);

  if (error) {
    if (error.code === '42P01') {
      interactionLoggingAvailable = false;
      console.warn(`[CareConvers] Table "${CARECONVERS_INTERACTIONS_TABLE}" introuvable. Journalisation des interactions désactivée.`);
      return;
    }
    console.error('[CareConvers] Erreur sauvegarde interaction:', error.message || error);
  }
}

// Quiz data loaded from CSV
const quizQuestions = [
  {
    id: 1,
    type: 'MCQ',
    question: "Comment peut-on aider une personne atteinte de la maladie d'Alzheimer à mieux comprendre?",
    correct: 4,
    options: [
      "En évitant de lui parler pour ne pas la fatiguer.",
      "En lui posant des questions ouvertes",
      "En lui parlant rapidement pour qu'elle comprenne vite.",
      "En utilisant des phrases courtes et des termes simples."
    ]
  },
  {
    id: 2,
    type: 'MCQ',
    question: "Quelle est une bonne pratique lors de la communication avec la personne présentant des troubles cognitifs ?",
    correct: 4,
    options: [
      "Ne pas répéter les informations si elle ne comprend pas.",
      "Se mettre de côté et lui parler proche de son oreille",
      "Utiliser des questions ouvertes pour encourager la discussion.",
      "Se mettre face à elle pour être dans son champ de vision."
    ]
  },
  {
    id: 3,
    type: 'MCQ',
    question: "Que faire si la personne atteinte de la maladie d'Alzheimer ne répond pas à votre présence?",
    correct: 2,
    options: [
      "Parler plus fort",
      "Attirer son attention en effleurant son épaule ou sa main.",
      "Taper dans ses mains pour qu'elle réagisse.",
      "L'ignorer jusqu'à ce qu'elle réponde."
    ]
  },
  {
    id: 4,
    type: 'MCQ',
    question: "Comment doit-on adapter l'environnement pour faciliter la communication?",
    correct: 4,
    options: [
      "Mettre beaucoup de bruit pour stimuler la personne.",
      "Allumer la télévision",
      "Allumer toutes les lumières",
      "Éviter la musique de fond et les lieux bruyants."
    ]
  },
  {
    id: 5,
    type: 'MCQ',
    question: "Quelle est une conséquence des troubles du langage chez la personne présentant des troubles cognitifs ?",
    correct: 4,
    options: [
      "Elle apprécie beaucoup plus de parler.",
      "Elle n'a plus besoin d'aide pour communiquer.",
      "Elle est plus attentive aux discussions de son entourage.",
      "Elle peut devenir incohérente dans ses discours."
    ]
  },
  {
    id: 6,
    type: 'MCQ',
    question: "Comment la communication non verbale peut-elle aider dans l'échange avec la personne présentant des troubles cognitifs ?",
    correct: 2,
    options: [
      "Elle complique la compréhension.",
      "Elle permet de transmettre des messages malgré la diminution de la parole.",
      "Elle doit être évitée pour ne pas distraire la personne.",
      "Elle n'a pas d'importance dans la communication."
    ]
  },
  {
    id: 7,
    type: 'MCQ',
    question: "Que doit-on faire si la personne atteinte de la maladie d'Alzheimer refuse de parler?",
    correct: 2,
    options: [
      "Inciter la personne à parler, afin d'obtenir des réponses et ainsi éviter une perte du langage.",
      "Respecter son silence et continuer à lui parler doucement.",
      "Parler plus fort pour qu'elle réponde.",
      "Lui poser plus de questions pour la faire parler."
    ]
  },
  {
    id: 8,
    type: 'MCQ',
    question: "Pourquoi est-il important de faire preuve de patience lors de la communication avec la personne présentant des troubles de la mémoire ?",
    correct: 2,
    options: [
      "Parce qu'elle ne veut pas communiquer.",
      "Parce qu'elle a souvent besoin de plus de temps pour comprendre et répondre.",
      "Parce qu'elle doit apprendre à parler plus vite pour entretenir sa capacité à interagir.",
      "Parce qu'elle doit être régulièrement encourgée à répondre rapidement."
    ]
  },
  {
    id: 9,
    type: 'MCQ',
    question: "Que doit-on faire si la personne malade exprime un comportement inapproprié?",
    correct: 1,
    options: [
      "Ignorer ses propos et ne pas relever ses insultes.",
      "Lui demander de se calmer immédiatement.",
      "Réagir violemment pour lui faire comprendre.",
      "Répondre en utilisant des propos vulgaires."
    ]
  },
  {
    id: 10,
    type: 'MCQ',
    question: "Une des règles pour communiquer efficacement avec une personne atteinte de démence est de :",
    correct: 1,
    options: [
      "Parler clairement et se présenter",
      "Parler rapidement pour capter l'attention",
      "Ne pas utiliser de gestes",
      "Éviter de lui poser des questions"
    ]
  }
];

// Utility function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Optional Gemini client (lazy-init, non-fatal if missing)
let geminiAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenAI } = require('@google/genai');
    geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn('[CareConvers] Gemini SDK not available, falling back to regex intents.');
}

// Regex-based fallback intent matcher (kept from previous implementation)
function getIntentRegex(userInput) {
  console.log(`[CareConvers][REGEX] Processing input: "${userInput}"`);
  const t = String(userInput || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (
    /je\s*m['’]?appelle/.test(t) &&
    /(étudiant|etudiant).*(infirmier|infirmière|infirmiere)/.test(t)
  ) {
    return "Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor";
  }
  if (
    /je\s*m['’]?assieds\s+en\s+face\s+de\s+vous/.test(t) ||
    /je\s*me\s+mets\s+en\s+face\s+de\s+vous/.test(t)
  ) {
    return "Je m'assieds en face de vous, comme ça vous me voyez bien";
  }
  if (
    /vous\s+êtes\s+bien\s+madame\s+aubry/.test(t) ||
    /vous\s+etes\s+bien\s+madame\s+aubry/.test(t)
  ) {
    return "Vous êtes bien Madame Aubry, Denise, du 14.05.1940";
  }
  if (/je\s+vous\s+apporte\s+votre\s+petit\s+déjeuner/.test(t) || /je\s+vous\s+apporte\s+votre\s+petit\s+dejeuner/.test(t)) {
    return "Je vous apporte votre petit déjeuner";
  }
  if (/vous\s+avez\s+faim/.test(t)) {
    return 'Vous avez faim';
  }
  // Step 5 OPQRST and related prompts (broad regex approximations)
  if (/avez[-\s]?vous\s+mal.*des\s+douleurs/.test(t)) return 'Avez-vous mal/des douleurs ?';
  if (/qu['']?est\s+ce\s+qui\s+provoque.*douleur/.test(t)) return 'Qu\'est ce qui provoque votre douleur ?';
  if (/qu['']?est\s+ce\s+qui\s+aide.*soulager.*douleur/.test(t)) return 'Qu\'est ce qui aide à soulager votre douleur ?';
  if (/que\s+ressentez[-\s]?vous/.test(t)) return 'Que ressentez-vous ?';
  if (/depuis\s+quand.*(mal|douleur)/.test(t)) return 'Depuis quand avez-vous mal/des douleurs ? ';
  if (/est[-\s]?ce\s+que.*votre\s+douleur.*continu.*disparait/.test(t)) return 'Est-ce que votre douleur est continu ou disparait par moments ?';
  if (/de\s+quel\s+probl[eè]me.*(s'ag[iî]t|sagit)/.test(t)) return 'De quel problème croyez-vous qu\'il s\'agît ';
  if (/d[ée]j[aà].*cette\s+douleur/.test(t)) return 'Avez-vous déjà eu cette douleur dans le passé ?';
  if (/impact.*douleur.*quotidien/.test(t)) return 'Quel est l\'impact de cette douleur sur votre quotidien ? »';
  
  // Step 7 vital signs intents
  if (/je\s+vais\s+faire\s+quelques\s+examens\s+supplementaires/.test(t)) return 'Je vais faire quelques examens supplémentaires';
  if (/je\s+vais\s+faire\s+quelques\s+examens/.test(t)) return 'Je vais faire quelques examens supplémentaires';
  if (/je\s+vais\s+controler\s+vos\s+signes\s+vitaux/.test(t)) return 'Je vais contrôler vos signes vitaux';
  if (/controler.*signes.*vitaux/.test(t)) return 'Je vais contrôler vos signes vitaux';
  if (/je\s+vais\s+mesurer\s+vos\s+parametres\s+vitaux/.test(t)) return 'Je vais mesurer vos paramètres vitaux';
  if (/mesurer.*parametres.*vitaux/.test(t)) return 'Je vais mesurer vos paramètres vitaux';
  
  // Step 8 Algoplus scale intents
  if (/au\s+vu\s+de\s+la\s+situation.*madame.*n['']?est\s+pas\s+en\s+mesure.*evaluer.*douleur.*echel+e.*observation/.test(t)) return 'Au vu de la situation, Madame n\'est pas en mesure d\'évaluer sa douleur, je vais donc utiliser une échelle d\'observation comportementale de la douleur aiguë';
  if (/je\s+vais\s+utiliser\s+une\s+echel+e\s+d['']?observation/.test(t)) return 'Je vais utiliser une échelle d\'observation comportementale';
  if (/echel+e.*observation/.test(t)) return 'Je vais utiliser une échelle d\'observation comportementale';
  if (/je\s+vais\s+utiliser.*l['']?echel+e\s+algoplus/.test(t)) return 'Je vais utiliser l\'échelle Algoplus';
  if (/echel+e\s+algoplus/.test(t)) return 'Je vais utiliser l\'échelle Algoplus';

  // Step 9 decision intents
  if (/je\s+constate\s+que\s+vous\s+avez\s+mal.*je\s+vais\s+informer\s+ma\s+referente/.test(t)) {
    return 'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir';
  }
  if (/je\s+vais\s+informer\s+ma\s+referente/.test(t)) {
    return 'Je vais informer ma référente';
  }
  if (/je\s+constate\s+que\s+vous\s+avez\s+mal/.test(t)) {
    return 'Je constate que vous avez mal';
  }
  
  // Catch some typos present in cases
  if (/fafsdfim/.test(t)) return 'Vous avez fafsdfim';
  const result = 'unknown';
  console.log(`[CareConvers][REGEX] No match found, returning: "${result}"`);
  return result;
}

// Gemini-assisted semantic intent matcher (context-aware)
async function getIntent(userInput, currentStep = 1) {
  // Log user input for debugging
  console.log(`[CareConvers][DEBUG] User input: "${userInput}" (Step: ${currentStep})`);
  
  // If Gemini not configured, fallback to regex
  if (!geminiAI) {
    return { intent: getIntentRegex(userInput), intentSource: 'regex-no-gemini' };
  }

  // Map ASCII or variant labels to the canonical labels used in the switch
  const canonicalMap = new Map([
    ["Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor", "Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor","Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor"],
    ["Je m'assieds en face de vous, comme ca vous me voyez bien", "Je m'assieds en face de vous, comme ca vous me voyez bien"],
    ["Vous etes bien Madame Aubry, Denise, du 14.05.1940", "Vous êtes bien Madame Aubry, Denise, du 14.05.1940"],
    ["Je vous apporte votre petit dejeuner", "Je vous apporte votre petit déjeuner"],
    ["Vous avez faim", "Vous avez faim"],
    ["C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin", "C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin"],
    ["Avez-vous mal/des douleurs ?", "Avez-vous mal/des douleurs ?"],
    ["Qu'est ce qui provoque votre douleur ?", "Qu'est ce qui provoque votre douleur ?"],
    ["Qu'est ce qui aide a soulager votre douleur ?", "Qu'est ce qui aide à soulager votre douleur ?"],
    ["Que ressentez-vous ?", "Que ressentez-vous ?"],
    ["Depuis quand avez-vous mal/des douleurs ?", "Depuis quand avez-vous mal/des douleurs ? "],
    ["Est-ce que votre douleur est continu ou disparait par moments ?", "Est-ce que votre douleur est continu ou disparait par moments ?"],
    ["De quel probleme croyez-vous qu'il s'agit", "De quel problème croyez-vous qu'il s'agît "],
    ["De quel probleme croyez-voffus qu'il s'agit", "De quel problème croyez-voffus qu'il s'agît "],
    ["Avez-vous deja eu cette douleur dans le passe ?", "Avez-vous déjà eu cette douleur dans le passé ?"],
    ["Quel est l'impact de cette douleur sur votre quotidien ?", " Quel est l'impact de cette douleur sur votre quotidien ? »"],
    ["Vous avez fafsdfim", "Vous avez fafsdfim"],
    ["Je vais faire quelques examens supplémentaires", "Je vais faire quelques examens supplémentaires"],
    ["Je vais contrôler vos signes vitaux", "Je vais contrôler vos signes vitaux"],
    ["Je vais mesurer vos paramètres vitaux", "Je vais mesurer vos paramètres vitaux"],
    ["Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë", "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë"],
    ["Je vais utiliser une échelle d'observation comportementale", "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë"],
    ["Je vais utiliser l'échelle Algoplus", "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë"],
    ["Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir", "Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir"],
    ["Je vais informer ma référente", "Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir"],
    ["Je constate que vous avez mal", "Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir"],
    ["Je constate que vous avez l'air d'avoir mal, c'est exact", "Je constate que vous avez l'air d'avoir mal, c'est exact"],
    ["Transmission ISBAR", "Transmission ISBAR"],
    ["Je vais transmettre à ma référente", "Transmission ISBAR"],
    ["ISBAR", "Transmission ISBAR"],
    ["unknown", "unknown"],
  ]);

  // Context-aware intent filtering based on current step
  const getRelevantIntents = (step) => {
    switch (step) {
      case 1:
        return ["Bonjour, je m’appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor"];
      case 2:
        return ["Je m'assieds en face de vous, comme ça vous me voyez bien"];
      case 3:
        return ["Vous êtes bien Madame Aubry, Denise, du 14.05.1940"];
      case 4:
        return ["Je vous apporte votre petit déjeuner", "Vous avez faim"];
      case 5:
        return [
            "C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin",
            "Je constate que vous avez l'air d'avoir mal, c'est exact"
           
        ];
      case 6:
        return [
          "C'est etonnant, d'habitude vous demander regulierement a quelle heure vous allez manger, vous n'etes pas en forme ce matin",
          "Avez-vous mal/des douleurs ?",
          "Qu'est ce qui provoque votre douleur ?",
          "Qu'est ce qui aide a soulager votre douleur ?",
          "Que ressentez-vous ?",
          "Depuis quand avez-vous mal/des douleurs ?",
          "Est-ce que votre douleur est continu ou disparait par moments ?",
          "De quel probleme croyez-vous qu'il s'agit",
          "De quel probleme croyez-voffus qu'il s'agit",
          "Avez-vous deja eu cette douleur dans le passe ?",
          "Quel est l'impact de cette douleur sur votre quotidien ?",
        ];
      case 7:
        return [
          "Je vais faire quelques examens supplémentaires",
          "Je vais contrôler vos signes vitaux",
          "Je vais mesurer vos paramètres vitaux"
        ];
      case 8:
        return [
          "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë",
          "Je vais utiliser une échelle d'observation comportementale",
          "Je vais utiliser l'échelle Algoplus"
        ];
      case 9:
        return [
          "Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir",
          "Je vais informer ma référente",
          "Je constate que vous avez mal"
        ];
      case 10:
        return [
          "Transmission ISBAR",
          "Je vais transmettre à ma référente",
          "ISBAR"
        ];
      default:
        return ["unknown"];
    }
  };

  const relevantIntents = getRelevantIntents(currentStep);
  const intentList = relevantIntents.map(intent => `- ${intent}`).join('\n');

  console.log(`[DEBUG] Step ${currentStep} - Available intents:`, intentList);
  console.log(`[DEBUG] Step ${currentStep} - User input: "${String(userInput || '')}"`);

  const prompt = `Tu es un assistant de classification d'intentions.\n\nClassifie la phrase de l'utilisateur dans UNE SEULE des etiquettes SUIVANTES (reponds STRICTEMENT par l'ETIQUETTE EXACTE, sans autre texte). Voici les options possibles pour cette etape :\n${intentList}\n- unknown\n\nAccepte les variantes orthographiques, l'absence d'accents et les reformulations proches. Reponds UNIQUEMENT par une des etiquettes ci-dessus, sans ponctuation additionnelle.\n\nPhrase de l'utilisateur: "${String(userInput || '')}"`;

  try {
    const response = await geminiAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    console.log(prompt);
    const rawIntent = (response.text || '').trim();
    const mapped = canonicalMap.get(rawIntent) || (relevantIntents.includes(rawIntent) ? rawIntent : 'unknown');
    const canonical = canonicalMap.get(mapped) || mapped;
    console.log(`[CareConvers][Intent] step=${currentStep} input="${userInput}" -> intent(raw)="${rawIntent}" -> intent(canonical)="${canonical}"`);
    if (canonical === 'unknown') {
      return { intent: getIntentRegex(userInput), intentSource: 'regex-fallback-unknown' };
    }
    return { intent: canonical, intentSource: 'gemini' };
  } catch (error) {
    console.error('[CareConvers] Gemini classification failed, using regex fallback:', error?.message || error);
    return { intent: getIntentRegex(userInput), intentSource: 'regex-fallback-error' };
  }
}

function registerCareConversStoreRoutes(app) {
  console.log('[ROUTES] careconversStoreBackend mounted');

  // In-memory state: maps user identifier -> step
  const conversationStates = {};

  // Track ISBAR progress for step 10: maps user identifier -> set of completed ISBAR parts
  const isbarProgress = {};

  // Track quiz progress for step 11: maps user identifier -> quiz state
  const quizProgress = {};

  // Track OPQRST progress for step 6: maps user identifier -> count
  const opqrstProgress = {};

  // Stateful Chat Endpoint
  app.post('/api/chat', async (req, res) => {
    let { prompt, userId } = req.body;
    const currentUser = normalizeUserId(userId);

    if (!currentUser) {
      return res.status(400).json({ error: 'User identifier is missing.' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is missing.' });
    }

    // Trim whitespace and newlines from prompt
    prompt = prompt.trim();

    // Hydrate user state from Supabase at request start
    const persisted = await loadSessionState(currentUser);
    conversationStates[currentUser] = persisted.currentStep;
    opqrstProgress[currentUser] = persisted.opqrstCount;
    isbarProgress[currentUser] = new Set(persisted.isbarParts);
    if (persisted.quizState) {
      quizProgress[currentUser] = persisted.quizState;
    } else {
      delete quizProgress[currentUser];
    }

    // Get current step for the user, default to 1
    let currentStep = conversationStates[currentUser] || 1;
    let responseText = '';
    let nextStep = currentStep;
    let media = null;

    // --- Conversation Logic ---
    const intentResult = await getIntent(prompt, currentStep);
    const intent = intentResult?.intent || 'unknown';
    const intentSource = intentResult?.intentSource || 'unknown';

    console.log(`[DEBUG] Step ${currentStep}, intent: "${intent}"`);

    switch (currentStep) {  
 
      case 1:
        if (intent === "Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor") {
          console.log('[DEBUG] Case 1 matched! Moving to step 2');
          responseText = '--';
          nextStep = 2;
          media = {
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/img1_canape.png?alt=media&token=97461139-e9ea-4f08-8c89-6f4278d879e0',
            caption: ': "La patiente ne vous a pas entendu"  (a un déficit auditif non-compensé)'
          };
        } else {
          responseText = '-?';
          nextStep = 1; // Reste à l'étape 1 si intent non reconnu
        }
        break;

      case 2:
        if (intent === "Je m'assieds en face de vous, comme ça vous me voyez bien") {
          responseText = 'Bonjour, vous ressemblez à ma voisine, c\'est bien vous ?';
          nextStep = 3;

        } else {
          // Make an image appear in the UI: img1_canape.png

          responseText = '2b';
        }
        break;

      case 3:
                    if (intent === 'Vous êtes bien Madame Aubry, Denise, du 14.05.1940') {
          responseText = 'Oui c est moi';
          nextStep = 4; // Reset for a new conversation
          media = {
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/2.png?alt=media&token=771a2a77-5d89-4e58-9527-f15072b5014a',
            caption: ': "La patiente a les yeux fermés'
          };
        } else {
          responseText = '- - - ';
        }
        break;


        

        
      case 4:
        if (intent === 'Je vous apporte votre petit déjeuner') {
          responseText = ': Mmmmh – aaaaah,  Mmmmh – aaaaah';
          nextStep = 5; // Reset for a new conversation
          media = {
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
            caption: ': "La patiente grimace'
          };
        } else if (intent === 'Vous avez faim') {
            responseText = 'Oh non, je n’ai vraiment pas envie de manger';
            nextStep = 4; // Reset for a new conversation
            media = {
                imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
                caption: ': "La patiente grimace'
              };
          } else {
            responseText = ' Mmmmh – aaaaah';
            nextStep = 4;
          }
        break;

           case 5:
            if (intent === 'C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin') {
              responseText = "S'il vous plait, dites à mon mari de venir, il faut appeler la police avant qu'il fasse nuit !  ";
              nextStep = 6; // Reset for a new conversation
              media = {
                imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
                caption: ': "La patiente se penche en avant'
              };
            } else if (intent === 'Je constate que vous avez l’air d’avoir mal, c’est exact') {
                responseText = "S'il vous plait, dites à mon mari de venir, il faut appeler la police avant qu'il fasse nuit !  ";
                nextStep = 6; // Reset for a new conversation
                media = {
                    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
                    caption: ': "La patiente se penche en avant'
                  };
              } else {
                responseText = "S'il vous plait, dites à mon mari de venir, il faut appeler la police avant qu'il fasse nuit !  ";
                nextStep = 6;
              }
            break;

      case 6: {
        const currentOpqrstCount = opqrstProgress[currentUser] || 0;
        
        // Liste des intents OPQRST valides pour l'étape 6
        const opqrstIntents = [
          "Avez-vous mal/des douleurs ?",
          "Qu'est ce qui provoque votre douleur ?",
          "Qu'est ce qui aide à soulager votre douleur ?",
          "Que ressentez-vous ?",
          "Depuis quand avez-vous mal/des douleurs ? ",
          "Est-ce que votre douleur est continu ou disparait par moments ?",
          "De quel problème croyez-vous qu'il s'agît ",
          "Avez-vous déjà eu cette douleur dans le passé ?",
          "Quel est l'impact de cette douleur sur votre quotidien ? »"
        ];

        // Logique commune pour tous les intents OPQRST
        if (opqrstIntents.includes(intent)) {
          responseText = "S'il vous plaît, dites à mon mari de venir, il faut appeler la police avant qu'il fasse nuit !";

          const newCount = currentOpqrstCount + 1;
          opqrstProgress[currentUser] = newCount;
          console.log(`[CareConvers][Step 6] OPQRST question ${newCount}/3: "${intent}"`);
          
          // Après 3 questions OPQRST, passer à l'étape 7
          if (newCount >= 3) {
            opqrstProgress[currentUser] = 0;
            nextStep = 7;
            media = {
              imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
              caption: "La patiente n'arrive pas à répondre correctement à vos questions (confusion, désorientation)"
            };
          } else {
            nextStep = 6; // Stay in step 6 until 3 questions are asked
          }
        } else {
          // Réponse par défaut si l'intent n'est pas reconnu
          responseText = "Raaahhahah... (gémissements)";
          nextStep = 6; // Stay in step 6 for unrecognized intents
        }
        break;
      }
          
    case 7: {
        // Liste des intents pour la mesure des paramètres vitaux
        const vitalSignsIntents = [
          "Je vais faire quelques examens supplémentaires",
          "Je vais contrôler vos signes vitaux",
          "Je vais mesurer vos paramètres vitaux"
        ];

        if (vitalSignsIntents.includes(intent)) {
          responseText = "D'accord...";
          nextStep = 8; // Prochaine étape après mesure des paramètres
          opqrstProgress[currentUser] = 0;
          media = {
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/4.png?alt=media&token=c5e8d919-f35e-4e3c-8e10-0fef6af3ebef',
            caption: `Résultats des paramètres vitaux :
TA 138/79 mmHg
FC 90 bpm ; régulière
FR 20 rpm
SpO2 97% AA
T° 36.7°C`
          };
        } else {
          responseText = "Mmmmh... aaaah...";
          nextStep = 7; // Stay in step 7 for unrecognized intents
        }
        break;
      }

      case 8: {
        // Liste des intents pour l'échelle Algoplus
        const algoplusIntents = [
          "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë",
          "Je vais utiliser une échelle d'observation comportementale",
          "Je vais utiliser l'échelle Algoplus"
        ];

        if (algoplusIntents.includes(intent)) {
          responseText = "...";
          nextStep = 9; // Prochaine étape après échelle Algoplus
          media = {
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
            caption: `📊 Échelle Algoplus - Réponse aux items :

1️⃣ Visage
Froncement des sourcils, grimaces, crispation, mâchoires serrées, visage figé.
✅ Réponse : patiente grimace

2️⃣ Regard
Regard inattentif, fixe, lointain ou suppliant, pleurs, yeux fermés.
✅ Réponse : patiente à les yeux fermés

3️⃣ Plaintes
« Aie », « Ouille », « J'ai mal », gémissements, cris.
✅ Réponse : la patiente gémit

4️⃣ Corps
Retrait ou protection d'une zone, refus de mobilisation, attitudes figées.
✅ Réponse : la patiente ne se laisse pas toucher les hanches

5️⃣ Comportements
Agitation ou agressivité, agrippement.
❌ Réponse : la patiente n'est pas agitée ou agressive, elle ne s'agrippe pas

🎯 Score Algoplus : 4 sur 5`
          };
        } else {
          responseText = "Mmmmh... aaaah...";
          nextStep = 8; // Stay in step 8 for unrecognized intents
        }
        break;
      }

      case 9: {
        // Liste des intents pour la prise de décision
        const decisionIntents = [
          "Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir",
          "Je vais informer ma référente",
          "Je constate que vous avez mal"
        ];

        if (decisionIntents.includes(intent)) {
          responseText = "S'il vous plaît aidez-moi...";
          nextStep = 10; // Prochaine étape : transmission
        } else {
          responseText = "Mmmmh... aaaah...";
        }
        break;
      }

      case 10: {
        // Transmission ISBAR - 4 phrases requises
        // Initialize progress tracker for this user if not exists
        if (!isbarProgress[currentUser]) {
          isbarProgress[currentUser] = new Set();
        }

        const p = String(prompt || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        // Check which ISBAR part matches the user input
        let matchedPart = null;

        if (
          /madame\s+aubr(e|ey)/.test(p) ||
          /signes?/.test(p) ||
          /douleur/.test(p)
        ) {
          matchedPart = 'S';
        } else if (
          /habituellement\s+calme/.test(p) ||
          /participe\s+aux\s+repas/.test(p)
        ) {
          matchedPart = 'B';
        } else if (
          /changement\s+dans\s+son\s+comportement/.test(p) ||
          /algoplus/.test(p) ||
          /score\s+de\s+4/.test(p) ||
          /observe|observee|observees|observer/.test(p)
        ) {
          matchedPart = 'A';
        } else if (
          /evaluation\s+clinique/.test(p) ||
          /prise\s+en\s+charge/.test(p) ||
          /recommande|recommendation/.test(p)
        ) {
          matchedPart = 'R';
        }

        if (matchedPart) {
          // Add the matched part to the user's progress
          isbarProgress[currentUser].add(matchedPart);

          const completedCount = isbarProgress[currentUser].size;
          console.log(`[DEBUG] ISBAR part ${matchedPart} matched! Progress: ${completedCount}/4`);

          if (completedCount < 4) {
            responseText = "Merci, continue...";
            nextStep = 10; // Reste à l'étape 10
            media = {
              imageUrl: '',
              caption: `📝 Progression ISBAR : ${completedCount}/4 parties validées\n\n${
                isbarProgress[currentUser].has('S') ? '✅ S - Situation\n' : '❌ S - Situation\n'
              }${
                isbarProgress[currentUser].has('B') ? '✅ B - Background\n' : '❌ B - Background\n'
              }${
                isbarProgress[currentUser].has('A') ? '✅ A - Assessment\n' : '❌ A - Assessment\n'
              }${
                isbarProgress[currentUser].has('R') ? '✅ R - Recommendation' : '❌ R - Recommendation'
              }`
            };
          } else {
            // All 4 parts completed - move to quiz
            responseText = "✅ Transmission ISBAR complète !\n\n📚 Passons maintenant au quiz de connaissances pour évaluer votre compréhension du scénario.";
            nextStep = 11; // Move to quiz
            media = {
              imageUrl: '',
              caption: '✅ Simulation terminée. Vous avez complété toutes les étapes avec succès !\n\n🎉 Transmission ISBAR complète : 4/4 parties validées'
            };
            // Clean up progress
            delete isbarProgress[currentUser];
          }
        } else {
          responseText = "S'il vous plaît, continuez votre transmission ISBAR...";
          nextStep = 10;
        }
        break;
      }

      case 11: {
        // Quiz de connaissances
        if (!quizProgress[currentUser]) {
          quizProgress[currentUser] = {
            currentQuestion: 0,
            answers: [],
            score: 0,
            questions: shuffleArray([...quizQuestions]).slice(0, 5) // 5 questions aléatoires
          };
        }

        const progress = quizProgress[currentUser];
        const currentQ = progress.questions[progress.currentQuestion];

        if (!currentQ) {
          // Quiz terminé
          const finalScore = Math.round((progress.score / progress.questions.length) * 100);
          responseText = `📊 Quiz terminé !\n\nScore: ${finalScore}%\n${progress.score}/${progress.questions.length} réponses correctes\n\n✅ Formation complétée avec succès !`;
          nextStep = 12; // Étape terminale
          media = {
            imageUrl: '',
            caption: `🎉 RÉSULTATS FINAUX\n━━━━━━━━━━━━━━━━━━━━\n📚 Quiz: ${finalScore}%\n✅ Questions correctes: ${progress.score}/${progress.questions.length}\n📈 Score global: ${finalScore}%\n━━━━━━━━━━━━━━━━━━━━`
          };
          // Clean up quiz progress
          delete quizProgress[currentUser];
        } else {
          // Validation réponse
          let isCorrect = false;
          const answerNumber = parseInt(prompt.trim());

          if (currentQ.type === 'MCQ' && !isNaN(answerNumber)) {
            isCorrect = answerNumber === currentQ.correct;
          }

          if (isCorrect) {
            progress.score++;
            progress.answers.push({ questionId: currentQ.id, correct: true, userAnswer: prompt });
          } else {
            progress.answers.push({ questionId: currentQ.id, correct: false, userAnswer: prompt });
          }

          progress.currentQuestion++;

          // Question suivante
          const nextQ = progress.questions[progress.currentQuestion];
          if (nextQ) {
            responseText = `Question ${progress.currentQuestion + 1}/${progress.questions.length}:\n\n${nextQ.question}\n\n`;
            responseText += nextQ.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');
            nextStep = 11;
          }
        }
        break;
      }

      default:
        responseText = 'Une erreur est survenue, réinitialisation de la conversation.';
        nextStep = 1; // Reset
        // Clean up ISBAR progress if exists
        if (isbarProgress[currentUser]) {
          delete isbarProgress[currentUser];
        }
        if (quizProgress[currentUser]) {
          delete quizProgress[currentUser];
        }
        opqrstProgress[currentUser] = 0;
        break;
    }

    // Update the user's state
    conversationStates[currentUser] = nextStep;

    // Persist user state to Supabase
    await saveSessionState(currentUser, {
      currentStep: conversationStates[currentUser] || 1,
      opqrstCount: opqrstProgress[currentUser] || 0,
      isbarParts: isbarProgress[currentUser] ? Array.from(isbarProgress[currentUser]) : [],
      quizState: quizProgress[currentUser] || null,
    });

    console.log(`[CareConvers] Sending response - step: ${currentStep} -> ${nextStep}, response: "${responseText.substring(0, 50)}..."`);

    // Persist full interaction for research/analytics
    await saveInteraction({
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
        timestamp: new Date().toISOString(),
      },
    });

    // Send the response (include media if any)
    res.json({
      response: responseText,
      nextStep,
      media,
      intentSource,
      geminiUsed: intentSource === 'gemini',
    });
  });

  // Reset endpoint to clear conversation state
  app.post('/api/reset', (req, res) => {
    const { userId } = req.body;
    const currentUser = normalizeUserId(userId);

    if (!currentUser) {
      return res.status(400).json({ success: false, error: 'User identifier is missing.' });
    }
    
    // Clear conversation state
    delete conversationStates[currentUser];
    delete isbarProgress[currentUser];
    delete quizProgress[currentUser];
    opqrstProgress[currentUser] = 0;

    // Also clear persisted state
    deleteSessionState(currentUser).catch((e) => {
      console.error('[CareConvers] Erreur suppression session persistée:', e?.message || e);
    });
    
    console.log(`[CareConvers] Reset conversation for user: ${currentUser}`);
    res.json({ success: true, message: 'Conversation reset successfully', nextStep: 1 });
  });
}

module.exports = registerCareConversStoreRoutes;