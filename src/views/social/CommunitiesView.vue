<template>
  <div class="community-management">
    <Navbar />

    <SocialThreeColumnLayout center-max-width="78rem">
      <template #left>
        <LeftSidebar />
      </template>

      <main class="community-management__content" ref="mainFeedRef">
        <div class="community-management__header">
          <h1>Communautés</h1>
          <Button label="Créer une communauté" icon="pi pi-plus" @click="showCreateDialog = true" />
        </div>

        <Card class="mb-4">
          <template #title>Mes communautés</template>
          <template #content>
            <DataTable :value="myCommunities" :loading="loading" responsiveLayout="scroll" dataKey="id"
              emptyMessage="Aucune communauté rejointe.">
              <Column field="name" header="Nom" sortable />
              <Column field="description" header="Description" />
              <Column header="Type">
                <template #body="slotProps">
                  <div class="type-cell">
                    <Tag :value="displayType(slotProps.data.type)" :severity="typeSeverity(slotProps.data.type)" />
                    <Dropdown
                      v-if="isOwner(slotProps.data) && canEditType(slotProps.data)"
                      v-model="slotProps.data.type"
                      :options="communityTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="type-select"
                      @change="updateCommunityType(slotProps.data)"
                    />
                  </div>
                </template>
              </Column>
              <Column field="member_count" header="Membres" sortable />
              <Column header="Actions" :style="{ minWidth: '280px' }">
                <template #body="slotProps">
                  <Button label="Forum" icon="pi pi-comments" class="p-button-sm mr-2" @click="openCommunityForum(slotProps.data.id)" />
                  <Button label="Quitter" icon="pi pi-sign-out" class="p-button-sm p-button-secondary mr-2"
                    @click="leaveCommunity(slotProps.data.id)" :disabled="isOwner(slotProps.data)" />
                  <Button v-if="isOwner(slotProps.data)" label="Supprimer" icon="pi pi-trash"
                    class="p-button-sm p-button-danger" @click="confirmDeleteCommunity(slotProps.data)" />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <Card>
          <template #title>Découvrir des communautés</template>
          <template #content>
            <DataTable :value="discoverCommunities" :loading="loading" responsiveLayout="scroll" dataKey="id"
              emptyMessage="Aucune communauté disponible.">
              <Column field="name" header="Nom" sortable />
              <Column field="description" header="Description" />
              <Column header="Type">
                <template #body="slotProps">
                  <Tag :value="displayType(slotProps.data.type)" :severity="typeSeverity(slotProps.data.type)" />
                </template>
              </Column>
              <Column field="member_count" header="Membres" sortable />
              <Column header="Actions" :style="{ minWidth: '220px' }">
                <template #body="slotProps">
                  <Button label="Rejoindre" icon="pi pi-user-plus" class="p-button-sm mr-2"
                    @click="joinCommunity(slotProps.data.id)" />
                  <Button label="Forum" icon="pi pi-comments" class="p-button-sm p-button-secondary"
                    @click="openCommunityForum(slotProps.data.id)" />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </main>

      <template #right>
        <RightSidebar />
      </template>
    </SocialThreeColumnLayout>

    <Dialog v-model:visible="showCreateDialog" header="Créer une communauté" modal class="create-dialog">
      <div class="p-fluid">
        <div class="field">
          <label for="communityName">Nom</label>
          <InputText id="communityName" v-model="newCommunity.name" />
        </div>
        <div class="field">
          <label for="communityDescription">Description</label>
          <Textarea id="communityDescription" v-model="newCommunity.description" rows="4" />
        </div>
        <div class="field">
          <label for="communityType">Type</label>
          <Dropdown id="communityType" v-model="newCommunity.type" :options="communityTypeOptions" optionLabel="label"
            optionValue="value" />
        </div>
        <div class="dialog-actions">
          <Button label="Annuler" class="p-button-text" @click="showCreateDialog = false" />
          <Button label="Créer" icon="pi pi-check" @click="createCommunity" />
        </div>
      </div>
    </Dialog>

    <ConfirmDialog />
    <Toast />
    <MobileBottomNav :scrollTarget="mainFeedRef" />
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import LeftSidebar from '@/components/social/library/LeftSidebar.vue'
import RightSidebar from '@/components/social/library/RightSidebar.vue'
import SocialThreeColumnLayout from '@/components/common/layouts/SocialThreeColumnLayout.vue'
import MobileBottomNav from '@/components/common/utils/MobileBottomNav.vue'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase.js'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'

const normalizeType = (value) => {
  if (value === 'ferme') return 'closed'
  if (value === 'cache') return 'hidden'
  return value || 'public'
}

const getCommunityDescription = (community) =>
  community?.description ?? community?.desc ?? community?.details ?? community?.about ?? ''

const getCommunityCreatedBy = (community) =>
  community?.created_by ?? community?.createdBy ?? community?.owner_id ?? community?.ownerId ?? null

const getCommunityCreatedAt = (community) =>
  community?.created_at ?? community?.createdAt ?? community?.date_creation ?? community?.dateCreation ?? null

export default {
  name: 'CommunityManagement',
  components: {
    Navbar,
    LeftSidebar,
    RightSidebar,
    SocialThreeColumnLayout,
    MobileBottomNav,
    Card,
    DataTable,
    Column,
    Button,
    Dialog,
    InputText,
    Textarea,
    Dropdown,
    Tag,
    ConfirmDialog,
    Toast,
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const confirm = useConfirm()
    const toast = useToast()

    const loading = ref(false)
    const mainFeedRef = ref(null)
    const communities = ref([])
    const communityColumns = ref(new Set())
    const myCommunityIds = ref(new Set())
    const currentUserId = ref(null)
    const showCreateDialog = ref(false)

    const communityTypeOptions = [
      { label: 'Public', value: 'public' },
      { label: 'Fermé', value: 'closed' },
      { label: 'Caché', value: 'hidden' },
    ]

    const newCommunity = ref({
      name: '',
      description: '',
      type: 'public',
    })

    const isOwner = (community) => getCommunityCreatedBy(community) === currentUserId.value
    const canEditType = (community) => Object.prototype.hasOwnProperty.call(community || {}, 'type')

    const displayType = (type) => {
      if (normalizeType(type) === 'closed') return 'Fermé'
      if (normalizeType(type) === 'hidden') return 'Caché'
      return 'Public'
    }

    const typeSeverity = (type) => {
      if (normalizeType(type) === 'closed') return 'warning'
      if (normalizeType(type) === 'hidden') return 'secondary'
      return 'success'
    }

    const visibleCommunities = computed(() => {
      return communities.value.filter((c) => {
        const type = normalizeType(c.type)
        const isMember = myCommunityIds.value.has(c.id)
        const owner = isOwner(c)
        return type !== 'hidden' || isMember || owner
      })
    })

    const myCommunities = computed(() => {
      return visibleCommunities.value.filter((c) => myCommunityIds.value.has(c.id) || isOwner(c))
    })

    const discoverCommunities = computed(() => {
      return visibleCommunities.value.filter((c) => !myCommunityIds.value.has(c.id) && !isOwner(c))
    })

    const loadCurrentUser = async () => {
      if (!authStore.user) {
        await authStore.checkAuthState()
      }
      currentUserId.value = authStore.user?.id || null
    }

    const loadCommunities = async () => {
      if (!currentUserId.value) return
      loading.value = true
      try {
        const [{ data: comms, error: commsError }, { data: memberships, error: membershipsError }, { data: allMembers, error: allMembersError }] = await Promise.all([
          supabase.from('communities').select('*'),
          supabase.from('user_communities').select('community_id').eq('user_id', currentUserId.value),
          supabase.from('user_communities').select('community_id'),
        ])

        if (commsError) throw commsError
        if (membershipsError) throw membershipsError
        if (allMembersError) throw allMembersError

        communityColumns.value = new Set((comms || []).flatMap((row) => Object.keys(row || {})))

        const ids = new Set((memberships || []).map((row) => row.community_id))
        myCommunityIds.value = ids

        const countMap = (allMembers || []).reduce((acc, row) => {
          const key = row.community_id
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})

        communities.value = (comms || []).map((c) => ({
          ...c,
          description: getCommunityDescription(c),
          type: normalizeType(c.type),
          created_by: getCommunityCreatedBy(c),
          created_at: getCommunityCreatedAt(c),
          member_count: countMap[c.id] || 0,
        })).sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
          return bTime - aTime
        })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les communautés.', life: 3500 })
      } finally {
        loading.value = false
      }
    }

    const createCommunity = async () => {
      if (!currentUserId.value) return
      if (!newCommunity.value.name.trim() || !newCommunity.value.description.trim()) {
        toast.add({ severity: 'warn', summary: 'Champs requis', detail: 'Nom et description sont obligatoires.', life: 2500 })
        return
      }

      try {
        const nameValue = newCommunity.value.name.trim()
        const typeValue = normalizeType(newCommunity.value.type)

        const descriptionValue = newCommunity.value.description.trim()
        const creatorName =
          authStore.user?.user_metadata?.full_name ||
          authStore.user?.email?.split('@')[0] ||
          currentUserId.value

        const hasCol = (name) => communityColumns.value.has(name)
        const inferredPayload = { name: nameValue }
        if (hasCol('type')) inferredPayload.type = typeValue
        if (hasCol('description')) inferredPayload.description = descriptionValue
        else if (hasCol('desc')) inferredPayload.desc = descriptionValue

        if (hasCol('created_by')) inferredPayload.created_by = currentUserId.value
        else if (hasCol('createdBy')) inferredPayload.createdBy = currentUserId.value
        else if (hasCol('creator_name')) inferredPayload.creator_name = creatorName

        const attemptPayloads = [
          inferredPayload,
          { name: nameValue, description: descriptionValue },
          { name: nameValue },
        ]

        let data = null
        let lastError = null
        for (const payload of attemptPayloads) {
          const { data: inserted, error } = await supabase
            .from('communities')
            .insert([payload])
            .select('id')
            .single()

          if (!error) {
            data = inserted
            break
          }

          lastError = error
          const message = String(error.message || '').toLowerCase()
          const isRlsError =
            error.code === '42501' ||
            message.includes('row-level security') ||
            message.includes('violates row-level security')
          if (isRlsError) {
            throw error
          }

          const isRecoverableMissingColumn =
            error.code === '42703' ||
            error.code === 'PGRST204' ||
            message.includes('column') ||
            message.includes('schema cache')

          if (!isRecoverableMissingColumn) {
            throw error
          }
        }

        if (!data) {
          throw lastError || new Error('Impossible de créer la communauté avec le schéma courant.')
        }

        const { error: memberError } = await supabase
          .from('user_communities')
          .upsert([{ user_id: currentUserId.value, community_id: data.id }], { onConflict: 'user_id,community_id' })
        if (memberError) throw memberError

        toast.add({ severity: 'success', summary: 'Communauté créée', detail: 'La communauté a bien été créée.', life: 2500 })
        showCreateDialog.value = false
        newCommunity.value = { name: '', description: '', type: 'public' }
        await loadCommunities()
      } catch (error) {
        const message = String(error?.message || '').toLowerCase()
        const isRlsError =
          error?.code === '42501' ||
          message.includes('row-level security') ||
          message.includes('violates row-level security')

        if (isRlsError) {
          toast.add({
            severity: 'error',
            summary: 'Accès refusé (RLS)',
            detail: 'Supabase bloque la création via les policies RLS de la table communities.',
            life: 5000,
          })
          return
        }

        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer la communauté.', life: 3000 })
      }
    }

    const joinCommunity = async (communityId) => {
      if (!currentUserId.value) return
      try {
        const { error } = await supabase
          .from('user_communities')
          .upsert([{ user_id: currentUserId.value, community_id: communityId }], { onConflict: 'user_id,community_id' })
        if (error) throw error
        toast.add({ severity: 'success', summary: 'Rejoint', detail: 'Vous avez rejoint la communauté.', life: 2200 })
        await loadCommunities()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de rejoindre cette communauté.', life: 3000 })
      }
    }

    const leaveCommunity = async (communityId) => {
      confirm.require({
        message: 'Quitter cette communauté ? ',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Quitter',
        rejectLabel: 'Annuler',
        accept: async () => {
          try {
            const { error } = await supabase
              .from('user_communities')
              .delete()
              .eq('user_id', currentUserId.value)
              .eq('community_id', communityId)
            if (error) throw error
            toast.add({ severity: 'success', summary: 'Fait', detail: 'Vous avez quitté la communauté.', life: 2200 })
            await loadCommunities()
          } catch (error) {
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de quitter cette communauté.', life: 3000 })
          }
        },
      })
    }

    const updateCommunityType = async (community) => {
      if (!isOwner(community)) return
      if (!canEditType(community)) {
        toast.add({ severity: 'warn', summary: 'Type indisponible', detail: 'La colonne type n’existe pas dans cette table.', life: 2500 })
        return
      }
      try {
        const { error } = await supabase
          .from('communities')
          .update({ type: normalizeType(community.type) })
          .eq('id', community.id)
        if (error) throw error
        toast.add({ severity: 'success', summary: 'Type mis à jour', detail: 'Le type de communauté a été modifié.', life: 2200 })
        await loadCommunities()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de modifier le type.', life: 3000 })
      }
    }

    const confirmDeleteCommunity = (community) => {
      confirm.require({
        message: `Supprimer définitivement "${community.name}" ?`,
        header: 'Suppression communauté',
        icon: 'pi pi-trash',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClass: 'p-button-danger',
        accept: async () => {
          try {
            const { error: membersErr } = await supabase.from('user_communities').delete().eq('community_id', community.id)
            if (membersErr) throw membersErr

            const { error: postsErr } = await supabase.from('posts').delete().eq('community_id', community.id)
            if (postsErr) throw postsErr

            const { error: commErr } = await supabase
              .from('communities')
              .delete()
              .eq('id', community.id)
            if (commErr) throw commErr

            toast.add({ severity: 'success', summary: 'Supprimée', detail: 'Communauté supprimée.', life: 2200 })
            await loadCommunities()
          } catch (error) {
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression impossible.', life: 3000 })
          }
        },
      })
    }

    const openCommunityForum = (communityId) => {
      router.push({ name: 'CommunityInfoView', params: { id: communityId } })
    }

    onMounted(async () => {
      await loadCurrentUser()
      if (!currentUserId.value) {
        toast.add({ severity: 'warn', summary: 'Connexion requise', detail: 'Reconnecte-toi pour gérer les communautés.', life: 3000 })
        return
      }
      await loadCommunities()
    })

    return {
      loading,
      mainFeedRef,
      showCreateDialog,
      communityTypeOptions,
      newCommunity,
      myCommunities,
      discoverCommunities,
      displayType,
      typeSeverity,
      isOwner,
      canEditType,
      createCommunity,
      joinCommunity,
      leaveCommunity,
      updateCommunityType,
      confirmDeleteCommunity,
      openCommunityForum,
    }
  },
}
</script>

<style scoped>
.community-management {
  min-height: 100vh;
}

.newsfeed-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 1.5rem;
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  max-height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  overflow: hidden;
}

.sidebar-left,
.sidebar-right {
  height: 100%;
  overflow-y: hidden;
}

.community-management__content {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
}

.community-management__content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.community-management__content {
  scrollbar-width: none;
}

.community-management__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.type-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.type-select {
  width: 8rem;
}

.field {
  margin-bottom: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

@media (max-width: 1024px) {
  .newsfeed-layout {
    grid-template-columns: 1fr 2fr;
  }

  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .newsfeed-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
    width: 100%;
    max-width: 100vw;
    margin: 0 auto;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .sidebar-left {
    display: none;
  }

  .community-management__content {
    padding: 0.5rem 0;
  }
}
</style>
