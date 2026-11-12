<template>
  <MobileStackScreen title="Mon dossier" @back="emit('close')">
    <!-- Dossier de formation existant (informations, résultat de la votation,
         stages, critères, documents à déposer), affiché tel quel dans l'application. -->
    <div class="m-record">
      <ProfileInfo embed />
    </div>
  </MobileStackScreen>
</template>

<script setup>
import MobileStackScreen from '@/mobile/ui/MobileStackScreen.vue'
import ProfileInfo from '@/components/user/details/ProfileInfo.vue'

const emit = defineEmits(['close'])
</script>

<style scoped>
.m-record {
  margin: 0 -8px;
}
</style>
