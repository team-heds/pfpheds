const { quizQuestions } = require('./quizData');
const { shuffleArray } = require('./utils');

function processConversationStep({
  currentStep,
  intent,
  prompt,
  currentUser,
  isbarProgress,
  quizProgress,
  opqrstProgress,
}) {
  let responseText = '';
  let nextStep = currentStep;
  let media = null;

  switch (currentStep) {
    case 1:
      if (intent === "Bonjour, je m'appelle nom, prénom et je suis étudiant infirmier, actuellement en 1ère année Bachelor") {
        responseText = '--';
        nextStep = 2;
        media = {
          imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/img1_canape.png?alt=media&token=97461139-e9ea-4f08-8c89-6f4278d879e0',
          caption: ': "La patiente ne vous a pas entendu"  (a un déficit auditif non-compensé)'
        };
      } else {
        responseText = '-?';
        nextStep = 1;
      }
      break;

    case 2:
      if (intent === "Je m'assieds en face de vous, comme ça vous me voyez bien") {
        responseText = "Bonjour, vous ressemblez à ma voisine, c'est bien vous ?";
        nextStep = 3;
      } else {
        responseText = '2b';
      }
      break;

    case 3:
      if (intent === 'Vous êtes bien Madame Aubry, Denise, du 14.05.1940') {
        responseText = 'Oui c est moi';
        nextStep = 4;
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
        nextStep = 5;
        media = {
          imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
          caption: ': "La patiente grimace'
        };
      } else if (intent === 'Vous avez faim') {
        responseText = 'Oh non, je n’ai vraiment pas envie de manger';
        nextStep = 4;
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
        nextStep = 6;
        media = {
          imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
          caption: ': "La patiente se penche en avant'
        };
      } else if (intent === 'Je constate que vous avez l’air d’avoir mal, c’est exact') {
        responseText = "S'il vous plait, dites à mon mari de venir, il faut appeler la police avant qu'il fasse nuit !  ";
        nextStep = 6;
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

      const opqrstIntents = [
        'Avez-vous mal/des douleurs ?',
        "Qu'est ce qui provoque votre douleur ?",
        "Qu'est ce qui aide à soulager votre douleur ?",
        'Que ressentez-vous ?',
        'Depuis quand avez-vous mal/des douleurs ? ',
        'Est-ce que votre douleur est continu ou disparait par moments ?',
        "De quel problème croyez-vous qu'il s'agît ",
        'Avez-vous déjà eu cette douleur dans le passé ?',
        "Quel est l'impact de cette douleur sur votre quotidien ? »"
      ];

      if (opqrstIntents.includes(intent)) {
        responseText = "S'il vous plaît, dites à mon mari de venir, il faut appeler la police avant qu'il fasse nuit !";

        const newCount = currentOpqrstCount + 1;
        opqrstProgress[currentUser] = newCount;

        if (newCount >= 3) {
          opqrstProgress[currentUser] = 0;
          nextStep = 7;
          media = {
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/3.png?alt=media&token=91cc1d60-c979-465c-8e10-0fef6af3ebef',
            caption: "La patiente n'arrive pas à répondre correctement à vos questions (confusion, désorientation)"
          };
        } else {
          nextStep = 6;
        }
      } else {
        responseText = 'Raaahhahah... (gémissements)';
        nextStep = 6;
      }
      break;
    }

    case 7: {
      const vitalSignsIntents = [
        'Je vais faire quelques examens supplémentaires',
        'Je vais contrôler vos signes vitaux',
        'Je vais mesurer vos paramètres vitaux'
      ];

      if (vitalSignsIntents.includes(intent)) {
        responseText = "D'accord...";
        nextStep = 8;
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
        responseText = 'Mmmmh... aaaah...';
        nextStep = 7;
      }
      break;
    }

    case 8: {
      const algoplusIntents = [
        "Au vu de la situation, Madame n'est pas en mesure d'évaluer sa douleur, je vais donc utiliser une échelle d'observation comportementale de la douleur aiguë",
        "Je vais utiliser une échelle d'observation comportementale",
        "Je vais utiliser l'échelle Algoplus"
      ];

      if (algoplusIntents.includes(intent)) {
        responseText = '...';
        nextStep = 9;
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
        responseText = 'Mmmmh... aaaah...';
        nextStep = 8;
      }
      break;
    }

    case 9: {
      const decisionIntents = [
        'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir',
        'Je vais informer ma référente',
        'Je constate que vous avez mal'
      ];

      if (decisionIntents.includes(intent)) {
        responseText = "S'il vous plaît aidez-moi...";
        nextStep = 10;
      } else {
        responseText = 'Mmmmh... aaaah...';
      }
      break;
    }

    case 10: {
      if (!isbarProgress[currentUser]) {
        isbarProgress[currentUser] = new Set();
      }

      const p = String(prompt || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

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
        isbarProgress[currentUser].add(matchedPart);

        const completedCount = isbarProgress[currentUser].size;

        if (completedCount < 4) {
          responseText = 'Merci, continue...';
          nextStep = 10;
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
          responseText = '✅ Transmission ISBAR complète !\n\n📚 Passons maintenant au quiz de connaissances pour évaluer votre compréhension du scénario.';
          nextStep = 11;
          media = {
            imageUrl: '',
            caption: '✅ Simulation terminée. Vous avez complété toutes les étapes avec succès !\n\n🎉 Transmission ISBAR complète : 4/4 parties validées'
          };
          delete isbarProgress[currentUser];
        }
      } else {
        responseText = "S'il vous plaît, continuez votre transmission ISBAR...";
        nextStep = 10;
      }
      break;
    }

    case 11: {
      if (!quizProgress[currentUser]) {
        quizProgress[currentUser] = {
          currentQuestion: 0,
          answers: [],
          score: 0,
          started: false,
          questions: shuffleArray([...quizQuestions]).slice(0, 5)
        };
      }

      const progress = quizProgress[currentUser];
      if (typeof progress.started !== 'boolean') {
        progress.started = progress.answers.length > 0;
      }
      const currentQ = progress.questions[progress.currentQuestion];

      const formatQuestion = (question, index, total) => {
        let text = `Question ${index + 1}/${total}:\n\n${question.question}\n\n`;
        text += question.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');
        return text;
      };

      // On first entry to quiz, display the first question once without consuming the current prompt.
      if (!progress.started && currentQ) {
        progress.started = true;
        responseText = formatQuestion(currentQ, progress.currentQuestion, progress.questions.length);
        nextStep = 11;
        break;
      }

      if (!currentQ) {
        const finalScore = Math.round((progress.score / progress.questions.length) * 100);
        responseText = `📊 Quiz terminé !\n\nScore: ${finalScore}%\n${progress.score}/${progress.questions.length} réponses correctes\n\n✅ Formation complétée avec succès !`;
        nextStep = 12;
        media = {
          imageUrl: '',
          caption: `🎉 RÉSULTATS FINAUX\n━━━━━━━━━━━━━━━━━━━━\n📚 Quiz: ${finalScore}%\n✅ Questions correctes: ${progress.score}/${progress.questions.length}\n📈 Score global: ${finalScore}%\n━━━━━━━━━━━━━━━━━━━━`
        };
        delete quizProgress[currentUser];
      } else {
        let isCorrect = false;
        const answerNumber = parseInt(prompt.trim());

        if (currentQ.type === 'MCQ' && !isNaN(answerNumber)) {
          isCorrect = answerNumber === currentQ.correct;
        } else {
          responseText = `Merci de répondre avec le numéro de la bonne réponse (1-${currentQ.options.length}).\n\n`;
          responseText += formatQuestion(currentQ, progress.currentQuestion, progress.questions.length);
          nextStep = 11;
          break;
        }

        if (isCorrect) {
          progress.score++;
          progress.answers.push({ questionId: currentQ.id, correct: true, userAnswer: prompt });
        } else {
          progress.answers.push({ questionId: currentQ.id, correct: false, userAnswer: prompt });
        }

        progress.currentQuestion++;

        const nextQ = progress.questions[progress.currentQuestion];
        if (nextQ) {
          responseText = formatQuestion(nextQ, progress.currentQuestion, progress.questions.length);
          nextStep = 11;
        } else {
          const finalScore = Math.round((progress.score / progress.questions.length) * 100);
          responseText = `📊 Quiz terminé !\n\nScore: ${finalScore}%\n${progress.score}/${progress.questions.length} réponses correctes\n\n✅ Formation complétée avec succès !`;
          nextStep = 12;
          media = {
            imageUrl: '',
            caption: `🎉 RÉSULTATS FINAUX\n━━━━━━━━━━━━━━━━━━━━\n📚 Quiz: ${finalScore}%\n✅ Questions correctes: ${progress.score}/${progress.questions.length}\n📈 Score global: ${finalScore}%\n━━━━━━━━━━━━━━━━━━━━`
          };
          delete quizProgress[currentUser];
        }
      }
      break;
    }

    case 12: {
      responseText = '✅ La simulation est déjà terminée. Utilisez le bouton de réinitialisation pour recommencer un nouveau scénario.';
      nextStep = 12;
      media = {
        imageUrl: '',
        caption: '🎉 Session terminée. Réinitialisez pour relancer la simulation.'
      };
      break;
    }

    default:
      responseText = 'Une erreur est survenue, réinitialisation de la conversation.';
      nextStep = 1;
      if (isbarProgress[currentUser]) {
        delete isbarProgress[currentUser];
      }
      if (quizProgress[currentUser]) {
        delete quizProgress[currentUser];
      }
      opqrstProgress[currentUser] = 0;
      break;
  }

  return {
    responseText,
    nextStep,
    media,
  };
}

module.exports = {
  processConversationStep,
};
