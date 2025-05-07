<template>
  <div>
    <h3>Chargé de signature</h3>
  
    <ul>
      <li v-for="place in filteredSignatureAssignments(enseignant)" :key="place._key">
        <span>
          {{ getUserNomPrenom(place.idEtudiant) }}<br>
          <span style="font-size:0.95em;color:#888;">
            {{ getNomDomainePlace(place.idPlace) }} - 
            {{ getInstitutionNameById(getPlaceIdInstitutionById(place.idPlace)) }}<br>
            <span v-if="place.praticienFormateur">
              PF: {{ place.praticienFormateur.Prenom }} {{ place.praticienFormateur.Nom }}
            </span>
            <span v-if="place.lieuSignature">
              <br>Lieu signature: {{ place.lieuSignature }}
            </span>
            <span v-if="place.remarqueSignature && place.remarqueSignature.trim() !== ''">
              <br><b>Remarque Signature :</b> {{ place.remarqueSignature }}
            </span>
            <span v-if="getPlaceById(place.idPlace) && getPlaceById(place.idPlace).Note && getPlaceById(place.idPlace).Note.trim() !== ''">
              <br><b>Remarque lieu:</b> {{ getPlaceById(place.idPlace).Note }}
            </span>
            <span v-if="getStudentNoteById(place.idEtudiant)">
              <br><b>Remarque étudiant :</b> {{ getStudentNoteById(place.idEtudiant) }}
            </span>
          </span>
        </span>
      </li>
    </ul>
    <span v-if="filteredSignatureAssignments(enseignant).length === 0">Aucune affectation</span>
  </div>
</template>

<script>
export default {
  name: 'InfoRepondantSignature',
  props: {
    enseignant: { type: Object, required: true },
    signatureAssignments: { type: Object, required: true, default: () => ({}) },
    users: { type: Object, required: true, default: () => ({}) },
    places: { type: Object, required: true, default: () => ({}) },
    institutions: { type: Object, required: true, default: () => ({}) },
    praticienFormateurs: { type: Object, required: true, default: () => ({}) },
    students: { type: Object, required: false, default: () => ({}) }
  },
  methods: {
    filteredSignatureAssignments(enseignant) {
      if (!enseignant || !this.signatureAssignments || typeof this.signatureAssignments !== 'object') return [];
      // DEBUG
      // eslint-disable-next-line no-console
      console.log('Enseignant.key:', enseignant.key, 'teacherKeys:', Object.values(this.signatureAssignments).map(p => p.teacherKey));
      return Object.values(this.signatureAssignments)
        .filter(place => (place.teacherKey && enseignant.key && place.teacherKey.trim() === enseignant.key.trim()))
        .map(place => {
          let praticien = null;
          if (place.praticienFormateurKey && this.praticienFormateurs[place.praticienFormateurKey]) {
            praticien = this.praticienFormateurs[place.praticienFormateurKey];
          }
          return {
            ...place,
            praticienFormateur: praticien,
            lieuSignature: place.lieuSignature || ''
          };
        });
    },
    getUserNomPrenom(id) {
      const user = this.users[id];
      return user && user.Nom && user.Prenom ? user.Nom + ' ' + user.Prenom : 'Utilisateur inconnu';
    },
    getPlaceById(idPlace) {
      return this.places[idPlace] || null;
    },
    getNomDomainePlace(idPlace) {
      const place = this.getPlaceById(idPlace);
      if (!place) return 'Place inconnue';
      let domaine = place.idInstitution || place.Domaine || '';
      return `${place.NomPlace || 'Nom inconnu'}${domaine ? ' / ' + domaine : ''}`;
    },
    getPlaceIdInstitutionById(idPlace) {
      const place = this.getPlaceById(idPlace);
      if (!place) return 'Institution inconnue';
      return place.IDPlace || place.InstitutionId || 'Institution inconnue';
    },
    getInstitutionNameById(idInstitution) {
      const inst = this.institutions[idInstitution];
      return inst && inst.Name ? inst.Name : 'Institution inconnue';
    },
    getStudentNoteById(id) {
      const s = this.students && this.students[id];
      if (s && s.StudentNote && s.StudentNote.trim() !== '') {
        return s.StudentNote;
      }
      return '';
    }
  }
};
</script>
