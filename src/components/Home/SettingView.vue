<template>
    <div class="settings-page">
      <Navbar />
      <div class="settings-container">
        <h1>Paramètres de la plateforme</h1>
        <div class="settings-layout">
          <!-- Zone principale : affichage des options selon la catégorie active -->
          <div class="main-content">
            <!-- Catégorie Interface -->
            <div v-if="activeCategory === 'Interface'" class="settings-group">
              <h2>Interface</h2>
              <div class="setting-item">
                <label for="language-select">Langue :</label>
                <select id="language-select" v-model="settings.interface.language">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
              <div class="setting-item">
                <label for="font-size-select">Taille du texte :</label>
                <select id="font-size-select" v-model="settings.interface.fontSize">
                  <option value="small">Petit</option>
                  <option value="medium">Moyen</option>
                  <option value="large">Grand</option>
                </select>
              </div>
              <div class="setting-item">
                <label for="theme-select">Thème :</label>
                <select id="theme-select" v-model="settings.interface.theme">
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </div>
              <div class="setting-item">
                <label for="animations-toggle">Animations :</label>
                <div class="toggle-container">
                  <input type="checkbox" id="animations-toggle" v-model="settings.interface.enableAnimations" />
                  <span>{{ settings.interface.enableAnimations ? "Activées" : "Désactivées" }}</span>
                </div>
              </div>
            </div>
  
            <!-- Catégorie Date & Heure -->
            <div v-if="activeCategory === 'Date & Heure'" class="settings-group">
              <h2>Date & Heure</h2>
              <div class="setting-item">
                <label for="date-format-select">Format de date :</label>
                <select id="date-format-select" v-model="settings.dateTime.dateFormat">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div class="setting-item">
                <label for="timezone-select">Fuseau horaire :</label>
                <select id="timezone-select" v-model="settings.dateTime.timezone">
                  <option value="UTC">UTC</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
            </div>
  
            <!-- Catégorie Maintenance & Sécurité -->
            <div v-if="activeCategory === 'Maintenance & Sécurité'" class="settings-group">
              <h2>Maintenance & Sécurité</h2>
              <div class="setting-item">
                <label for="maintenance-mode-toggle">Mode maintenance :</label>
                <div class="toggle-container">
                  <input type="checkbox" id="maintenance-mode-toggle" v-model="settings.maintenance.maintenanceMode" />
                  <span>{{ settings.maintenance.maintenanceMode ? "Activé" : "Désactivé" }}</span>
                </div>
              </div>
              <div class="setting-item">
                <label for="session-timeout-input">Durée de session (minutes) :</label>
                <input
                  type="number"
                  id="session-timeout-input"
                  v-model="settings.maintenance.sessionTimeout"
                  min="5"
                  max="120"
                />
              </div>
            </div>
  
            <!-- Catégorie Notifications -->
            <div v-if="activeCategory === 'Notifications'" class="settings-group">
              <h2>Notifications</h2>
              <div class="setting-item">
                <label for="email-notifications-toggle">Notifications par e-mail :</label>
                <div class="toggle-container">
                  <input type="checkbox" id="email-notifications-toggle" v-model="settings.notifications.emailNotifications" />
                  <span>{{ settings.notifications.emailNotifications ? "Activées" : "Désactivées" }}</span>
                </div>
              </div>
              <div class="setting-item">
                <label for="push-notifications-toggle">Notifications push :</label>
                <div class="toggle-container">
                  <input type="checkbox" id="push-notifications-toggle" v-model="settings.notifications.pushNotifications" />
                  <span>{{ settings.notifications.pushNotifications ? "Activées" : "Désactivées" }}</span>
                </div>
              </div>
            </div>
  
            <!-- Bouton d'application -->
            <div class="setting-item apply-button">
                <!--  <button @click="applySettings">Appliquer les paramètres</button>-->
                <button >Appliquer les paramètres</button>
            </div>
          </div>
  
          <!-- Sidebar des catégories (positionnée à droite) -->
          <div class="sidebar">
            <h3>Catégories</h3>
            <ul>
              <li :class="{ active: activeCategory === 'Interface' }" @click="activeCategory = 'Interface'">
                Interface
              </li>
              <li :class="{ active: activeCategory === 'Date & Heure' }" @click="activeCategory = 'Date & Heure'">
                Date & Heure
              </li>
              <li :class="{ active: activeCategory === 'Maintenance & Sécurité' }" @click="activeCategory = 'Maintenance & Sécurité'">
                Maintenance & Sécurité
              </li>
              <li :class="{ active: activeCategory === 'Notifications' }" @click="activeCategory = 'Notifications'">
                Notifications
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import Navbar from '@/components/Utils/Navbar.vue';
  
  export default {
    name: "SettingView",
    components: {
      Navbar
    },
    data() {
      return {
        activeCategory: 'Interface',
        settings: {
          interface: {
            language: 'fr',
            fontSize: 'medium',
            theme: 'light',
            enableAnimations: true
          },
          dateTime: {
            dateFormat: 'DD/MM/YYYY',
            timezone: 'UTC'
          },
          maintenance: {
            maintenanceMode: false,
            sessionTimeout: 30
          },
          notifications: {
            emailNotifications: true,
            pushNotifications: false
          }
        }
      };
    },
    methods: {
      applySettings() {
        const settings = this.settings;
        console.log("Paramètres de la plateforme appliqués :", settings);
        alert("Les paramètres de la plateforme ont été appliqués avec succès !");
        // Sauvegarde dans le localStorage (ou une autre solution de persistance)
        localStorage.setItem('platformSettings', JSON.stringify(settings));
      }
    },
    mounted() {
      // Chargement des paramètres sauvegardés (si disponibles)
      const savedSettings = localStorage.getItem('platformSettings');
      if (savedSettings) {
        // Fusionne les valeurs sauvegardées avec la configuration par défaut
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    }
  };
  </script>
  
  <style scoped>
  .settings-page {
    font-family: Arial, sans-serif;
  }
  
  .settings-container {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .settings-layout {
    display: flex;
    gap: 20px;
  }
  
  /* Zone principale pour les options */
  .main-content {
    flex: 1;
    padding: 20px;
    border-radius: 8px;
  }
  
  /* Sidebar de navigation (positionnée à droite) */
  .sidebar {
    width: 250px;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .sidebar h3 {
    text-align: center;
    margin-top: 0;
    margin-bottom: 15px;
  }
  
  .sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .sidebar ul li {
    padding: 10px;
    text-align: center;
    cursor: pointer;
    border-bottom: 1px solid #eee;
  }
  
  .sidebar ul li:last-child {
    border-bottom: none;
  }
  
  .sidebar ul li.active,
  .sidebar ul li:hover {
    background: #007bff;
    color: #fff;
  }
  
  /* Groupes de paramètres */
  .settings-group {
    margin-bottom: 30px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 20px;
  }
  
  .settings-group h2 {
    margin-bottom: 15px;
    font-size: 1.2em;
  }
  
  /* Items de paramètres */
  .setting-item {
    margin-bottom: 15px;
  }
  
  .setting-item label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .setting-item select,
  .setting-item input[type="number"] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .toggle-container {
    display: flex;
    align-items: center;
  }
  
  .toggle-container input[type="checkbox"] {
    margin-right: 10px;
  }
  
  /* Bouton d'application */
  .apply-button {
    text-align: center;
    margin-top: 20px;
  }
  
  .apply-button button {
    padding: 10px 20px;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .apply-button button:hover {
    background: #0056b3;
  }
  </style>
  