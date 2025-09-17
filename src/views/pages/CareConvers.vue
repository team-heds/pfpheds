<!-- src/components/LeftAvatar.vue -->
<template>
    <div class="care-convers-container">
    <div class="avatar-container" ref="avatarContainer"></div>
    <div class="controls">
      <textarea v-model="textToSpeak" placeholder="Ecrivez votre message ici"></textarea>
      <button @click="speak">Parler</button>
    </div>  
    <div class="conversation-status">
        <h4>Progression de la conversation</h4>
        <ul class="step-tracker">
          <li :class="{ 'active-step': conversationStep === 1, 'completed-step': conversationStep > 1 }">1. Présentation</li>
          <li :class="{ 'active-step': conversationStep === 2, 'completed-step': conversationStep > 2 }">2. Demander des nouvelles</li>
          <li :class="{ 'active-step': conversationStep === 3, 'completed-step': conversationStep > 3 }">3. Dire au revoir</li>
        </ul>
        <p class="instructions"><b>Instruction actuelle :</b> {{ conversationInstructions }}</p>
      </div>
    <div class="chat-history">
        <div v-for="(message, index) in messages" :key="index" :class="['message-bubble', `message-${message.from}`]">
          <p><strong>{{ message.from === 'user' ? 'Vous' : 'Paul' }}:</strong> {{ message.text }}</p>
        </div>
      </div>

      
  
  </div>
  </template>
  
  <script>
  import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
  
  export default {
    name: "LeftAvatar",
    props: {
      language: { type: String, default: "fr" },
      mood: { type: String, default: "neutral" },
    },
    setup(props, { expose }) {
      const avatarContainer = ref(null);
      const textToSpeak = ref("");
      const conversationStep = ref(1);
      const messages = ref([]);
      let head = null;
  
      const getLanguageConfig = (lang) =>
        lang === "fr"
          ? {
              ttsLang: "fr-FR",
              ttsVoice: "fr-FR-Standard-D",
              lipsyncModules: ["fr"],
              lipsyncLang: "fr",
            }
          : lang === "pt"
          ? {
              ttsLang: "pt-FR",
              ttsVoice: "pt-BR-Standard-D",
              lipsyncModules: ["pt"],
              lipsyncLang: "pt",
            }
          : {
              ttsLang: "en-US",
              ttsVoice: "en-US-Standard-A",
              lipsyncModules: ["en"],
              lipsyncLang: "en",
            };
  
      const loadTalkingHead = async () => {
        try {
          const module = await import("../../assets/js/talkinghead.mjs");
          return module.TalkingHead;
        } catch (error) {
          console.error("Erreur lors du chargement du module TalkingHead", error);
          return null;
        }
      };
  
      const initAvatar = async () => {
        if (avatarContainer.value) {
          const TalkingHeadClass = await loadTalkingHead();
          if (!TalkingHeadClass) return;
          const langConfig = getLanguageConfig(props.language);
          head = new TalkingHeadClass(avatarContainer.value, {
            ttsEndpoint:
              "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
            // WARNING: It is not secure to expose your API key on the client side.
            // Please consider moving this to a backend service or using environment variables.
            ttsApikey: "AIzaSyCM7K85njEJr12agV4FgexQp12uRPhNGLI",
            ...langConfig,
            cameraView: "head",
          });
          try {
            await head.showAvatar({
              url: "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png",
              body: "F",
              avatarMood: props.mood,
              ...langConfig,
            });
          } catch (error) {
            console.error("Erreur de chargement de l'avatar", error);
          }
        }
      };
  
      onMounted(initAvatar);
      onBeforeUnmount(() => {
        if (head && typeof head.dispose === "function") {
          head.dispose();
          head = null;
        }
      });
  
      watch(
        () => props.mood,
        (newMood) => {
          if (head) head.setMood(newMood);
        }
      );
  
      watch(
        () => props.language,
        (newLang) => {
          const langConfig = getLanguageConfig(newLang);
          if (head && typeof head.setLanguage === "function") {
            head.setLanguage(langConfig);
          } else {
            console.warn("Mise à jour dynamique de la langue non supportée par l'avatar.");
          }
        }
      );
  
      // Fonction speakText qui fait parler l'avatar
      const speakText = (text) => {
        return new Promise((resolve, reject) => {
          if (head) {
            try {
              head.speakText(text, {
                avatarMood: props.mood,
                ...getLanguageConfig(props.language),
              });
              head.speakMarker(() => {
                resolve();
              });
            } catch (error) {
              console.error("Erreur lors de l'envoi du texte :", error);
              reject(error);
            }
          } else {
            reject(new Error("L'avatar n'est pas initialisé"));
          }
        });
      };
  
      const conversationInstructions = computed(() => {
        switch (conversationStep.value) {
          case 1:
            return "Demandez-lui son nom (par ex: 'Comment t'appelles-tu ?')";
          case 2:
            return "Demandez-lui comment il va.";
          case 3:
            return "Dites 'au revoir' pour terminer.";
          default:
            return "Conversation terminée.";
        }
      });

      const speak = async () => {
        if (!textToSpeak.value) return;

        messages.value.push({ from: 'user', text: textToSpeak.value });

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: textToSpeak.value, userId: 'demo_user' }), // Using a static userId for now
          });

          if (!response.ok) {
            throw new Error('Backend server response was not OK');
          }

          const data = await response.json();
          const botResponse = data.response;
          if (botResponse) {
            messages.value.push({ from: 'bot', text: botResponse });
          }

          // Update conversation step from backend response
          conversationStep.value = data.nextStep;

          // Make the avatar speak the response
          if (head && botResponse) {
            head.speakText(botResponse);
          }

          // Clear the input field for the next turn
          textToSpeak.value = '';
        } catch (error) {
          console.error("Error fetching ChatGPT response:", error);
          if (head) {
            head.speakText("Désolé, une erreur est survenue.");
          }
        }
      };

      expose({ speakText });
      return { avatarContainer, textToSpeak, speak, conversationStep, conversationInstructions, messages };
    },
  };
  </script>
  
  <style scoped>
  .care-convers-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .conversation-status {
    margin-top: 15px;
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 8px;
    text-align: center;
  }

  .conversation-status h4 {
    color: black;
  }

  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 500px;
    gap: 10px;
  }

  .controls textarea {
    flex-grow: 1;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    resize: vertical;
    min-height: 40px;
    font-family: inherit;
  }

  .instructions {
    font-style: italic;
    color: #555;
  }

  .input-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .step-tracker {
    list-style: none;
    padding: 0;
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 10px 0;
  }

  .step-tracker li {
    color: #aaa;
    font-weight: bold;
  }

  .step-tracker .active-step {
    color: #007bff;
    border-bottom: 2px solid #007bff;
  }

  .step-tracker .completed-step {
    color: #28a745;
    text-decoration: line-through;
  }

  .chat-history {
    width: 100%;
    max-width: 500px;
    height: 300px;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .message-bubble {
    padding: 8px 12px;
    border-radius: 15px;
    max-width: 70%;
    word-wrap: break-word;
  }

  .message-user {
    background-color: #007bff;
    color: white;
    align-self: flex-end;
  }

  .message-bot {
    background-color: #e9e9eb;
    color: black;
    align-self: flex-start;
  }

  .avatar-container {
    width: 300px;
    height: 300px;
    border: 1px solid #ccc;
    overflow: hidden;
  }
  
  </style>
  