<!-- src/components/LeftAvatar.vue -->
<template>
  <div class="care-convers-container">
    <!-- Scenario Objectives Modal -->
    <ScenarioObjectivesModal
      v-model="showObjectivesModal"
      @confirmed="onObjectivesConfirmed"
    />

    <!-- Quick Start Panel -->
    <div class="quick-start-panel" v-if="!hasStartedConversation">
      <div class="quick-start-content">
        <label for="startStep" class="step-label">🚀 Démarrage rapide - Étape :</label>
        <input 
          type="number" 
          id="startStep" 
          v-model.number="selectedStartStep" 
          min="1" 
          max="9" 
          class="step-input"
          @keydown.enter="quickStart"
        />
        <button class="quick-start-btn" @click="quickStart">OK - Commencer</button>
        <span class="step-hint">ou suivre le parcours normal ci-dessous ↓</span>
      </div>
    </div>

    <!-- Start Button (appears only after dossier has been read) -->
    <div class="start-bar" v-if="showStartButton">
      <button class="start-btn" @click="startConversation">Commencer</button>
    </div>

    <!-- PDF Viewer Modal (always mounted) -->
    <PdfViewerModal
      v-model="showPdfModal"
      :pdfUrl="dossierPdfUrl"
      title="Dossier médical - Madame Aubrey"
    />

    <!-- Consigne Modal (always mounted) -->
    <ConsigneModal
      v-model="showConsigneModal"
      title="Consigne"
      :text="consigneText"
      @acknowledged="onConsigneAck"
    />

    <!-- Quick Access Toolbar -->
    <div class="quick-access">
      <button class="qa-btn" @click="openObjectives">Objectifs du scénario</button>
      <button class="qa-btn" @click="openResumeSlide">Résumé de la situation</button>
      <button class="qa-btn" @click="openDossierSlide">Dossier médical</button>
      <button class="qa-btn" @click="openPdf">Voir PDF</button>
    </div>

    <!-- Slides Panel: Intro then Dossier médical -->
    <div v-if="showSlidesPanel" class="slides-panel">
      <div class="slides-header">
        <span class="badge" v-if="currentSlide === 1">1/2</span>
        <span class="badge" v-else>2/2</span>
        <h3 v-if="currentSlide === 1">Résumé de la situation</h3>
        <h3 v-else>Dossier médical</h3>
      </div>

      <div v-if="currentSlide === 1" class="slide-content">
        <p>
          Madame Aubrey, Denise, 14.05.1940, est une résidente de l’EMS Harmonia.
          Il est 08h30 du matin et Madame est dans sa chambre. L’étudiant·e a comme
          consigne de lui apporter le plateau avec le petit-déjeuner. Dès l’entrée
          de l’étudiant·e en chambre, Madame gémie. Elle refuse de prendre son
          petit-déjeuner, comportement qui n’est pas habituel.
        </p>
      </div>

      <div v-else class="slide-content dossier-medical">
        <ul>
          <li>Placement en EMS Harmonia depuis un an.</li>
          <li>Perte d’autonomie importante (AVQ-D), chutes à répétition liées aux troubles neurocognitifs modérés.</li>
          <li>Sans réseau familial, placement demandé pour sécurité.</li>
          <li>Veuve depuis 10 ans, sans enfants.</li>
          <li>Troubles neurocognitifs modérés, coxarthrose bilatérale, déficit auditif non compensé. Déplacement avec rollator.</li>
          <li>Manifestations cognitives: répétitions de questions, oublis récents, désorientation temporelle, communication parfois confuse, difficulté à finaliser des tâches.</li>
        </ul>
        <div class="media-row">
          <img class="doc-image" :src="dossierImageUrl" alt="Photo dossier médical (placeholder)" />
          <button class="btn btn-primary" @click="showPdfModal = true">Voir le PDF « Dossier médical »</button>
        </div>
      </div>

      <div class="slides-actions">
        <button class="btn" :disabled="currentSlide === 1" @click="prevSlide">Précédent</button>
        <button v-if="currentSlide === 1" class="btn btn-primary" @click="nextSlide">Continuer</button>
        <button v-else class="btn btn-success" @click="finishSlides">J’ai lu, continuer →</button>
      </div>
    </div>

    <!-- Main two-column layout: left (media), right (avatar + chat) -->
    <div class="main-layout">
      <!-- LEFT COLUMN: media (image + caption) -->
      <div class="media-column">
        <div v-if="mediaImageUrl" class="media-panel">
          <img :src="mediaImageUrl" alt="Media contextuelle" class="media-image" />
          <p class="media-caption">{{ mediaCaption }}</p>
        </div>
      </div>

      <!-- RIGHT COLUMN: avatar, status, chat, input -->
      <div class="interaction-column">
        <div class="avatar-container" ref="avatarContainer" :class="{ 'avatar-disabled': !hasStartedConversation }"></div>

        <div class="conversation-status">
          <h4>Progression de la conversation</h4>
          <p class="current-step"><b>Étape actuelle :</b> {{ conversationStep }}/10</p>
          <ul class="step-tracker">
            <li :class="{ 'active-step': conversationStep === 1, 'completed-step': conversationStep > 1 }">1. Se présenter</li>
            <li :class="{ 'active-step': conversationStep === 2, 'completed-step': conversationStep > 2 }">2. S'asseoir en face</li>
            <li :class="{ 'active-step': conversationStep === 3, 'completed-step': conversationStep > 3 }">3. Vérifier identité</li>
            <li :class="{ 'active-step': conversationStep === 4, 'completed-step': conversationStep > 4 }">4. Servir repas</li>
            <li :class="{ 'active-step': conversationStep === 5, 'completed-step': conversationStep > 5 }">5. Évaluer douleur</li>
            <li :class="{ 'active-step': conversationStep === 6, 'completed-step': conversationStep > 6 }">6. OPQRST</li>
            <li :class="{ 'active-step': conversationStep === 7, 'completed-step': conversationStep > 7 }">7. Paramètres vitaux</li>
            <li :class="{ 'active-step': conversationStep === 8, 'completed-step': conversationStep > 8 }">8. Échelle Algoplus</li>
            <li :class="{ 'active-step': conversationStep === 9, 'completed-step': conversationStep > 9 }">9. Prise de décision</li>
            <li :class="{ 'active-step': conversationStep === 10, 'completed-step': conversationStep > 10 }">10. Transmission ISBAR</li>
          </ul>
          <p class="instructions"><b>Instruction actuelle :</b> {{ conversationInstructions }}</p>
        </div>

        <div class="chat-history" ref="chatHistory">
          <div v-if="messages.length === 0" class="empty-chat">
            <p>👋 La conversation commencera lorsque vous enverrez votre premier message.</p>
          </div>
          <div v-for="(message, index) in messages" :key="index" :class="['message-bubble', `message-${message.from}`]">
            <p><strong>{{ message.from === 'user' ? 'Vous' : 'Madame Aubrey' }}:</strong> {{ message.text }}</p>
          </div>
          <div v-if="isLoading" class="message-bubble message-loading">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        
        <div v-if="errorMessage" class="error-banner" role="alert">
          {{ errorMessage }}
        </div>

        <div class="controls" v-if="hasStartedConversation">
          <textarea 
            v-model="textToSpeak" 
            placeholder="Écrivez votre message ici..." 
            @keydown.enter.exact.prevent="speak"
            @keydown.enter.shift.exact="textToSpeak += '\n'"
            :disabled="isLoading"
            aria-label="Champ de saisie du message"
          ></textarea>
          <button 
            @click="speak" 
            :disabled="isLoading || !textToSpeak.trim()"
            :class="{ 'btn-loading': isLoading }"
            aria-label="Envoyer le message"
          >
            <span v-if="!isLoading">Envoyer</span>
            <span v-else>Envoi...</span>
          </button>
        </div>
      </div>
    </div>

      
  
  </div>
  </template>
  
  <script>
  import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from "vue";
  import ScenarioObjectivesModal from "@/components/careconvers/ScenarioObjectivesModal.vue";
  import PdfViewerModal from "@/components/careconvers/PdfViewerModal.vue";
  import ConsigneModal from "@/components/careconvers/ConsigneModal.vue";
  
  export default {
    name: "LeftAvatar",
    components: { ScenarioObjectivesModal, PdfViewerModal, ConsigneModal },
    props: {
      language: { type: String, default: "fr" },
      mood: { type: String, default: "neutral" },
    },
    setup(props, { expose }) {
      const avatarContainer = ref(null);
      const textToSpeak = ref("");
      const conversationStep = ref(1);
      const messages = ref([]);
      const mediaImageUrl = ref("");
      const mediaCaption = ref("");
      const isLoading = ref(false);
      const errorMessage = ref("");
      const chatHistory = ref(null);
      const selectedStartStep = ref(1);

      // Modal and slides state
      const showObjectivesModal = ref(false); // Start closed to allow quick start
      const showSlidesPanel = ref(false);
      const showStartButton = ref(false); // becomes true after dossier lu
      const currentSlide = ref(1); // 1: Résumé, 2: Dossier médical
      // Image placeholder (remplacer par votre chemin réel si disponible)
      const dossierImageUrl = ref("https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/1.png?alt=media&token=2b443989-93c8-47f9-9203-a36055e1f8c1");
      // NOTE: c'est dans le même dossier l'image avec nom screen.png (à brancher si vous l'ajoutez sous /public)
      // Exemple: dossierImageUrl.value = '/images/screen.png'
      const dossierPdfUrl = ref("https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/4.%20Dossier_transfert_Aubrey%20Denise.pdf?alt=media&token=bf61f841-567f-4171-8e02-13e049d0b5cc");

      // PDF modal state
      const showPdfModal = ref(false);

      // Consigne modal state
      const showConsigneModal = ref(false);
      const consigneText = ref(
        "Il est 08h30. Vous devez apporter le plateau du petit déjeuner et le déposer sur la table à manger de Madame Aubry à la chambre 101 "
      );
      let head = null;
      const hasStartedConversation = ref(false);
  
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
            return "Présentez-vous : 'Bonjour, je m'appelle [nom prénom] et je suis étudiant·e infirmier·ère'.";
          case 2:
            return "Mettez-vous à sa hauteur, asseyez-vous en face d'elle et parlez clairement.";
          case 3:
            return "Vérifiez son identité : 'Vous êtes bien Madame Aubry, Denise, du 14.05.1940 ?'.";
          case 4:
            return "Déposez le plateau repas et observez son comportement.";
          case 5:
            return "Posez des questions sur sa douleur (OPQRST).";
          case 6:
            return "Évaluez la douleur et adaptez votre communication (3 questions OPQRST).";
          case 7:
            return "Mesurez les paramètres vitaux : 'Je vais contrôler vos signes vitaux'.";
          case 8:
            return "Utilisez l'échelle Algoplus : 'Je vais utiliser l'échelle Algoplus'.";
          case 9:
            return "Prenez une décision : 'Je constate que vous avez mal. Je vais informer ma référente et je reviens ensuite vous voir'.";
          case 10:
            return "Transmettez l'information à votre référent·e (ISBAR).";
          default:
            return "Conversation terminée. Excellent travail !";
        }
      });

      const scrollToBottom = async () => {
        await nextTick();
        if (chatHistory.value) {
          chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
        }
      };

      const speak = async () => {
        if (!textToSpeak.value.trim()) return;
        
        errorMessage.value = "";
        isLoading.value = true;
        const userMessage = textToSpeak.value;
        
        messages.value.push({ from: 'user', text: userMessage });
        textToSpeak.value = '';
        scrollToBottom();

        try {
          const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              prompt: userMessage, 
              currentStep: conversationStep.value 
            }),
          });

          if (!response.ok) {
            throw new Error(`Erreur serveur : ${response.status}`);
          }

          const data = await response.json();
          const botResponse = data.response;
          
          if (botResponse) {
            messages.value.push({ from: 'bot', text: botResponse });
            scrollToBottom();
          }

          // Update conversation step from backend response
          if (data.nextStep !== undefined) {
            conversationStep.value = data.nextStep;
          }

          // Display media if provided by backend
          if (data.media && data.media.imageUrl) {
            mediaImageUrl.value = data.media.imageUrl;
            mediaCaption.value = data.media.caption || '';
          }

          // Make the avatar speak the response
          if (head && botResponse) {
            try {
              await head.speakText(botResponse);
            } catch (err) {
              console.warn("Erreur TTS:", err);
            }
          }
        } catch (error) {
          console.error("Erreur lors de la communication:", error);
          errorMessage.value = "⚠️ Impossible de communiquer avec le serveur. Vérifiez que le backend est démarré (port 3000).";
          
          if (head) {
            try {
              await head.speakText("Désolé, une erreur est survenue.");
            } catch (err) {
              console.warn("Erreur TTS:", err);
            }
          }
        } finally {
          isLoading.value = false;
        }
      };

      // Slides controls
      const onObjectivesConfirmed = () => {
        showSlidesPanel.value = true;
        currentSlide.value = 1;
      };
      const nextSlide = () => {
        if (currentSlide.value < 2) currentSlide.value += 1;
      };
      const prevSlide = () => {
        if (currentSlide.value > 1) currentSlide.value -= 1;
      };
      const finishSlides = () => {
        showSlidesPanel.value = false;
        showStartButton.value = true; // allow starting only after dossier médical is read
      };

      // Quick access actions
      const openObjectives = () => {
        showObjectivesModal.value = true;
      };
      const openResumeSlide = () => {
        showSlidesPanel.value = true;
        currentSlide.value = 1;
      };
      const openDossierSlide = () => {
        showSlidesPanel.value = true;
        currentSlide.value = 2;
      };
      const openPdf = () => {
        showPdfModal.value = true;
      };

      // Consigne acknowledged → open slides at Résumé
      const onConsigneAck = () => {
        showSlidesPanel.value = true;
        currentSlide.value = 1;
        // hasStartedConversation already enabled when clicking Commencer
      };

      const startConversation = () => {
        hasStartedConversation.value = true; // show controls and undim avatar immediately
        showConsigneModal.value = true;      // also show the consigne popup
      };

      const quickStart = () => {
        // Skip all modals and start directly at selected step
        showObjectivesModal.value = false;
        showSlidesPanel.value = false;
        showConsigneModal.value = false;
        showStartButton.value = false;
        
        // Set the conversation step
        conversationStep.value = selectedStartStep.value;
        
        // Enable conversation immediately
        hasStartedConversation.value = true;
        
        // Show initial media if starting at step 1
        if (selectedStartStep.value === 1) {
          mediaImageUrl.value = '';
          mediaCaption.value = '';
        }
      };

      expose({ speakText });
      return {
        avatarContainer,
        textToSpeak,
        speak,
        conversationStep,
        conversationInstructions,
        messages,
        mediaImageUrl,
        mediaCaption,
        isLoading,
        errorMessage,
        chatHistory,
        // modal & slides
        showObjectivesModal,
        onObjectivesConfirmed,
        showSlidesPanel,
        showStartButton,
        currentSlide,
        nextSlide,
        prevSlide,
        finishSlides,
        dossierImageUrl,
        dossierPdfUrl,
        showPdfModal,
        showConsigneModal,
        consigneText,
        hasStartedConversation,
        // quick access
        openObjectives,
        openResumeSlide,
        openDossierSlide,
        openPdf,
        onConsigneAck,
        startConversation,
        selectedStartStep,
        quickStart,
      };
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

  /* Two-column responsive layout */
  .main-layout {
    width: 100%;
    max-width: 1200px;
    display: grid;
    grid-template-columns: 1fr 1.2fr; /* left media smaller, right interaction bigger */
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 1024px) {
    .main-layout { 
      grid-template-columns: 1fr; 
      gap: 24px;
    }
    .interaction-column { order: 1; }
    .media-column { order: 2; }
  }

  .interaction-column {
    background: white;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    border: 2px solid #e5e7eb;
  }

  .media-column {
    display: flex;
    flex-direction: column;
  }

  /* Start bar */
  .start-bar { margin: 6px 0 0 0; }
  .start-btn { cursor: pointer; border-radius: 10px; padding: 10px 16px; border: 1px solid #0ea5e9; background: #0ea5e9; color: #fff; font-weight: 700; }
  .start-btn:hover { background: #0284c7; border-color: #0284c7; }

  /* Quick Start Panel */
  .quick-start-panel {
    width: 100%;
    max-width: 820px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 16px 20px;
    margin: 10px 0;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }

  .quick-start-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .step-label {
    color: white;
    font-weight: 600;
    font-size: 15px;
  }

  .step-input {
    width: 70px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 2px solid white;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    background: white;
    color: #667eea;
  }

  .step-input:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
  }

  .quick-start-btn {
    cursor: pointer;
    border-radius: 8px;
    padding: 10px 20px;
    border: 2px solid white;
    background: white;
    color: #667eea;
    font-weight: 700;
    font-size: 15px;
    transition: all 0.2s;
  }

  .quick-start-btn:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .step-hint {
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    font-style: italic;
    width: 100%;
    text-align: center;
    margin-top: 4px;
  }

  /* Quick Access Toolbar */
  .quick-access { display: flex; gap: 8px; flex-wrap: wrap; margin: 6px 0 8px 0; }
  .qa-btn { cursor: pointer; border-radius: 999px; padding: 6px 12px; border: 1px solid #e5e7eb; background: #f3f4f6; color: #111827; font-weight: 600; font-size: 13px; }
  .qa-btn:hover { background: #e5e7eb; }

  /* Slides Panel Styles */
  .slides-panel {
    width: 100%;
    max-width: 820px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  }
  .slides-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .slides-header h3 { margin: 0; color: #111827; }
  .badge { font-size: 12px; background: #f3f4f6; padding: 4px 8px; border-radius: 999px; color: #374151; }
  .slide-content { color: #111827; line-height: 1.6; }
  .slide-content ul { padding-left: 18px; margin: 0; }
  .dossier-medical .media-row { display: flex; align-items: center; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
  .doc-image { width: 320px; max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
  .pdf-link { color: #0ea5e9; text-decoration: none; font-weight: 600; }
  .pdf-link:hover { text-decoration: underline; }
  .slides-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
  .btn { cursor: pointer; border-radius: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; color: #111827; font-weight: 600; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: #0ea5e9; color: white; border-color: #0ea5e9; }
  .btn-primary:hover { background: #0284c7; }
  .btn-success { background: #10b981; color: white; border-color: #10b981; }
  .btn-success:hover { background: #059669; }

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

  .current-step {
    color: #007bff;
    font-size: 16px;
    margin: 8px 0;
    text-align: center;
  }

  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 10px;
  }

  .controls textarea {
    flex-grow: 1;
    padding: 12px;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    resize: vertical;
    min-height: 50px;
    max-height: 120px;
    font-family: inherit;
    font-size: 15px;
    transition: border-color 0.2s;
  }
  .controls textarea:focus {
    outline: none;
    border-color: #0ea5e9;
  }
  .controls textarea:disabled {
    background: #f9fafb;
    cursor: not-allowed;
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

  .message-loading {
    background-color: #f3f4f6;
    align-self: flex-start;
    padding: 12px 16px;
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #9ca3af;
    animation: typing 1.4s infinite;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
    30% { transform: translateY(-10px); opacity: 1; }
  }

  .empty-chat {
    text-align: center;
    color: #9ca3af;
    padding: 40px 20px;
    font-style: italic;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #991b1b;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 500;
  }

  .controls button {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    background: #0ea5e9;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 100px;
  }

  .controls button:hover:not(:disabled) {
    background: #0284c7;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  }

  .controls button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-loading {
    position: relative;
  }

  .avatar-container {
    width: 300px;
    height: 300px;
    border: 1px solid #ccc;
    overflow: hidden;
  }
  .avatar-disabled { opacity: 0.4; pointer-events: none; filter: grayscale(0.2); }

  /* Media Panel */
  .media-panel { margin-top: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .media-image { max-width: 360px; width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
  .media-caption { color: #111827; background: rgba(255,255,255,0.9); padding: 8px 12px; border-radius: 6px; font-size: 14px; text-align: center; font-weight: 500; }
   
  </style>
  