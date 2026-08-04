<template>
    <TheNavbar />
  
    <div class="p-4">
      <!-- HomeCalendar: Accueil Planning -->
      <h1 class="text-3xl mb-4">HomeCalendar — Accueil Planning</h1>

      <!-- Rôles -->
      <PlanningLegend class="mb-4" style="max-width:860px" />

      <div class="mb-4 border-1 surface-border border-round p-3" style="max-width: 860px;">
        <div class="mb-2 text-800 font-medium">Rôles</div>
        <ul class="m-0 pl-3">
          <li><strong>admin</strong> : peut tout modifier</li>
          <li><strong>rmodule</strong> : peut éditer les titres et enseignants de son module</li>
          <li><strong>enseignant</strong> : peut éditer en partie le cours auquel il participe</li>
        </ul>
      </div>

      <!-- Modèle DB (cible Supabase) -->
      <div class="mb-4 border-1 surface-border border-round p-3" style="max-width: 860px;">
        <div class="mb-2 text-800 font-medium">Modèle de données — Planning</div>
        <ul class="m-0 pl-3">
          <li><strong>utilisateur</strong> : role, nom, id</li>
          <li><strong>structure</strong> : nom, id, jour (module - cours)</li>
          <li><strong>module</strong> : rspmodule, couleur, nom, description, syllabus</li>
          <li><strong>cours</strong> : liste enseignants, nom, description, syllabus, horaire</li>
        </ul>
      </div>

      <!-- Actions rapides selon le rôle Firebase -->
      <div class="mb-5 border-1 surface-border border-round p-3" style="max-width: 860px;">
        <div class="mb-3 text-800 font-medium">Actions rapides</div>
        <small class="block text-700 mb-2">Public</small>
        <div class="grid" style="row-gap:.75rem">
          <div class="col-12 md:col-4">
            <Button class="w-full" icon="pi pi-home" label="Calendar - Home" title="Accueil Calendrier" @click="go('/calendar')" />
          </div>
          <div class="col-12 md:col-4">
            <Button class="w-full" icon="pi pi-calendar" label="Calendar - Full" title="Voir le calendrier Temps plein" @click="go('/calendar/full')" />
          </div>
          <div class="col-12 md:col-4">
            <Button class="w-full" icon="pi pi-list" label="Calendar - Semester" title="Voir par semestre (liste de semaines)" severity="secondary" @click="go('/calendar/semester')" />
          </div>
          <div class="col-12 md:col-4">
            <Button class="w-full" icon="pi pi-th-large" label="Calendar - Module" title="Voir par module" severity="secondary" @click="go('/calendar/module')" />
          </div>
        </div>
        <small class="block text-700 mt-3 mb-2">Selon rôles</small>
        <div class="grid" style="row-gap:.75rem">
          <div class="col-12 md:col-4" v-if="canModifyCourses">
            <Button class="w-full" icon="pi pi-users" label="Calendar - Teacher" title="Voir planning par enseignant" @click="go('/calendar/teacher')" />
          </div>

          <div class="col-12 md:col-4" v-if="canModifyCourses">
            <Button class="w-full" icon="pi pi-user" label="Calendar - My Courses" title="Mes cours (enseignant/rôles)" @click="go('/calendar/my-courses')" />
          </div>
          <div class="col-12 md:col-4" v-if="canEditModules">
            <Button class="w-full" icon="pi pi-sitemap" label="Calendar - My Modules" title="Mes modules (rmodule)" @click="go('/calendar/my-modules')" />
          </div>
          <div class="col-12 md:col-4" v-if="isAdmin">
            <Button class="w-full" icon="pi pi-cog" label="Calendar - Admin" title="Administration calendrier" severity="warning" @click="go('/calendar/admin')" />
          </div>
        </div>
        <small class="text-600">Les boutons s'affichent selon vos rôles Firebase: admin, rmodule, enseignant.</small>
      </div>

      <!-- Description des vues (extrait des besoins) -->
      <div class="mb-5 border-1 surface-border border-round p-3" style="max-width: 860px;">
        <div class="mb-2 text-800 font-medium">Vues prévues</div>
        <ul class="m-0 pl-3">
          <li><strong>CalendrierFormationPlein</strong> (semaine 37→37, 5 jours/semaine; 3 ans = 6 semestres 2026-29)</li>
          <li><strong>CalendrierFormationPleinEdit</strong> (Admin) — chaque case: Module/Vacances/Interruption/Examens/Formation pratique</li>
          <li><strong>Calendrier Semestriel</strong> — par semestre, ligne par ligne (semaine par semaine)</li>
          <li><strong>Calendrier Module</strong> — par module, ligne par ligne; <em>CalendrierModuleEdit</em> (Admin ou rmodule propriétaire)</li>
          <li><strong>Calendrier Enseignant</strong> — par enseignant, ligne par ligne</li>
          <li><strong>Modules</strong> — liste des modules existants; <em>EditModule</em> (Admin ou rmodule propriétaire)</li>
          <li><strong>Cours</strong> — détail d'un cours; <em>EditCours</em> (Admin, rmodule du module, ou Enseignant assigné)</li>
          <li><strong>ProfilEnseignant</strong> — infos enseignant</li>
          <li><strong>AdminManagement</strong> (Admin) — dashboard pour créer modules/planning</li>
          <li><strong>V2 Temps partiel</strong> — 9 semestres (S37→S37) avec jour «Asynchrone»; édition similaire</li>
        </ul>
      </div>

      <h2 class="text-2xl mb-3">Supabase (DB only) — Todos</h2>
  
      <!-- Auth -->
      <div class="mb-4 border-1 surface-border border-round p-3" style="max-width:520px">
        <div class="mb-2 text-800 font-medium">Authentification</div>
        <div v-if="user" class="text-700 mb-2">
          Connecté en tant que <strong>{{ user.email }}</strong>
        </div>
  
        <div class="grid" style="row-gap:.5rem">
          <div class="col-12">
            <InputText v-model="email" placeholder="email" class="w-full" type="email" />
          </div>
          <div class="col-12">
            <InputText v-model="password" placeholder="mot de passe" class="w-full" type="password" />
          </div>
  
          <div class="col-12 flex gap-2 justify-content-end">
            <Button size="small" :loading="authLoading" label="S'inscrire" @click="handleSignUp" />
            <Button size="small" :loading="authLoading" label="Se connecter" @click="handleSignIn" />
            <Button size="small" severity="secondary" outlined :loading="authLoading" label="Se déconnecter" @click="handleSignOut" />
          </div>
  
          <div class="col-12">
            <Button size="small" link label="Mot de passe oublié ?" @click="handleResetRequest" />
          </div>
        </div>
  
        <!-- Bloc reset visible en mode recovery -->
        <div v-if="recovery.active" class="mt-3 border-1 surface-border border-round p-3">
          <div class="mb-2 text-800 font-medium">Définir un nouveau mot de passe</div>
          <div class="grid" style="row-gap:.5rem">
            <div class="col-12">
              <InputText v-model="recovery.newPassword" type="password" placeholder="Nouveau mot de passe" class="w-full" />
            </div>
            <div class="col-12">
              <InputText v-model="recovery.newPassword2" type="password" placeholder="Confirmer le mot de passe" class="w-full" />
            </div>
            <div class="col-12 flex gap-2 justify-content-end">
              <Button size="small" label="Enregistrer" :loading="authLoading" @click="handleSetNewPassword" />
            </div>
          </div>
        </div>
      </div>
  
      <!-- Todos CRUD (DB only) -->
      <div class="mb-4 border-1 surface-border border-round p-3" style="max-width: 860px;">
        <div class="mb-2 text-800 font-medium">Todos (CRUD via REST)</div>
  
        <div class="grid" style="row-gap:.5rem; max-width:860px">
          <div class="col-12 md:col-4">
            <InputText v-model="todo.draft.title" placeholder="Titre (obligatoire)" class="w-full" />
          </div>
          <div class="col-12 md:col-5">
            <InputText v-model="todo.draft.content" placeholder="Contenu" class="w-full" />
          </div>
          <div class="col-12 md:col-3 flex gap-2 justify-content-end">
            <Button size="small" :loading="todo.mutating" label="Ajouter" @click="onAdd" v-if="!todo.draft.id"/>
            <Button size="small" :loading="todo.mutating" label="Mettre à jour" @click="onUpdate" v-else />
            <Button size="small" severity="secondary" outlined label="Annuler" @click="todo.resetDraft" v-if="todo.draft.id"/>
          </div>
        </div>
  
        <div class="flex align-items-center gap-2 mt-3">
          <Button size="small" label="Rafraîchir" :loading="todo.loading" @click="todo.fetchTodos" />
          <small class="text-600">Dernier sync :
            {{ todo.lastSyncedAt ? new Date(todo.lastSyncedAt).toLocaleTimeString() : '—' }}
          </small>
        </div>
  
        <div class="mt-3">
          <div v-if="todo.loading" class="text-700">Chargement...</div>
  
          <DataTable v-else :value="todo.todos" stripedRows responsiveLayout="scroll" size="small">
            <Column field="title" header="Titre" />
            <Column field="content" header="Description" />
            <Column header="Créé le">
              <template #body="{ data }">
                {{ data.created_at ? new Date(data.created_at).toLocaleString() : '—' }}
              </template>
            </Column>
            <Column header="Actions" :style="{ width: '160px' }">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button size="small" icon="pi pi-pencil" class="p-button-text" @click="todo.edit(slotProps.data)" />
                  <Button size="small" icon="pi pi-trash" class="p-button-text p-button-danger" @click="onDelete(slotProps.data.id)" />
                </div>
              </template>
            </Column>
          </DataTable>
  
          <div v-if="!todo.loading && todo.todos.length === 0" class="text-600 mt-2">Aucun todo.</div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
  import { supabase } from '@/supabase.js'
  import { useToast } from 'primevue/usetoast'
  import { useTodoStore } from '@/stores/todoStore.js'
  import { useRouter } from 'vue-router'
  // Firebase (pour récupérer les rôles)
  import { db, auth } from '@/firebase.js'
  import { ref as dbRef, get as dbGet } from 'firebase/database'
  import { onAuthStateChanged } from 'firebase/auth'
  
  import TheNavbar from '@/components/TheNavbar.vue'
  import PlanningLegend from '@/components/common/planning/PlanningLegend.vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Button from 'primevue/button'
  import InputText from 'primevue/inputtext'
  
  const toast = useToast()
  const todo = useTodoStore()
  const router = useRouter()

  // -------- Rôles Firebase pour HomeCalendar --------
  const TEST_MODE = true
  const fbUser = ref(null)
  const fbRoles = ref({})
  const isAdmin = computed(() => TEST_MODE || !!fbRoles.value?.admin)
  const isRmodule = computed(() => TEST_MODE || !!fbRoles.value?.rmodule)
  const isEnseignant = computed(() => TEST_MODE || !!fbRoles.value?.enseignant)
  const canModifyCourses = computed(() => TEST_MODE || isAdmin.value || isRmodule.value || isEnseignant.value)
  const canEditModules = computed(() => TEST_MODE || isAdmin.value || isRmodule.value)
  const go = (path) => router.push(path)
  
  // -------- Auth local --------
  const email = ref('')
  const password = ref('')
  const user = ref(null)
  const authLoading = ref(false)
  
  // Bloc recovery (point 2)
  const recovery = ref({
    active: false,
    newPassword: '',
    newPassword2: '',
  })
  
  const loadSession = async () => {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
  }
  
  // Inscription : on force l’URL de redirection vers hedsvs.ch
  const handleSignUp = async () => {
    authLoading.value = true
    try {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { emailRedirectTo: 'https://hedsvs.ch' }
      })
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Inscription envoyée', detail: 'Vérifie tes e-mails', life: 3000 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur inscription', detail: e.message, life: 4000 })
    } finally {
      authLoading.value = false
    }
  }
  
  const handleSignIn = async () => {
    authLoading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (error) throw error
      await loadSession()
      toast.add({ severity: 'success', summary: 'Connecté', detail: user.value?.email || '', life: 2500 })
      await todo.fetchTodos()
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur connexion', detail: e.message, life: 4000 })
    } finally {
      authLoading.value = false
    }
  }
  
  const handleSignOut = async () => {
    authLoading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
      todo.todos = []
      toast.add({ severity: 'success', summary: 'Déconnecté', life: 2000 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur déconnexion', detail: e.message, life: 4000 })
    } finally {
      authLoading.value = false
    }
  }
  
  // ---- Mot de passe oublié ? (envoi e-mail)
  // Envoi de l'e-mail de réinit
  const handleResetRequest = async () => {
    if (!email.value) {
      toast.add({ severity: 'warn', summary: 'Adresse requise', detail: 'Saisis ton e-mail puis clique sur “Mot de passe oublié ?”', life: 4000 })
      return
    }
    authLoading.value = true
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      toast.add({ severity: 'success', summary: 'E-mail envoyé', detail: 'Vérifie ta boîte mail', life: 4000 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 5000 })
    } finally {
      authLoading.value = false
    }
  }
  
  // ---- Détecte le retour depuis l’e-mail (type=recovery dans le hash) et installe la session
  const checkRecoveryFromUrl = async () => {
    const hash = window.location.hash?.replace(/^#/, '') || ''
    const p = new URLSearchParams(hash)
    const type = p.get('type')
    const access_token = p.get('access_token')
    const refresh_token = p.get('refresh_token')
    if (type === 'recovery' && access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (!error) {
        recovery.value.active = true
        // Retire les tokens de l’URL
        history.replaceState({}, document.title, window.location.pathname + window.location.search)
      }
    }
  }
  
  const handleSetNewPassword = async () => {
    if (recovery.value.newPassword.length < 8) {
      toast.add({ severity: 'warn', summary: 'Mot de passe trop court', detail: '8 caractères minimum', life: 3000 })
      return
    }
    if (recovery.value.newPassword !== recovery.value.newPassword2) {
      toast.add({ severity: 'warn', summary: 'Les mots de passe ne correspondent pas', life: 3000 })
      return
    }
    authLoading.value = true
    try {
      const { error } = await supabase.auth.updateUser({ password: recovery.value.newPassword })
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Mot de passe changé', life: 2500 })
      recovery.value.active = false
      recovery.value.newPassword = ''
      recovery.value.newPassword2 = ''
      await loadSession()
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 5000 })
    } finally {
      authLoading.value = false
    }
  }
  
  // -------- Handlers CRUD --------
  const onAdd = async () => {
    try {
      await todo.addTodo()
      toast.add({ severity: 'success', summary: 'Ajouté', life: 1500 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur (insert)', detail: e.message, life: 4000 })
    }
  }
  const onUpdate = async () => {
    try {
      await todo.updateTodo()
      toast.add({ severity: 'success', summary: 'Mis à jour', life: 1500 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur (update)', detail: e.message, life: 4000 })
    }
  }
  const onDelete = async (id) => {
    if (!confirm('Supprimer ce todo ?')) return
    try {
      await todo.deleteTodo(id)
      toast.add({ severity: 'success', summary: 'Supprimé', life: 1200 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur (delete)', detail: e.message, life: 4000 })
    }
  }
  
  // -------- Lifecycle --------
  let authSub = null
  const onVis = () => {
    if (document.visibilityState === 'visible') todo.fetchTodos()
  }
  
  onMounted(async () => {
    // Récupère les rôles depuis Firebase pour afficher les boutons
    onAuthStateChanged(auth, async (u) => {
      fbUser.value = u
      if (u) {
        try {
          const rolesRef = dbRef(db, `Users/${u.uid}/Roles`)
          const snap = await dbGet(rolesRef)
          fbRoles.value = snap.exists() ? snap.val() : {}
        } catch (e) {
          console.error('Erreur chargement rôles Firebase:', e)
        }
      } else {
        fbRoles.value = {}
      }
    })

    await loadSession()
    await checkRecoveryFromUrl()   // <<< Point 2 : détection du retour
    await todo.fetchTodos()
    todo.startPolling(10000)
    document.addEventListener('visibilitychange', onVis)
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
      todo.fetchTodos()
    })
    authSub = subscription
  })
  onBeforeUnmount(() => {
    todo.stopPolling()
    document.removeEventListener('visibilitychange', onVis)
    if (authSub) authSub.unsubscribe()
  })
  watch(user, () => todo.fetchTodos())
  </script>
