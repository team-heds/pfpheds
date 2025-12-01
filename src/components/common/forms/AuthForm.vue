<template>
  <form @submit.prevent="$emit('submit')" class="w-full" novalidate>
    <div class="mb-4">
      <label :for="ids.email" class="sr-only">Email</label>
      <InputText
        :id="ids.email"
        type="email"
        :placeholder="emailPlaceholder"
        v-model="modelEmail"
        class="w-full"
        :class="{ 'p-invalid': emailError }"
        autocomplete="username"
        aria-required="true"
        :aria-invalid="emailError ? 'true' : 'false'"
        :aria-describedby="emailError ? ids.emailError : null"
      />
      <ErrorInline v-if="emailError" :id="ids.emailError" :message="emailErrorText" />
    </div>

    <div class="mb-4">
      <label :for="ids.password" class="sr-only">Mot de passe</label>
      <Password
        :id="ids.password"
        v-model="modelPassword"
        :placeholder="passwordPlaceholder"
        inputClass="w-full"
        class="w-full"
        :feedback="false"
        toggleMask
        autocomplete="current-password"
        aria-required="true"
        :aria-invalid="passwordError ? 'true' : 'false'"
        :aria-describedby="passwordError ? ids.passwordError : null"
      />
      <ErrorInline v-if="passwordError" :id="ids.passwordError" :message="passwordErrorText" />
    </div>

    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center">
        <Checkbox v-model="modelRemember" :inputId="ids.remember" binary class="mr-2" />
        <label :for="ids.remember" class="text-sm">Se souvenir de moi</label>
      </div>
      <button type="button" class="link-forgot" @click="$emit('reset-password')">
        Mot de passe oublié ?
      </button>
    </div>

    <Button
      type="submit"
      :label="submitLabel"
      class="w-full p-button-raised supabase-button"
      :loading="loading"
      :aria-busy="loading ? 'true' : 'false'"
      aria-label="Se connecter"
    />
  </form>
</template>

<script setup>
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ErrorInline from '@/components/common/feedback/ErrorInline.vue'

const props = defineProps({
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  remember: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  emailError: { type: Boolean, default: false },
  passwordError: { type: Boolean, default: false },
  emailErrorText: { type: String, default: "L'email est requis." },
  passwordErrorText: { type: String, default: 'Le mot de passe est requis.' },
  emailPlaceholder: { type: String, default: 'Email' },
  passwordPlaceholder: { type: String, default: 'Mot de passe' },
  submitLabel: { type: String, default: 'Se connecter' },
})

const emit = defineEmits(['update:email', 'update:password', 'update:remember', 'submit', 'reset-password'])

const modelEmail = computed({
  get: () => props.email,
  set: (v) => emit('update:email', v)
})
const modelPassword = computed({
  get: () => props.password,
  set: (v) => emit('update:password', v)
})
const modelRemember = computed({
  get: () => props.remember,
  set: (v) => emit('update:remember', v)
})

const ids = {
  email: 'auth-email',
  password: 'auth-password',
  remember: 'auth-remember'
}
</script>

<style scoped>
.link-forgot {
  background: transparent;
  border: 0;
  color: var(--text-600);
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.link-forgot:hover { opacity: 0.85; }
.link-forgot:focus-visible { outline: 2px solid #111; outline-offset: 2px; }

:deep(.p-inputtext),
:deep(.p-password-input) {
  border-radius: var(--input-radius);
  height: var(--input-height);
  font-size: var(--font-size-base);
}
:deep(.p-inputtext) { width: 100%; }
:deep(.p-password) { width: 100%; }
:deep(.p-password input.p-inputtext) { width: 100%; }

:deep(.p-inputtext:focus),
:deep(.p-password-input:focus) {
  box-shadow: var(--focus-ring);
}
</style>
