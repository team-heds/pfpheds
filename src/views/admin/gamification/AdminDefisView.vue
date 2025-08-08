<template>
  <div class="admin-defis">
    <h2 class="title">
      <i class="pi pi-flag"></i>
      Gestion des Défis Gamification
    </h2>

    <!-- Create / Edit Form -->
    <div class="card">
      <h3>{{ editId ? 'Modifier un défi' : 'Créer un nouveau défi' }}</h3>
      <form @submit.prevent="onSubmit" class="defi-form">
        <div class="form-grid">
          <div class="form-field">
            <label>Titre</label>
            <input v-model="form.title" type="text" required placeholder="Ex: Semaine de la collaboration" />
          </div>
          <div class="form-field">
            <label>Type</label>
            <select v-model="form.type">
              <option value="general">Général</option>
              <option value="streak">Série</option>
              <option value="house">Maison</option>
              <option value="bonus">Bonus</option>
            </select>
          </div>
          <div class="form-field">
            <label>Maison ciblée</label>
            <select v-model="form.targetHouse">
              <option value="all">Toutes</option>
              <option value="Harmonis">Harmonis</option>
              <option value="Elaris">Elaris</option>
              <option value="Doloris">Doloris</option>
              <option value="Solencia">Solencia</option>
            </select>
          </div>
          <div class="form-field">
            <label>Récompense (XP)</label>
            <input v-model.number="form.reward" type="number" min="0" step="10" />
          </div>
          <div class="form-field">
            <label>Échéance</label>
            <input v-model="form.deadline" type="date" />
          </div>
          <div class="form-field checkbox">
            <label>
              <input v-model="form.active" type="checkbox" />
              Actif
            </label>
          </div>
          <div class="form-field full">
            <label>Description / Objectif</label>
            <textarea v-model="form.description" rows="3" placeholder="Décrivez le défi et l'objectif à atteindre..."></textarea>
          </div>
          <div class="form-field full">
            <label>Objectif (courte phrase)</label>
            <input v-model="form.goal" type="text" placeholder="Ex: Participer à 3 activités de groupe" />
          </div>
        </div>
        <div class="actions">
          <button type="submit" class="btn primary">
            <i class="pi" :class="editId ? 'pi-save' : 'pi-plus'" />
            {{ editId ? 'Enregistrer' : 'Créer le défi' }}
          </button>
          <button v-if="editId" type="button" class="btn" @click="resetForm">
            Annuler
          </button>
        </div>
      </form>
    </div>

    <!-- Existing challenges list -->
    <div class="card">
      <div class="list-header">
        <h3><i class="pi pi-list"></i> Défis existants</h3>
        <button class="btn" @click="loadDefis"><i class="pi pi-refresh"></i> Actualiser</button>
      </div>
      <div v-if="loading" class="empty">Chargement...</div>
      <div v-else-if="defis.length === 0" class="empty">Aucun défi pour le moment.</div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Type</th>
              <th>Maison</th>
              <th>XP</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in defis" :key="d.id">
              <td>{{ d.title }}</td>
              <td>{{ d.type }}</td>
              <td>{{ d.targetHouse || 'all' }}</td>
              <td>{{ d.reward || 0 }}</td>
              <td>{{ d.deadline ? new Date(d.deadline).toLocaleDateString() : '-' }}</td>
              <td>
                <span class="status" :class="d.active ? 'active' : 'inactive'">{{ d.active ? 'Actif' : 'Inactif' }}</span>
              </td>
              <td class="row-actions">
                <button class="icon-btn" title="Éditer" @click="startEdit(d)"><i class="pi pi-pencil"></i></button>
                <button class="icon-btn" :title="d.active ? 'Désactiver' : 'Activer'" @click="toggleActive(d)">
                  <i class="pi" :class="d.active ? 'pi-times' : 'pi-check'" />
                </button>
                <button class="icon-btn danger" title="Supprimer" @click="remove(d)"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createDefi, listDefis, updateDefi, deleteDefi } from '@/service/defisService'

const loading = ref(false)
const defis = ref([])
const editId = ref(null)

const form = ref({
  title: '',
  description: '',
  type: 'general',
  goal: '',
  reward: 0,
  deadline: '',
  targetHouse: 'all',
  active: true,
})

const resetForm = () => {
  editId.value = null
  form.value = {
    title: '',
    description: '',
    type: 'general',
    goal: '',
    reward: 0,
    deadline: '',
    targetHouse: 'all',
    active: true,
  }
}

const loadDefis = async () => {
  loading.value = true
  try {
    defis.value = await listDefis()
    // sort by createdAt desc
    defis.value.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  try {
    if (editId.value) {
      await updateDefi(editId.value, { ...form.value })
    } else {
      await createDefi({ ...form.value })
    }
    await loadDefis()
    resetForm()
  } catch (e) {
    console.error('Erreur lors de la sauvegarde du défi', e)
  }
}

const startEdit = (d) => {
  editId.value = d.id
  form.value = {
    title: d.title || '',
    description: d.description || '',
    type: d.type || 'general',
    goal: d.goal || '',
    reward: d.reward || 0,
    deadline: d.deadline ? d.deadline.substring(0, 10) : '',
    targetHouse: d.targetHouse || 'all',
    active: d.active !== false,
  }
}

const toggleActive = async (d) => {
  try {
    await updateDefi(d.id, { active: !d.active })
    await loadDefis()
  } catch (e) {
    console.error('Erreur activation défi', e)
  }
}

const remove = async (d) => {
  if (!confirm(`Supprimer le défi "${d.title}" ?`)) return
  try {
    await deleteDefi(d.id)
    await loadDefis()
  } catch (e) {
    console.error('Erreur suppression défi', e)
  }
}

onMounted(loadDefis)
</script>

<style scoped>
.admin-defis { padding: 1rem; }
.title { display: flex; align-items: center; gap: .5rem; margin-bottom: 1rem; }
.card { background: var(--surface-card, #fff); border-radius: 12px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.06); margin-bottom: 1rem; }

.defi-form .form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
.form-field { display: flex; flex-direction: column; gap: .25rem; }
.form-field.full { grid-column: 1 / -1; }
.form-field.checkbox { justify-content: end; }

.actions { display: flex; gap: .5rem; margin-top: .5rem; }
.btn { background: #e5e7eb; color: #111827; border: none; border-radius: 8px; padding: .5rem .75rem; cursor: pointer; }
.btn.primary { background: #2563eb; color: white; }
.btn .pi { margin-right: .35rem; }

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { text-align: left; padding: .5rem; border-bottom: 1px solid #e5e7eb; }
.row-actions { display: flex; gap: .25rem; }
.icon-btn { background: transparent; border: none; cursor: pointer; padding: .25rem .35rem; border-radius: 6px; }
.icon-btn:hover { background: #f3f4f6; }
.icon-btn.danger { color: #ef4444; }
.status { padding: .15rem .5rem; border-radius: 999px; font-size: .85rem; }
.status.active { background: #dcfce7; color: #14532d; }
.status.inactive { background: #fee2e2; color: #7f1d1d; }

@media (max-width: 900px) {
  .defi-form .form-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .defi-form .form-grid { grid-template-columns: 1fr; }
}
</style>
