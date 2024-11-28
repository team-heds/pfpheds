<template>
  <div class="sidebar card">
    <!-- Profil utilisateur -->
    <div class="user-profile">
      <h4>
        <Avatar label="A" class="mr-2" size="large" shape="circle" />
        <a @click="goToProfile" class="profile-link">Antoine Quarroz</a>
      </h4>
    </div>

    <!-- Liens supplémentaires -->
    <div class="profile-links">
      <ul class="">
        <li >
          <i class="pi pi-images link-icon"></i>
          <span>Historique des PFP</span>
        </li>
        <li @click="goToSettings">
          <i class="pi pi-cog link-icon"></i>
          <span>Paramètres</span>
        </li>
        <li @click="goToPrivacy">
          <i class="pi pi-lock link-icon"></i>
          <span>Confidentialité</span>
        </li>
        <li @click="goToLogout">
          <i class="pi pi-sign-out link-icon"></i>
          <span>Déconnexion</span>
        </li>
      </ul>
    </div>

    <hr />

    <!-- Messagerie -->
    <h4>Messagerie</h4>
    <ul class="messaging-list">
      <li v-for="(contact, index) in contacts" :key="index" class="message-item" @click="openChat(contact.name)">
        <Avatar :label="contact.initials" class="mr-2" size="large" shape="circle" />
        <div class="contact-info">
          <span class="contact-name">{{ contact.name }}</span>
          <p class="last-message">{{ contact.lastMessage }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import Avatar from "primevue/avatar";

export default {
  name: "LeftSidebar",
  components: { Avatar },
  data() {
    return {
      contacts: [
        {
          name: "Antoine Quarroz",
          initials: "A",
          lastMessage: "Salut, tu as vu mon dernier message?",
        },
        {
          name: "Loic Berthod",
          initials: "L",
          lastMessage: "On se retrouve à 15h pour le projet.",
        },
        {
          name: "Marie Dupont",
          initials: "M",
          lastMessage: "Merci pour les infos, à bientôt !",
        },
      ],
    };
  },
  methods: {
    goToProfile() {
      this.$router.push("/profile");
    },
    goToPfpHistory() {
      this.$router.push("/pfp-history");
    },
    goToSettings() {
      this.$router.push("/settings");
    },
    goToPrivacy() {
      this.$router.push("/privacy");
    },
    goToLogout() {
      console.log("Déconnexion effectuée");
      this.$router.push("/logout");
    },
    openChat(name) {
      this.$router.push(`/chat?user=${encodeURIComponent(name)}`);
    },
  },
};
</script>

<style scoped>
/* Styles de la sidebar gauche */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
}

/* Liens du profil */
.profile-link {
  text-decoration: none;
  color: var(--text-color);
  cursor: pointer;
  transition: color 0.3s ease;
}

.profile-link:hover {
  color: var(--primary-color);
}

/* Liens supplémentaires */
.profile-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.profile-links li {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.3s ease, background-color 0.3s ease;
}

.profile-links li:hover {
  color: var(--primary-color);
  background-color: var(--surface-hover);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.link-icon {
  font-size: 1.25rem;
  margin-right: 0.5rem;
  padding: 0.5rem;
  color: var(--primary-color);
}

/* Liste des contacts */
.messaging-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.message-item:hover {
  background-color: var(--surface-hover);
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-weight: bold;
  color: var(--text-color);
}

.last-message {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}
</style>
