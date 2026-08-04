<template>
    <div class="settings-page">
      <Navbar />
      <div class="settings-container">
        <PageHeader title="Paramètres de la plateforme" description="Personnalisez l’interface, les notifications et les préférences de votre session." />
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

            <!-- Catégorie Données & Cache -->
            <div v-if="activeCategory === 'Données & Cache'" class="settings-group">
              <h2>Données & Cache</h2>
              <p class="cache-description">
                Si vous rencontrez des problèmes d'affichage, des données obsolètes ou des erreurs sur la plateforme,
                vous pouvez vider le cache de l'application. Cela supprimera les données temporaires stockées
                dans votre navigateur et rechargera la page.
              </p>
              <div class="cache-info">
                <div class="cache-info-item">
                  <strong>Version de l'application :</strong>
                  <span>{{ appVersion }}</span>
                </div>
                <div class="cache-info-item">
                  <strong>Service Worker :</strong>
                  <span>{{ swStatus }}</span>
                </div>
                <div class="cache-info-item">
                  <strong>Caches stockés :</strong>
                  <span>{{ cacheCount }} cache(s)</span>
                </div>
              </div>
              <div class="cache-actions">
                <button class="btn-clear-cache" @click="clearCache" :disabled="clearing">
                  {{ clearing ? 'Nettoyage en cours...' : 'Vider le cache et recharger' }}
                </button>
              </div>
              <p class="cache-note">
                <em>Note : Après le nettoyage, vous serez peut-être invité(e) à vous reconnecter.</em>
              </p>
            </div>
  
          </div>
  
          <!-- Sidebar des catégories (positionnée à droite) -->
          <div class="sidebar">
            <h3>Catégories</h3>
            <ul aria-label="Catégories de paramètres">
              <li v-for="category in categories" :key="category.label">
                <button type="button" :class="{ active: activeCategory === category.label }" :aria-current="activeCategory === category.label ? 'page' : undefined" @click="activeCategory = category.label">
                  <i :class="category.icon" aria-hidden="true"></i>
                  <span>{{ category.label }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="isDirty" class="settings-savebar" role="status">
          <span><i class="pi pi-circle-fill" aria-hidden="true"></i> Modifications non enregistrées</span>
          <div>
            <button type="button" class="savebar-button savebar-button--secondary" @click="discardSettings">Annuler les modifications</button>
            <button type="button" class="savebar-button" :disabled="isSaving" @click="applySettings">{{ isSaving ? 'Enregistrement…' : 'Enregistrer les paramètres' }}</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import Navbar from '@/components/common/utils/Navbar.vue';
  import PageHeader from '@/components/common/layout/PageHeader.vue';
  
  export default {
    name: "SettingView",
    components: {
      Navbar,
      PageHeader
    },
    data() {
      return {
        activeCategory: 'Interface',
        categories: [
          { label: 'Interface', icon: 'pi pi-desktop' },
          { label: 'Date & Heure', icon: 'pi pi-calendar' },
          { label: 'Maintenance & Sécurité', icon: 'pi pi-shield' },
          { label: 'Notifications', icon: 'pi pi-bell' },
          { label: 'Données & Cache', icon: 'pi pi-database' }
        ],
        isDirty: false,
        isSaving: false,
        settingsReady: false,
        initialSettings: null,
        clearing: false,
        appVersion: localStorage.getItem('app_version') || 'N/A',
        swStatus: 'Vérification...',
        cacheCount: 0,
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
        this.isSaving = true;
        const settings = this.settings;
        console.log("Paramètres de la plateforme appliqués :", settings);
        localStorage.setItem('platformSettings', JSON.stringify(settings));
        this.initialSettings = JSON.stringify(settings);
        this.isDirty = false;
        this.isSaving = false;
      },
      discardSettings() {
        if (this.initialSettings) this.settings = JSON.parse(this.initialSettings);
        this.isDirty = false;
      },
      async clearCache() {
        this.clearing = true;
        try {
          // 1. Unregister all service workers
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const reg of registrations) {
              await reg.unregister();
            }
            console.log(`✅ ${registrations.length} Service Worker(s) supprimé(s)`);
          }
          // 2. Delete all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
              await caches.delete(name);
            }
            console.log(`✅ ${cacheNames.length} cache(s) supprimé(s)`);
          }
          // 3. Clear localStorage (except auth)
          const authKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-')) authKeys.push({ key, val: localStorage.getItem(key) });
          }
          localStorage.clear();
          // Restore auth keys so user stays logged in
          authKeys.forEach(({ key, val }) => localStorage.setItem(key, val));
          console.log('✅ localStorage nettoyé (auth préservée)');
          // 4. Reload
          window.location.reload();
        } catch (err) {
          console.error('❌ Erreur lors du nettoyage:', err);
          alert('Erreur lors du nettoyage du cache. Essayez de vider manuellement le cache de votre navigateur.');
          this.clearing = false;
        }
      }
    },
    watch: {
      settings: {
        deep: true,
        handler() {
          if (this.settingsReady) this.isDirty = true;
        }
      }
    },
    async mounted() {
      // Chargement des paramètres sauvegardés (si disponibles)
      const savedSettings = localStorage.getItem('platformSettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
      this.initialSettings = JSON.stringify(this.settings);
      this.$nextTick(() => { this.settingsReady = true; });
      // Check SW & cache status
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          this.swStatus = regs.length > 0 ? `Actif (${regs.length})` : 'Aucun';
        } else {
          this.swStatus = 'Non supporté';
        }
        if ('caches' in window) {
          const names = await caches.keys();
          this.cacheCount = names.length;
        }
      } catch (e) {
        this.swStatus = 'Erreur';
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
  
  .settings-layout {
    display: flex;
    gap: 20px;
  }
  
  /* Zone principale pour les options */
  .main-content {
    flex: 1;
    padding: 20px;
    border-radius: 1.2rem; /* Coins arrondis taille que je dois uttilser */

  }
  
  /* Sidebar de navigation (positionnée à droite) */
  .sidebar {
    width: 250px;
    padding: 20px;
    border-radius: 1.2rem;
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
  
  .sidebar ul button {
    display: flex;
    align-items: center;
    gap: .75rem;
    width: 100%;
    min-height: 44px;
    padding: .75rem;
    border: 0;
    border-radius: .75rem;
    background: transparent;
    color: var(--text-color);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  
  .sidebar ul li:last-child {
    border-bottom: none;
  }
  
  .sidebar ul button.active,
  .sidebar ul button:hover {
    background: var(--primary-color);
    color: #fff;
  }
  .sidebar ul button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  
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

  /* Données & Cache */
  .cache-description {
    color: #666;
    line-height: 1.5;
    margin-bottom: 20px;
  }

  .cache-info {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
  }

  .cache-info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }

  .cache-info-item:last-child {
    border-bottom: none;
  }

  .cache-actions {
    text-align: center;
    margin: 20px 0;
  }

  .btn-clear-cache {
    padding: 12px 24px;
    background: #dc3545;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    transition: background 0.2s;
  }

  .btn-clear-cache:hover:not(:disabled) {
    background: #c82333;
  }

  .btn-clear-cache:disabled {
    background: #999;
    cursor: not-allowed;
  }

  .cache-note {
    color: #888;
    font-size: 0.9em;
    text-align: center;
  }

  .settings-savebar {
    position: sticky;
    bottom: 1rem;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.5rem;
    padding: .875rem 1rem;
    border: 1px solid var(--surface-border);
    border-radius: 1rem;
    background: var(--surface-card);
    box-shadow: 0 10px 30px rgba(0,0,0,.18);
  }
  .settings-savebar > span { display:flex; align-items:center; gap:.5rem; color:var(--text-color); font-weight:600; }
  .settings-savebar > span i { color:var(--primary-color); font-size:.55rem; }
  .settings-savebar > div { display:flex; gap:.75rem; flex-wrap:wrap; }
  .savebar-button { min-height:44px; padding:.625rem 1rem; border:0; border-radius:.75rem; background:var(--primary-color); color:#fff; font:inherit; font-weight:600; cursor:pointer; }
  .savebar-button--secondary { border:1px solid var(--surface-border); background:transparent; color:var(--text-color); }
  .savebar-button:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
  @media(max-width:768px){.settings-layout{flex-direction:column-reverse}.sidebar{width:auto}.settings-savebar{align-items:stretch;flex-direction:column}.settings-savebar>div{display:grid}.savebar-button{width:100%}}
  </style>
  
