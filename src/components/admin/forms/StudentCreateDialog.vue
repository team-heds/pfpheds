<template>
  <Dialog 
    :visible="visible"
    @update:visible="(val) => emit('update:visible', val)"
    modal 
    header="Nouvel étudiant"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
    @hide="closeDialog"
  >
    <div class="p-fluid">
      <Toast />
      
      <!-- Form -->
      <form id="student-create-form" class="app-form" @submit.prevent="createStudent">
        <FormSection title="Identité et inscription" description="Renseignez les informations principales de l’étudiant." icon="pi pi-user">
        <div class="grid">
        <!-- Prénom -->
        <FormField for-id="forname" label="Prénom" required :error="errors.forname" v-slot="field">
          <InputText 
            id="forname" 
            v-model="formData.forname" 
            required 
            :class="{ 'p-invalid': errors.forname }"
            :aria-invalid="field.invalid"
            :aria-describedby="field.describedby"
          />
        </FormField>

        <!-- Nom -->
        <FormField for-id="family_name" label="Nom" required :error="errors.family_name" v-slot="field">
          <InputText 
            id="family_name" 
            v-model="formData.family_name" 
            required
            :class="{ 'p-invalid': errors.family_name }"
            :aria-invalid="field.invalid"
            :aria-describedby="field.describedby"
          />
        </FormField>

        <!-- Email -->
        <FormField for-id="email" label="Email" required :error="errors.email" v-slot="field">
          <InputText 
            id="email" 
            v-model="formData.email" 
            type="email"
            required
            :class="{ 'p-invalid': errors.email }"
            autocomplete="email"
            :aria-invalid="field.invalid"
            :aria-describedby="field.describedby"
          />
        </FormField>

        <!-- Classe -->
        <FormField for-id="class" label="Classe" required :error="errors.class" v-slot="field">
          <Dropdown
            id="class"
            v-model="formData.class"
            :options="classOptions"
            placeholder="Sélectionner une classe"
            :class="{ 'p-invalid': errors.class }"
            :aria-invalid="field.invalid"
            :aria-describedby="field.describedby"
          />
        </FormField>

        <!-- SAE (Cas Particulier) -->
        <div class="field col-12 md:col-6">
          <div class="flex align-items-center">
            <Checkbox 
              id="sae" 
              v-model="formData.sae" 
              :binary="true"
            />
            <label for="sae" class="ml-2 font-semibold">SAE (Cas Particulier)</label>
          </div>
        </div>

        <!-- Cas Particulier (texte) -->
        <div class="field col-12 md:col-6">
          <label for="cas_particulier" class="font-semibold">Détails cas particulier</label>
          <InputText 
            id="cas_particulier" 
            v-model="formData.cas_particulier"
            placeholder="Optionnel"
          />
        </div>
        </div>
        </FormSection>
      </form>
    </div>

    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="closeDialog" :disabled="saving" />
      <Button 
        label="Créer" 
        icon="pi pi-check" 
        @click="createStudent" 
        :loading="saving"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'
import FormSection from '@/components/common/forms/FormSection.vue'
import FormField from '@/components/common/forms/FormField.vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'student-created'])

const toast = useToast()
const saving = ref(false)
const errors = ref({})

const classOptions = ['BA22', 'BA23', 'BA24', 'BA25']

const formData = ref({
  forname: '',
  family_name: '',
  email: '',
  class: '',
  sae: false,
  cas_particulier: ''
})

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.forname?.trim()) {
    errors.value.forname = 'Le prénom est requis'
    isValid = false
  }

  if (!formData.value.family_name?.trim()) {
    errors.value.family_name = 'Le nom est requis'
    isValid = false
  }

  if (!formData.value.email?.trim()) {
    errors.value.email = 'L\'email est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = 'Email invalide'
    isValid = false
  }

  if (!formData.value.class) {
    errors.value.class = 'La classe est requise'
    isValid = false
  }

  return isValid
}

const createStudent = async () => {
  if (!validateForm()) {
    return
  }

  saving.value = true

  try {
    // NOTE: La création d'un user_profile nécessite normalement une inscription complète
    // avec Supabase Auth. Pour l'instant, on va créer uniquement dans StudentsPhysio
    // et afficher un message à l'admin
    
    // Vérifier si l'email existe déjà
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('email', formData.value.email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingProfile) {
      toast.add({
        severity: 'warn',
        summary: 'Utilisateur existant',
        detail: 'Un utilisateur avec cet email existe déjà. Utilisez la fonction "Modifier" pour le mettre à jour.',
        life: 5000
      })
      return
    }

    // Émettre l'événement AVANT de fermer (même si création non complète)
    emit('student-created')
    
    // Attendre que le parent traite l'événement
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Pour créer un nouvel étudiant, il faut passer par Supabase Auth
    // Afficher un message informatif
    toast.add({
      severity: 'info',
      summary: 'Création d\'étudiant',
      detail: 'La création d\'un nouvel étudiant nécessite une inscription complète via Supabase Auth. Veuillez demander à l\'étudiant de s\'inscrire via la page d\'inscription.',
      life: 8000
    })

    closeDialog()

  } catch (error) {
    console.error('Erreur lors de la création:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Impossible de créer l\'étudiant',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  formData.value = {
    forname: '',
    family_name: '',
    email: '',
    class: '',
    sae: false,
    cas_particulier: ''
  }
  errors.value = {}
}

const closeDialog = () => {
  emit('update:visible', false)
  resetForm()
}
</script>

<style scoped>
.p-fluid .field {
  margin-bottom: 1rem;
}

.p-invalid {
  border-color: #e24c4c;
}

.p-error {
  color: #e24c4c;
  font-size: 0.875rem;
}
</style>
