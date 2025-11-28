<template>
  <AdminLayout>
    <template #header>
      <PageHeader title="Gestion des Permissions" subtitle="Vue d'ensemble des permissions du système" icon="pi pi-lock" />
    </template>
    <div class="permissions-view">

      <div class="permissions-grid">
        <!-- Permissions PFP -->
        <div class="permission-card">
          <h3>📋 Permissions PFP</h3>
          <div class="permission-list">
            <div class="permission-item">
              <strong>page1.access</strong>
              <p>Accès à la section PFP complète</p>
            </div>
            <div class="permission-item">
              <strong>AdminPhysio</strong>
              <p>Administration filière Physiothérapie</p>
            </div>
            <div class="permission-item">
              <strong>EnseignantPhysio</strong>
              <p>Enseignant filière Physiothérapie</p>
            </div>
            <div class="permission-item">
              <strong>EtudiantPhysio</strong>
              <p>Étudiant filière Physiothérapie</p>
            </div>
          </div>
        </div>

        <!-- Permissions Académique -->
        <div class="permission-card">
          <h3>📚 Permissions Académique</h3>
          <div class="permission-list">
            <div class="permission-item">
              <strong>page2.access</strong>
              <p>Accès à la section Académique complète</p>
            </div>
            <div class="permission-item">
              <strong>AdminSoins</strong>
              <p>Administration filière Soins Infirmiers</p>
            </div>
            <div class="permission-item">
              <strong>EnseignantSoins</strong>
              <p>Enseignant filière Soins Infirmiers</p>
            </div>
            <div class="permission-item">
              <strong>RMSoins</strong>
              <p>Responsable de module Soins Infirmiers</p>
            </div>
          </div>
        </div>

        <!-- Permissions Système -->
        <div class="permission-card">
          <h3>⚙️ Permissions Système</h3>
          <div class="permission-list">
            <div class="permission-item">
              <strong>super.all</strong>
              <p>Super administrateur (tous les accès)</p>
            </div>
            <div class="permission-item">
              <strong>admin</strong>
              <p>Administrateur général</p>
            </div>
          </div>
        </div>
      </div>

      <div class="info-box">
        <i class="pi pi-info-circle"></i>
        <p><strong>Note:</strong> Pour modifier vos permissions, utilisez la page "Gestion des Rôles".</p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
</script>

<style scoped>
.permissions-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.permissions-header {
  text-align: center;
  margin-bottom: 3rem;
}

.permissions-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.permissions-header p {
  color: var(--text-color-secondary);
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.permission-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.permission-card h3 {
  margin-bottom: 1.5rem;
  color: var(--primary-color);
  border-bottom: 2px solid var(--surface-border);
  padding-bottom: 0.5rem;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.permission-item {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  border-left: 3px solid var(--primary-color);
}

.permission-item strong {
  display: block;
  color: var(--text-color);
  margin-bottom: 0.25rem;
  font-family: monospace;
}

.permission-item p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.info-box {
  background: var(--blue-50);
  border: 1px solid var(--blue-200);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-box i {
  color: var(--blue-500);
  font-size: 1.5rem;
}

.info-box p {
  margin: 0;
  color: var(--blue-900);
}
</style>
