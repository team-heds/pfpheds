<template>
  <!-- Top instructors START -->
  <div class="col-lg-6 col-xxl-4">
    <div class="card shadow h-100">
      <!-- Card header -->
      <div class="card-header border-bottom d-flex justify-content-between align-items-center p-4">
        <h5 class="card-header-title">Utilisateurs</h5>
        <a href="#" class="btn btn-link p-0 mb-0">Voir</a>  <!-- Ajouter un lien vers la page FAQ -->
      </div>
      <!-- Card body START -->
      <div class="card-body p-4">
        <!-- Instructor item START -->
        <div
            class="team-member d-sm-flex justify-content-between align-items-center"
            v-for="(teamMember, index) in teamMembers"
            :key="index"
        >
          <!-- Avatar and info -->
          <div class="d-sm-flex align-items-center mb-1 mb-sm-0">
            <!-- Avatar -->
            <div class="avatar avatar-md flex-shrink-0">
              <img class="avatar-img rounded-circle" :src="teamMember.avatarUrl" alt="avatar">
            </div>
            <!-- Info -->
            <div class="ms-0 ms-sm-2 mt-2 mt-sm-0">
              <h6 class="mb-1">{{ teamMember.name }}<i class="bi bi-patch-check-fill text-info small ms-1"></i></h6>
              <ul class="list-inline mb-0 small">
                <li class="list-inline-item fw-light me-2 mb-1 mb-sm-0"><i class="fas fa-book text-purple me-1"></i>{{ teamMember.role }}</li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Instructor item END -->
      </div>
      <!-- Card body END -->
    </div>
  </div>
  <!-- Top instructors END -->
</template>

<script>
export default {
  name: 'TeamSection',
  data() {
    return {
      // api vers la liste des profs
      teamMembers: [
        { name: 'Christophe Baur', role: 'Administrateur', avatarUrl: 'assets/images/avatar/09.jpg' },
        { name: 'Antoine Quarroz', role: 'Développeur', avatarUrl: 'assets/images/avatar/03.jpg' },
        { name: 'Loïc Berthod', role: 'Développeur', avatarUrl: 'assets/images/avatar/01.jpg' },
      ],
    };
  },
};
</script>

<style scoped>
.team-member:not(:last-child) {
  border-bottom: 1px solid #ddd;  /* ajustez la couleur et l'épaisseur de la bordure selon vos préférences */
  padding-bottom: 1em;  /* ajoutez un espace en dessous de chaque membre de l'équipe pour simuler l'espace qu'un <hr> aurait créé */
  margin-bottom: 1em;
}
</style>
