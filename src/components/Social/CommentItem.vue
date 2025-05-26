<template>
  <div class="comment-card ml-2 mb-2 p-2 border-round bg-gray-50">
    <div class="comment-author font-bold mb-1">
      {{ comment.Author || 'Anonyme' }}
    </div>
    <div class="comment-content mb-1" v-html="comment.Content"></div>
    <div class="comment-date text-xs text-secondary mb-1">
      {{ formatTimestamp(comment.Timestamp) }}
    </div>
    <div class="flex items-center gap-2 mb-1">
      <button @click="toggleLike" class="p-button p-button-text p-button-sm">
        <i :class="['pi', isLiked ? 'pi-heart-fill text-pink-500' : 'pi-heart']"></i>
        <span>{{ likeCount }}</span>
      </button>
      <button @click="showReply = !showReply" class="p-button p-button-text p-button-sm">Répondre</button>
    </div>
    <div v-if="showReply" class="reply-form mt-2">
      <textarea v-model="replyContent" placeholder="Votre réponse..." rows="2" class="w-full p-2 border-round"></textarea>
      <button @click="submitReply" class="p-button p-button-sm mt-2">Envoyer</button>
    </div>
    <!-- Affichage récursif des sous-commentaires -->
    <div v-if="repliesArray.length">
      <CommentItem
        v-for="reply in repliesArray"
        :key="reply.id"
        :comment="reply"
        :comment-id="reply.id"
        :parent-path="`${parentPath}/replies/${commentId}`"
        :current-user="currentUser"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, defineComponent, watch } from 'vue';
import { dbRef, update, push, serverTimestamp } from '@/firebase';
import CommentItem from './CommentItem.vue';

export default defineComponent({
  name: 'CommentItem',
  props: {
    comment: { type: Object, required: true },
    commentId: { type: String, required: true },
    parentPath: { type: String, required: true },
    currentUser: { type: Object, required: false },
  },
  components: { CommentItem },
  setup(props) {
    const showReply = ref(false);
    const replyContent = ref('');
    const isLiked = ref(false);
    const likeCount = ref(0);

    // Pour la récursivité
    const repliesArray = computed(() => {
      if (!props.comment.replies) return [];
      return Object.entries(props.comment.replies).map(([id, reply]) => ({
        id,
        ...reply
      }));
    });

    function checkLikeStatus() {
      if (props.comment.likes && props.currentUser) {
        isLiked.value = !!props.comment.likes[props.currentUser.uid];
        likeCount.value = Object.values(props.comment.likes).filter(v => v === true).length;
      } else {
        isLiked.value = false;
        likeCount.value = 0;
      }
    }

    function toggleLike() {
      if (!props.currentUser) return alert('Vous devez être connecté pour liker.');
      const likesRef = dbRef(null, `${props.parentPath}/replies/${props.commentId}/likes`);
      if (isLiked.value) {
        const updates = {};
        updates[props.currentUser.uid] = null;
        update(likesRef, updates);
        isLiked.value = false;
        if (props.comment.likes && props.comment.likes[props.currentUser.uid]) {
          likeCount.value--;
        }
      } else {
        const updates = {};
        updates[props.currentUser.uid] = true;
        update(likesRef, updates);
        isLiked.value = true;
        if (!props.comment.likes || !props.comment.likes[props.currentUser.uid]) {
          likeCount.value++;
        }
      }
    }

    function submitReply() {
      if (!replyContent.value.trim()) {
        alert('Veuillez écrire quelque chose avant de répondre.');
        return;
      }
      if (!props.currentUser) {
        alert('Vous devez être connecté pour répondre.');
        return;
      }
      const newReply = {
        IdUser: props.currentUser.uid,
        Author: props.currentUser.email ? props.currentUser.email.split('@')[0] : 'Utilisateur',
        Content: replyContent.value,
        Timestamp: serverTimestamp(),
      };
      const repliesRef = dbRef(null, `${props.parentPath}/replies/${props.commentId}/replies`);
      push(repliesRef, newReply);
      replyContent.value = '';
      showReply.value = false;
    }

    function formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
    }

    watch(
      () => props.comment.likes,
      () => checkLikeStatus(),
      { immediate: true }
    );
    watch(
      () => props.currentUser,
      () => checkLikeStatus(),
      { immediate: true }
    );

    return {
      showReply,
      replyContent,
      isLiked,
      likeCount,
      toggleLike,
      submitReply,
      formatTimestamp,
      repliesArray
    };
  }
});
</script>

<style scoped>
.comment-card {
  background: #f8f9fa;
  border-radius: 1.2rem;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
}
</style>
