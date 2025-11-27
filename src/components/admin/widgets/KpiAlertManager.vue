<template>
  <Dialog
    v-model:visible="visible"
    :header="`Configurer les alertes - ${kpi?.label}`"
    :modal="true"
    :style="{ width: '600px' }"
    @hide="onClose"
  >
    <div v-if="kpi" class="flex flex-column gap-4">
      <!-- Activer/Désactiver les alertes -->
      <div class="flex align-items-center justify-content-between">
        <label class="font-semibold">Alertes actives</label>
        <InputSwitch v-model="alertConfig.enabled" />
      </div>

      <Divider />

      <template v-if="alertConfig.enabled">
        <!-- Type d'alerte -->
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Type d'alerte</label>
          <Dropdown
            v-model="alertConfig.type"
            :options="alertTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner un type"
            class="w-full"
          />
        </div>

        <!-- Seuil -->
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Seuil de déclenchement</label>
          <div class="p-inputgroup">
            <InputNumber
              v-model="alertConfig.threshold"
              :min="0"
              :max="alertConfig.type === 'percentage' ? 100 : undefined"
              class="w-full"
            />
            <span class="p-inputgroup-addon">
              {{ alertConfig.type === 'percentage' ? '%' : 'unités' }}
            </span>
          </div>
          <small class="text-600">
            {{ getThresholdHelp() }}
          </small>
        </div>

        <!-- Condition -->
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Condition</label>
          <Dropdown
            v-model="alertConfig.condition"
            :options="conditions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner une condition"
            class="w-full"
          />
        </div>

        <!-- Sévérité -->
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Niveau de sévérité</label>
          <SelectButton
            v-model="alertConfig.severity"
            :options="severities"
            optionLabel="label"
            optionValue="value"
          >
            <template #option="{ option }">
              <i :class="option.icon" :style="{ color: option.color }"></i>
              <span class="ml-2">{{ option.label }}</span>
            </template>
          </SelectButton>
        </div>

        <!-- Message personnalisé -->
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Message personnalisé (optionnel)</label>
          <Textarea
            v-model="alertConfig.customMessage"
            rows="3"
            placeholder="Ex: Attention, ce KPI nécessite votre attention"
            class="w-full"
          />
        </div>

        <!-- Notification -->
        <div class="flex align-items-center justify-content-between">
          <div>
            <label class="font-semibold">Envoyer une notification</label>
            <p class="text-600 text-sm m-0">Recevoir un email quand l'alerte se déclenche</p>
          </div>
          <InputSwitch v-model="alertConfig.notify" />
        </div>

        <!-- Prévisualisation -->
        <Divider />
        
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Prévisualisation</label>
          <Message :severity="alertConfig.severity" :closable="false">
            <i :class="getSeverityIcon()" class="mr-2"></i>
            {{ getPreviewMessage() }}
          </Message>
        </div>
      </template>
    </div>

    <template #footer>
      <Button
        label="Annuler"
        @click="visible = false"
        severity="secondary"
        outlined
      />
      <Button
        v-if="alertConfig.enabled"
        label="Supprimer l'alerte"
        @click="removeAlert"
        severity="danger"
        outlined
      />
      <Button
        label="Enregistrer"
        @click="saveAlert"
        icon="pi pi-check"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import SelectButton from 'primevue/selectbutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Button from 'primevue/button'

const props = defineProps({
  kpi: Object,
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'save', 'remove'])

const visible = ref(props.modelValue)

const alertConfig = ref({
  enabled: false,
  type: 'value',
  threshold: 0,
  condition: 'above',
  severity: 'warn',
  customMessage: '',
  notify: false
})

const alertTypes = [
  { label: 'Valeur absolue', value: 'value' },
  { label: 'Variation en %', value: 'percentage' },
  { label: 'Tendance', value: 'trend' }
]

const conditions = [
  { label: 'Au-dessus du seuil', value: 'above' },
  { label: 'En-dessous du seuil', value: 'below' },
  { label: 'Égal au seuil', value: 'equal' }
]

const severities = [
  {
    label: 'Info',
    value: 'info',
    icon: 'pi pi-info-circle',
    color: '#3b82f6'
  },
  {
    label: 'Attention',
    value: 'warn',
    icon: 'pi pi-exclamation-triangle',
    color: '#f59e0b'
  },
  {
    label: 'Erreur',
    value: 'error',
    icon: 'pi pi-times-circle',
    color: '#ef4444'
  },
  {
    label: 'Succès',
    value: 'success',
    icon: 'pi pi-check-circle',
    color: '#10b981'
  }
]

function getThresholdHelp() {
  switch (alertConfig.value.type) {
    case 'value':
      return `Déclencher l'alerte quand la valeur ${alertConfig.value.condition === 'above' ? 'dépasse' : 'descend sous'} ${alertConfig.value.threshold}`
    case 'percentage':
      return `Déclencher l'alerte quand la variation ${alertConfig.value.condition === 'above' ? 'augmente de' : 'diminue de'} ${alertConfig.value.threshold}%`
    case 'trend':
      return 'Déclencher l\'alerte en fonction de la tendance'
    default:
      return ''
  }
}

function getSeverityIcon() {
  const severity = severities.find(s => s.value === alertConfig.value.severity)
  return severity?.icon || 'pi pi-info-circle'
}

function getPreviewMessage() {
  if (alertConfig.value.customMessage) {
    return alertConfig.value.customMessage
  }
  
  const kpiLabel = props.kpi?.label || 'Ce KPI'
  const conditionText = alertConfig.value.condition === 'above' ? 'supérieure à' : 'inférieure à'
  
  switch (alertConfig.value.type) {
    case 'value':
      return `${kpiLabel}: valeur ${conditionText} ${alertConfig.value.threshold}`
    case 'percentage':
      return `${kpiLabel}: variation de ${alertConfig.value.threshold}%`
    case 'trend':
      return `${kpiLabel}: tendance ${alertConfig.value.condition === 'above' ? 'à la hausse' : 'à la baisse'}`
    default:
      return 'Alerte configurée'
  }
}

function saveAlert() {
  if (!alertConfig.value.enabled) {
    emit('remove', props.kpi?.id)
  } else {
    const alert = {
      ...alertConfig.value,
      icon: getSeverityIcon(),
      message: getPreviewMessage()
    }
    emit('save', props.kpi?.id, alert)
  }
  visible.value = false
}

function removeAlert() {
  alertConfig.value.enabled = false
  emit('remove', props.kpi?.id)
  visible.value = false
}

function onClose() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// Charger config existante si le KPI a déjà une alerte
watch(() => props.kpi, (kpi) => {
  if (kpi?.alert) {
    alertConfig.value = { ...kpi.alert, enabled: true }
  } else {
    alertConfig.value = {
      enabled: false,
      type: 'value',
      threshold: 0,
      condition: 'above',
      severity: 'warn',
      customMessage: '',
      notify: false
    }
  }
}, { immediate: true })
</script>
