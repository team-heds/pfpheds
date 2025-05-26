<template>
  <div class="story-poll">
    <div class="poll-question">{{ question }}</div>
    <div class="poll-options">
      <button v-for="(option, idx) in options" :key="idx" @click="vote(idx)" :disabled="votedIdx !== null">
        <span>{{ option }}</span>
        <span v-if="votedIdx !== null"> - {{ votes[idx] }} vote{{ votes[idx] > 1 ? 's' : '' }}</span>
      </button>
    </div>
    <div v-if="votedIdx !== null" class="poll-thanks">Merci pour votre vote !</div>
  </div>
</template>

<script>
export default {
  name: 'StoryStickerPoll',
  props: {
    question: { type: String, required: true },
    options: { type: Array, required: true }
  },
  data() {
    return {
      votes: Array(this.options.length).fill(0),
      votedIdx: null
    }
  },
  methods: {
    vote(idx) {
      if (this.votedIdx !== null) return;
      this.votes[idx]++;
      this.votedIdx = idx;
      this.$emit('voted', idx);
    }
  }
}
</script>

<style scoped>
.story-poll {
  background: #f6fff4;
  border-radius: 1.2rem;
  padding: 1.2rem 1.2rem 0.8rem 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(60,255,120,0.07);
  text-align: center;
}
.poll-question {
  font-size: 1.08rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.poll-options button {
  margin: 0.3rem 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 1rem;
  border: 2px solid #36d399;
  background: #e9fff3;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s, border 0.15s;
}
.poll-options button:disabled {
  background: #caffdf;
  color: #888;
  border-color: #aaf5c2;
}
.poll-thanks {
  font-size: 1rem;
  color: #36d399;
  margin-top: 0.7rem;
}
</style>
