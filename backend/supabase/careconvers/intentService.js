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

const STOPWORDS = new Set([
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'au', 'aux',
  'et', 'ou', 'a', 'à', 'en', 'dans', 'sur', 'pour', 'par', 'avec', 'sans',
  'ce', 'cet', 'cette', 'ces', 'que', 'qui', 'quoi', 'est', 'suis', 'etre',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'vos', 'leur',
  'comme', 'ainsi', 'donc', 'alors', 'bien', 'oui', 'non', 'svp', 'sil', 'plait'
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toKeywordSet(value) {
  const tokens = normalizeText(value)
    .split(' ')
    .filter((token) => token && token.length > 2 && !STOPWORDS.has(token));
  return new Set(tokens);
}

function scoreIntentCandidate(inputKeywords, candidateIntent) {
  const candidateKeywords = toKeywordSet(candidateIntent);
  if (candidateKeywords.size === 0) return { score: 0, overlapCount: 0 };

  let overlapCount = 0;
  for (const token of candidateKeywords) {
    if (inputKeywords.has(token)) overlapCount += 1;
  }

  const score = overlapCount / candidateKeywords.size;
  return { score, overlapCount };
}

function pickBestIntentFromInput(userInput, relevantIntents) {
  const normalizedInput = normalizeText(userInput);
  const inputKeywords = toKeywordSet(normalizedInput);
  if (inputKeywords.size === 0) return null;

  let best = { intent: 'unknown', score: 0, overlapCount: 0 };

  for (const intent of relevantIntents || []) {
    const normalizedIntent = normalizeText(intent);
    if (normalizedIntent && normalizedInput === normalizedIntent) {
      return { intent, score: 1, overlapCount: 999 };
    }

    const { score, overlapCount } = scoreIntentCandidate(inputKeywords, intent);
    if (score > best.score) {
      best = { intent, score, overlapCount };
    }
  }

  if (best.overlapCount >= 2 && best.score >= 0.4) {
    return best;
  }

  return null;
}

/**
 * Matches user input against regex patterns to identify care conversation intents in French
 * @param {string} userInput - The user's input text to analyze
 * @returns {string} A French response message matching the identified intent, or 'unknown' if no pattern matches
 * @description
 * Normalizes input by converting to lowercase and removing diacritical marks.
 * Identifies intents related to:
 * - Patient introduction and positioning
 * - Pain/symptom assessment questions
 * - Medical examinations and vital signs checks
 * - Pain assessment scales (behavioral observation, Algoplus)
 * - Communication with supervisors
 * @example
 * getIntentRegex("Je m'appelle Antoine et je suis étudiant infirmier")
 * // Returns: "Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor"
 */
function getIntentRegex(userInput) {
  console.log(`[CareConvers][REGEX] Processing input: "${userInput}"`);
  const t = normalizeText(userInput);
  if (
    /je\s*(m|me)\s*appell(e|er)?/.test(t) &&
    /(etudiant).*(infirmier|infirmiere)/.test(t)
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
    /vous\s+etes\s+bien\s+madame\s+aubry/.test(t)
  ) {
    return 'Vous êtes bien Madame Aubry, Denise, du 14.05.1940';
  }
  if (/je\s+vous\s+apporte\s+votre\s+petit\s+dej(euner|euner)?/.test(t) || /petit\s+dejeuner/.test(t)) {
    return 'Je vous apporte votre petit déjeuner';
  }
  if (/vous\s+avez\s+faim/.test(t)) {
    return 'Vous avez faim';
  }

  if (/avez[-\s]?vous\s+mal.*des\s+douleurs/.test(t)) return 'Avez-vous mal/des douleurs ?';
  if (/qu['’]?est\s+ce\s+qui\s+provoque.*douleur/.test(t)) return "Qu'est ce qui provoque votre douleur ?";
  if (/qu['’]?est\s+ce\s+qui\s+aide.*soulager.*douleur/.test(t)) return "Qu'est ce qui aide à soulager votre douleur ?";
  if (/que\s+ressentez[-\s]?vous/.test(t)) return 'Que ressentez-vous ?';
  if (/depuis\s+quand.*(mal|douleur)/.test(t)) return 'Depuis quand avez-vous mal/des douleurs ? ';
  if (/est[-\s]?ce\s+que.*votre\s+douleur.*continu.*disparait/.test(t)) return 'Est-ce que votre douleur est continu ou disparait par moments ?';
  if (/de\s+quel\s+probl[eè]me.*(s\'ag[iî]t|sagit)/.test(t)) return "De quel problème croyez-vous qu'il s'agît ";
  if (/d[ee]j[aà].*cette\s+douleur/.test(t)) return 'Avez-vous déjà eu cette douleur dans le passé ?';
  if (/impact.*douleur.*quotidien/.test(t)) return "Quel est l'impact de cette douleur sur votre quotidien ? »";

  if (/je\s+vais\s+faire\s+quelques\s+examens\s+supplementaires/.test(t)) return 'Je vais faire quelques examens supplémentaires';
  if (/je\s+vais\s+faire\s+quelques\s+examens/.test(t)) return 'Je vais faire quelques examens supplémentaires';
  if (/je\s+vais\s+controler\s+vos\s+signes\s+vitaux/.test(t)) return 'Je vais contrôler vos signes vitaux';
  if (/controler.*signes.*vitaux/.test(t)) return 'Je vais contrôler vos signes vitaux';
  if (/je\s+vais\s+mesurer\s+vos\s+parametres\s+vitaux/.test(t)) return 'Je vais mesurer vos paramètres vitaux';
  if (/mesurer.*parametres.*vitaux/.test(t)) return 'Je vais mesurer vos paramètres vitaux';

  if (/au\s+vu\s+de\s+la\s+situation.*madame.*n['’]?est\s+pas\s+en\s+mesure.*evaluer.*douleur.*echel+e.*observation/.test(t)) return "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë";
  if (/je\s+vais\s+utiliser\s+une\s+echel+e\s+d['’]?observation/.test(t)) return "Je vais utiliser une échelle d'observation comportementale";
  if (/echel+e.*observation/.test(t)) return "Je vais utiliser une échelle d'observation comportementale";
  if (/je\s+vais\s+utiliser.*l['’]?echel+e\s+algoplus/.test(t)) return "Je vais utiliser l'échelle Algoplus";
  if (/echel+e\s+algoplus/.test(t)) return "Je vais utiliser l'échelle Algoplus";

  if (/je\s+constate\s+que\s+vous\s+avez\s+mal.*je\s+vais\s+informer\s+ma\s+referente/.test(t)) {
    return 'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir';
  }
  if (/je\s+vais\s+informer\s+ma\s+referente/.test(t)) {
    return 'Je vais informer ma référente';
  }
  if (/je\s+constate\s+que\s+vous\s+avez\s+mal/.test(t)) {
    return 'Je constate que vous avez mal';
  }

  if (/fafsdfim/.test(t)) return 'Vous avez fafsdfim';
  const result = 'unknown';
  console.log(`[CareConvers][REGEX] No match found, returning: "${result}"`);
  return result;
}



















function getRelevantIntents(step) {
  switch (step) {
    case 1:
      return ["Bonjour, je m’appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor"];
    case 2:
      return ["Je m'assieds en face de vous, comme ça vous me voyez bien"];
    case 3:
      return ['Vous êtes bien Madame Aubry, Denise, du 14.05.1940'];
    case 4:
      return ['Je vous apporte votre petit déjeuner', 'Vous avez faim'];
    case 5:
      return [
        'C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin',
        'Je constate que vous avez l\'air d\'avoir mal, c\'est exact'
      ];
    case 6:
      return [
        "C'est etonnant, d'habitude vous demander regulierement a quelle heure vous allez manger, vous n'etes pas en forme ce matin",
        'Avez-vous mal/des douleurs ?',
        "Qu'est ce qui provoque votre douleur ?",
        "Qu'est ce qui aide a soulager votre douleur ?",
        'Que ressentez-vous ?',
        'Depuis quand avez-vous mal/des douleurs ?',
        'Est-ce que votre douleur est continu ou disparait par moments ?',
        "De quel probleme croyez-vous qu'il s'agit",
        "De quel probleme croyez-voffus qu'il s'agit",
        'Avez-vous deja eu cette douleur dans le passe ?',
        "Quel est l'impact de cette douleur sur votre quotidien ?",
      ];
    case 7:
      return [
        'Je vais faire quelques examens supplémentaires',
        'Je vais contrôler vos signes vitaux',
        'Je vais mesurer vos paramètres vitaux'
      ];
    case 8:
      return [
        "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë",
        "Je vais utiliser une échelle d'observation comportementale",
        "Je vais utiliser l'échelle Algoplus"
      ];
    case 9:
      return [
        'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir',
        'Je vais informer ma référente',
        'Je constate que vous avez mal'
      ];
    case 10:
      return [
        'Transmission ISBAR',
        'Je vais transmettre à ma référente',
        'ISBAR'
      ];
    default:
      return ['unknown'];
  }
}

const canonicalMap = new Map([
  ["Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor", "Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor"],
  ["Bonjour, je m’appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor", "Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor"],
  ["Je m'assieds en face de vous, comme ca vous me voyez bien", "Je m'assieds en face de vous, comme ça vous me voyez bien"],
  ['Vous etes bien Madame Aubry, Denise, du 14.05.1940', 'Vous êtes bien Madame Aubry, Denise, du 14.05.1940'],
  ['Je vous apporte votre petit dejeuner', 'Je vous apporte votre petit déjeuner'],
  ['Vous avez faim', 'Vous avez faim'],
  ['C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin', 'C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin'],
  ['Avez-vous mal/des douleurs ?', 'Avez-vous mal/des douleurs ?'],
  ["Qu'est ce qui provoque votre douleur ?", "Qu'est ce qui provoque votre douleur ?"],
  ["Qu'est ce qui aide a soulager votre douleur ?", "Qu'est ce qui aide à soulager votre douleur ?"],
  ['Que ressentez-vous ?', 'Que ressentez-vous ?'],
  ['Depuis quand avez-vous mal/des douleurs ?', 'Depuis quand avez-vous mal/des douleurs ? '],
  ['Est-ce que votre douleur est continu ou disparait par moments ?', 'Est-ce que votre douleur est continu ou disparait par moments ?'],
  ["De quel probleme croyez-vous qu'il s'agit", "De quel problème croyez-vous qu'il s'agît "],
  ["De quel probleme croyez-voffus qu'il s'agit", "De quel problème croyez-voffus qu'il s'agît "],
  ['Avez-vous deja eu cette douleur dans le passe ?', 'Avez-vous déjà eu cette douleur dans le passé ?'],
  ["Quel est l'impact de cette douleur sur votre quotidien ?", "Quel est l'impact de cette douleur sur votre quotidien ? »"],
  ['Vous avez fafsdfim', 'Vous avez fafsdfim'],
  ['Je vais faire quelques examens supplémentaires', 'Je vais faire quelques examens supplémentaires'],
  ['Je vais contrôler vos signes vitaux', 'Je vais contrôler vos signes vitaux'],
  ['Je vais mesurer vos paramètres vitaux', 'Je vais mesurer vos paramètres vitaux'],
  ["Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë", "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë"],
  ["Je vais utiliser une échelle d'observation comportementale", "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë"],
  ["Je vais utiliser l'échelle Algoplus", "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë"],
  ['Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir', 'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir'],
  ['Je vais informer ma référente', 'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir'],
  ['Je constate que vous avez mal', 'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir'],
  ["Je constate que vous avez l'air d'avoir mal, c'est exact", "Je constate que vous avez l'air d'avoir mal, c'est exact"],
  ['Transmission ISBAR', 'Transmission ISBAR'],
  ['Je vais transmettre à ma référente', 'Transmission ISBAR'],
  ['ISBAR', 'Transmission ISBAR'],
  ['unknown', 'unknown'],
]);

function resolveCanonicalIntent(rawIntent, relevantIntents) {
  const normalizedRaw = normalizeText(rawIntent);

  if (canonicalMap.has(rawIntent)) {
    return canonicalMap.get(rawIntent);
  }

  for (const [key, canonical] of canonicalMap.entries()) {
    if (normalizeText(key) === normalizedRaw) {
      return canonical;
    }
  }

  for (const intent of relevantIntents || []) {
    if (normalizeText(intent) === normalizedRaw) {
      return intent;
    }
  }

  return 'unknown';
}

function getStepSpecificGuidance(step) {
  switch (step) {
    case 1:
      return "Étape 1 (présentation): reconnais les formulations de présentation même avec variantes de genre, placeholders, prénoms, ordre des mots différent. Si l'idée centrale est 'je me présente comme étudiant infirmier', classe en présentation.";
    case 2:
      return "Étape 2 (positionnement): accepte les reformulations indiquant se placer/s'asseoir en face pour être vu par la patiente.";
    case 3:
      return "Étape 3 (identitovigilance): accepte les formulations qui vérifient l'identité de Madame Aubry.";
    case 4:
      return "Étape 4 (petit déjeuner): distingue l'apport du petit déjeuner de la question sur la faim.";
    case 5:
      return "Étape 5 (observation clinique): reconnais les formulations qui signalent un état inhabituel et/ou la suspicion de douleur.";
    case 6:
      return "Étape 6 (OPQRST): classe toute question centrée sur douleur/qualité/durée/facteurs déclenchants/soulagement/impact quotidien dans l'étiquette OPQRST la plus proche.";
    case 7:
      return "Étape 7 (paramètres vitaux): accepte les synonymes de contrôle/mesure/examens des signes vitaux.";
    case 8:
      return "Étape 8 (Algoplus): accepte les formulations évoquant échelle d'observation comportementale/Algoplus/impossibilité d'auto-évaluation.";
    case 9:
      return "Étape 9 (décision-escalade): reconnais les formulations indiquant constat de douleur et information de la référente.";
    case 10:
      return "Étape 10 (transmission): si la phrase évoque transmission à la référente, classe en 'Transmission ISBAR'.";
    default:
      return "Reste strictement dans la liste d'étiquettes fournie pour cette étape.";
  }
}

async function getIntent(userInput, currentStep = 1) {
  console.log(`[CareConvers][DEBUG] User input: "${userInput}" (Step: ${currentStep})`);

  const relevantIntents = getRelevantIntents(currentStep);

  if (!geminiAI) {
    const regexIntent = getIntentRegex(userInput);
    if (regexIntent !== 'unknown') {
      return {
        intent: regexIntent,
        intentSource: 'regex-no-gemini',
        debug: { reason: 'gemini-not-configured' }
      };
    }

    const fuzzyMatch = pickBestIntentFromInput(userInput, relevantIntents);
    if (fuzzyMatch) {
      return {
        intent: fuzzyMatch.intent,
        intentSource: 'fuzzy-no-gemini',
        debug: {
          reason: 'gemini-not-configured-fuzzy-match',
          fuzzyScore: fuzzyMatch.score,
          fuzzyOverlap: fuzzyMatch.overlapCount,
          relevantIntents,
        }
      };
    }

    return {
      intent: 'unknown',
      intentSource: 'regex-no-gemini',
      debug: { reason: 'gemini-not-configured' }
    };
  }

  const intentList = relevantIntents.map((intent) => `- ${intent}`).join('\n');
  const stepGuidance = getStepSpecificGuidance(currentStep);

  const prompt = `RÔLE: Tu es un classificateur d'intentions cliniques pour un scénario pédagogique.\n\nOBJECTIF: Classer la phrase utilisateur dans EXACTEMENT UNE étiquette autorisée pour l'étape ${currentStep}.\n\nÉTIQUETTES AUTORISÉES:\n${intentList}\n- unknown\n\nRÈGLES DE DÉCISION (obligatoires):\n1) Utilise uniquement la sémantique de la phrase (pas la forme exacte).\n2) Accepte fautes, accents manquants, apostrophes différentes, formulations inclusives et synonymes proches.\n3) Si plusieurs étiquettes semblent possibles, choisis la PLUS SPÉCIFIQUE au contenu principal.\n4) N'utilise 'unknown' QUE si la phrase est réellement hors-sujet pour cette étape.\n5) La sortie doit être STRICTEMENT une des étiquettes autorisées, sans phrase explicative.\n\nINDICE ÉTAPE ${currentStep}: ${stepGuidance}\n\nFORMAT DE SORTIE: retourne uniquement l'étiquette exacte, rien d'autre.\n\nPHRASE UTILISATEUR: "${String(userInput || '')}"`;

  try {
    const response = await geminiAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawIntent = (response.text || '').trim();
    const geminiRawResponse = String(response.text || '').trim();
    const canonical = resolveCanonicalIntent(rawIntent, relevantIntents);

    console.log(`[CareConvers][Intent] step=${currentStep} input="${userInput}" -> intent(raw)="${rawIntent}" -> intent(canonical)="${canonical}"`);

    if (canonical === 'unknown') {
      const regexIntent = getIntentRegex(userInput);
      const fuzzyMatch = regexIntent === 'unknown'
        ? pickBestIntentFromInput(userInput, relevantIntents)
        : null;
      const fallbackIntent = fuzzyMatch?.intent || regexIntent;

      return {
        intent: fallbackIntent,
        intentSource: fuzzyMatch ? 'fuzzy-fallback-unknown' : 'regex-fallback-unknown',
        debug: {
          reason: 'gemini-returned-non-canonical-label',
          rawIntent,
          geminiRawResponse,
          fallbackIntent,
          fuzzyScore: fuzzyMatch?.score || null,
          fuzzyOverlap: fuzzyMatch?.overlapCount || null,
          relevantIntents,
        }
      };
    }

    return {
      intent: canonical,
      intentSource: 'gemini',
      debug: {
        reason: 'gemini-success',
        rawIntent,
        geminiRawResponse,
        mappedIntent: canonical,
        canonicalIntent: canonical,
        relevantIntents,
      }
    };
  } catch (error) {
    console.error('[CareConvers] Gemini classification failed, using regex fallback:', error?.message || error);
    const regexIntent = getIntentRegex(userInput);
    const fuzzyMatch = regexIntent === 'unknown'
      ? pickBestIntentFromInput(userInput, relevantIntents)
      : null;

    return {
      intent: fuzzyMatch?.intent || regexIntent,
      intentSource: fuzzyMatch ? 'fuzzy-fallback-error' : 'regex-fallback-error',
      debug: {
        reason: 'gemini-error',
        errorMessage: error?.message || String(error),
        fuzzyScore: fuzzyMatch?.score || null,
        fuzzyOverlap: fuzzyMatch?.overlapCount || null,
      }
    };
  }
}

module.exports = {
  getIntent,
  getIntentRegex,
};
