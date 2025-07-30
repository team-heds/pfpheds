<template>
  <div class="stats-overlay" @click.self="$emit('close')">
    <div class="stats-modal">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <div class="stat-title">Statistiques avancées</div>
      <div class="stat-row stat-separator">
        <strong>Vues :</strong>
        <span class="stat-badge">{{ viewsCount }}</span>
      </div>
      <div class="stat-row">
        <strong>Taux de réaction :</strong>
        <span class="stat-badge">{{ reactionRate }}%</span>
      </div>
      <div v-if="viewersInfo.length" class="stat-row">
        <strong>Viewers :</strong>
        <span class="stat-list">
          <span v-for="viewer in sortedViewers" :key="viewer && viewer.uid ? viewer.uid : 'unknown'" class="stat-user">
            <img :src="(viewer && viewer.photoURL) ? viewer.photoURL : defaultAvatar" class="stat-avatar"/>
            {{ (viewer && viewer.displayName) ? viewer.displayName : (viewer && viewer.uid) ? viewer.uid : 'Inconnu' }}
          </span>
        </span>
      </div>
      <div v-else class="stat-row stat-empty">Aucun viewer pour l’instant.</div>
      <div v-if="reactionsInfo.length" class="stat-row">
        <strong>Réactions :</strong>
        <span class="stat-list">
          <span v-for="reaction in sortedReactions" :key="reaction && reaction.uid ? reaction.uid : 'unknown'" class="stat-user">
            <img :src="(reaction && reaction.photoURL) ? reaction.photoURL : defaultAvatar" class="stat-avatar"/>
            <span class="emoji-badge">{{ reaction && reaction.emoji ? reaction.emoji : '' }}</span>
            {{ (reaction && reaction.displayName) ? reaction.displayName : (reaction && reaction.uid) ? reaction.uid : 'Inconnu' }}
          </span>
        </span>
      </div>
      <div v-else class="stat-row stat-empty">Aucune réaction pour l’instant.</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StoryStats',
  props: {
    viewsCount: { type: Number, required: true },
    reactionRate: { type: Number, required: true },
    viewersInfo: { type: Array, required: true },
    reactionsInfo: { type: Array, required: true },
    sortedViewers: { type: Array, required: true },
    sortedReactions: { type: Array, required: true },
    defaultAvatar: { type: String, required: true }
  }
}
</script>

<style scoped>
.stats-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stats-modal {
  background: var(--surface-card, #fff);
  border-radius: 8px;
  padding: 18px 16px 18px 16px;
  min-width: 320px;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  color: var(--primary-color, #1976d2);
  font-size: 2rem;
  cursor: pointer;
  transition: color 0.2s;
}
.close-btn:hover {
  color: var(--primary-color-hover, #0d47a1);
}
.stat-title {
  font-weight: bold;
  font-size: 1.18rem;
  color: var(--primary-color, #2196f3);
  margin-bottom: 10px;
}
.stat-row {
  margin-bottom: 10px;
  font-size: 1.03rem;
  width: 100%;
}
.stat-separator {
  border-bottom: 1px solid var(--surface-border, #e0e0e0);
  margin-bottom: 8px;
  padding-bottom: 7px;
}
.stat-badge {
  background: #e3f2fd;
  color: var(--primary-color, #1976d2);
  border-radius: 12px;
  padding: 2px 10px;
  font-weight: bold;
  margin-left: 6px;
  margin-right: 6px;
  font-size: 1rem;
  display: inline-block;
}
.emoji-badge {
  background: #fffde7;
  color: #ff9800;
  border-radius: 8px;
  padding: 2px 6px;
  font-size: 1.1rem;
  margin-right: 5px;
  border: 1px solid #ffe0b2;
  display: inline-block;
}
.stat-empty {
  color: #aaa;
  font-style: italic;
}
.stat-list {
  margin-left: 8px;
  color: #333;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;
}
.stat-user {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-right: 13px;
  margin-bottom: 4px;
  border-radius: 8px;
  padding: 2px 7px 2px 2px;
  background: transparent;
  transition: background 0.18s;
}
.stat-user:hover {
  background: var(--surface-50, #f6f8fa);
}
.stat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--surface-border, #b3c6e0);
  margin-right: 7px;
  transition: box-shadow 0.2s;
}
.stat-avatar:hover {
  box-shadow: 0 0 0 2px var(--primary-color, #2196f3);
}
@media (max-width: 600px) {
  .stats-modal {
    min-width: unset;
    padding: 10px 3vw 14px 3vw;
  }
  .stat-avatar {
    width: 30px;
    height: 30px;
  }
}
</style>