<template>
  <div>
    <h3>Étudiants assignés comme répondant</h3>
    <ul style="list-style:none;padding:0;">
      <li v-for="etudiant in etudiants" :key="etudiant.key" style="margin-bottom:1em;">
        <b>{{ etudiant.Nom }} {{ etudiant.Prenom }} - {{ etudiant.Class }}</b><br>
    
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'InfoRepondantEtudiants',
  props: {
    etudiants: { type: Array, required: true }
  }
};
</script>
