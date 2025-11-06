<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-users text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Étudiants</h1>
              <p class="text-600 m-0 mt-2">Liste des étudiants avec permission EtudiantPhysio</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2">
            <input v-model="query" type="text" class="search-input" placeholder="Rechercher (nom, email)" />
          </div>
        </div>
      </div>

      <div class="surface-card p-0 border-round shadow-2">
        <div ref="scrollEl" class="list-scroll">
          <template v-for="grp in groupOrder" :key="grp">
            <div v-if="groupedRows[grp] && groupedRows[grp].length" class="group-header">{{ grp }}</div>
            <div v-for="u in groupedRows[grp]" :key="grp + '-' + u.user_id" class="row-item">
              <div class="row-left">
                <img v-if="u.avatar_url" :src="u.avatar_url" alt="avatar" class="avatar" />
                <div v-else class="avatar placeholder">{{ initials(u) }}</div>
              </div>
              <div class="row-center">
                <div class="name">{{ u.display_name || fullName(u) }}</div>
                <div class="meta">{{ u.email }}</div>
              </div>
              <div class="row-right">
                <span class="status" :class="u.is_active ? 'active' : 'inactive'">{{ u.is_active ? 'Actif' : 'Inactif' }}</span>
              </div>
            </div>
          </template>
          <div v-if="loadingMore" class="loading">Chargement...</div>
          <div v-if="!loading && rows.length === 0" class="empty">Aucun étudiant trouvé</div>
        </div>
      </div>
    </div>
  </AdminLayout>
  
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'

const PAGE_SIZE = 30
const rows = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const query = ref('')
const scrollEl = ref(null)
let from = 0
let to = PAGE_SIZE - 1
let lastSearch = ''
let debounceId = null

const cohortKeys = ['BA25-PHY','BA24-PHY','BA23-PHY']
const groupOrder = ['BA25-PHY','BA24-PHY','BA23-PHY','Autres']

function hasPerm(u, key) {
  const arr = Array.isArray(u?.permissions) ? u.permissions : []
  return arr.includes(key)
}

const groupedRows = computed(() => {
  const map = { 'BA25-PHY': [], 'BA24-PHY': [], 'BA23-PHY': [], 'Autres': [] }
  for (const u of rows.value) {
    const found = cohortKeys.find(k => hasPerm(u, k))
    if (found) map[found].push(u)
    else map['Autres'].push(u)
  }
  return map
})

function resetPager() {
  rows.value = []
  hasMore.value = true
  from = 0
  to = PAGE_SIZE - 1
}

function fullName(u) {
  return [u.family_name, u.forname].filter(Boolean).join(' ')
}

function initials(u) {
  const s = (u.display_name || fullName(u) || ' ? ').trim()
  const parts = s.split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'U'
}

async function fetchPage(search, append) {
  if (!append) loading.value = true
  if (append) loadingMore.value = true
  try {
    let q = supabase
      .from('user_profiles')
      .select('user_id, email, forname, family_name, display_name, avatar_url, is_active, created_at, permissions', { count: 'exact' })
      .filter('permissions', 'cs', '["EtudiantPhysio"]')
      .order('family_name', { ascending: true })
      .order('forname', { ascending: true })
      .range(from, to)

    if (search && search.trim().length > 0) {
      const s = search.trim()
      q = q.or(`email.ilike.%${s}%,forname.ilike.%${s}%,family_name.ilike.%${s}%,display_name.ilike.%${s}%`)
    }

    const { data, error } = await q
    if (error) throw error

    if (!append) rows.value = []
    rows.value = append ? rows.value.concat(data || []) : (data || [])
    hasMore.value = (data || []).length === PAGE_SIZE
    if (hasMore.value) {
      from = to + 1
      to = from + PAGE_SIZE - 1
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function onScroll() {
  if (!hasMore.value || loadingMore.value) return
  const el = scrollEl.value
  if (!el) return
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48
  if (nearBottom) fetchPage(lastSearch, true)
}

onMounted(async () => {
  await fetchPage('', false)
  if (scrollEl.value) scrollEl.value.addEventListener('scroll', onScroll)
})

watch(query, (v) => {
  if (debounceId) clearTimeout(debounceId)
  debounceId = setTimeout(async () => {
    lastSearch = v || ''
    resetPager()
    await fetchPage(lastSearch, false)
  }, 300)
})

</script>

<style scoped>
.search-input { 
  padding: 0.5rem 0.75rem; 
  border: 1px solid var(--surface-border,#e0e0e0); 
  border-radius: 8px; 
  min-width: 260px;
}
.list-scroll {
  max-height: 70vh;
  overflow-y: auto;
}
.group-header {
  position: sticky;
  top: 0;
  background: var(--surface-card);
  z-index: 1;
  padding: 0.5rem 1rem;
  font-weight: 700;
  border-top: 1px solid var(--surface-border,#eee);
  border-bottom: 1px solid var(--surface-border,#eee);
}
.row-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border,#eee);
}
.row-left { width: 48px; display: flex; justify-content: center; }
.row-center { flex: 1; min-width: 0; }
.row-right { margin-left: 0.5rem; }
.name { font-weight: 600; color: var(--text-color); }
.meta { font-size: 0.85rem; color: var(--text-color-secondary); }
.avatar { width: 36px; height: 36px; border-radius: 999px; object-fit: cover; }
.avatar.placeholder { width: 36px; height: 36px; border-radius: 999px; background: #e5e7eb; color: #374151; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.status { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid #e5e7eb; }
.status.active { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
.status.inactive { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.loading { text-align: center; padding: 1rem; color: var(--text-color-secondary); }
.empty { text-align: center; padding: 2rem; color: var(--text-color-secondary); }
</style>
