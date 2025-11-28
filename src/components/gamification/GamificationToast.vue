<template>
  <Transition name="toast">
    <div v-if="visible" class="gamification-toast" :class="`toast-${type}`">
      <div class="toast-icon">
        <i :class="iconClass"></i>
      </div>
      <div class="toast-content">
        <h4 class="toast-title">{{ title }}</h4>
        <p class="toast-message">{{ message }}</p>
        <div v-if="xp" class="toast-xp">
          <i class="pi pi-bolt"></i>
          <span>+{{ xp }} XP</span>
        </div>
      </div>
      <button class="toast-close" @click="close">
        <i class="pi pi-times"></i>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  type: {
    type: String,
    default: 'info' // 'success', 'info', 'warning', 'error', 'badge', 'levelup', 'quest', 'challenge'
  },
  title: String,
  message: String,
  xp: Number,
  duration: {
    type: Number,
    default: 5000
  },
  autoClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const visible = ref(props.modelValue)
let timeout = null

const iconClass = computed(() => {
  const icons = {
    success: 'pi pi-check-circle',
    info: 'pi pi-info-circle',
    warning: 'pi pi-exclamation-triangle',
    error: 'pi pi-times-circle',
    badge: 'pi pi-shield',
    levelup: 'pi pi-star',
    quest: 'pi pi-compass',
    challenge: 'pi pi-flag'
  }
  return icons[props.type] || icons.info
})

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.autoClose) {
    startAutoClose()
  }
})

const startAutoClose = () => {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    close()
  }, props.duration)
}

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
  if (timeout) clearTimeout(timeout)
}

onMounted(() => {
  if (visible.value && props.autoClose) {
    startAutoClose()
  }
})
</script>

<style scoped>
.gamification-toast {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  border-left: 4px solid;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.toast-message {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

.toast-xp {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #95a5a6;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  color: #7f8c8d;
}

/* Toast type styles */
.toast-success {
  border-left-color: #27ae60;
}

.toast-success .toast-icon {
  background: #d5f4e6;
  color: #27ae60;
}

.toast-info {
  border-left-color: #3498db;
}

.toast-info .toast-icon {
  background: #d6eaf8;
  color: #3498db;
}

.toast-warning {
  border-left-color: #f39c12;
}

.toast-warning .toast-icon {
  background: #fef5e7;
  color: #f39c12;
}

.toast-error {
  border-left-color: #e74c3c;
}

.toast-error .toast-icon {
  background: #fadbd8;
  color: #e74c3c;
}

.toast-badge {
  border-left-color: #9b59b6;
  background: linear-gradient(135deg, #f8f9fa 0%, #e8eaf6 100%);
}

.toast-badge .toast-icon {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.toast-levelup {
  border-left-color: #f39c12;
  background: linear-gradient(135deg, #fff9e6 0%, #fef5e7 100%);
}

.toast-levelup .toast-icon {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
  animation: pulse 1.5s ease-in-out infinite;
}

.toast-quest {
  border-left-color: #3498db;
  background: linear-gradient(135deg, #ebf5fb 0%, #d6eaf8 100%);
}

.toast-quest .toast-icon {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.toast-challenge {
  border-left-color: #e74c3c;
  background: linear-gradient(135deg, #fdedec 0%, #fadbd8 100%);
}

.toast-challenge .toast-icon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

/* Animations */
.toast-enter-active {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@media (max-width: 768px) {
  .gamification-toast {
    top: 70px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
