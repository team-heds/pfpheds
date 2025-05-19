<!-- src/components/FilterSidebar.vue -->
<template>
  <div class="filter-sidebar">
    <!-- Section Filtrer par Canton -->
    <div class="filter-section card">
      <h4>Filtrer par Canton</h4>
      <!-- Ajout de la classe "two-columns" pour le layout en deux colonnes -->
      <ul class="filter-list two-columns">
        <li
          v-for="canton in cantons"
          :key="canton"
          class="filter-item"
        >
          <Checkbox
            type="checkbox"
            :id="`canton-${canton}`"
            :value="canton"
            v-model="selectedCantons"
            @change="emitFilters"
          />
          <label :for="`canton-${canton}`">{{ canton }}</label>
        </li>
        <li v-if="cantons.length === 0" class="text-center">
          Aucun canton disponible
        </li>
      </ul>
    </div>

    <!-- Section Filtrer par Critères -->
    <div class="filter-section card">
      <h4>Filtrer par Critères</h4>
      <ul class="filter-list">
        <li
          v-for="criter in criterOptions"
          :key="criter"
          class="filter-item"
        >
          <Checkbox
            type="checkbox"
            :id="`criter-${criter}`"
            :value="criter"
            v-model="selectedCriter"
            @change="emitFilters"
          />
          <label :for="`criter-${criter}`">{{ criter }}</label>
        </li>
      </ul>
    </div>

    <!-- Section Filtrer par PFP -->
    <div class="filter-section card">
      <h4>Filtrer par PFP</h4>
      <ul class="filter-list">
        <li
          v-for="pfp in pfpOptions"
          :key="pfp"
          class="filter-item"
        >
          <Checkbox
            type="checkbox"
            :id="`pfp-${pfp}`"
            :value="pfp"
            v-model="selectedPfp"
            @change="emitFilters"
          />
          <label :for="`pfp-${pfp}`">{{ pfp }}</label>
        </li>
      </ul>
    </div>

    <!-- Section Filtrer par Langue -->
    <div class="filter-section card">
      <h4>Filtrer par Langue</h4>
      <ul class="filter-list">
        <li
          v-for="lang in languageOptions"
          :key="lang"
          class="filter-item"
        >
          <Checkbox
            type="checkbox"
            :id="`lang-${lang}`"
            :value="lang"
            v-model="selectedLanguages"
            @change="emitFilters"
          />
          <label :for="`lang-${lang}`">{{ lang }}</label>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "FilterSidebar",
  props: {
    cantons: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedCantons: [],
      selectedCriter: [],
      selectedLanguages: [],
      selectedPfp: [],
      // Options fixes pour la section Critères, PFP et Langue
      criterOptions: ["AIGU", "AMBU", "MSQ", "NEUROGER", "SYSINT", "REHAB"],
      pfpOptions: ["PFP1A", "PFP1B", "PFP2", "PFP3", "PFP4"],
      languageOptions: ["FR", "DE"]
    };
  },
  methods: {
    emitFilters() {
      // Émission d'un objet regroupant les filtres sélectionnés
      this.$emit("filters-changed", {
        cantons: this.selectedCantons,
        criter: this.selectedCriter,
        languages: this.selectedLanguages,
        pfp: this.selectedPfp
      });
    }
  }
};
</script>

<style scoped>
.filter-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-radius: 1.2rem;
  margin-right: 4rem;
  margin-left: 0;
}

.filter-section {
  padding: 1.5rem;
  border-radius: 1.2rem;
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  margin: 0;
}

h4 {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.filter-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.filter-list.two-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  transition: background-color 0.2s ease;
}

.filter-item:hover {
  background-color: var(--surface-hover);
  border-radius: 0.5rem;
}

.filter-item input {
  margin: 0;
}

.filter-item label {
  font-size: 1rem;
  color: var(--text-color);
}

.text-center {
  text-align: center;
  font-style: italic;
  color: var(--text-color-secondary);
}
</style>
