<template>
  <div class="profile-section card">
    <UserProfile :user="currentUser" />
    <div class="hashtags">
      <h3># Hashtags Populaires</h3>
      <ul>
        <li>#Innovation</li>
        <li>#Technologie</li>
        <li>#Formation</li>
      </ul>
    </div>
  </div>
</template>

<script>
import UserProfile from "@/components/Social/UserProfile.vue";

export default {
  name: "RightSidebar",
  components: {
    UserProfile,
  },
  props: {
    currentUser: Object,
  },
};
</script>

<style scoped>
/* Styles de la sidebar droite */
.profile-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.hashtags ul {
  list-style: none;
  padding: 0;
}
.hashtags li {
  margin: 0.5rem 0;
}
</style>
