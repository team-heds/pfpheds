// CareConvers stateful chat routes
// Mount with: const registerCareConversStoreRoutes = require('./supabase/careconversStoreBackend');
// in your main backend (index.js): registerCareConversStoreRoutes(app);

var temp = 0;

// Optional OpenAI client (lazy-init, non-fatal if missing)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  console.warn('[CareConvers] OpenAI SDK not available, falling back to regex intents.');
}

// Regex-based fallback intent matcher (kept from previous implementation)
function getIntentRegex(userInput) {
  const t = String(userInput || '').toLowerCase().trim();
  if (
    /je\s*m['']?appelle/.test(t) &&
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
  if (/avez[-\s]?vous\s+mal|douleur/.test(t)) return 'Avez-vous mal/des douleurs ?';
  if (/provoque.*douleur/.test(t)) return 'Qu’est ce qui provoque votre douleur ?';
  if (/aide.*soulager.*douleur/.test(t)) return 'Qu’est ce qui aide à soulager votre douleur ?';
  if (/que\s+ressentez[-\s]?vous/.test(t)) return 'Que ressentez-vous ?';
  if (/depuis\s+quand.*(mal|douleur)/.test(t)) return 'Depuis quand avez-vous mal/des douleurs ? ';
  if (/(douleur).*continu|disparait|dispara[iî]t/.test(t)) return 'Est-ce que votre douleur est continu ou disparait par moments ?';
  if (/de\s+quel\s+probl[eè]me.*(s'ag[iî]t|sagit)/.test(t)) return 'De quel problème croyez-vous qu’il s’agît ';
  if (/d[ée]j[aà].*cette\s+douleur/.test(t)) return 'Avez-vous déjà eu cette douleur dans le passé ?';
  if (/impact.*douleur.*quotidien/.test(t)) return ' Quel est l’impact de cette douleur sur votre quotidien ? »';
  // Catch some typos present in cases
  if (/fafsdfim/.test(t)) return 'Vous avez fafsdfim';
  return 'unknown';
}

// OpenAI-assisted semantic intent matcher (context-aware)
async function getIntent(userInput, currentStep = 1) {
  // If OpenAI not configured, fallback to regex
  if (!openai) return getIntentRegex(userInput);

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
        return ["Je m'assieds en face de vous, comme ca vous me voyez bien"];
      case 3:
        return ["Vous etes bien Madame Aubry, Denise, du 14.05.1940"];
      case 4:
        return ["Je vous apporte votre petit dejeuner", "Vous avez faim"];
      case 5:
        return [
            "C’est étonnant, d’habitude vous demander régulièrement à quelle heure vous allez manger, vous n’êtes pas en forme ce matin",
            "e constate que vous avez l air d’avoir mal, c est exact ",
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

  const systemPrompt = `Tu es un assistant de classification d'intentions.\n\nClassifie la phrase de l'utilisateur dans UNE SEULE des etiquettes SUIVANTES (reponds STRICTEMENT par l'ETIQUETTE EXACTE, sans autre texte). Voici les options possibles pour cette etape :\n${intentList}\n- unknown\n\nAccepte les variantes orthographiques, l'absence d'accents et les reformulations proches. Reponds UNIQUEMENT par une des etiquettes ci-dessus, sans ponctuation additionnelle.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: String(userInput || '') }
      ],
   
    });
    console.log(systemPrompt);
    const rawIntent = (completion.choices?.[0]?.message?.content || '').trim();
    const mapped = canonicalMap.get(rawIntent) || (relevantIntents.includes(rawIntent) ? rawIntent : 'unknown');
    const canonical = canonicalMap.get(mapped) || mapped;
    console.log(`[CareConvers][Intent] step=${currentStep} input="${userInput}" -> intent(raw)="${rawIntent}" -> intent(canonical)="${canonical}"`);
    return canonical === 'unknown' ? getIntentRegex(userInput) : canonical;
  } catch (error) {
    console.error('[CareConvers] OpenAI classification failed, using regex fallback:', error?.message || error);
    return getIntentRegex(userInput);
  }
}

function registerCareConversStoreRoutes(app) {
  console.log('[ROUTES] careconversStoreBackend mounted');

  // In-memory state: maps user identifier -> step
  const conversationStates = {};
  
  // Track ISBAR progress for step 10: maps user identifier -> set of completed ISBAR parts
  const isbarProgress = {};

  // Stateful Chat Endpoint
  app.post('/api/chat', async (req, res) => {
    let { prompt, userId } = req.body; // Assuming a userId will be sent, defaulting to 'demo_user'
    const currentUser = userId || 'demo_user';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is missing.' });
    }

    // Trim whitespace and newlines from prompt
    prompt = prompt.trim();

    // Get current step for the user, default to 1
    let currentStep = conversationStates[currentUser] || 1;
    let responseText = '';
    let nextStep = currentStep;
    let media = null;

    // --- Conversation Logic ---
    const intent = await getIntent(prompt, currentStep);

    console.log(`[DEBUG] Step ${currentStep}, intent: "${intent}"`);

    switch (currentStep) {  
 
      case 1:
        if (intent.includes("Bonjour") && intent.includes("appelle") && intent.includes("étudiant") && intent.includes("infirmier")) {
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
        if (intent === "Je m'assieds en face de vous, comme ca vous me voyez bien") {
          responseText = 'Bonjour, vous ressemblez à ma voisine, c’est bien vous ?';
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
          responseText = '- - - ';
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
                nextStep = 5;
              }
            break;

      case 6: {
        // Liste des intents OPQRST valides pour l'étape 6
        const opqrstIntents = [
          "C'est étonnant, d'habitude vous demander régulièrement à quelle heure vous allez manger, vous n'êtes pas en forme ce matin",
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
          
          temp++;
          console.log(`[CareConvers][Step 6] OPQRST question ${temp}/3: "${intent}"`);
          
          // Après 3 questions OPQRST, passer à l'étape 7
          if (temp >= 3) {
            temp = 0;
            nextStep = 7;
            media = {
              imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
              caption: "La patiente n'arrive pas à répondre correctement à vos questions (confusion, désorientation)"
            };
          }
        } else {
          // Réponse par défaut si l'intent n'est pas reconnu
          responseText = "Raaahhahah... (gémissements)";
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

        // Check which ISBAR part matches the user input
        let matchedPart = null;
        
        if (intent.includes("Madame Aubrey présente") || intent.includes("signes") || intent.includes("évoquer une douleur")) {
          matchedPart = 'S';
        } else if (intent.includes("habituellement calme") || intent.includes("participe aux repas")) {
          matchedPart = 'B';
        } else if (intent.includes("changement dans son comportement") || intent.includes("échelle ALGOPLUS") || intent.includes("score de 4") || intent.includes("observé")) {
          matchedPart = 'A';
        } else if (intent.includes("évaluation clinique") || intent.includes("prise en charge") || intent.includes("recommande")) {
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
            // All 4 parts completed
            responseText = "Merci...";
            nextStep = 10; // Fin de la simulation
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

      default:
        responseText = 'Une erreur est survenue, réinitialisation de la conversation.';
        nextStep = 1; // Reset
        // Clean up ISBAR progress if exists
        if (isbarProgress[currentUser]) {
          delete isbarProgress[currentUser];
        }
        break;
    }

    // Update the user's state
    conversationStates[currentUser] = nextStep;

    console.log(`[CareConvers] Sending response - step: ${currentStep} -> ${nextStep}, response: "${responseText.substring(0, 50)}..."`);

    // Send the response (include media if any)
    res.json({ response: responseText, nextStep, media });
  });

  // Reset endpoint to clear conversation state
  app.post('/api/reset', (req, res) => {
    const { userId } = req.body;
    const currentUser = userId || 'demo_user';
    
    // Clear conversation state
    delete conversationStates[currentUser];
    delete isbarProgress[currentUser];
    
    console.log(`[CareConvers] Reset conversation for user: ${currentUser}`);
    res.json({ success: true, message: 'Conversation reset successfully', nextStep: 1 });
  });
}

module.exports = registerCareConversStoreRoutes;