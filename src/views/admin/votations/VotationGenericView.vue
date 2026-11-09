<template>
  <AdminLayout :noSidebar="true">
    <section v-if="isAdminPreview" class="admin-preview-toolbar" aria-label="Aperçu administrateur">
      <div class="admin-preview-copy">
        <span class="admin-preview-icon" aria-hidden="true"><i class="pi pi-eye"></i></span>
        <div>
          <h2>Aperçu administrateur</h2>
          <p>Consultez les propositions de la campagne sans simuler le profil d’un étudiant.</p>
        </div>
      </div>
      <div class="admin-preview-actions">
        <label for="admin-votation-session">Campagne ouverte</label>
        <select id="admin-votation-session" v-model="previewSessionId"
          :disabled="sessionRefreshInFlight || !previewSessions.length" @change="refreshSessionAndData">
          <option v-for="session in previewSessions" :key="session.id" :value="session.id">
            {{ session.pfp_type }} — {{ session.target_class }} — {{ session.year }}{{ session.is_priority ? ' — Prioritaire' : '' }}
          </option>
        </select>
        <PrimeButton label="Actualiser" icon="pi pi-refresh" :disabled="sessionRefreshInFlight" @click="refreshSessionAndData" />
      </div>
      <p v-if="previewError" class="admin-preview-error" role="alert">{{ previewError }}</p>
    </section>
    <!-- Chargement de la session -->
    <div
      v-if="sessionLoading"
      class="flex align-items-center justify-content-center"
      style="min-height: 60vh"
    >
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <p class="text-600">Chargement de la votation...</p>
      </div>

    </div>

    <!-- Pas de session active -->
    <div
      v-else-if="!activeSession"
      class="flex align-items-center justify-content-center"
      style="min-height: 60vh"
    >
      <div class="text-center surface-card p-5 border-round shadow-2" style="max-width: 500px">
        <i class="pi pi-lock text-4xl text-orange-500 mb-3"></i>
        <h2 class="text-900 m-0 mb-2">Votation fermée</h2>
        <p class="text-600 m-0 mb-3">
          Aucune votation n'est ouverte pour le moment. Veuillez réessayer plus tard.
        </p>
        <PrimeButton label="Retour" icon="pi pi-arrow-left" outlined @click="goBackToProfile" />
      </div>
    </div>

    <div
      v-else-if="!isAdminPreview && votingAccessBlocked"
      class="flex align-items-center justify-content-center"
      style="min-height: 60vh"
    >
      <div class="assignment-locked-card" role="status" aria-live="polite">
        <span class="assignment-locked-icon" aria-hidden="true">
          <i :class="assignmentCheckError ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
        </span>
        <h2>{{ assignmentCheckError ? 'Accès temporairement indisponible' : 'Une place vous est déjà attribuée' }}</h2>
        <p v-if="assignmentCheckError">
          Nous ne pouvons pas vérifier votre situation pour le moment. Réessayez ou contactez le secrétariat.
        </p>
        <template v-else>
          <p>Vous ne devez plus participer à cette votation {{ targetPFP }}.</p>
          <dl v-if="existingCampaignAssignment" class="assignment-locked-details">
            <div v-if="existingCampaignAssignment.assigned_institution_name">
              <dt>Institution</dt>
              <dd>{{ existingCampaignAssignment.assigned_institution_name }}</dd>
            </div>
            <div v-if="existingCampaignAssignment.assigned_place_name">
              <dt>Place</dt>
              <dd>{{ existingCampaignAssignment.assigned_place_name }}</dd>
            </div>
          </dl>
        </template>
        <div class="assignment-locked-actions">
          <PrimeButton label="Retour au profil" icon="pi pi-arrow-left" @click="goBackToProfile" />
          <PrimeButton v-if="assignmentCheckError" label="Réessayer" icon="pi pi-refresh" outlined @click="refreshSessionAndData" />
        </div>
      </div>
    </div>

    <!-- Votation active -->
    <div v-else class="votation-container">
      <!-- En-tête moderne -->
      <div class="votation-header">
        <div class="header-content">
          <div class="header-left">
            <i class="pi pi-check-square header-icon"></i>
            <div>
              <div class="header-title-row">
                <h1 class="header-title">Votation {{ targetPFP }}</h1>
                <span v-if="isAdminPreview" class="read-only-badge"><i class="pi pi-eye" aria-hidden="true"></i> Lecture seule</span>
              </div>
              <p class="header-subtitle">
                Année {{ selectedYear }} · {{ availablePlaces.length }} {{ isAdminPreview ? 'capacités proposées' : 'places disponibles' }}<template v-if="isAdminPreview"> · {{ adminInstitutionCount }} institutions</template>
              </p>
            </div>
          </div>
          <PrimeButton
            label="Retour"
            icon="pi pi-arrow-left"
            outlined
            @click="goBackToProfile"
            class="back-button"
          />
        </div>
      </div>

      <section v-if="!isAdminPreview && availablePlaces.length > 0" class="choice-progress content-wrapper" aria-labelledby="choice-progress-title">
        <div class="choice-progress-heading">
          <div>
            <h2 id="choice-progress-title">Votre classement</h2>
            <p>Classez exactement cinq places, de votre préférence principale à votre cinquième choix.</p>
          </div>
          <strong>{{ selectionCount }}/5 choix</strong>
        </div>
        <div class="choice-progress-bar" role="progressbar" aria-label="Choix complétés" aria-valuemin="0" aria-valuemax="5" :aria-valuenow="selectionCount">
          <span :style="{ width: `${selectionCount * 20}%` }"></span>
        </div>
        <ol class="choice-slots">
          <li v-for="rank in 5" :key="rank" :class="{ complete: selectedPlaces[rank - 1] }">
            <span>{{ rank }}</span>
            <div><strong>{{ selectedPlaces[rank - 1]?.NomPlace || `Choix ${rank} à définir` }}</strong><small v-if="selectedPlaces[rank - 1]">{{ selectedPlaces[rank - 1].InstitutionName }}</small></div>
            <button v-if="selectedPlaces[rank - 1]" type="button" :aria-label="`Retirer le choix ${rank}`" @click="removeChoice(rank - 1)"><i class="pi pi-times" aria-hidden="true"></i></button>
          </li>
        </ol>
      </section>

      <section v-if="isAdminPreview && availablePlaces.length > 0" class="admin-form-guide content-wrapper" aria-labelledby="admin-form-guide-title">
        <div>
          <h2 id="admin-form-guide-title">Formulaire de votation à cinq choix</h2>
          <p>Voici exactement la présentation proposée aux étudiants. En aperçu administrateur, les sélections restent désactivées.</p>
        </div>
        <ol aria-label="Ordre des choix">
          <li v-for="rank in 5" :key="rank"><strong>{{ rank }}</strong><span>{{ rank === 1 ? 'Priorité' : `Choix ${rank}` }}</span></li>
        </ol>
      </section>

      <section v-if="availablePlaces.length > 0" class="place-tools content-wrapper" aria-label="Rechercher une place">
        <label for="place-search">Rechercher une institution, une place ou un critère</label>
        <div class="place-search-control">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input id="place-search" v-model.trim="placeSearchQuery" type="search" placeholder="Ex. Meyriez, orthopédie, REHAB…" autocomplete="off" />
          <span>{{ filteredAvailablePlaces.length }} résultat{{ filteredAvailablePlaces.length > 1 ? 's' : '' }}</span>
        </div>
      </section>

      <div v-if="availablePlaces.length > 0 && filteredAvailablePlaces.length === 0" class="search-empty content-wrapper" role="status">
        <i class="pi pi-search" aria-hidden="true"></i>
        <div><h2>Aucune place ne correspond</h2><p>Modifiez ou effacez votre recherche pour retrouver toutes les places.</p></div>
        <button type="button" @click="placeSearchQuery = ''">Effacer la recherche</button>
      </div>

      <!-- Bandeau critères manquants pour PFP4 -->
      <div v-if="hasPfp4Sections" class="pfp4-missing-banner content-wrapper">
        <div class="pfp4-missing-card">
          <div class="flex align-items-center gap-3 flex-wrap">
            <i class="pi pi-exclamation-triangle text-2xl text-orange-500"></i>
            <div>
              <div class="text-900 font-bold text-lg mb-1">
                Critères à valider pour votre diplôme
              </div>
              <div class="flex align-items-center gap-2 flex-wrap">
                <Tag
                  v-for="c in pfp4MissingCriteria"
                  :key="c"
                  :value="c"
                  severity="danger"
                  class="text-sm px-3 py-1"
                  style="font-size: 0.95rem"
                />
              </div>
            </div>
          </div>
          <div class="text-600 mt-2 text-sm">
            <i class="pi pi-arrow-down mr-1"></i> Les places ci-dessous sont triées par pertinence.
            <strong
              >Privilégiez en priorité les places qui couvrent le plus grand nombre de vos critères
              manquants en terme d'équité !!</strong
            >
            Pour rappel il est obligatoire de
            <strong>
              valider au minimum une place dans la deuxième langue pour obtenir votre
              diplôme</strong
            >.
          </div>
        </div>
      </div>

      <!-- ═══ MODE SECTIONS PFP4 (avec critères manquants) ═══ -->
      <div v-if="hasPfp4Sections && availablePlaces.length > 0" class="content-wrapper">
        <!-- SECTION HAUTE PRIORITÉ -->
        <div v-if="pfp4HighPlaces.length > 0" class="pfp4-section pfp4-section-high mb-4">
          <div class="pfp4-section-header pfp4-section-header-high">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-star-fill text-xl"></i>
              <span class="font-bold text-lg">Priorité haute</span>
              <Tag :value="pfp4HighPlaces.length + ' places'" severity="success" class="ml-2" />
            </div>
            <span class="text-sm opacity-80"
              >Couvrent 2+ de vos critères manquants — à privilégier</span
            >
          </div>
          <DataTable
            :value="pfp4HighPlaces"
            class="modern-votation-table pfp4-table-high desktop-place-table"
            responsiveLayout="scroll"
            :scrollable="true"
            :rowHover="true"
          >
            <Column header="Crit. couverts" :style="{ width: '110px', textAlign: 'center' }">
              <template #body="slotProps">
                <div class="pfp4-badge pfp4-badge-high">
                  {{ slotProps.data.pfp4CoveredCount }} / {{ pfp4MissingCriteria.length }}
                </div>
              </template>
            </Column>
            <Column header="Institution" field="InstitutionName" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <a target="_blank" :href="slotProps.data.url" class="institution-link"
                  ><i class="pi pi-building mr-2"></i
                  >{{ slotProps.data.InstitutionName || 'Non spécifié' }}</a
                >
              </template>
            </Column>
            <Column header="Place" field="NomPlace" :style="{ minWidth: '160px' }">
              <template #body="slotProps"
                ><div class="place-name font-semibold">{{ slotProps.data.NomPlace }}</div></template
              >
            </Column>
            <Column header="Critères" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <div class="criteria-tags">
                  <template
                    v-for="cr in ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU']"
                    :key="cr"
                  >
                    <Tag
                      v-if="slotProps.data[cr]"
                      :value="cr"
                      :severity="isMissingCriteria(cr) ? 'danger' : 'success'"
                      class="mr-1 mb-1"
                    />
                  </template>
                </div>
              </template>
            </Column>
            <Column header="Langues" :style="{ width: '100px' }">
              <template #body="slotProps">
                <div class="language-tags">
                  <Tag
                    v-if="slotProps.data.FR"
                    value="FR"
                    :severity="isMissingCriteria('FR') ? 'danger' : 'warning'"
                    class="mr-1"
                  />
                  <Tag
                    v-if="slotProps.data.DE"
                    value="DE"
                    :severity="isMissingCriteria('DE') ? 'danger' : 'warning'"
                    class="mr-1"
                  />
                </div>
              </template>
            </Column>
            <Column
              v-for="i in 5"
              :key="'hc-' + i"
              :header="'Choix ' + i"
              headerClass="choice-column-header"
              bodyClass="choice-column-cell"
              :style="{ textAlign: 'center', width: '75px' }"
            >
              <template #body="slotProps">
                <div class="radio-wrapper">
                  <RadioButton
                    v-model="selectedPlaces[i - 1]"
                    :value="slotProps.data"
                    :disabled="isPlaceDisabled(slotProps.data, i - 1)"
                    @click="onRadioClick(slotProps.data, i - 1, $event)"
                  />
                </div>
              </template>
            </Column>
            <Column
              v-for="i in 5"
              :key="'hv-' + i"
              :header="'Top ' + i"
              headerClass="vote-column-header"
              bodyClass="vote-column-cell"
              :style="{ textAlign: 'center', width: '60px' }"
            >
              <template #body="slotProps">
                <Tag
                  :value="getVoteCount(slotProps.data)['top' + i] || 0"
                  :severity="getVoteCount(slotProps.data)['top' + i] > 0 ? 'primary' : 'secondary'"
                  rounded
                />
              </template>
            </Column>
            <Column header="Total" headerClass="vote-total-header" bodyClass="vote-total-cell" :style="{ textAlign: 'center', width: '70px' }">
              <template #body="slotProps">
                <Tag
                  :value="getVoteCount(slotProps.data).total || 0"
                  severity="contrast"
                  rounded
                  class="font-semibold"
                />
              </template>
            </Column>
          </DataTable>
          <VotationPlaceCards class="mobile-place-cards" :places="pfp4HighPlaces" :selected-places="selectedPlaces" :votes-aggregation="votesAggregation" :missing-criteria="pfp4MissingCriteria" :admin-preview="isAdminPreview" @select="selectPlaceForRank" />
        </div>

        <!-- SECTION MOYENNE PRIORITÉ -->
        <div v-if="pfp4MediumPlaces.length > 0" class="pfp4-section pfp4-section-medium mb-4">
          <div class="pfp4-section-header pfp4-section-header-medium">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-bookmark text-xl"></i>
              <span class="font-bold text-lg">Priorité moyenne</span>
              <Tag :value="pfp4MediumPlaces.length + ' places'" severity="warning" class="ml-2" />
            </div>
            <span class="text-sm opacity-80">Couvrent 1 critère manquant</span>
          </div>
          <DataTable
            :value="pfp4MediumPlaces"
            class="modern-votation-table pfp4-table-medium desktop-place-table"
            responsiveLayout="scroll"
            :scrollable="true"
            :rowHover="true"
          >
            <Column header="Crit. couverts" :style="{ width: '110px', textAlign: 'center' }">
              <template #body
                ><div class="pfp4-badge pfp4-badge-medium">
                  1 / {{ pfp4MissingCriteria.length }}
                </div></template
              >
            </Column>
            <Column header="Institution" field="InstitutionName" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <a target="_blank" :href="slotProps.data.url" class="institution-link"
                  ><i class="pi pi-building mr-2"></i
                  >{{ slotProps.data.InstitutionName || 'Non spécifié' }}</a
                >
              </template>
            </Column>
            <Column header="Place" field="NomPlace" :style="{ minWidth: '160px' }">
              <template #body="slotProps"
                ><div class="place-name">{{ slotProps.data.NomPlace }}</div></template
              >
            </Column>
            <Column header="Critères" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <div class="criteria-tags">
                  <template
                    v-for="cr in ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU']"
                    :key="cr"
                  >
                    <Tag
                      v-if="slotProps.data[cr]"
                      :value="cr"
                      :severity="isMissingCriteria(cr) ? 'danger' : 'success'"
                      class="mr-1 mb-1"
                    />
                  </template>
                </div>
              </template>
            </Column>
            <Column header="Langues" :style="{ width: '100px' }">
              <template #body="slotProps">
                <div class="language-tags">
                  <Tag
                    v-if="slotProps.data.FR"
                    value="FR"
                    :severity="isMissingCriteria('FR') ? 'danger' : 'warning'"
                    class="mr-1"
                  />
                  <Tag
                    v-if="slotProps.data.DE"
                    value="DE"
                    :severity="isMissingCriteria('DE') ? 'danger' : 'warning'"
                    class="mr-1"
                  />
                </div>
              </template>
            </Column>
            <Column
              v-for="i in 5"
              :key="'mc-' + i"
              :header="'Choix ' + i"
              headerClass="choice-column-header"
              bodyClass="choice-column-cell"
              :style="{ textAlign: 'center', width: '75px' }"
            >
              <template #body="slotProps">
                <div class="radio-wrapper">
                  <RadioButton
                    v-model="selectedPlaces[i - 1]"
                    :value="slotProps.data"
                    :disabled="isPlaceDisabled(slotProps.data, i - 1)"
                    @click="onRadioClick(slotProps.data, i - 1, $event)"
                  />
                </div>
              </template>
            </Column>
            <Column
              v-for="i in 5"
              :key="'mv-' + i"
              :header="'Top ' + i"
              headerClass="vote-column-header"
              bodyClass="vote-column-cell"
              :style="{ textAlign: 'center', width: '60px' }"
            >
              <template #body="slotProps">
                <Tag
                  :value="getVoteCount(slotProps.data)['top' + i] || 0"
                  :severity="getVoteCount(slotProps.data)['top' + i] > 0 ? 'primary' : 'secondary'"
                  rounded
                />
              </template>
            </Column>
            <Column header="Total" headerClass="vote-total-header" bodyClass="vote-total-cell" :style="{ textAlign: 'center', width: '70px' }">
              <template #body="slotProps">
                <Tag
                  :value="getVoteCount(slotProps.data).total || 0"
                  severity="contrast"
                  rounded
                  class="font-semibold"
                />
              </template>
            </Column>
          </DataTable>
          <VotationPlaceCards class="mobile-place-cards" :places="pfp4MediumPlaces" :selected-places="selectedPlaces" :votes-aggregation="votesAggregation" :missing-criteria="pfp4MissingCriteria" :admin-preview="isAdminPreview" @select="selectPlaceForRank" />
        </div>

        <!-- SECTION AUTRES PLACES -->
        <div v-if="pfp4OtherPlaces.length > 0" class="pfp4-section pfp4-section-other mb-4">
          <div class="pfp4-section-header pfp4-section-header-other">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-list text-xl"></i>
              <span class="font-bold text-lg">Autres places disponibles</span>
              <Tag :value="pfp4OtherPlaces.length + ' places'" severity="secondary" class="ml-2" />
            </div>
            <span class="text-sm opacity-80"
              >Ne couvrent aucun critère manquant mais restent disponibles</span
            >
          </div>
          <DataTable
            :value="pfp4OtherPlaces"
            class="modern-votation-table pfp4-table-other desktop-place-table"
            responsiveLayout="scroll"
            :scrollable="true"
            :rowHover="true"
          >
            <Column header="Institution" field="InstitutionName" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <a target="_blank" :href="slotProps.data.url" class="institution-link"
                  ><i class="pi pi-building mr-2"></i
                  >{{ slotProps.data.InstitutionName || 'Non spécifié' }}</a
                >
              </template>
            </Column>
            <Column header="Place" field="NomPlace" :style="{ minWidth: '160px' }">
              <template #body="slotProps"
                ><div class="place-name">{{ slotProps.data.NomPlace }}</div></template
              >
            </Column>
            <Column header="Critères" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <div class="criteria-tags">
                  <template
                    v-for="cr in ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU']"
                    :key="cr"
                  >
                    <Tag
                      v-if="slotProps.data[cr]"
                      :value="cr"
                      severity="success"
                      class="mr-1 mb-1"
                    />
                  </template>
                </div>
              </template>
            </Column>
            <Column header="Langues" :style="{ width: '100px' }">
              <template #body="slotProps">
                <div class="language-tags">
                  <Tag v-if="slotProps.data.FR" value="FR" severity="warning" class="mr-1" />
                  <Tag v-if="slotProps.data.DE" value="DE" severity="warning" class="mr-1" />
                </div>
              </template>
            </Column>
            <Column
              v-for="i in 5"
              :key="'oc-' + i"
              :header="'Choix ' + i"
              headerClass="choice-column-header"
              bodyClass="choice-column-cell"
              :style="{ textAlign: 'center', width: '75px' }"
            >
              <template #body="slotProps">
                <div class="radio-wrapper">
                  <RadioButton
                    v-model="selectedPlaces[i - 1]"
                    :value="slotProps.data"
                    :disabled="isPlaceDisabled(slotProps.data, i - 1)"
                    @click="onRadioClick(slotProps.data, i - 1, $event)"
                  />
                </div>
              </template>
            </Column>
            <Column
              v-for="i in 5"
              :key="'ov-' + i"
              :header="'Top ' + i"
              headerClass="vote-column-header"
              bodyClass="vote-column-cell"
              :style="{ textAlign: 'center', width: '60px' }"
            >
              <template #body="slotProps">
                <Tag
                  :value="getVoteCount(slotProps.data)['top' + i] || 0"
                  :severity="getVoteCount(slotProps.data)['top' + i] > 0 ? 'primary' : 'secondary'"
                  rounded
                />
              </template>
            </Column>
            <Column header="Total" headerClass="vote-total-header" bodyClass="vote-total-cell" :style="{ textAlign: 'center', width: '70px' }">
              <template #body="slotProps">
                <Tag
                  :value="getVoteCount(slotProps.data).total || 0"
                  severity="contrast"
                  rounded
                  class="font-semibold"
                />
              </template>
            </Column>
          </DataTable>
          <VotationPlaceCards class="mobile-place-cards" :places="pfp4OtherPlaces" :selected-places="selectedPlaces" :votes-aggregation="votesAggregation" :admin-preview="isAdminPreview" @select="selectPlaceForRank" />
        </div>
      </div>

      <!-- ═══ MODE CLASSIQUE (pas de sections PFP4) ═══ -->
      <div v-else-if="availablePlaces.length > 0" class="content-wrapper">
        <DataTable
          :value="filteredAvailablePlaces"
          class="modern-votation-table desktop-place-table"
          responsiveLayout="scroll"
          :scrollable="true"
          scrollHeight="65vh"
          :rowHover="true"
          stripedRows
        >
          <Column
            header="Institution"
            sortable
            field="InstitutionName"
            :style="{ minWidth: '200px' }"
          >
            <template #body="slotProps">
              <a target="_blank" :href="`${slotProps.data.url}`" class="institution-link">
                <i class="pi pi-building mr-2"></i>
                <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
              </a>
            </template>
          </Column>
          <Column header="Nom de la Place" sortable field="NomPlace" :style="{ minWidth: '180px' }">
            <template #body="slotProps">
              <div class="place-name">{{ slotProps.data.NomPlace }}</div>
            </template>
          </Column>
          <Column header="Catégorie" sortable field="InstitutionCategory">
            <template #body="slotProps">
              <Tag :value="slotProps.data.InstitutionCategory" severity="info" />
            </template>
          </Column>
          <Column header="Critères" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <div class="criteria-tags">
                <Tag v-if="slotProps.data.MSQ" value="MSQ" severity="success" class="mr-1 mb-1" />
                <Tag
                  v-if="slotProps.data.SYSINT"
                  value="SYSINT"
                  severity="success"
                  class="mr-1 mb-1"
                />
                <Tag
                  v-if="slotProps.data.NEUROGER"
                  value="NEUROGER"
                  severity="success"
                  class="mr-1 mb-1"
                />
                <Tag v-if="slotProps.data.AIGU" value="AIGU" severity="success" class="mr-1 mb-1" />
                <Tag
                  v-if="slotProps.data.REHAB"
                  value="REHAB"
                  severity="success"
                  class="mr-1 mb-1"
                />
                <Tag v-if="slotProps.data.AMBU" value="AMBU" severity="success" class="mr-1 mb-1" />
                <span
                  v-if="
                    !slotProps.data.MSQ &&
                    !slotProps.data.SYSINT &&
                    !slotProps.data.NEUROGER &&
                    !slotProps.data.AIGU &&
                    !slotProps.data.REHAB &&
                    !slotProps.data.AMBU
                  "
                  class="text-500"
                  >-</span
                >
              </div>
            </template>
          </Column>
          <Column header="Langues">
            <template #body="slotProps">
              <div class="language-tags">
                <Tag v-if="slotProps.data.FR" value="FR" severity="warning" class="mr-1" />
                <Tag v-if="slotProps.data.DE" value="DE" severity="warning" class="mr-1" />
                <span v-if="!slotProps.data.FR && !slotProps.data.DE" class="text-500">-</span>
              </div>
            </template>
          </Column>
          <Column
            v-for="i in 5"
            :key="'choice-' + i"
            :header="'Choix ' + i"
            headerClass="choice-column-header"
            bodyClass="choice-column-cell"
            :style="{ textAlign: 'center', width: '80px' }"
          >
            <template #body="slotProps">
              <div class="radio-wrapper">
                <RadioButton
                  v-model="selectedPlaces[i - 1]"
                  :value="slotProps.data"
                  :disabled="isPlaceDisabled(slotProps.data, i - 1)"
                  @click="onRadioClick(slotProps.data, i - 1, $event)"
                />
              </div>
            </template>
          </Column>
          <Column
            v-for="i in 5"
            :key="'votes-' + i"
            :header="'Top ' + i"
            headerClass="vote-column-header"
            bodyClass="vote-column-cell"
            :style="{ textAlign: 'center', width: '70px' }"
          >
            <template #body="slotProps">
              <Tag
                :value="getVoteCount(slotProps.data)['top' + i] || 0"
                :severity="getVoteCount(slotProps.data)['top' + i] > 0 ? 'primary' : 'secondary'"
                rounded
              />
            </template>
          </Column>
          <Column header="Total" headerClass="vote-total-header" bodyClass="vote-total-cell" :style="{ textAlign: 'center', width: '80px' }">
            <template #body="slotProps">
              <Tag
                :value="getVoteCount(slotProps.data).total || 0"
                severity="contrast"
                rounded
                class="font-semibold"
              />
            </template>
          </Column>
        </DataTable>
        <VotationPlaceCards class="mobile-place-cards" :places="filteredAvailablePlaces" :selected-places="selectedPlaces" :votes-aggregation="votesAggregation" :admin-preview="isAdminPreview" @select="selectPlaceForRank" />
      </div>
      <div v-else class="empty-state">
        <i class="pi pi-inbox empty-icon"></i>
        <h3>Aucune place proposée pour cette session</h3>
        <p class="text-600" v-if="isAdminPreview">
          La campagne {{ targetPFP }} — {{ selectedYear }} est ouverte, mais son aperçu ne contient actuellement aucune capacité proposée.
        </p>
        <p class="text-600" v-else>
          La campagne {{ targetPFP }} — {{ selectedYear }} est ouverte, mais aucune place n’est actuellement proposée à votre profil. Actualisez la page ou contactez le secrétariat si cette situation persiste.
        </p>
        <PrimeButton label="Actualiser" icon="pi pi-refresh" outlined :loading="sessionRefreshInFlight" @click="refreshSessionAndData" />
      </div>

      <!-- Tableau récapitulatif des choix -->
      <div
        class="recap-section"
        v-if="availablePlaces.length > 0 && selectedPlaces.some((p) => p !== null)"
      >
        <div class="recap-header">
          <i class="pi pi-list-check"></i>
          <h3>Récapitulatif de vos choix</h3>
        </div>
        <DataTable :value="selectedPlacesForRecap" class="recap-table" :rowHover="true">
          <Column header="Rang" :style="{ width: '80px', textAlign: 'center' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.rank" severity="primary" rounded class="font-semibold" />
            </template>
          </Column>
          <Column header="Institution" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <div class="recap-institution">
                <i class="pi pi-building mr-2"></i>
                <span>{{ slotProps.data.InstitutionName }}</span>
              </div>
            </template>
          </Column>
          <Column header="Nom de la Place" :style="{ minWidth: '180px' }">
            <template #body="slotProps">
              <strong class="recap-place-name">{{ slotProps.data.NomPlace }}</strong>
            </template>
          </Column>
          <Column header="Catégorie">
            <template #body="slotProps">
              <Tag :value="slotProps.data.InstitutionCategory" severity="info" />
            </template>
          </Column>
          <Column header="Critères" :style="{ minWidth: '180px' }">
            <template #body="slotProps">
              <div class="criteria-tags">
                <Tag v-if="slotProps.data.MSQ" value="MSQ" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.SYSINT" value="SYSINT" severity="success" class="mr-1" />
                <Tag
                  v-if="slotProps.data.NEUROGER"
                  value="NEUROGER"
                  severity="success"
                  class="mr-1"
                />
                <Tag v-if="slotProps.data.AIGU" value="AIGU" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.REHAB" value="REHAB" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.AMBU" value="AMBU" severity="success" class="mr-1" />
              </div>
            </template>
          </Column>
          <Column header="Action" :style="{ width: '100px', textAlign: 'center' }">
            <template #body="slotProps">
              <PrimeButton
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                @click="removeChoice(slotProps.data.index)"
                v-tooltip.top="'Retirer ce choix'"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Action de vote -->
      <div class="vote-action-section" v-if="!isAdminPreview && availablePlaces.length > 0">
        <div class="vote-submit">
          <div class="vote-info" :class="{ 'vote-info-updated': voteAlreadyCast }">
            <i :class="voteAlreadyCast ? 'pi pi-check-circle' : 'pi pi-info-circle'"></i>
            <span v-if="!voteAlreadyCast"
              >Sélectionnez jusqu'à 5 places par ordre de préférence</span
            >
            <span v-else
              >Modifiez vos choix et cliquez sur "Mettre à jour" pour enregistrer les
              changements</span
            >
          </div>
          <PrimeButton
            :label="voteAlreadyCast ? 'Mettre à jour mon vote' : 'Envoyer mon vote'"
            :icon="voteAlreadyCast ? 'pi pi-refresh' : 'pi pi-send'"
            @click="sendVote"
            size="large"
            :disabled="selectedPlaces.filter((p) => p !== null).length !== 5"
            :severity="voteAlreadyCast ? 'warning' : 'primary'"
          />
        </div>
      </div>
    </div>

    <!-- Dialogue de confirmation moderne -->
    <PrimeDialog
      v-model:visible="dialogVisible"
      :modal="true"
      :closable="false"
      :style="{ width: '450px' }"
      class="modern-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <i class="pi pi-check-circle" style="color: var(--green-500); font-size: 1.5rem"></i>
          <span class="font-semibold">Confirmation</span>
        </div>
      </template>
      <p class="dialog-message">{{ dialogMessage }}</p>
      <template #footer>
        <PrimeButton label="OK" icon="pi pi-check" @click="closeDialog" autofocus />
      </template>
    </PrimeDialog>
  </AdminLayout>
</template>

<script>
import { getAcademicYearKeys } from '@/domain/pfp/academicPeriod'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import RadioButton from 'primevue/radiobutton'
import PrimeDialog from 'primevue/dialog'
import PrimeButton from 'primevue/button'
import Tag from 'primevue/tag'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import VotationPlaceCards from '@/components/votation/VotationPlaceCards.vue'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { useUserStore } from '@/stores/userStore'
import { useRoleStore } from '@/stores/role'
import { canPreviewVotation, selectPreviewSession } from '@/domain/pfp/votationAdminPreview'
import { useVotesStore } from '@/stores/votesStore'
import { mapStores } from 'pinia'
import votesBackendService from '@/service/votesBackendService'
import votationSessionService from '@/service/votationSessionService'
import resultatVotationService from '@/service/resultatVotationService'
import { getExistingCampaignAssignment } from '@/service/votationEligibilityService'
import { supabase } from '@/supabase'
import {
  computeAggregatedCriteriaFromSources,
  extractStudentsPhysioFieldEntries,
  normalizeProfileStageEntries,
  parseBooleanFlag,
  parsePfpEntries
} from '@/utils/profileStages'

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
const DEBUG_VOTATION = import.meta.env.VITE_DEBUG_VOTATION === 'true'
const debugVotation = (...args) => {
  if (DEBUG_VOTATION) console.debug(...args)
}

export default {
  name: 'VotationGenericView',
  components: {
    DataTable,
    Column,
    RadioButton,
    PrimeDialog,
    PrimeButton,
    Tag,
    AdminLayout,
    VotationPlaceCards
  },
  data() {
    return {
      places: [],
      expandedPFPData: [],
      selectedPlaces: [null, null, null, null, null],
      votedPlaces: [null, null, null, null, null],
      dialogVisible: false,
      dialogMessage: '',
      votesAggregation: {},
      selectedYear: null,
      targetPFP: null,
      isSubmitting: false,
      activeSession: null,
      existingCampaignAssignment: null,
      assignmentEligibilityChecked: false,
      assignmentCheckError: '',
      sessionLoading: true,
      sessionRefreshInFlight: false,
      previewSessions: [],
      previewSessionId: null,
      previewError: '',
      refreshRequested: false,
      previewGeneration: 0,
      pfp4ProposedPlaceIds: null,
      pfp4AssignCountByPlace: {},
      offerSeatCountByPlace: {},
      offerOccupiedSeatCountByPlace: {},
      useOfferSeatActivation: false,
      completedPlaceIds: [],
      visitedPlaceIds: [],
      completedStageCount: 0,
      pfp4MissingCriteria: [],
      pfp4AppliedRule: null,
      placeSearchQuery: ''
    }
  },
  computed: {
    ...mapStores(usePlacesStore, useInstitutionsStore, useUserStore, useVotesStore, useRoleStore),

    isAdminPreview() {
      return canPreviewVotation(this.userStore.user, this.roleStore)
    },

    votingAccessBlocked() {
      return this.assignmentEligibilityChecked && (
        Boolean(this.existingCampaignAssignment) || Boolean(this.assignmentCheckError)
      )
    },

    availablePlaces() {
      return this.expandedPFPData
    },
    filteredAvailablePlaces() {
      const query = this.normalizeLookupValue(this.placeSearchQuery)
      if (!query) return this.expandedPFPData
      return this.expandedPFPData.filter((place) => {
        const searchable = [
          place.InstitutionName,
          place.NomPlace,
          place.InstitutionCategory,
          ...CRITERIA_KEYS.filter((criterion) => place[criterion])
        ].map((value) => this.normalizeLookupValue(value)).join(' ')
        return searchable.includes(query)
      })
    },
    selectionCount() {
      return this.selectedPlaces.filter(Boolean).length
    },
    adminInstitutionCount() {
      return new Set(this.expandedPFPData.map((place) => place.InstitutionId || place.InstitutionName).filter(Boolean)).size
    },
    voteAlreadyCast() {
      return this.votedPlaces[0] !== null
    },
    completedPlaceIdSet() {
      return new Set(
        (this.completedPlaceIds || []).map((id) => this.normalizePlaceId(id)).filter(Boolean)
      )
    },
    visitedPlaceIdSet() {
      return new Set(
        (this.visitedPlaceIds || []).map((id) => this.normalizePlaceId(id)).filter(Boolean)
      )
    },
    hasPfp4Sections() {
      return (
        !this.isAdminPreview &&
        (this.targetPFP === 'PFP4' || this.targetPFP === 'PFP3' || this.targetPFP === 'PFP2') &&
        this.pfp4MissingCriteria &&
        this.pfp4MissingCriteria.length > 0
      )
    },
    pfp4HighPlaces() {
      return this.filteredAvailablePlaces.filter((r) => r.pfp4Section === 'high')
    },
    pfp4MediumPlaces() {
      return this.filteredAvailablePlaces.filter((r) => r.pfp4Section === 'medium')
    },
    pfp4OtherPlaces() {
      return this.filteredAvailablePlaces.filter((r) => r.pfp4Section === 'other')
    },
    selectedPlacesForRecap() {
      return this.selectedPlaces
        .map((place, index) => {
          if (place) {
            return {
              ...place,
              rank: index + 1,
              index: index
            }
          }
          return null
        })
        .filter((p) => p !== null)
    }
  },
  methods: {
    goBackToProfile() {
      try {
        this.$router.back()
      } catch (e) {
        this.$router.push('/feed')
      }
    },

    async checkExistingCampaignAssignment() {
      this.existingCampaignAssignment = null
      this.assignmentEligibilityChecked = false
      this.assignmentCheckError = ''

      if (this.isAdminPreview || !this.activeSession) {
        this.assignmentEligibilityChecked = true
        return null
      }

      const userId = this.userStore.profile?.user_id || this.userStore.user?.id || null
      if (!userId) {
        this.assignmentCheckError = 'Utilisateur non identifié.'
        this.assignmentEligibilityChecked = true
        return null
      }

      try {
        this.existingCampaignAssignment = await getExistingCampaignAssignment({
          userId,
          pfpType: this.targetPFP,
          year: this.selectedYear
        })
        return this.existingCampaignAssignment
      } catch (error) {
        console.error('Impossible de vérifier une affectation existante:', error)
        this.assignmentCheckError = 'Vérification impossible.'
        return null
      } finally {
        this.assignmentEligibilityChecked = true
      }
    },

    getAcademicYearKeys(year) {
      return getAcademicYearKeys(year)
    },

    getValueForYearKey(source, year) {
      if (!source || typeof source !== 'object') return undefined
      const yearKeys = this.getAcademicYearKeys(year)
      for (const yearKey of yearKeys) {
        if (Object.prototype.hasOwnProperty.call(source, yearKey)) {
          return source[yearKey]
        }
      }
      return undefined
    },

    normalizeId(value) {
      return value === null || value === undefined ? '' : String(value)
    },

    normalizePlaceId(value) {
      if (value === null || value === undefined) return null
      const normalized = String(value).trim()
      return normalized.length > 0 ? normalized : null
    },

    normalizeLookupValue(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
    },

    resolvePlaceId(value) {
      if (value && typeof value === 'object') {
        return this.normalizePlaceId(
          value.PlaceId ??
            value.IDPlace ??
            value.ID_PFP ??
            value.id_pfp ??
            value.assigned_place_id ??
            null
        )
      }
      return this.normalizePlaceId(value)
    },

    getPlaceInstitutionName(place) {
      return (
        place?.InstitutionName ||
        place?.Institution ||
        this.institutionsStore.getInstitutionNameById(place?.InstitutionId) ||
        ''
      )
    },

    getStagePlaceName(stage) {
      return this.normalizeLookupValue(
        stage?.NomPlace ||
          stage?.nom_pfp ||
          stage?.Nom_PFP ||
          stage?.selected_stage_name ||
          stage?.nom_complet_pfp ||
          stage?.domaine ||
          stage?.Domaine
      )
    },

    getStageInstitutionName(stage) {
      const explicitInstitutionName =
        stage?.InstitutionName || stage?.institution_name || stage?.Institution || ''

      if (explicitInstitutionName) {
        return this.normalizeLookupValue(explicitInstitutionName)
      }

      const fullLabel = String(stage?.nom_complet_pfp || stage?.Nom_Complet_PFP || '').trim()
      const rawPlaceName =
        stage?.NomPlace || stage?.nom_pfp || stage?.Nom_PFP || stage?.selected_stage_name || ''

      if (!fullLabel || !rawPlaceName) return ''

      const normalizedFullLabel = this.normalizeLookupValue(fullLabel)
      const normalizedPlaceName = this.normalizeLookupValue(rawPlaceName)
      if (!normalizedFullLabel.startsWith(normalizedPlaceName)) return ''

      return this.normalizeLookupValue(fullLabel.slice(rawPlaceName.length))
    },

    getUniquePlaces() {
      const seen = new Set()
      const uniquePlaces = []
      ;(this.places || []).forEach((place) => {
        if (!place) return
        const placeId = this.resolvePlaceId(place)
        const dedupKey =
          placeId ||
          `${this.getStagePlaceName(place)}__${this.normalizeLookupValue(this.getPlaceInstitutionName(place))}`
        if (!dedupKey || seen.has(dedupKey)) return
        seen.add(dedupKey)
        uniquePlaces.push(place)
      })
      return uniquePlaces
    },

    getPlaceByResolvedId(placeId) {
      const resolvedId = this.resolvePlaceId(placeId)
      if (!resolvedId) return null
      return this.places.find((place) => this.resolvePlaceId(place) === resolvedId) || null
    },

    getPlaceFromStage(stage) {
      const targetPlaceName = this.getStagePlaceName(stage)
      const explicitInstitutionId =
        stage?.InstitutionId || stage?.Institution_id || stage?.institution_id || null
      const targetInstitutionName = this.getStageInstitutionName(stage)

      const idCandidates = [
        this.resolvePlaceId(stage),
        stage?.selected_places,
        stage?.selected_stage_id,
        stage?.id
      ]

      for (const candidate of idCandidates) {
        const place = this.getPlaceByResolvedId(candidate)
        if (!place) continue
        if (!targetPlaceName) return place

        const resolvedPlaceName = this.getStagePlaceName(place)
        if (resolvedPlaceName === targetPlaceName) return place
      }

      if (!targetPlaceName) return null

      const targetInstitutionId =
        explicitInstitutionId ||
        stage?.id_pfp ||
        stage?.ID_PFP ||
        null

      return (
        this.getUniquePlaces().find((place) => {
          const placeName = this.getStagePlaceName(place)
          if (placeName !== targetPlaceName) return false

          if (targetInstitutionId) {
            return String(place?.InstitutionId || place?.institution_id || '') === String(targetInstitutionId)
          }

          if (targetInstitutionName) {
            return (
              this.normalizeLookupValue(this.getPlaceInstitutionName(place)) ===
              targetInstitutionName
            )
          }

          return true
        }) || null
      )
    },

    getPlaceCapacityFieldData(place) {
      const pfpFieldCandidates = [
        `${String(this.targetPFP || '').toLowerCase()}_proposition`,
        this.targetPFP
      ]

      for (const field of pfpFieldCandidates) {
        const value = place?.[field]
        if (value && typeof value === 'object') {
          return { field, data: value }
        }
      }

      return null
    },

    getOfferSeatPrefix() {
      const targetClass = String(
        this.activeSession?.target_class || this.userStore?.profile?.classe || ''
      ).trim()
      const normalizedPfp =
        this.targetPFP === 'PFP1A' || this.targetPFP === 'PFP1B' ? 'PFP1' : this.targetPFP
      if (!targetClass || !normalizedPfp) return null
      return {
        active: `selectedActive${targetClass}${normalizedPfp}-`,
        student: `selectedEtudiant${targetClass}${normalizedPfp}-`
      }
    },

    computeOfferSeatAvailability() {
      const prefixes = this.getOfferSeatPrefix()
      const activeCountByPlace = {}
      const occupiedCountByPlace = {}
      let foundOfferFields = false

      if (!prefixes) {
        return { activeCountByPlace, occupiedCountByPlace, foundOfferFields }
      }

      this.places.forEach((place) => {
        const placeId = place?.PlaceId
        if (!placeId) return

        let activeCount = 0
        let occupiedCount = 0
        const keys = Object.keys(place || {})
        const activeSeatKeys = keys.filter((key) => key.startsWith(prefixes.active))

        activeSeatKeys.forEach((activeKey) => {
          const seatSuffix = activeKey.slice(prefixes.active.length)
          const isActive = place[activeKey] === true || place[activeKey] === 'true'
          if (!isActive) return

          activeCount += 1
          const studentKey = `${prefixes.student}${seatSuffix}`
          const studentValue = place[studentKey]
          if (
            studentValue !== undefined &&
            studentValue !== null &&
            String(studentValue).trim() !== ''
          ) {
            occupiedCount += 1
          }
        })

        const fieldEntry = this.getPlaceCapacityFieldData(place)
        const fieldData = fieldEntry?.data || null
        const nestedAssignations =
          fieldData?.assignations && typeof fieldData.assignations === 'object'
            ? fieldData.assignations
            : null

        if (nestedAssignations) {
          const targetClass = String(
            this.activeSession?.target_class || this.userStore?.profile?.classe || ''
          ).trim()
          const nestedEntries = Object.entries(nestedAssignations).filter(([seatKey]) => {
            if (!targetClass) return true
            return String(seatKey || '').startsWith(`${targetClass}-`)
          })

          if (nestedEntries.length > 0) {
            foundOfferFields = true
          }

          let nestedActiveCount = 0
          let nestedOccupiedCount = 0

          nestedEntries.forEach(([, seatData]) => {
            const isActive = seatData?.active === true || seatData?.active === 'true'
            if (!isActive) return

            nestedActiveCount += 1
            const studentValue = seatData?.etudiant
            if (
              studentValue !== undefined &&
              studentValue !== null &&
              String(studentValue).trim() !== ''
            ) {
              nestedOccupiedCount += 1
            }
          })

          activeCount = Math.max(activeCount, nestedActiveCount)
          occupiedCount = Math.max(occupiedCount, nestedOccupiedCount)
        }

        if (activeSeatKeys.length > 0) {
          foundOfferFields = true
        }

        if (activeCount > 0 || occupiedCount > 0) {
          activeCountByPlace[placeId] = activeCount
          occupiedCountByPlace[placeId] = occupiedCount
        }
      })

      return { activeCountByPlace, occupiedCountByPlace, foundOfferFields }
    },

    parsePfpValided(pfpVal) {
      return normalizeProfileStageEntries(parsePfpEntries(pfpVal))
    },

    extractProfileStageEntries(rows) {
      if (!Array.isArray(rows) || rows.length === 0) return []

      const entries = []
      rows.forEach((row) => {
        entries.push(...this.parsePfpValided(row?.pfp_valided))

        const pfp2Val = row?.pfp2_data
        if (Array.isArray(pfp2Val)) {
          entries.push(...pfp2Val)
        } else if (pfp2Val && typeof pfp2Val === 'object') {
          entries.push(pfp2Val)
        }
      })

      return entries.filter((entry) => entry && typeof entry === 'object')
    },

    extractStudentsPhysioPfpValidedEntries(rows) {
      if (!Array.isArray(rows) || rows.length === 0) return []
      const entries = []
      rows.forEach((row) => {
        entries.push(...this.parsePfpValided(row?.pfp_valided))
      })
      return entries.filter((entry) => entry && typeof entry === 'object')
    },

    buildMergedStudentsPhysioProfile(rows) {
      if (!Array.isArray(rows) || rows.length === 0) return null

      const sortedRows = [...rows].sort((a, b) =>
        String(b?.updated_at || b?.year || '').localeCompare(String(a?.updated_at || a?.year || ''))
      )
      const latestRow = sortedRows[0] || null
      if (!latestRow) return null

      return {
        ...latestRow,
        pfp_valided: extractStudentsPhysioFieldEntries(sortedRows, ['pfp_valided']),
        pfp2_data: extractStudentsPhysioFieldEntries(sortedRows, ['pfp2_data'])
      }
    },

    extractCriteriaFromObject(obj) {
      if (!obj) return {}
      const criteria = {}
      CRITERIA_KEYS.forEach((key) => {
        const rawValue =
          obj[key] !== undefined && obj[key] !== null ? obj[key] : obj[key.toLowerCase()]
        criteria[key] =
          rawValue === true ||
          rawValue === 1 ||
          rawValue === '1' ||
          (typeof rawValue === 'string' && rawValue.toLowerCase() === 'true')
      })
      return criteria
    },

    markValidatedCriteria(target, source) {
      if (!source) return
      const criteria = this.extractCriteriaFromObject(source)
      CRITERIA_KEYS.forEach((key) => {
        if (criteria[key]) {
          target[key] = true
        }
      })
    },

    computeValidatedCriteriaMap(physioRows = [], assignments = []) {
      const mergedUserProfile = this.buildMergedStudentsPhysioProfile(physioRows)
      return computeAggregatedCriteriaFromSources({
        studentResultVotes: assignments || [],
        userProfile: mergedUserProfile,
        studentPfpList: extractStudentsPhysioFieldEntries(physioRows, ['pfp_valided', 'pfp2_data']),
        resolvePlaceFromStage: (stage) => this.getPlaceFromStage(stage),
        criteriaKeys: CRITERIA_KEYS
      })
    },

    extractStudentsPhysioPfp2Entries(rows) {
      if (!Array.isArray(rows) || rows.length === 0) return []
      const entries = []
      rows.forEach((row) => {
        const pfp2Val = row?.pfp2_data
        if (Array.isArray(pfp2Val)) {
          entries.push(...pfp2Val)
        } else if (pfp2Val && typeof pfp2Val === 'object') {
          entries.push(pfp2Val)
        }
      })
      return entries
    },

    getPriorityMissingCriteria() {
      const missing = this.pfp4MissingCriteria || []
      if (this.completedStageCount === 1) {
        return missing
      }
      if (this.completedStageCount < 2) {
        return missing.filter((criteria) => criteria !== 'DE')
      }
      return missing
    },

    isValidatedLegacyStage(stage) {
      if (!stage || typeof stage !== 'object') return false
      const rawStatus = String(stage.status || stage.Status || '').trim().toLowerCase()
      if (rawStatus) return rawStatus === 'validee' || rawStatus === 'validée'
      return true
    },

    async loadCompletedPlaceIds() {
      const userId = this.userStore.profile?.user_id || this.userStore.user?.id || null
      if (!userId) {
        this.completedPlaceIds = []
        this.visitedPlaceIds = []
        this.completedStageCount = 0
        return
      }

      const [physioResult, assignmentsResult] = await Promise.all([
        supabase.from('StudentsPhysio').select('pfp_valided, pfp2_data').eq('user_id', userId),
        supabase
          .from('student_result_vote')
          .select('assigned_place_id, pfp_validee')
          .eq('user_id', userId)
          .not('assigned_place_id', 'is', null)
      ])

      if (physioResult.error) throw physioResult.error
      if (assignmentsResult.error) throw assignmentsResult.error

      const completed = new Set()
      const visited = new Set()
      const physioStages = this.extractProfileStageEntries(physioResult.data || [])

      physioStages.forEach((stage) => {
        const placeId = this.resolvePlaceId(this.getPlaceFromStage(stage) || stage)
        if (placeId) visited.add(String(placeId))
        if (!this.isValidatedLegacyStage(stage)) return
        if (placeId) completed.add(String(placeId))
      })
      ;(assignmentsResult.data || []).forEach((row) => {
        const placeId = this.resolvePlaceId(row)
        if (placeId) visited.add(placeId)
        if (placeId && row.pfp_validee === true) completed.add(placeId)
      })

      this.completedPlaceIds = Array.from(completed)
      this.visitedPlaceIds = Array.from(visited)
      this.completedStageCount = this.completedPlaceIds.length
    },

    async loadMissingCriteriaFromStudentData(options = {}) {
      const { preserveAppliedRule = false } = options
      const userId = this.userStore.profile?.user_id || this.userStore.user?.id || null
      if (!userId) {
        this.pfp4MissingCriteria = []
        if (!preserveAppliedRule) {
          this.pfp4AppliedRule = null
        }
        return []
      }

      const [physioResult, assignmentsResult] = await Promise.all([
        supabase
          .from('StudentsPhysio')
          .select('pfp_valided, pfp2_data, year')
          .eq('user_id', userId)
          .order('year', { ascending: false }),
        supabase
          .from('student_result_vote')
          .select('pfp_type, assigned_place_id, pfp_validee')
          .eq('user_id', userId)
      ])

      if (physioResult.error) {
        throw physioResult.error
      }
      if (assignmentsResult.error) {
        throw assignmentsResult.error
      }

      const physioRows = Array.isArray(physioResult.data) ? physioResult.data : []
      const validatedMap = this.computeValidatedCriteriaMap(
        physioRows,
        assignmentsResult.data || []
      )
      const missingCriteria = CRITERIA_KEYS.filter((key) => !validatedMap[key])
      this.pfp4MissingCriteria = missingCriteria
      if (!preserveAppliedRule) {
        this.pfp4AppliedRule =
          this.targetPFP === 'PFP3' ? 'PFP3_CRITERIA_SORT_LOCAL' : this.pfp4AppliedRule
      }
      debugVotation(`🎯 ${this.targetPFP} critères manquants calculés:`, missingCriteria)
      return missingCriteria
    },

    async loadProposalsFromSessionDirect() {
      const userId = this.userStore.profile?.user_id || this.userStore.user?.id || null
      if (!userId || !this.targetPFP || !this.selectedYear) {
        return null
      }

      const activeMap = this.activeSession?.pfp4_proposals
      if (activeMap && typeof activeMap === 'object') {
        const directStudentProposal = activeMap[userId] || null
        return {
          proposedPlaceIds: directStudentProposal?.placeIds || null,
          missingCriteria: directStudentProposal?.missingCriteria || [],
          appliedRule: directStudentProposal?.appliedRule || null,
          assignCounts: activeMap._assignCounts || {}
        }
      }

      let query = supabase
        .from('votation_sessions')
        .select('id, pfp4_proposals, created_at')
        .eq('pfp_type', this.targetPFP)
        .eq('year', this.selectedYear)

      if (this.activeSession?.target_class) {
        query = query.eq('target_class', this.activeSession.target_class)
      }

      const { data: sessions, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw error
      }

      const session = Array.isArray(sessions) ? sessions[0] : null
      const map = session?.pfp4_proposals || {}
      const studentProposal = map[userId] || null

      return {
        proposedPlaceIds: studentProposal?.placeIds || null,
        missingCriteria: studentProposal?.missingCriteria || [],
        appliedRule: studentProposal?.appliedRule || null,
        assignCounts: map._assignCounts || {}
      }
    },

    async refreshSessionAndData() {
      this.previewGeneration++
      if (this.sessionRefreshInFlight) {
        this.refreshRequested = true
        this.expandedPFPData = []
        return
      }
      this.sessionRefreshInFlight = true
      try {
        if (this.isAdminPreview) {
          await this.refreshAdminPreview()
          return
        }
        await this.loadSession()
        if (this.activeSession) {
          await this.checkExistingCampaignAssignment()
          if (!this.votingAccessBlocked) {
            await this.fetchData()
          } else {
            this.places = []
            this.expandedPFPData = []
            this.selectedPlaces = Array(5).fill(null)
          }
        } else {
          this.targetPFP = null
          this.selectedYear = null
          this.places = []
          this.expandedPFPData = []
        }
      } finally {
        this.sessionRefreshInFlight = false
        if (this.refreshRequested) {
          this.refreshRequested = false
          await this.refreshSessionAndData()
        }
      }
    },

    async refreshAdminPreview() {
      const generation = this.previewGeneration
      const userId = this.userStore.user?.id
      const isCurrent = () => generation === this.previewGeneration && this.isAdminPreview && this.userStore.user?.id === userId
      this.sessionLoading = true
      this.previewError = ''
      this.activeSession = null
      this.targetPFP = null
      this.selectedYear = null
      this.places = []
      this.expandedPFPData = []
      this.selectedPlaces = Array(5).fill(null)
      this.votedPlaces = Array(5).fill(null)
      this.completedPlaceIds = []
      this.visitedPlaceIds = []
      this.pfp4ProposedPlaceIds = null
      this.pfp4MissingCriteria = []
      this.pfp4AssignCountByPlace = {}
      this.offerSeatCountByPlace = {}
      this.offerOccupiedSeatCountByPlace = {}
      this.useOfferSeatActivation = false
      this.votesAggregation = {}
      try {
        const sessions = await votationSessionService.getAllActiveSessions()
        if (!isCurrent()) return
        this.previewSessions = sessions.filter((session) => session.status === 'open')
        const session = selectPreviewSession(this.previewSessions, this.previewSessionId)
        this.previewSessionId = session?.id || null
        if (!session) return
        await Promise.all([
          this.institutionsStore.fetchInstitutions(),
          this.placesStore.fetchPlaces({ force: true })
        ])
        // Recheck after data loading: a campaign may have closed in the meantime.
        const currentSessions = await votationSessionService.getAllActiveSessions()
        if (!isCurrent()) return
        this.previewSessions = currentSessions.filter((item) => item.status === 'open')
        if (!this.previewSessions.some((item) => item.id === session.id)) return
        const institutions = new Map(this.institutionsStore.institutions.map((item) => [item.InstitutionId, item]))
        this.places = this.placesStore.places.map((place) => ({
          ...place,
          InstitutionName: institutions.get(place.InstitutionId)?.Name || place.InstitutionName || 'Inconnu',
          InstitutionCategory: institutions.get(place.InstitutionId)?.Category || 'Non spécifié',
          url: place.InstitutionId
            ? `/institution/${encodeURIComponent(place.InstitutionId)}`
            : null,
          ...Object.fromEntries(CRITERIA_KEYS.map((key) => [key, parseBooleanFlag(place[key])]))
        }))
        this.activeSession = session
        this.targetPFP = session.pfp_type
        this.selectedYear = session.year

        const offerAvailability = this.computeOfferSeatAvailability()
        this.offerSeatCountByPlace = offerAvailability.activeCountByPlace
        this.offerOccupiedSeatCountByPlace = offerAvailability.occupiedCountByPlace
        this.useOfferSeatActivation = offerAvailability.foundOfferFields
        this.pfp4AssignCountByPlace = await resultatVotationService.getAssignmentCounts(
          this.targetPFP,
          this.selectedYear
        )

        this.updateExpandedData()
      } catch (error) {
        if (isCurrent()) {
          this.previewSessions = []
          this.previewError = 'Impossible de charger l’aperçu. Réessayez avec Actualiser.'
        }
      } finally {
        this.sessionLoading = false
      }
    },

    async loadSession() {
      this.sessionLoading = true
      try {
        // Lire le pfpType depuis le paramètre de route
        const routePfpType = this.$route.params.pfpType
        const currentUserId = this.userStore.profile?.user_id || this.userStore.user?.id || null
        const currentUserIdNormalized = this.normalizeId(currentUserId)

        // Helper: filtre les sessions prioritaires pour l'étudiant courant
        const filterSessionForUser = (sessions) => {
          if (!sessions || sessions.length === 0) return null
          for (const session of sessions) {
            if (session.is_priority) {
              // Session prioritaire : seuls les étudiants dans priority_user_ids y ont accès
              const allowedIds = Array.isArray(session.priority_user_ids)
                ? session.priority_user_ids.map((id) => this.normalizeId(id))
                : []
              if (currentUserIdNormalized && allowedIds.includes(currentUserIdNormalized)) {
                return session
              }
              // Étudiant non-prioritaire → ignorer cette session
              continue
            }
            // Session normale → accessible à tous
            return session
          }
          return null
        }

        // Charger toutes les sessions ouvertes une seule fois
        const allSessions = await votationSessionService.getAllActiveSessions()
        debugVotation(
          '🔍 Sessions ouvertes:',
          allSessions.length,
          allSessions.map((s) => ({
            pfp_type: s.pfp_type,
            is_priority: s.is_priority,
            priority_user_ids: s.priority_user_ids?.length || 0
          }))
        )
        debugVotation('🔍 currentUserId:', currentUserId)

        if (routePfpType) {
          // Route générique /votation/:pfpType — chercher la session pour ce PFP
          const routePfpTypeNormalized = String(routePfpType || '').toUpperCase()
          const matching = allSessions.filter(
            (s) => String(s.pfp_type || '').toUpperCase() === routePfpTypeNormalized
          )
          this.activeSession = filterSessionForUser(matching)
        } else {
          // Routes legacy /votation ou /votation_pfp1b
          const routeName = this.$route.name
          let pfpHint = null
          if (routeName === 'VotationView' || routeName === 'VotationViewLegacy') {
            pfpHint = 'PFP1A'
          } else if (routeName === 'VotationViewPFP1B' || routeName === 'VotationViewPFP1BLegacy') {
            pfpHint = 'PFP1B'
          }

          if (pfpHint) {
            const matching = allSessions.filter((s) => s.pfp_type === pfpHint)
            debugVotation(`🔍 Recherche session pour ${pfpHint}:`, matching.length, 'trouvée(s)')
            this.activeSession = filterSessionForUser(matching)
          }

          // Fallback : si aucune session trouvée, chercher si l'étudiant est dans une session prioritaire (tout PFP confondu)
          if (!this.activeSession && currentUserId) {
            debugVotation('🔍 Fallback: recherche session prioritaire pour cet étudiant...')
            const prioritySession = allSessions.find(
              (s) =>
                s.is_priority &&
                Array.isArray(s.priority_user_ids) &&
                s.priority_user_ids
                  .map((id) => this.normalizeId(id))
                  .includes(currentUserIdNormalized)
            )
            if (prioritySession) {
              debugVotation(
                `✅ Session prioritaire trouvée via fallback: ${prioritySession.pfp_type}`
              )
              this.activeSession = prioritySession
            }
          }

          // Fallback 2 : chercher par classe (user_profiles ou pfp_cohort)
          if (!this.activeSession) {
            const profile = this.userStore.profile
            const studentClass =
              profile?.Classe ||
              profile?.classe ||
              profile?.class ||
              profile?.Class ||
              profile?.pfp_cohort ||
              null
            if (studentClass) {
              debugVotation(`🔍 Fallback 2: recherche session pour classe ${studentClass}`)
              const classSessions = allSessions.filter((s) => s.target_class === studentClass)
              this.activeSession = filterSessionForUser(classSessions)
            }
          }

          // Fallback 3 : prendre la première session normale ouverte (non-prioritaire)
          if (!this.activeSession) {
            debugVotation('🔍 Fallback 3: recherche première session normale ouverte...')
            const normalSession = allSessions.find((s) => !s.is_priority)
            if (normalSession) {
              debugVotation(
                `✅ Session normale trouvée via fallback 3: ${normalSession.pfp_type} ${normalSession.year} (classe ${normalSession.target_class})`
              )
              this.activeSession = normalSession
            }
          }
        }

        if (this.activeSession) {
          this.targetPFP = this.activeSession.pfp_type
          this.selectedYear = this.activeSession.year
          debugVotation(
            `✅ Session active trouvée: ${this.targetPFP} ${this.selectedYear}${this.activeSession.is_priority ? ' (prioritaire)' : ''}`
          )
        } else {
          debugVotation('⚠️ Aucune session de votation active trouvée')
        }
      } catch (error) {
        console.error('❌ Erreur chargement session:', error)
        this.activeSession = null
      } finally {
        this.sessionLoading = false
      }
    },

    async fetchData() {
      if (!this.targetPFP || !this.selectedYear) return
      await this.institutionsStore.fetchInstitutions()
      await this.placesStore.fetchPlaces()
      await this.loadCompletedPlaceIds()

      await this.loadVoteStatistics()

      const rawPlaces = this.placesStore.places
      const institutionNameById = {}
      const institutionCategoryById = {}

      this.institutionsStore.institutions.forEach((inst) => {
        institutionNameById[inst.InstitutionId] = inst.Name
        institutionCategoryById[inst.InstitutionId] = inst.Category || 'Non spécifié'
      })

      this.places = rawPlaces.map((p) => {
        return {
          ...p,
          InstitutionName: institutionNameById[p.InstitutionId] || p.InstitutionName || 'Inconnu',
          InstitutionCategory: institutionCategoryById[p.InstitutionId] || 'Non spécifié',
          url: p.InstitutionId ? `/institution/${encodeURIComponent(p.InstitutionId)}` : null,
          MSQ: parseBooleanFlag(p.MSQ),
          SYSINT: parseBooleanFlag(p.SYSINT),
          NEUROGER: parseBooleanFlag(p.NEUROGER),
          AIGU: parseBooleanFlag(p.AIGU),
          REHAB: parseBooleanFlag(p.REHAB),
          AMBU: parseBooleanFlag(p.AMBU),
          FR: parseBooleanFlag(p.FR),
          DE: parseBooleanFlag(p.DE)
        }
      })

      this.pfp4ProposedPlaceIds = null
      this.pfp4AssignCountByPlace = {}
      this.offerSeatCountByPlace = {}
      this.offerOccupiedSeatCountByPlace = {}
      this.useOfferSeatActivation = false
      this.pfp4MissingCriteria = []
      this.pfp4AppliedRule = null

      const offerAvailability = this.computeOfferSeatAvailability()
      this.offerSeatCountByPlace = offerAvailability.activeCountByPlace
      this.offerOccupiedSeatCountByPlace = offerAvailability.occupiedCountByPlace
      this.useOfferSeatActivation = offerAvailability.foundOfferFields

      try {
        this.pfp4AssignCountByPlace = await resultatVotationService.getAssignmentCounts(
          this.targetPFP,
          this.selectedYear
        )
      } catch (assignmentReadError) {
        debugVotation(
          `⚠️ Lecture assignations ${this.targetPFP} via backend échouée:`,
          assignmentReadError.message
        )
        try {
          const fromSession = await this.loadProposalsFromSessionDirect()
          if (fromSession?.assignCounts && Object.keys(fromSession.assignCounts).length > 0) {
            this.pfp4AssignCountByPlace = fromSession.assignCounts
          } else {
            throw new Error('No session assignCounts available')
          }
        } catch (sessionFallbackError) {
          debugVotation(
            `⚠️ Lecture assignations ${this.targetPFP} via session échouée:`,
            sessionFallbackError.message
          )
          try {
            const { data: assignedRows, error: assignedError } = await supabase
              .from('student_result_vote')
              .select('assigned_place_id')
              .eq('pfp_type', this.targetPFP)
              .in('year', this.getAcademicYearKeys(this.selectedYear))
              .not('assigned_place_id', 'is', null)

            if (assignedError) {
              throw assignedError
            }

            const assignCountByPlace = {}
            ;(assignedRows || []).forEach((row) => {
              const placeId = row.assigned_place_id
              if (!placeId) return
              assignCountByPlace[placeId] = (assignCountByPlace[placeId] || 0) + 1
            })
            this.pfp4AssignCountByPlace = assignCountByPlace
          } catch (directReadError) {
            debugVotation(
              `⚠️ Lecture assignations ${this.targetPFP} via Supabase échouée:`,
              directReadError.message
            )
          }
        }
      }

      try {
        const fromSession = await this.loadProposalsFromSessionDirect()
        if (fromSession?.assignCounts && Object.keys(fromSession.assignCounts).length > 0) {
          Object.entries(fromSession.assignCounts).forEach(([placeId, value]) => {
            const n = Number(value) || 0
            if (!this.pfp4AssignCountByPlace[placeId] || this.pfp4AssignCountByPlace[placeId] < n) {
              this.pfp4AssignCountByPlace[placeId] = n
            }
          })
        }
      } catch (sessionCountsError) {
        debugVotation(
          `⚠️ Fusion assignations session ${this.targetPFP} échouée:`,
          sessionCountsError.message
        )
      }

      // Pour PFP4: charger les propositions personnalisées et les assignations existantes
      if (this.targetPFP === 'PFP4' && this.selectedYear) {
        try {
          const result = await resultatVotationService.getPfp4Proposals(
            this.selectedYear,
            this.activeSession?.target_class || null
          )
          this.pfp4ProposedPlaceIds = result.proposedPlaceIds
          const proposalAssignCounts = result.assignCounts || {}
          Object.entries(proposalAssignCounts).forEach(([placeId, value]) => {
            const nextValue = Number(value) || 0
            if (
              !this.pfp4AssignCountByPlace[placeId] ||
              this.pfp4AssignCountByPlace[placeId] < nextValue
            ) {
              this.pfp4AssignCountByPlace[placeId] = nextValue
            }
          })
          this.pfp4MissingCriteria = result.missingCriteria || []
          this.pfp4AppliedRule = result.appliedRule || null
          debugVotation(
            '🎯 PFP4 propositions chargées:',
            result.proposedPlaceIds
              ? result.proposedPlaceIds.length + ' places'
              : 'aucune (toutes visibles)'
          )
          debugVotation(
            '🎯 PFP4 critères manquants:',
            this.pfp4MissingCriteria,
            'règle:',
            this.pfp4AppliedRule
          )
          const totalSeats = Object.values(this.pfp4AssignCountByPlace).reduce((s, v) => s + v, 0)
          debugVotation(
            `🎯 PFP4 assignations existantes: ${Object.keys(this.pfp4AssignCountByPlace).length} places, ${totalSeats} sièges pris`
          )
        } catch (err) {
          debugVotation('⚠️ Impossible de charger les propositions PFP4:', err.message)
          this.pfp4ProposedPlaceIds = null
        }
      }

      if (this.targetPFP === 'PFP3') {
        try {
          const result = await resultatVotationService.getPfp3Proposals(
            this.selectedYear,
            this.activeSession?.target_class || null
          )
          this.pfp4ProposedPlaceIds = result.proposedPlaceIds
          const proposalAssignCounts = result.assignCounts || {}
          Object.entries(proposalAssignCounts).forEach(([placeId, value]) => {
            const nextValue = Number(value) || 0
            if (
              !this.pfp4AssignCountByPlace[placeId] ||
              this.pfp4AssignCountByPlace[placeId] < nextValue
            ) {
              this.pfp4AssignCountByPlace[placeId] = nextValue
            }
          })
          this.pfp4MissingCriteria = result.missingCriteria || []
          this.pfp4AppliedRule = result.appliedRule || null

          if (!this.pfp4MissingCriteria.length) {
            await this.loadMissingCriteriaFromStudentData()
          }

          debugVotation(
            '🎯 PFP3 propositions chargées:',
            result.proposedPlaceIds
              ? result.proposedPlaceIds.length + ' places'
              : 'aucune (fallback tri)'
          )
        } catch (err) {
          debugVotation('⚠️ Impossible de charger les propositions PFP3:', err.message)
          try {
            const direct = await this.loadProposalsFromSessionDirect()
            if (direct?.proposedPlaceIds && Array.isArray(direct.proposedPlaceIds)) {
              this.pfp4ProposedPlaceIds = direct.proposedPlaceIds
              if (direct.assignCounts && Object.keys(direct.assignCounts).length > 0) {
                this.pfp4AssignCountByPlace = {
                  ...this.pfp4AssignCountByPlace,
                  ...direct.assignCounts
                }
              }
              this.pfp4MissingCriteria = direct.missingCriteria || []
              this.pfp4AppliedRule = direct.appliedRule || null
              if (!this.pfp4MissingCriteria.length) {
                await this.loadMissingCriteriaFromStudentData()
              }
              debugVotation(
                '🎯 PFP3 propositions chargées via session:',
                this.pfp4ProposedPlaceIds.length
              )
            } else {
              await this.loadMissingCriteriaFromStudentData()
            }
          } catch (fallbackErr) {
            debugVotation(
              '⚠️ Impossible de charger les critères manquants PFP3:',
              fallbackErr.message
            )
            this.pfp4MissingCriteria = []
            this.pfp4AppliedRule = null
          }
        }
      }

      const savedMissingCriteriaSnapshot = [...(this.pfp4MissingCriteria || [])]

      if (
        !this.isAdminPreview &&
        (this.targetPFP === 'PFP2' || this.targetPFP === 'PFP3' || this.targetPFP === 'PFP4')
      ) {
        await this.loadMissingCriteriaFromStudentData({ preserveAppliedRule: true })

        const liveMissingCriteria = [...(this.pfp4MissingCriteria || [])].sort()
        const savedMissingCriteria = [...savedMissingCriteriaSnapshot].sort()
        if (
          this.pfp4ProposedPlaceIds &&
          JSON.stringify(liveMissingCriteria) !== JSON.stringify(savedMissingCriteria)
        ) {
          debugVotation(
            '♻️ Propositions sauvegardées ignorées: critères live différents des critères session',
            {
              targetPFP: this.targetPFP,
              savedMissingCriteria,
              liveMissingCriteria
            }
          )
          this.pfp4ProposedPlaceIds = null
          this.pfp4AppliedRule = this.targetPFP === 'PFP3' ? 'PFP3_CRITERIA_SORT_LOCAL' : null
        }
      }

      this.updateExpandedData()

      await this.checkExistingVote()
    },

    async loadVoteStatistics() {
      try {
        const aggregation = await votesBackendService.getVotePlaceAggregation(
          this.targetPFP,
          this.selectedYear
        )

        this.votesAggregation = {}

        aggregation.forEach((agg) => {
          const placeId = agg.place_id
          const rank = agg.rank
          const count = agg.vote_count

          if (!this.votesAggregation[placeId]) {
            this.votesAggregation[placeId] = {
              top1: 0,
              top2: 0,
              top3: 0,
              top4: 0,
              top5: 0,
              total: 0
            }
          }

          this.votesAggregation[placeId][`top${rank}`] = count
          this.votesAggregation[placeId].total += count
        })
      } catch (error) {
        console.error('❌ Erreur lors du chargement des statistiques:', error)
        this.votesAggregation = {}
      }
    },

    async checkExistingVote() {
      if (!this.userStore.user) return

      try {
        const existingVote = await this.votesStore.fetchVote(this.targetPFP, this.selectedYear)

        if (existingVote && existingVote.choices) {
          this.votedPlaces = [null, null, null, null, null]
          this.selectedPlaces = [null, null, null, null, null]

          if (Array.isArray(existingVote.choices)) {
            this.votedPlaces = existingVote.choices.map((c) => ({
              placeName: c.placeName || 'Inconnu',
              InstitutionName: c.InstitutionName || 'Inconnu'
            }))

            existingVote.choices.forEach((choice, index) => {
              const matchingPlace = this.expandedPFPData.find(
                (p) => p.PlaceId === choice.placeId && p.seatIndex === choice.seatIndex
              )

              if (matchingPlace) {
                this.selectedPlaces[index] = matchingPlace
              }
            })

            while (this.votedPlaces.length < 5) {
              this.votedPlaces.push(null)
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du vote:', error)
      }
    },

    updateExpandedData() {
      const rows = []
      const sorted = this.places
        .slice()
        .sort((a, b) => (a.NomPlace || '').localeCompare(b.NomPlace || ''))

      sorted.forEach((place) => {
        let count = 0
        const fieldEntry = this.getPlaceCapacityFieldData(place)
        const fieldData = fieldEntry?.data || null
        const usesPropositionField = String(fieldEntry?.field || '').endsWith('_proposition')

        if (fieldData) {
          const yr = String(this.selectedYear)
          // Si la clé year existe explicitement, l'utiliser (même si "0")
          // Ne fallback sur default QUE si la clé year n'existe pas du tout
          if (
            Object.prototype.hasOwnProperty.call(fieldData, yr) &&
            fieldData[yr] !== '' &&
            fieldData[yr] !== null &&
            fieldData[yr] !== undefined
          ) {
            count = parseInt(fieldData[yr]) || 0
          } else {
            const academicVal = this.getValueForYearKey(fieldData, this.selectedYear)
            if (academicVal !== undefined && academicVal !== null && academicVal !== '') {
              count = parseInt(academicVal) || 0
            } else if (usesPropositionField) {
              count = 0
            } else {
              const defVal = parseInt(fieldData['default'] || '0')
              count = !isNaN(defVal) ? defVal : 0
            }
          }
        }
        const offerCapacity = this.offerSeatCountByPlace[place.PlaceId]
        if (this.useOfferSeatActivation && Number.isFinite(offerCapacity)) {
          count = Number(offerCapacity) || 0
        }

        const baseCapacity = count
        const placeId = this.resolvePlaceId(place)
        const assignedCountFromVotes = Number(
          (placeId && this.pfp4AssignCountByPlace[placeId]) || 0
        )
        const assignedCountFromOffer = Number(
          (placeId && this.offerOccupiedSeatCountByPlace[placeId]) || 0
        )
        const assignedCount = Math.max(assignedCountFromVotes, assignedCountFromOffer)
        if (assignedCount > 0) {
          count -= assignedCount
        }

        if ((place.NomPlace || '').toLowerCase().includes('leukerbad')) {
          debugVotation('🎯 DEBUG Leukerbad', {
            pfp: this.targetPFP,
            year: this.selectedYear,
            placeId: place.PlaceId,
            placeName: place.NomPlace,
            baseCapacity,
            assignedCountFromVotes,
            assignedCountFromOffer,
            assignedCount,
            remaining: count
          })
        }

        if (!isNaN(count) && count >= 1) {
          for (let i = 1; i <= count; i++) {
            rows.push({
              ...place,
              seatIndex: i,
              uniqueKey: `${place.PlaceId}-${i}`
            })
          }
        }
      })
      const applyMissingCriteriaSections = (inputRows) => {
        const missing = this.getPriorityMissingCriteria()
        if (missing.length === 0) return inputRows
        const prioritizeGerman =
          (this.targetPFP === 'PFP3' || this.targetPFP === 'PFP4') &&
          this.completedStageCount === 1 &&
          missing.includes('DE')

        inputRows.forEach((row) => {
          const coveredCount = missing.filter((c) => CRITERIA_KEYS.includes(c) && row[c]).length
          row.pfp4CoveredCount = coveredCount
          if (coveredCount >= 2) {
            row.pfp4Section = 'high'
            row.pfp4SectionLabel =
              '⭐ Priorité haute — couvre ' + coveredCount + ' critères manquants'
          } else if (coveredCount === 1) {
            row.pfp4Section = 'medium'
            row.pfp4SectionLabel = '📋 Priorité moyenne — couvre 1 critère manquant'
          } else {
            row.pfp4Section = 'other'
            row.pfp4SectionLabel = '📌 Autres places disponibles'
          }
        })

        const sectionOrder = { high: 0, medium: 1, other: 2 }
        return inputRows.sort((a, b) => {
          const sectionDiff =
            (sectionOrder[a.pfp4Section] ?? 2) - (sectionOrder[b.pfp4Section] ?? 2)
          if (sectionDiff !== 0) return sectionDiff
          if (prioritizeGerman) {
            const germanDiff = Number(Boolean(b.DE)) - Number(Boolean(a.DE))
            if (germanDiff !== 0) return germanDiff
          }
          const coverageDiff = (b.pfp4CoveredCount || 0) - (a.pfp4CoveredCount || 0)
          if (coverageDiff !== 0) return coverageDiff
          return (a.NomPlace || '').localeCompare(b.NomPlace || '')
        })
      }

      // Pour PFP4: filtrer selon les propositions personnalisées
      const bypassSavedProposals =
        (this.completedPlaceIds || []).length < 2 && (this.pfp4MissingCriteria || []).includes('DE')
      if (
        !bypassSavedProposals &&
        this.targetPFP === 'PFP4' &&
        this.pfp4ProposedPlaceIds &&
        Array.isArray(this.pfp4ProposedPlaceIds)
      ) {
        const allowedIds = new Set(
          this.pfp4ProposedPlaceIds.map((id) => this.normalizePlaceId(id)).filter(Boolean)
        )
        const filtered = rows.filter(
          (r) =>
            allowedIds.has(this.resolvePlaceId(r)) &&
            !this.completedPlaceIdSet.has(this.resolvePlaceId(r))
        )
        this.expandedPFPData = applyMissingCriteriaSections(filtered)
        debugVotation(
          `🎯 PFP4: ${this.expandedPFPData.length}/${rows.length} places après filtrage propositions`
        )
      } else if (
        !bypassSavedProposals &&
        this.targetPFP === 'PFP3' &&
        this.pfp4ProposedPlaceIds &&
        Array.isArray(this.pfp4ProposedPlaceIds)
      ) {
        const allowedIds = new Set(
          this.pfp4ProposedPlaceIds.map((id) => this.normalizePlaceId(id)).filter(Boolean)
        )
        const filtered = rows.filter(
          (r) =>
            allowedIds.has(this.resolvePlaceId(r)) &&
            !this.completedPlaceIdSet.has(this.resolvePlaceId(r))
        )
        this.expandedPFPData = applyMissingCriteriaSections(filtered)
        debugVotation(
          `🎯 PFP3: ${this.expandedPFPData.length}/${rows.length} places après filtrage propositions`
        )
      } else if (this.targetPFP === 'PFP3' && this.pfp4MissingCriteria.length > 0) {
        const missing = this.getPriorityMissingCriteria()
        const missingDE = (this.completedPlaceIds || []).length >= 2 && missing.includes('DE')
        const MIN_PLACES = 5
        const countCovered = (row) =>
          missing.filter((c) => CRITERIA_KEYS.includes(c) && row[c]).length

        let proposedRows = []
        if (missingDE) {
          proposedRows = rows.filter(
            (r) => r.DE && !this.completedPlaceIdSet.has(this.resolvePlaceId(r))
          )
        } else {
          proposedRows = rows.filter(
            (r) => countCovered(r) > 0 && !this.completedPlaceIdSet.has(this.resolvePlaceId(r))
          )

          if (proposedRows.length < MIN_PLACES) {
            const currentKeys = new Set(proposedRows.map((r) => r.uniqueKey))
            const sysintRows = rows.filter(
              (r) =>
                !currentKeys.has(r.uniqueKey) &&
                r.SYSINT &&
                !this.completedPlaceIdSet.has(this.resolvePlaceId(r))
            )
            proposedRows.push(...sysintRows)
          }

          if (proposedRows.length < MIN_PLACES) {
            const currentKeys = new Set(proposedRows.map((r) => r.uniqueKey))
            const rest = rows.filter(
              (r) =>
                !currentKeys.has(r.uniqueKey) &&
                !this.completedPlaceIdSet.has(this.resolvePlaceId(r))
            )
            const needed = MIN_PLACES - proposedRows.length
            proposedRows.push(...rest.slice(0, needed))
          }
        }

        this.expandedPFPData = applyMissingCriteriaSections(proposedRows)
        debugVotation(
          `🎯 PFP3: ${this.expandedPFPData.length}/${rows.length} places proposées (fallback critères)`
        )
      } else if (this.targetPFP === 'PFP2') {
        const eligibleRows = rows.filter((row) => this.isPfp2PlaceEligible(row))
        this.expandedPFPData = this.pfp4MissingCriteria.length > 0
          ? applyMissingCriteriaSections(eligibleRows)
          : eligibleRows
        debugVotation(
          `🎯 PFP2: ${this.expandedPFPData.length}/${rows.length} places éligibles selon les lieux déjà fréquentés et les critères manquants`
        )
      } else {
        this.expandedPFPData = rows.filter(
          (r) => !this.completedPlaceIdSet.has(this.resolvePlaceId(r))
        )
      }

      if (
        (this.targetPFP === 'PFP4' || this.targetPFP === 'PFP3' || this.targetPFP === 'PFP2') &&
        this.pfp4MissingCriteria.length > 0
      ) {
        const high = this.expandedPFPData.filter((r) => r.pfp4Section === 'high').length
        const med = this.expandedPFPData.filter((r) => r.pfp4Section === 'medium').length
        const other = this.expandedPFPData.filter((r) => r.pfp4Section === 'other').length
        debugVotation(
          `🎯 ${this.targetPFP} sections: ⭐${high} haute, 📋${med} moyenne, 📌${other} autres`
        )
      }
    },

    pfp4RowClass(data) {
      if (this.targetPFP !== 'PFP4' || !data.pfp4Section) return ''
      if (data.pfp4Section === 'high') return 'pfp4-row-high'
      if (data.pfp4Section === 'medium') return 'pfp4-row-medium'
      return ''
    },

    isMissingCriteria(criteriaName) {
      return this.pfp4MissingCriteria && this.pfp4MissingCriteria.includes(criteriaName)
    },

    isPfp2PlaceEligible(place) {
      const placeId = this.resolvePlaceId(place)
      if (placeId && this.visitedPlaceIdSet.has(placeId)) return false

      const missingCriteria = this.getPriorityMissingCriteria()
      if (missingCriteria.length === 0) return true
      return missingCriteria.some((criterion) => Boolean(place?.[criterion]))
    },

    getVoteCount(place) {
      const placeId = place.PlaceId

      if (this.votesAggregation[placeId]) {
        return this.votesAggregation[placeId]
      }

      return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
    },

    isPlaceDisabled(place, choiceIndex) {
      if (this.isAdminPreview) return true
      const normalize = (v) => (v || '').toString().trim().toLowerCase()
      for (let i = 0; i < this.selectedPlaces.length; i++) {
        if (i !== choiceIndex && this.selectedPlaces[i]) {
          const s = this.selectedPlaces[i]
          const samePlaceId = s.PlaceId && place.PlaceId && s.PlaceId === place.PlaceId
          const sameInstAndName =
            s.InstitutionId === place.InstitutionId &&
            normalize(s.NomPlace) === normalize(place.NomPlace)
          if (samePlaceId || sameInstAndName) {
            return true
          }
        }
      }
      return false
    },

    async sendVote() {
      if (this.isAdminPreview) return
      if (this.isSubmitting) return

      if (!this.userStore.user) {
        this.dialogMessage = 'Vous devez être connecté pour voter.'
        this.dialogVisible = true
        return
      }

      await this.checkExistingCampaignAssignment()
      if (this.votingAccessBlocked) {
        this.dialogMessage = this.existingCampaignAssignment
          ? 'Une place vous est déjà attribuée pour cette votation. Aucun nouveau vote ne peut être enregistré.'
          : 'Votre situation ne peut pas être vérifiée actuellement. Aucun vote n’a été enregistré.'
        this.dialogVisible = true
        return
      }

      this.isSubmitting = true

      const choices = this.selectedPlaces
        .map((p, index) => {
          if (!p) return null
          return {
            rank: index + 1,
            placeId: p.PlaceId,
            seatIndex: p.seatIndex,
            placeName: p.NomPlace,
            InstitutionName: p.InstitutionName
          }
        })
        .filter((c) => c !== null)

      if (choices.length !== 5) {
        this.dialogMessage =
          'Veuillez sélectionner exactement 5 places par ordre de préférence avant de voter.'
        this.dialogVisible = true
        this.isSubmitting = false
        return
      }

      try {
        await this.votesStore.saveVote(this.targetPFP, this.selectedYear, choices)

        this.votedPlaces = this.selectedPlaces.map((p) =>
          p
            ? {
                placeName: p.NomPlace,
                InstitutionName: p.InstitutionName
              }
            : null
        )

        await this.loadVoteStatistics()

        this.dialogMessage = this.voteAlreadyCast
          ? 'Votre vote a été mis à jour avec succès !'
          : 'Votre vote a été enregistré avec succès !'
        this.dialogVisible = true
      } catch (error) {
        console.error("❌ Erreur lors de l'enregistrement du vote:", error)
        this.dialogMessage =
          "Erreur lors de l'enregistrement du vote: " + (error.message || 'Erreur inconnue')
        this.dialogVisible = true
      } finally {
        this.isSubmitting = false
      }
    },

    closeDialog() {
      this.dialogVisible = false
    },

    removeChoice(index) {
      this.selectedPlaces[index] = null
      this.$forceUpdate()
    },

    selectPlaceForRank({ place, choiceIndex }) {
      if (this.isAdminPreview || this.isPlaceDisabled(place, choiceIndex)) return
      const current = this.selectedPlaces[choiceIndex]
      const sameSelection = current && (
        (current.PlaceId && place.PlaceId && current.PlaceId === place.PlaceId && current.seatIndex === place.seatIndex) ||
        (current.InstitutionId === place.InstitutionId && this.normalizeLookupValue(current.NomPlace) === this.normalizeLookupValue(place.NomPlace))
      )
      this.selectedPlaces[choiceIndex] = sameSelection ? null : place
      this.$forceUpdate()
    },

    onRadioClick(place, choiceIndex, event) {
      if (this.isAdminPreview) return
      try {
        const current = this.selectedPlaces[choiceIndex]
        if (
          current &&
          ((current.PlaceId &&
            place.PlaceId &&
            current.PlaceId === place.PlaceId &&
            current.seatIndex === place.seatIndex) ||
            (current.InstitutionId === place.InstitutionId &&
              (current.NomPlace || '').toString().trim().toLowerCase() ===
                (place.NomPlace || '').toString().trim().toLowerCase()))
        ) {
          this.selectedPlaces[choiceIndex] = null
          if (event && typeof event.preventDefault === 'function') event.preventDefault()
          if (event && typeof event.stopPropagation === 'function') event.stopPropagation()
          this.$forceUpdate()
        }
      } catch (e) {
        // no-op
      }
    }
  },
  watch: {
    isAdminPreview() {
      this.refreshSessionAndData()
    },
    '$route.fullPath'() {
      this.refreshSessionAndData()
    },
    'userStore.user.id'() {
      this.refreshSessionAndData()
    },
    'userStore.profile.user_id'() {
      this.refreshSessionAndData()
    },
    'userStore.profile.classe'() {
      this.refreshSessionAndData()
    },
    'userStore.profile.Classe'() {
      this.refreshSessionAndData()
    }
  },
  async mounted() {
    await this.refreshSessionAndData()
  }
}
</script>

<style scoped>
.assignment-locked-card {
  width: min(560px, calc(100% - 2rem));
  padding: 2rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 30%, var(--surface-border));
  border-radius: 18px;
  background: var(--surface-card);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.16);
  color: var(--text-color);
  text-align: center;
}

.assignment-locked-icon {
  display: inline-grid;
  width: 64px;
  height: 64px;
  place-items: center;
  margin-bottom: 1rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
  font-size: 1.8rem;
}

.assignment-locked-card h2 {
  margin: 0 0 0.65rem;
}

.assignment-locked-card > p {
  margin: 0 auto 1.25rem;
  max-width: 46ch;
  color: var(--text-color-secondary);
}

.assignment-locked-details {
  display: grid;
  gap: 0.75rem;
  margin: 1.25rem 0;
  padding: 1rem;
  border-radius: 12px;
  background: var(--surface-ground);
  text-align: left;
}

.assignment-locked-details div {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 0.75rem;
}

.assignment-locked-details dt {
  color: var(--text-color-secondary);
  font-weight: 600;
}

.assignment-locked-details dd {
  margin: 0;
  font-weight: 700;
}

.assignment-locked-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.votation-container {
  min-height: 100vh;
  padding: 0;
}

.admin-preview-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem 2rem;
  max-width: 1680px;
  margin: 1.25rem auto;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  color: var(--text-color);
  background: var(--surface-card);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
}

.admin-preview-copy,
.admin-preview-actions {
  display: flex;
  align-items: center;
}

.admin-preview-copy { gap: .8rem; }
.admin-preview-copy h2,
.admin-preview-copy p { margin: 0; }
.admin-preview-copy h2 { font-size: 1rem; }
.admin-preview-copy p { max-width: 62ch; margin-top: .2rem; color: var(--text-color-secondary); font-size: .82rem; line-height: 1.45; }
.admin-preview-icon { display: grid; flex: 0 0 44px; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: #071426; background: #ffd400; }
.admin-preview-actions { justify-content: flex-end; gap: .6rem; }
.admin-preview-actions label { color: var(--text-color-secondary); font-size: .78rem; font-weight: 700; }
.admin-preview-actions select { min-height: 44px; max-width: 360px; padding: 0 .75rem; border: 1px solid var(--surface-border); border-radius: 10px; color: var(--text-color); background: var(--surface-ground); font: inherit; }
.admin-preview-actions select:focus-visible { outline: 3px solid #ffd400; outline-offset: 2px; }
.admin-preview-error { grid-column: 1 / -1; margin: 0; color: #fca5a5; }

/* En-tête moderne */
.votation-header {
  border-bottom: 1px solid var(--surface-border);
  padding: 2rem;
}

.header-content {
  max-width: 1680px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  font-size: 3rem;
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
  padding: 1rem;
  border-radius: 12px;
}

.header-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.header-title-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.read-only-badge { display: inline-flex; min-height: 28px; align-items: center; gap: .4rem; padding: .25rem .55rem; border-radius: 999px; color: #fff0b3; background: rgba(255, 212, 0, .12); font-size: .72rem; font-weight: 800; }

.header-subtitle {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.back-button {
  border-color: var(--surface-border);
  color: var(--text-color-secondary);
}

.back-button:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
}

/* Contenu */
.content-wrapper {
  max-width: 1680px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.admin-form-guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.25rem;
  margin-bottom: .75rem;
  padding-top: .85rem;
  padding-bottom: .85rem;
  border-radius: 14px;
  background: var(--surface-card);
}
.admin-form-guide h2,
.admin-form-guide p { margin: 0; }
.admin-form-guide h2 { color: var(--text-color); font-size: 1rem; }
.admin-form-guide p { max-width: 68ch; margin-top: .25rem; color: var(--text-color-secondary); font-size: .82rem; line-height: 1.45; }
.admin-form-guide ol { display: flex; gap: .4rem; margin: 0; padding: 0; list-style: none; }
.admin-form-guide li { display: flex; min-height: 44px; align-items: center; gap: .4rem; padding: .3rem .55rem; border-radius: 10px; color: var(--text-color-secondary); background: var(--surface-ground); }
.admin-form-guide li strong { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 50%; color: #071426; background: #ffd400; }
.admin-form-guide li span { font-size: .7rem; font-weight: 700; white-space: nowrap; }

.choice-progress { margin-top: 1.25rem; margin-bottom: 1.25rem; }
.choice-progress-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.choice-progress-heading h2, .choice-progress-heading p { margin: 0; }
.choice-progress-heading h2 { color: var(--text-color); font-size: 1.25rem; }
.choice-progress-heading p { max-width: 68ch; margin-top: .3rem; color: var(--text-color-secondary); line-height: 1.5; }
.choice-progress-heading > strong { flex: 0 0 auto; padding: .5rem .75rem; border-radius: 999px; color: #071426; background: #ffd400; }
.choice-progress-bar { overflow: hidden; height: 8px; margin: 1rem 0; border-radius: 999px; background: color-mix(in srgb, var(--surface-card) 80%, white); }
.choice-progress-bar span { display: block; height: 100%; border-radius: inherit; background: #ffd400; transition: width 220ms ease-out; }
.choice-slots { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: .5rem; margin: 0; padding: 0; list-style: none; }
.choice-slots li { display: grid; grid-template-columns: 30px minmax(0,1fr) 36px; align-items: center; gap: .5rem; min-height: 58px; padding: .55rem; border-radius: 12px; color: var(--text-color-secondary); background: var(--surface-card); }
.choice-slots li > span { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 50%; border: 1px solid var(--surface-border); font-weight: 800; }
.choice-slots li strong, .choice-slots li small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.choice-slots li strong { font-size: .78rem; }
.choice-slots li small { margin-top: .15rem; font-size: .68rem; }
.choice-slots li.complete { color: var(--text-color); background: color-mix(in srgb, var(--surface-card) 88%, #ffd400); }
.choice-slots li.complete > span { border-color: #ffd400; color: #071426; background: #ffd400; }
.choice-slots button { display: grid; width: 36px; height: 44px; place-items: center; border: 0; border-radius: 9px; color: var(--text-color-secondary); background: transparent; cursor: pointer; }
.choice-slots button:focus-visible, .place-search-control input:focus-visible, .search-empty button:focus-visible { outline: 3px solid #ffd400; outline-offset: 2px; }
.place-tools { margin-top: 1.25rem; margin-bottom: 1rem; }
.place-tools label { display: block; margin-bottom: .5rem; color: var(--text-color); font-weight: 700; }
.place-search-control { display: grid; grid-template-columns: 24px minmax(0,1fr) auto; align-items: center; gap: .6rem; min-height: 48px; padding: 0 .85rem; border: 1px solid var(--surface-border); border-radius: 12px; background: var(--surface-card); }
.place-search-control i { color: var(--text-color-secondary); }
.place-search-control input { min-width: 0; min-height: 44px; border: 0; outline: 0; color: var(--text-color); background: transparent; font: inherit; }
.place-search-control span { color: var(--text-color-secondary); font-size: .82rem; white-space: nowrap; }
.search-empty { display: flex; align-items: center; gap: 1rem; padding-top: 1.25rem; padding-bottom: 1.25rem; border-radius: 14px; color: var(--text-color); background: var(--surface-card); }
.search-empty > i { color: #ffd400; font-size: 1.5rem; }
.search-empty h2, .search-empty p { margin: 0; }
.search-empty h2 { font-size: 1rem; }
.search-empty p { margin-top: .2rem; color: var(--text-color-secondary); }
.search-empty button { min-height: 44px; margin-left: auto; padding: .6rem .8rem; border: 0; border-radius: 10px; color: #071426; background: #ffd400; font: inherit; font-weight: 700; cursor: pointer; }
.mobile-place-cards { display: none; }

/* Tableau moderne */
.modern-votation-table {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
}

.modern-votation-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  border-color: var(--surface-border);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  padding: 1rem 0.75rem;
}

.modern-votation-table :deep(.p-datatable-tbody > tr) {
  background: var(--surface-card);
  transition: background 0.18s ease;
}

.modern-votation-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-hover) !important;
}

.modern-votation-table :deep(.p-datatable-tbody > tr > td) {
  border-color: var(--surface-border);
  color: var(--text-color);
  padding: 0.85rem 0.75rem;
}

.modern-votation-table :deep(.choice-column-header) {
  color: #fff0b3;
  background: color-mix(in srgb, var(--surface-ground) 84%, #ffd400);
}

.modern-votation-table :deep(.choice-column-cell) {
  background: rgba(255, 212, 0, .035);
}

.modern-votation-table :deep(.vote-column-header),
.modern-votation-table :deep(.vote-total-header) {
  color: #c9d7ea;
  background: color-mix(in srgb, var(--surface-ground) 88%, #4f6fa8);
}

.modern-votation-table :deep(.vote-column-cell),
.modern-votation-table :deep(.vote-total-cell) {
  background: rgba(79, 111, 168, .035);
}

/* Styles pour les liens et contenus */
.institution-link {
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  font-weight: 500;
  transition: color 0.2s;
}

.institution-link:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.place-name {
  font-weight: 500;
  color: var(--text-color);
}

.criteria-tags,
.language-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* Radio buttons */
.radio-wrapper {
  display: grid;
  min-width: 44px;
  min-height: 44px;
  place-items: center;
}

.modern-votation-table :deep(.p-radiobutton) {
  width: 1.5rem;
  height: 1.5rem;
}

.modern-votation-table :deep(.p-radiobutton .p-radiobutton-box) {
  border-width: 2px;
  width: 1.5rem;
  height: 1.5rem;
}

/* État vide */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
  max-width: 600px;
  margin: 2rem auto;
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--text-color);
  margin: 1rem 0 0.5rem 0;
}

/* Section récapitulatif */
.recap-section {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.recap-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px 8px 0 0;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-bottom: none;
}

.recap-header i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.recap-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
}

.recap-table {
  background: var(--surface-card);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.recap-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  border-color: var(--surface-border);
  font-weight: 600;
  padding: 0.75rem;
}

.recap-table :deep(.p-datatable-tbody > tr > td) {
  border-color: var(--surface-border);
  color: var(--text-color);
  padding: 1rem 0.75rem;
}

.recap-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-hover) !important;
}

.recap-institution {
  display: flex;
  align-items: center;
  color: var(--primary-color);
  font-weight: 500;
}

.recap-place-name {
  color: var(--text-color);
  font-size: 1.05rem;
}

/* Section de vote */
.vote-action-section {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.vote-submit {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.vote-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
  background: rgba(99, 102, 241, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.vote-info i {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.vote-info-updated {
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.3);
}

.vote-info-updated i {
  color: var(--yellow-500);
}

/* Dialog moderne */
.modern-dialog :deep(.p-dialog-header) {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dialog-message {
  font-size: 1.05rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 1.5rem 0;
}

/* PFP4 - Bandeau critères manquants */
.pfp4-missing-banner {
  margin-top: 1rem;
}

.pfp4-missing-card {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(234, 179, 8, 0.08));
  border: 2px solid rgba(249, 115, 22, 0.3);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}

/* PFP4 - Sections */
.pfp4-section {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.pfp4-section-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pfp4-section-header-high {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}

.pfp4-section-header-medium {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: white;
}

.pfp4-section-header-other {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  color: white;
}

/* PFP4 - Badges critères couverts */
.pfp4-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  min-width: 60px;
}

.pfp4-badge-high {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 2px solid rgba(16, 185, 129, 0.4);
}

.pfp4-badge-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 2px solid rgba(245, 158, 11, 0.4);
}

/* PFP4 - Colorisation subtile des tables */
.pfp4-table-high :deep(.p-datatable-tbody > tr) {
  background: rgba(16, 185, 129, 0.03);
}

.pfp4-table-high :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(16, 185, 129, 0.1) !important;
}

.pfp4-table-medium :deep(.p-datatable-tbody > tr) {
  background: rgba(245, 158, 11, 0.03);
}

.pfp4-table-medium :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(245, 158, 11, 0.1) !important;
}

.pfp4-table-other :deep(.p-datatable-tbody > tr) {
  opacity: 0.85;
}

.pfp4-table-other :deep(.p-datatable-tbody > tr:hover) {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-preview-toolbar { grid-template-columns: 1fr; margin: .75rem 1rem; }
  .admin-preview-actions { align-items: stretch; flex-direction: column; }
  .admin-preview-actions select { width: 100%; max-width: none; }
  .votation-header {
    padding: 1.5rem 1rem;
  }

  .header-content {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }

  .content-wrapper,
  .vote-action-section {
    padding: 0 1rem;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .header-left { align-items: flex-start; gap: .8rem; }
  .header-icon { padding: .65rem; font-size: 2rem; }
  .back-button { min-height: 44px; }
  .desktop-place-table { display: none; }
  .mobile-place-cards { display: grid; }
  .admin-form-guide { align-items: flex-start; flex-direction: column; }
  .admin-form-guide ol { width: 100%; }
  .admin-form-guide li { min-width: 0; flex: 1; justify-content: center; padding: .3rem; }
  .admin-form-guide li span { display: none; }
  .choice-progress-heading { align-items: center; }
  .choice-progress-heading p { display: none; }
  .choice-slots { grid-template-columns: 1fr; }
  .choice-slots li { grid-template-columns: 34px minmax(0,1fr) 44px; min-height: 54px; }
  .choice-slots button { width: 44px; }
  .place-search-control { grid-template-columns: 22px minmax(0,1fr); }
  .place-search-control span { grid-column: 2; padding-bottom: .65rem; }
  .search-empty { align-items: flex-start; flex-wrap: wrap; }
  .search-empty button { width: 100%; margin-left: 0; }
  .recap-section { display: none; }
  .vote-action-section { padding-bottom: 5rem; }
  .vote-submit { align-items: stretch; padding: 1rem; }
  .vote-info { padding: .75rem; }
  .vote-submit :deep(.p-button) { min-height: 48px; }
}

@media (min-width: 769px) and (max-width: 1100px) {
  .admin-preview-toolbar { grid-template-columns: 1fr; margin-right: 2rem; margin-left: 2rem; }
  .admin-preview-actions { justify-content: flex-start; }
  .desktop-place-table { display: none; }
  .mobile-place-cards { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); }
  .choice-slots { grid-template-columns: repeat(2,minmax(0,1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
</style>
