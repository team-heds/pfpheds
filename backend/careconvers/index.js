require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001; // Dedicated CareConvers backend

app.use(cors());
app.use(express.json());

// Minimal scenario engine for early steps
// Steps:
// 1: Présentation (nom, prénom, fonction) → media img1.png + caption (patiente ne vous a pas entendu)
// 2: Mise à la hauteur/face ("Je m’assieds en face de vous...") → if missing, show img1_canape.png
// 3: Vérifie identité ("Vous êtes bien Madame Aubry, Denise, du 14.05.1940")

function detectIntro(text) {
  const t = text.toLowerCase();
  const hasJeMappelle = /je\s*m['’]?appelle/.test(t);
  const hasNames = /\b([a-zàâçéèêëîïôûùüÿñæœ'-]{2,})\s+([a-zàâçéèêëîïôûùüÿñæœ'-]{2,})\b/.test(t);
  const hasFunction = /(étudiant|etudiant).*(infirmier|infirmière|infirmiere)/.test(t);
  return hasJeMappelle && hasNames && hasFunction;
}

function saidSitInFront(text) {
  const t = text.toLowerCase();
  return /je\s*m['’]?assieds\s+en\s+face\s+de\s+vous/.test(t) || /je\s*me\s+mets\s+en\s+face\s+de\s+vous/.test(t);
}

function verifyIdentity(text) {
  const t = text.toLowerCase();
  return /vous\s+êtes\s+bien\s+madame\s+aubry.*14\.05\.1940/.test(t) || /vous\s+etes\s+bien\s+madame\s+aubry/.test(t);
}

app.post('/api/chat', (req, res) => {
  const { prompt, currentStep = 1 } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is missing.' });
  }

  let response = '';
  let nextStep = currentStep;
  let media = null;

  if (currentStep === 1) {
    if (detectIntro(prompt)) {
      // Success: student introduced themselves → patient did not hear
      nextStep = 2;
      media = {
        imageUrl: '/images/img1.png',
        caption: 'La patiente ne vous a pas entendu (a un déficit auditif non-compensé).'
      };
      response = '';
    } else {
      response = "Commencez par vous présenter: ‘Bonjour, je m’appelle [nom prénom] et je suis étudiant·e infirmier·ère’.";
      nextStep = 1;
    }
  } else if (currentStep === 2) {
    if (saidSitInFront(prompt)) {
      response = "Bonjour, vous ressemblez à ma voisine, c’est bien vous ?"; // exemple de réponse si condition remplie
      nextStep = 3;
    } else {
      // Show canape image as guidance
      media = { imageUrl: '/images/img1_canape.png', caption: "La patiente ne vous a pas entendu  (a un déficit auditif non-compensé)" };
      response = "Mettez-vous à sa hauteur, en face d’elle, et parlez lentement.";
      nextStep = 2;
    }
  } else if (currentStep === 3) {
    if (verifyIdentity(prompt)) {
      response = "Oui c’est moi."; // validation identité
      nextStep = 4;
    } else {
      response = "Vérifiez l’identité: ‘Vous êtes bien Madame Aubry, Denise, du 14.05.1940 ?’.";
      nextStep = 3;
    }
  } else {
    response = "Poursuivez selon les consignes de l’étape.";
  }

  return res.json({ response, nextStep, media });
});

app.listen(port, () => {
  console.log(`CareConvers backend is running on http://localhost:${port}`);
});

