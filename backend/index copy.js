require('dotenv').config()
const express = require('express')
const cors = require('cors')
const supabase = require('./supabaseClient');
const OpenAI = require('openai');
const app = express()

const userStoreRoutes = require('./supabase/userStoreBackend')
const institutionsStoreRoutes = require('./supabase/institutionsStoreBackend')
const enseignantsStoreRoutes = require('./supabase/enseignantsStoreBackend.js');
const hashtagStoreRoutes = require('./supabase/hashtagStoreBackend.js');
const communitiesStoreRoutes = require('./supabase/communitiesStoreBackend');
const filePhysioRoutes = require('./supabase/filePhysioBackendStore');
const postsStoreRoutes = require('./supabase/postsBackendStore.js');
const praticiensFormateursStoreRoutes = require('./supabase/praticiensFormateursBackendStore.js');

app.use('/api', userStoreRoutes);
app.use('/api/institutions', institutionsStoreRoutes);
app.use('/api/communities', communitiesStoreRoutes);
app.use('/api/enseignants', enseignantsStoreRoutes);
app.use('/api/filePhysio', filePhysioRoutes);
app.use('/api/hashtags', hashtagStoreRoutes);
app.use('/api/posts', postsStoreRoutes);
app.use('/api/praticiens-formateurs', praticiensFormateursStoreRoutes);
// CORS and JSON parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
// Express 5 uses path-to-regexp v6 which doesn't support '*' patterns.
// Use a regex to match all paths for CORS preflight handling.
app.options(/.*/, cors())
app.use(express.json())

// OpenAI Client Initialization
if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. The /api/chat endpoint will not work.");
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


app.get('/api/ping', (req, res) => {
  res.send('pingpong')
})

app.get('/api/pong', (req, res) => {
  res.send('aller')
})

app.get('/api/pongg', (req, res) => {
  res.send('aller 2x')
})


// Exemple de route test Supabase

app.get('/api/chapters', async (req, res) => {
  const { data, error } = await supabase.from('chapters').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// In-memory store for conversation state (for demonstration purposes)
const conversationStates = {};

// Helper function to check semantic similarity with OpenAI
async function getIntent(userInput) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not found.");
    return 'unknown';
  }

  const systemPrompt = `You are an intent classification assistant. Classify the user's phrase into one of the following categories: 'ask_name', 'ask_how_are_you', 'say_goodbye', or 'unknown'. 'say_goodbye' includes phrases like 'au revoir', 'bonne journée', or 'passez une belle journée'. Respond with only the category name.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: 0,
      max_tokens: 10
    });

    const intent = completion.choices[0].message.content.trim();
    console.log(`User says: "${userInput}", Intent classified as: "${intent}"`); // Debugging log
    return intent;
  } catch (error) {
    console.error('Error getting intent from OpenAI:', error);
    return 'unknown';
  }
}

// Stateful Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { prompt, userId } = req.body; // Assuming a userId will be sent, defaulting to 'demo_user'
  const currentUser = userId || 'demo_user';

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is missing.' });
  }

  // Get current step for the user, default to 1
  let currentStep = conversationStates[currentUser] || 1;
  let responseText = '';
  let nextStep = currentStep;

  // --- Conversation Logic ---
  const intent = await getIntent(prompt);

  switch (currentStep) {
    case 1:
      if (intent === 'ask_name') {
        responseText = "Je m'appelle Paul";
        nextStep = 2;
      } else {
        responseText = "Pour commencer, veuillez me demander mon nom.";
      }
      break;

    case 2:
      if (intent === 'ask_how_are_you') {
        responseText = "Oui je vais bien";
        nextStep = 3;
      } else {
        responseText = "Maintenant, demandez-moi comment je vais.";
      }
      break;

    case 3:
      if (intent === 'say_goodbye') {
        responseText = "Merci à vous aussi";
        nextStep = 1; // Reset for a new conversation
      } else {
        responseText = "Pour finir, dites-moi au revoir.";
      }
      break;

    default:
      responseText = "Une erreur est survenue, réinitialisation de la conversation.";
      nextStep = 1; // Reset
      break;
  }

  // Update the user's state
  conversationStates[currentUser] = nextStep;

  // Send the response
  res.json({ response: responseText, nextStep: nextStep });

  });

// Lancement du serveur sur toutes les interfaces réseau
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
