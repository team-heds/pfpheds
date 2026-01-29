<template>
  <div class="tri-state-cell">
    <div class="flex align-items-center gap-1">
      <Button
        :icon="stateIcon"
        :class="stateClass"
        :severity="stateSeverity"
        size="small"
        rounded
        @click="cycleState"
        v-tooltip.top="stateTooltip"
      />
      <Button
        icon="pi pi-comment"
        :severity="comment ? 'info' : 'secondary'"
        size="small"
        rounded
        outlined
        @click="toggleCommentDialog"
        v-tooltip.top="comment ? 'Modifier le commentaire' : 'Ajouter un commentaire'"
      />
    </div>
    
    <Dialog 
      v-model:visible="showCommentDialog" 
      modal 
      :header="commentDialogTitle"
      :style="{ width: '30rem' }"
    >
      <div class="flex flex-column gap-3">
        <label for="comment-input" class="font-semibold">Commentaire :</label>
        <Textarea
          id="comment-input"
          v-model="localComment"
          rows="4"
          autoResize
          placeholder="Saisissez votre commentaire..."
        />
      </div>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" @click="cancelComment" text />
        <Button label="Supprimer" icon="pi pi-trash" @click="deleteComment" severity="danger" text v-if="comment" />
        <Button label="Enregistrer" icon="pi pi-check" @click="saveComment" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'

export default defineComponent({
  name: 'TriStateCell',
  components: {
    Button,
    Dialog,
    Textarea
  },
  props: {
    value: {
      type: [Boolean, null],
      default: null
    },
    comment: {
      type: String,
      default: ''
    }
  },
  emits: ['update:value', 'update:comment'],
  data() {
    return {
      showCommentDialog: false,
      localComment: ''
    }
  },
  computed: {
    stateIcon() {
      if (this.value === null) return 'pi pi-circle'
      if (this.value === false) return 'pi pi-times'
      return 'pi pi-check'
    },
    stateClass() {
      if (this.value === null) return 'state-empty'
      if (this.value === false) return 'state-cross'
      return 'state-check'
    },
    stateSeverity() {
      if (this.value === null) return 'secondary'
      if (this.value === false) return 'danger'
      return 'success'
    },
    stateTooltip() {
      if (this.value === null) return 'Vide (cliquez pour marquer comme croix)'
      if (this.value === false) return 'Croix (cliquez pour marquer comme validé)'
      return 'Validé (cliquez pour réinitialiser)'
    },
    commentDialogTitle() {
      if (this.value === null) return 'Commentaire'
      if (this.value === false) return 'Commentaire - Non conforme'
      return 'Commentaire - Validé'
    }
  },
  methods: {
    cycleState() {
      if (this.value === null) {
        this.$emit('update:value', false)
      } else if (this.value === false) {
        this.$emit('update:value', true)
      } else {
        this.$emit('update:value', null)
      }
    },
    toggleCommentDialog() {
      this.localComment = this.comment || ''
      this.showCommentDialog = true
    },
    saveComment() {
      this.$emit('update:comment', this.localComment)
      this.showCommentDialog = false
    },
    cancelComment() {
      this.localComment = ''
      this.showCommentDialog = false
    },
    deleteComment() {
      this.$emit('update:comment', '')
      this.localComment = ''
      this.showCommentDialog = false
    }
  }
})
</script>

<style scoped>
.tri-state-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-empty {
  opacity: 0.6;
}

.state-cross {
  animation: shake 0.3s ease-in-out;
}

.state-check {
  animation: pulse 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
