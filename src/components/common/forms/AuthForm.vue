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

    <div class="auth-form__options mb-4">
      <div class="auth-form__remember">
        <Checkbox v-model="modelRemember" :inputId="ids.remember" binary class="mr-2" />
        <label :for="ids.remember" class="text-sm">Se souvenir de moi</label>
      </div>
      <button
        type="button"
        class="link-forgot"
        :disabled="resetLoading"
        @click="$emit('reset-password')"
      >
        {{ resetLoading ? 'Envoi en cours...' : 'Mot de passe oublié ?' }}
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
  resetLoading: { type: Boolean, default: false },
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
  color: var(--app-color-text);
  font-weight: var(--app-font-weight-bold);
  cursor: pointer;
  padding: 0;
}
.link-forgot:hover { color:var(--app-color-brand); }
.link-forgot:disabled { opacity: 0.5; cursor: not-allowed; }
.link-forgot:focus-visible { outline:max(2px,.1875rem) solid var(--app-color-focus); outline-offset:var(--app-space-1); }

.auth-form__options { display:flex; align-items:center; justify-content:space-between; gap:var(--app-space-4); }
.auth-form__remember { display:flex; align-items:center; min-width:0; }

:deep(.p-inputtext),
:deep(.p-password-input) {
  border-radius: var(--app-control-radius);
  height: var(--app-control-height-lg);
  font-size: var(--app-font-size-md);
}
:deep(.p-inputtext) { width: 100%; }
:deep(.p-password) { width: 100%; }
:deep(.p-password input.p-inputtext) { width: 100%; }

:deep(.p-inputtext:focus),
:deep(.p-password-input:focus) {
  box-shadow: var(--app-shadow-focus);
}

@media(max-width:40rem){
  .auth-form__options{align-items:flex-start;flex-direction:column;gap:var(--app-space-3)}
  .link-forgot{min-height:var(--app-touch-target);display:inline-flex;align-items:center;text-align:start}
}
</style>
