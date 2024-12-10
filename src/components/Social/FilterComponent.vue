<!-- src/components/Social/FilterComponent.vue -->
<template>
    <div class="filters-container">
      <Dropdown
        v-model="localSelectedFilterType"
        :options="filterTypes"
        optionLabel="label"
        optionValue="value"
        placeholder="Sélectionner un type de filtre"
        @change="handleFilterTypeChange"
      />
  
      <Dropdown
        v-if="localSelectedFilterType"
        v-model="localSelectedFilterValue"
        :options="filterOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Sélectionner une option"
        @change="handleFilterValueChange"
      />
  
      <Button
        v-if="localSelectedFilterType"
        label="Appliquer le filtre"
        @click="emitApplyFilter"
        class="ml-2"
      />
      <Button
        v-if="localSelectedFilterType"
        label="Réinitialiser"
        @click="emitResetFilter"
        class="ml-2 p-button-secondary"
      />
    </div>
  </template>
  
  <script>
  export default {
    name: "FilterComponent",
    props: {
      filterTypes: {
        type: Array,
        required: true,
      },
      selectedFilterType: {
        type: [String, null],
        default: null,
      },
      filterOptions: {
        type: Array,
        required: true,
      },
      selectedFilterValue: {
        type: [String, null],
        default: null,
      },
    },
    emits: [
      "update:selectedFilterType",
      "update:selectedFilterValue",
      "apply-filter",
      "reset-filter",
      "filter-type-change", // Déclaré ici
    ],
    data() {
      return {
        localSelectedFilterType: this.selectedFilterType,
        localSelectedFilterValue: this.selectedFilterValue,
      };
    },
    watch: {
      selectedFilterType(newVal) {
        this.localSelectedFilterType = newVal;
      },
      selectedFilterValue(newVal) {
        this.localSelectedFilterValue = newVal;
      },
    },
    methods: {
      handleFilterTypeChange(event) {
        const value = event.value; // Extraction de la valeur réelle
        this.localSelectedFilterType = value;
        this.$emit("update:selectedFilterType", value);
        this.$emit("filter-type-change", value);
      },
      handleFilterValueChange(event) {
        const value = event.value; // Extraction de la valeur réelle
        this.localSelectedFilterValue = value.name;
        this.$emit("update:selectedFilterValue", value);
      },
      emitApplyFilter() {
        this.$emit("apply-filter");
      },
      emitResetFilter() {
        this.$emit("reset-filter");
      },
    },
  };
  </script>
  
  <style scoped>
  .filters-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  /* Ajoutez des styles supplémentaires si nécessaire */
  </style>
  