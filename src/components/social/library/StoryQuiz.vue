<template>
  <div class="story-quiz">
    <div class="quiz-question">{{ question }}</div>
    <div class="quiz-options">
      <button
        v-for="(option, idx) in options"
        :key="idx"
        @click="answer(idx)"
        :disabled="answeredIdx !== null"
        :class="{
          selected: answeredIdx === idx,
          correct: answeredIdx !== null && answerIdx === idx,
          wrong: answeredIdx !== null && answeredIdx === idx && answerIdx !== idx
        }"
      >
        <span>{{ option }}</span>
        <span v-if="answeredIdx !== null && answerIdx === idx" class="quiz-correct">✔</span>
      </button>
    </div>
    <div v-if="answeredIdx !== null" class="quiz-feedback">
      <span v-if="answeredIdx === answerIdx" class="good">Bonne réponse !</span>
      <span v-else class="bad">Mauvaise réponse.</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StoryQuiz',
  props: {
    question: { type: String, required: true },
    options: { type: Array, required: true },
    answerIdx: { type: Number, default: null }
  },
  data() {
    return {
      answeredIdx: null
    }
  },
  methods: {
    answer(idx) {
      if (this.answeredIdx !== null) return;
      this.answeredIdx = idx;
      this.$emit('answered', idx);
    }
  }
}
</script>

<style scoped>
.story-quiz {
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  border-radius: 2.3rem;
  box-shadow: 0 6px 28px 0 rgba(120, 120, 220, 0.11);
  padding: 1.1rem 0.5rem 1.3rem 0.5rem;
  text-align: center;
  margin: 1.2rem auto 0.7rem auto;
  max-width: 430px;
  width: 98vw;
  transition: box-shadow 0.18s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.quiz-question {
  background: #fff;
  border-radius: 1.3rem;
  box-shadow: 0 2px 12px 0 rgba(120,120,180,0.08);
  font-size: 1.21rem;
  font-weight: 800;
  margin-bottom: 1.7rem;
  color: #1e293b;
  letter-spacing: 0.01em;
  padding: 1.1rem 0.7rem 1.1rem 0.7rem;
  width: 96%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.35;
  word-break: break-word;
} 
.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
  width: 100%;
  margin: 0 auto;
  max-width: 100%;
} 
.quiz-options button {
  width: 100%;
  max-width: 400px;
  padding: 1.1rem 0.7rem;
  border-radius: 2rem;
  border: 1.5px solid #e0e7ff;
  background: #fff;
  font-size: 1.18rem;
  color: #2d2a5a;
  font-weight: 700;
  box-shadow: 0 4px 18px 0 rgba(80, 120, 200, 0.10);
  cursor: pointer;
  margin: 0 auto 0.1rem auto;
  outline: none;
  text-align: center;
  word-break: break-word;
  white-space: normal;
  line-height: 1.38;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
  user-select: none;
  position: relative;
  will-change: transform;
}
.quiz-options button:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px 0 rgba(80, 120, 200, 0.07);
}
.quiz-options button.selected {
  background: #eef2ff;
  border-color: #a5b4fc;
  color: #3730a3;
  font-weight: 900;
}
.quiz-options button.correct {
  background: #d1fae5;
  border-color: #22d3ee;
  color: #047857;
  font-weight: 900;
}
.quiz-options button.wrong {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}
.quiz-options button:disabled {
  background: #f3f4f6;
  color: #b5b5b5;
  border-color: #e0e7ff;
  cursor: default;
  opacity: 0.97;
}
.quiz-options button:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #818cf8;
  color: #312e81;
  box-shadow: 0 6px 24px 0 rgba(80, 120, 200, 0.13);
}
.quiz-options button:disabled {
  background: #f3f4f6;
  color: #b5b5b5;
  border-color: #e0e7ff;
  cursor: default;
}
.quiz-options button.selected {
  background: #ede9fe;
  border-color: #a78bfa;
  color: #6d28d9;
}
.quiz-options button.correct {
  background: #bbf7d0;
  border-color: #22d3ee;
  color: #047857;
  font-weight: 800;
}
.quiz-options button.wrong {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}
.quiz-options .quiz-correct {
  margin-left: 0.5em;
  color: #22d3ee;
  font-size: 1.2em;
  flex-shrink: 0;
}
.quiz-feedback {
  margin-top: 1.2rem;
  font-size: 1.13rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.quiz-feedback .good {
  color: #10b981;
  background: #d1fae5;
  border-radius: 0.7em;
  padding: 0.18em 0.8em;
}
.quiz-feedback .bad {
  color: #ef4444;
  background: #fee2e2;
  border-radius: 0.7em;
  padding: 0.18em 0.8em;
}
@media (max-width: 600px) {
  .story-quiz {
    padding: 1.15rem 0.4rem 0.75rem 0.4rem;
    font-size: 1rem;
  }
  .quiz-options button {
    min-width: 110px;
    font-size: 0.99rem;
    padding: 0.6rem 0.6rem;
  }
}
</style>
