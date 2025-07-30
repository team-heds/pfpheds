<template>
  <div class="files-view">
    <Navbar />
    <div class="p-card p-mt-4">
      <div class="p-card-header">
        <h2><i class="pi pi-folder"></i> Gestionnaire de Fichiers</h2>
      </div>
      <div class="p-card-body">
        <p>Interface de gestion des fichiers en cours de développement.</p>
        <div class="p-grid">
          <div class="p-col-12 p-md-6">
            <h3>Fonctionnalités à venir :</h3>
            <ul>
              <li>Upload de fichiers</li>
              <li>Organisation en dossiers</li>
              <li>Partage de fichiers</li>
              <li>Prévisualisation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '@/components/common/utils/Navbar.vue';
</script>

<style scoped>
.files-view {
  padding: 20px;
}

.p-card {
  max-width: 800px;
  margin: 0 auto;
}

.p-card-header h2 {
  margin: 0;
  color: var(--primary-color);
}

.p-card-header i {
  margin-right: 10px;
}
</style>
