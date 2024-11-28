<template>
  <div class="sidebar card">

    <div>
      <h4>Antoine Quarroz</h4>
      <ul class="menu-options">
        <li><a href="#">Mes Groupes</a></li>
        <li><a href="#">Créer une Communauté</a></li>
      </ul>
    </div>

    <h3>Messagerie</h3>
    <ul class="messaging-list">
      <li><a href="#">Antoine Quarroz</a></li>
      <li><a href="#">Loic Berthod</a></li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "LeftSidebar",
};
</script>

<style scoped>
/* Styles de la sidebar gauche */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.menu-options,
.messaging-list {
  list-style: none;
  padding: 0;
}
.menu-options a,
.messaging-list a {
  text-decoration: none;
  color: var(--text-color);
}
</style>
