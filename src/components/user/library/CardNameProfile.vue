
<template>

  <!-- Bandeau Maison (inclut Game Master) -->
  <BandeauMaison
    v-if="hasValidHouse"
    :maison="userGamification.maison"
    :niveau="userGamification.niveau"
    :loginStreak="userGamification.loginStreak"
    class="mb-4"
  />

  <!-- PROMPT POUR QUIZ HES si pas de maison (sauf Game Master) -->
  <div v-if="!hasValidHouse && !isGameMaster" class="house-quiz-prompt mb-4">
    <div class="quiz-prompt-card">
      <div class="quiz-prompt-content">
        <i class="pi pi-graduation-cap quiz-prompt-icon"></i>
        <h3>Découvre ta maison HES !</h3>
        <p>Passe le quiz pour être assigné à ta maison selon tes valeurs et ta personnalité.</p>
        <button @click="startHESQuiz" class="quiz-prompt-button">
          <i class="pi pi-play"></i>
          Commencer le quiz
        </button>
      </div>
    </div>
  </div>


  <!-- XP Bar (sauf pour Game Master qui a déjà tout dans son bandeau) -->
  <XPBar
    v-if="hasValidHouse && !isGameMaster"
    :xp="userGamification.xp"
    :xp-to-next="userGamification.xpToNext"
    :niveau="userGamification.niveau"
    :maison="userGamification.maison"
    class="mb-4"
  />

  <!-- FIN BANDEAU MAISON + XP -->
  <div class="mb-4 card-profile-responsive">
    <div class="avatar-wrapper">
      <img :src="user.photoURL || defaultAvatar" alt="Avatar" style="border-radius: 3rem;" />
      <h1 class="pl-4">{{ displayFullName }}</h1>
    </div>
    <h5 class="mb-4">Informations personnelles</h5>
    <div class="surfaces-card info-grid">
      <div class="info-item">
        <i class="pi pi-envelope info-icon"></i>
        <span class="info-label">Email :</span>
        <span class="info-value">{{ displayEmail }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-user info-icon"></i>
        <span class="info-label">Nom, Prénom :</span>
        <span class="info-value">{{ displayFullName }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-briefcase info-icon"></i>
        <span class="info-label">Classe :</span>
        <span class="info-value">{{ user.classe || 'Non définie' }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-map-marker info-icon"></i>
        <span class="info-label">Ville :</span>
        <span class="info-value">{{ user.ville || 'Non renseignée' }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-id-card info-icon"></i>
        <span class="info-label">Id :</span>
        <span class="info-value id">{{ user.uid }}</span>
      </div>
      <div class="info-item info-item-respondant">
        <i class="pi pi-users info-icon"></i>
        <span class="info-label">Répondant HES :</span>
        <br class="show-on-overflow"/>
        <span class="info-value">
          <template v-if="isAdmin">
            <Dropdown
              v-model="selectedTeacher"
              :options="teachersOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez un enseignant"
              showClear
            />
          </template>
          <template v-else>
            {{ user.repondantHES || 'Non assigné' }}
          </template>
        </span>
      </div>
      <div class="info-item info-item-full actions-row">
        <Button label="Sauvegarder le profil" @click="saveProfileWithXP" class="save-btn" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/supabase.js';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import BandeauMaison from '@/components/gamification/BandeauMaison.vue';
import XPBar from '@/components/gamification/XPBar.vue';
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import gamificationIntegration from '@/service/gamificationIntegration'
import supabaseStorageService from '@/service/supabaseStorageService'

const defaultAvatar = '@/assets/images/avatar/01.jpg';
const toast = useToast();

// Profil consulté (celui affiché)
const user = ref({
  uid: '',
  prenom: '',
  nom: '',
  bio: '',
  photoURL: '',
  email: '',
  ville: '',
  classe: '',
  repondantHES: '',
  maison: '',
  niveau: '',
  xp: 0,
  xpToNext: 100
});

// Profil de l'utilisateur connecté (pour vérifier s'il est admin)
const currentUserProfile = ref({
  uid: '',
  Roles: {}
});

const selectedAvatarFile = ref(null);
// Référence pour la sélection d'un enseignant dans le dropdown (pour modifier Répondant HES)
const selectedTeacher = ref("");

// Computed pour déterminer si l'utilisateur connecté est admin
const isAdmin = computed(() => {
  return currentUserProfile.value.Roles && currentUserProfile.value.Roles.admin === true;
});

// Fonction helper pour capitaliser (première lettre en majuscule)
const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Computed pour l'affichage des données utilisateur avec fallback sur authStore
const displayName = computed(() => {
  // Si c'est le profil de l'utilisateur connecté, utiliser authStore
  if (route.params.id === authStore.user?.id) {
    const email = authStore.user?.email || '';
    return email.split('@')[0] || 'Utilisateur';
  }
  // Sinon utiliser les données du profil consulté avec capitalisation
  const prenom = capitalize(user.value.prenom)
  const nom = capitalize(user.value.nom)
  return `${prenom} ${nom}`.trim() || 'Utilisateur';
});

const displayEmail = computed(() => {
  // Si c'est le profil de l'utilisateur connecté, utiliser authStore
  if (route.params.id === authStore.user?.id) {
    return authStore.user?.email || user.value.email || '';
  }
  // Sinon utiliser les données du profil consulté
  return user.value.email || '';
});

const displayFullName = computed(() => {
  // Si c'est le profil de l'utilisateur connecté, utiliser authStore
  if (route.params.id === authStore.user?.id) {
    const email = authStore.user?.email || '';
    const username = email.split('@')[0] || '';
    // Essayer d'extraire prénom/nom du username
    const parts = username.split('.');
    if (parts.length >= 2) {
      return `${capitalize(parts[1])} ${capitalize(parts[0])}`;
    }
    return capitalize(username) || 'Utilisateur';
  }
  // Sinon utiliser les données du profil consulté avec capitalisation
  const nom = capitalize(user.value.nom)
  const prenom = capitalize(user.value.prenom)
  return `${nom} ${prenom}`.trim() || 'Utilisateur';
});

// Récupération du profil consulté depuis user_profiles Supabase
const fetchUserProfileById = async (userId) => {
  console.log('📥 Chargement profil depuis user_profiles pour:', userId)

  const { data: profileData, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('❌ Erreur chargement profil:', error)
    return
  }

  if (profileData) {
    console.log('✅ Profil chargé:', profileData)
    console.log('📋 Données extraites:', {
      classe: profileData.class || profileData.classe,
      repondantHES: profileData.hes_referent || profileData.respondant_hes,
      allKeys: Object.keys(profileData)
    })
    
    user.value = {
      ...user.value,
      uid: userId,
      prenom: profileData.forname || '',
      nom: profileData.family_name || '',
      email: profileData.email || '',
      ville: profileData.city || '',
      bio: profileData.bio || '',
      photoURL: profileData.avatar_url || profileData.profile_picture_url || defaultAvatar,
      classe: profileData.class || profileData.classe || '',
      repondantHES: profileData.hes_referent || profileData.respondant_hes || ''
    };
    
    console.log('👤 User.value mis à jour:', {
      classe: user.value.classe,
      repondantHES: user.value.repondantHES
    })
  } else {
    console.warn("⚠️ Aucun profil trouvé pour l'ID :", userId);
  }
};

// Enrichir avec les données de StudentsPhysio si disponibles
const fetchStudentProfileById = async (userId) => {
  console.log('📚 Enrichissement avec StudentsPhysio pour:', userId)
  
  try {
    const { data: physioData, error } = await supabase
      .from('StudentsPhysio')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) {
      console.warn('⚠️ StudentsPhysio non accessible:', error.message)
      return
    }
    
    if (physioData) {
      console.log('✅ Données StudentsPhysio trouvées:', physioData)
      console.log('📊 Données brutes StudentsPhysio:', {
        class: physioData.class,
        ville: physioData.ville || physioData.city,
        repondant: physioData.repondant_hes
      })
      
      const enrichedFields = []
      
      // 1. CLASSE - Priorité: user_profiles.class > StudentsPhysio.class
      if (!user.value.classe) {
        const classePhysio = physioData.class
        if (classePhysio) {
          user.value.classe = classePhysio
          enrichedFields.push('classe')
          console.log('📝 Classe enrichie depuis StudentsPhysio:', classePhysio)
        }
      } else {
        console.log('✅ Classe déjà présente depuis user_profiles:', user.value.classe)
      }
      
      // 2. RÉPONDANT HES - Priorité: user_profiles.hes_referent > StudentsPhysio
      const repondantPhysio = physioData.repondant_hes
      if (!user.value.repondantHES && repondantPhysio) {
        user.value.repondantHES = repondantPhysio
        enrichedFields.push('repondantHES')
        console.log('📝 Répondant HES enrichi depuis StudentsPhysio:', repondantPhysio)
      } else if (user.value.repondantHES) {
        console.log('✅ Répondant HES déjà présent depuis user_profiles:', user.value.repondantHES)
      }
      
      // 3. VILLE - Priorité: user_profiles.city > StudentsPhysio
      const villePhysio = physioData.ville || physioData.city
      if (!user.value.ville && villePhysio) {
        user.value.ville = villePhysio
        enrichedFields.push('ville')
        console.log('📝 Ville enrichie depuis StudentsPhysio:', villePhysio)
      } else if (user.value.ville) {
        console.log('✅ Ville déjà présente depuis user_profiles:', user.value.ville)
      }
      
      // 4. EMAIL - Priorité: user_profiles.email > StudentsPhysio
      if (!user.value.email && physioData.email) {
        user.value.email = physioData.email
        enrichedFields.push('email')
        console.log('📝 Email enrichi depuis StudentsPhysio:', physioData.email)
      } else if (user.value.email) {
        console.log('✅ Email déjà présent depuis user_profiles:', user.value.email)
      }
      
      // 5. NOM/PRÉNOM - Priorité: user_profiles > StudentsPhysio
      if (!user.value.nom && physioData.family_name) {
        user.value.nom = physioData.family_name
        enrichedFields.push('nom')
        console.log('📝 Nom enrichi depuis StudentsPhysio:', physioData.family_name)
      }
      if (!user.value.prenom && physioData.forname) {
        user.value.prenom = physioData.forname
        enrichedFields.push('prenom')
        console.log('📝 Prénom enrichi depuis StudentsPhysio:', physioData.forname)
      }
      
      // Résumé de l'enrichissement
      if (enrichedFields.length > 0) {
        console.log(`🎯 ${enrichedFields.length} champs enrichis depuis StudentsPhysio:`, enrichedFields)
      } else {
        console.log('ℹ️ Aucun champ à enrichir - user_profiles complet')
      }
      
      console.log('👤 User.value après enrichissement:', {
        classe: user.value.classe,
        repondantHES: user.value.repondantHES,
        ville: user.value.ville,
        email: user.value.email,
        nom: user.value.nom,
        prenom: user.value.prenom
      })
    } else {
      console.log('ℹ️ Pas de données StudentsPhysio pour cet utilisateur')
    }
  } catch (error) {
    console.error('❌ Erreur enrichissement StudentsPhysio:', error)
  }
};

// Récupération du profil de l'utilisateur connecté depuis user_profiles Supabase
const fetchCurrentUserProfile = async (currentUserId) => {
  console.log('👤 Chargement profil utilisateur connecté:', currentUserId)

  // Charger les rôles depuis user_roles
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUserId)

  const roles = {}
  rolesData?.forEach(r => {
    roles[r.role] = true
  })

  currentUserProfile.value = {
    uid: currentUserId,
    Roles: roles
  }

  console.log('✅ Rôles utilisateur:', roles)

  // Récupérer aussi les données de gamification pour l'utilisateur connecté
  await fetchGamificationData(currentUserId);
};

// Importation des enseignants depuis user_profiles (filtrés par rôle)
const teachers = ref([]);
const fetchTeachers = async () => {
  console.log('👨‍🏫 Chargement des enseignants depuis Supabase...')

  try {
    // Charger les utilisateurs avec le rôle 'professor' depuis user_roles
    const { data: teacherRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'professor')

    if (rolesError) {
      console.warn('⚠️ Erreur chargement user_roles:', rolesError.message)
      // Continuer quand même pour charger depuis StudentsPhysio
    } else if (teacherRoles && teacherRoles.length > 0) {
      const teacherIds = teacherRoles.map(r => r.user_id)

      // Charger les profils des enseignants
      const { data: teachersData, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, forname, family_name, email')
        .in('user_id', teacherIds)

      if (error) {
        console.error('❌ Erreur chargement enseignants:', error)
      } else {
        teachers.value = teachersData || []
        console.log(`✅ ${teachers.value.length} enseignants chargés depuis user_profiles`)
      }
    } else {
      console.log('ℹ️ Aucun enseignant trouvé dans user_roles')
    }
  } catch (error) {
    console.error('❌ Erreur dans fetchTeachers:', error)
  }

  // TOUJOURS enrichir avec les répondants HES depuis StudentsPhysio
  await fetchRepondantsFromStudentsPhysio()
};

// Récupérer les répondants HES depuis StudentsPhysio
const fetchRepondantsFromStudentsPhysio = async () => {
  console.log('📋 Chargement des répondants HES depuis StudentsPhysio...')
  
  try {
    const { data: physioData, error } = await supabase
      .from('StudentsPhysio')
      .select('repondant_hes, class')

    if (error) {
      console.warn('⚠️ StudentsPhysio non accessible ou vide:', error.message)
      return
    }

    if (!physioData || physioData.length === 0) {
      console.log('ℹ️ Aucun répondant trouvé dans StudentsPhysio')
      return
    }

    // Regrouper les répondants avec leurs classes
    const repondantsMap = new Map()
    physioData.forEach(row => {
      const repondant = row.repondant_hes
      const classe = row.class
      
      if (repondant && typeof repondant === 'string' && repondant.trim()) {
        const repondantName = repondant.trim()
        
        // Ajouter la classe associée au répondant
        if (!repondantsMap.has(repondantName)) {
          repondantsMap.set(repondantName, new Set())
        }
        if (classe) {
          repondantsMap.get(repondantName).add(classe)
        }
      }
    })

    // Ajouter les répondants qui ne sont pas déjà dans la liste des teachers
    const existingNames = teachers.value.map(t => 
      t.display_name || `${t.forname} ${t.family_name}`.trim()
    )

    repondantsMap.forEach((classes, repondantName) => {
      if (!existingNames.includes(repondantName)) {
        const classesArray = Array.from(classes)
        const classesText = classesArray.length > 0 ? classesArray.join(', ') : ''
        
        // Ajouter comme entrée sans user_id (uniquement par nom)
        teachers.value.push({
          user_id: `physio_${repondantName}`, // ID fictif pour le dropdown
          display_name: repondantName,
          forname: '',
          family_name: '',
          email: '',
          classes: classesArray,
          classesText: classesText,
          fromStudentsPhysio: true
        })
      }
    })

    console.log(`✅ ${repondantsMap.size} répondants HES trouvés dans StudentsPhysio`)
    console.log(`📊 Total: ${teachers.value.length} options disponibles`)
    
    // Log détaillé des répondants avec leurs classes
    repondantsMap.forEach((classes, name) => {
      console.log(`  - ${name}: ${Array.from(classes).join(', ') || 'pas de classe'}`)
    })
  } catch (error) {
    console.error('❌ Erreur récupération répondants StudentsPhysio:', error)
  }
};

// Construction des options pour le dropdown des enseignants
const teachersOptions = computed(() => {
  return teachers.value.map(teacher => {
    const displayName = teacher.display_name || `${teacher.forname} ${teacher.family_name}`
    
    // Ajouter les classes si c'est un répondant de StudentsPhysio
    let label = displayName
    if (teacher.fromStudentsPhysio && teacher.classesText) {
      label = `${displayName} (Classes: ${teacher.classesText})`
    } else if (teacher.fromStudentsPhysio) {
      label = `${displayName} (StudentsPhysio)`
    }
    
    return {
      label: label,
      value: teacher.user_id,
      classes: teacher.classes || [],
      fromStudentsPhysio: teacher.fromStudentsPhysio || false
    };
  });
});

// Pré-remplissage du dropdown si un répondant est déjà présent et si l'utilisateur connecté est admin
watch(teachersOptions, (newOptions) => {
  if (user.value.repondantHES && isAdmin.value) {
    const repondantName = user.value.repondantHES.trim();
    
    // Chercher d'abord une correspondance exacte par label complet
    let teacherMatch = newOptions.find(opt => opt.label === repondantName);
    
    // Si pas trouvé, extraire le nom de base du label (avant les parenthèses)
    if (!teacherMatch) {
      teacherMatch = newOptions.find(opt => {
        const baseName = opt.label.split(' (')[0].trim()
        return baseName === repondantName || baseName.toLowerCase() === repondantName.toLowerCase()
      });
    }
    
    // Si toujours pas trouvé, chercher une correspondance partielle (insensible à la casse)
    if (!teacherMatch) {
      teacherMatch = newOptions.find(opt => 
        opt.label.toLowerCase().includes(repondantName.toLowerCase())
      );
    }
    
    if (teacherMatch) {
      selectedTeacher.value = teacherMatch.value;
      console.log(`✅ Répondant HES pré-sélectionné: ${teacherMatch.label}`, {
        value: teacherMatch.value,
        classes: teacherMatch.classes,
        fromStudentsPhysio: teacherMatch.fromStudentsPhysio
      });
    } else {
      selectedTeacher.value = "";
      console.log(`⚠️ Répondant HES actuel non trouvé dans les options: "${repondantName}"`);
    }
  }
}, { immediate: true });

// Fonction de sauvegarde du profil : met à jour user_profiles dans Supabase
const saveProfile = async () => {

  try {
    console.log('💾 Sauvegarde du profil dans Supabase...')

    // Si un nouvel avatar a été sélectionné, on l'upload sur Supabase Storage
    if (selectedAvatarFile.value) {
      try {
        console.log('📸 Upload avatar vers Supabase Storage...');
        const uploadResult = await supabaseStorageService.uploadAvatar(
          user.value.uid,
          selectedAvatarFile.value
        );
        user.value.photoURL = uploadResult.url;
        console.log('✅ Avatar uploadé sur Supabase:', uploadResult.url);
      } catch (error) {
        console.error("❌ Erreur lors de l'upload de l'avatar sur Supabase:", error);
        toast.add({ severity: 'error', summary: 'Avatar', detail: "Erreur lors de l'upload de l'avatar", life: 3500 })
        return;
      }
    }

    // Trouver le label de l'enseignant si un est sélectionné
    let hesReferent = user.value.repondantHES
    if (isAdmin.value && selectedTeacher.value) {
      const teacherOpt = teachersOptions.value.find(opt => opt.value === selectedTeacher.value);
      
      // Extraire le nom de base (sans les classes entre parenthèses)
      if (teacherOpt) {
        const baseName = teacherOpt.label.split(' (')[0].trim()
        hesReferent = baseName
        
        // Log pour debug
        console.log('💾 Sauvegarde répondant HES:', {
          selectedValue: selectedTeacher.value,
          fullLabel: teacherOpt.label,
          savedName: hesReferent,
          classes: teacherOpt.classes,
          isFromStudentsPhysio: teacherOpt.fromStudentsPhysio
        })
      } else {
        hesReferent = ''
      }
    }

    // Mise à jour du profil dans user_profiles Supabase
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        forname: user.value.prenom,
        family_name: user.value.nom,
        email: user.value.email,
        city: user.value.ville,
        bio: user.value.bio,
        avatar_url: user.value.photoURL,
        class: user.value.classe,
        hes_referent: hesReferent,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.value.uid)

    if (updateError) {
      console.error('❌ Erreur mise à jour profil:', updateError)
      toast.add({ severity: 'error', summary: 'Profil', detail: 'Erreur lors de la sauvegarde du profil', life: 3500 })
      return
    }

    user.value.repondantHES = hesReferent
    console.log('✅ Profil mis à jour dans Supabase')

    // NOUVEAU : Déclencher l'intégration gamification pour mise à jour profil
    await gamificationIntegration.onProfileUpdate(user.value.uid, {
      profileCompleted: true,
      hasAvatar: !!user.value.photoURL,
      hasBio: !!user.value.bio,
      hasCity: !!user.value.ville,
      timestamp: Date.now()
    });

    toast.add({ severity: 'success', summary: 'Profil', detail: 'Profil mis à jour avec succès', life: 2500 })

    // Recharger les données de gamification pour afficher les nouveaux badges/XP
    await fetchGamificationData(user.value.uid);

  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil :", error);
    toast.add({ severity: 'error', summary: 'Profil', detail: 'Erreur lors de la sauvegarde du profil', life: 3500 })
  }
};

const onAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedAvatarFile.value = file;
  }
};

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  // Vérifier et créer le bucket avatars si nécessaire
  await supabaseStorageService.ensureAvatarsBucket();

  // Récupérer l'ID de l'utilisateur dont le profil est consulté (depuis l'URL)
  const userId = route.params.id;
  if (userId) {
    await fetchUserProfileById(userId);
    await fetchStudentProfileById(userId);
    await fetchGamificationData(userId);
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }

  // Utiliser authStore au lieu de Firebase Auth pour l'utilisateur connecté
  if (authStore.user?.id) {
    await fetchCurrentUserProfile(authStore.user.id);
  }

  // Charger la liste des enseignants
  await fetchTeachers();
});

// Récupération des données de gamification avec le service Supabase
const fetchGamificationData = async (userId) => {
  try {
    // Utiliser le service Supabase pour récupérer les données
    const gamificationData = await gamificationServiceSupabase.getUserGamificationData(userId);

    if (gamificationData) {
      userGamification.value = {
        maison: gamificationData.maison || null,
        niveau: gamificationData.niveau || 1,
        xp: gamificationData.xp || 0,
        totalXP: gamificationData.totalXP || 0,
        xpToNext: gamificationData.xpToNext || 100,
        lastXPGain: gamificationData.lastXPGain || null,
        loginStreak: gamificationData.loginStreak || 0,
        badges: gamificationData.badges || [],
        quests: gamificationData.quests || [],
        challenges: gamificationData.challenges || []
      };
    } else {
      // Données par défaut si aucune donnée trouvée
      userGamification.value = {
        maison: null,
        niveau: 1,
        xp: 0,
        totalXP: 0,
        xpToNext: 100,
        lastXPGain: null,
        loginStreak: 0,
        badges: [],
        quests: [],
        challenges: []
      };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données de gamification:', error)
    userGamification.value = {
      maison: null,
      niveau: 1,
      xp: 0,
      totalXP: 0,
      xpToNext: 100,
      lastXPGain: null,
      loginStreak: 0,
      badges: [],
      quests: [],
      challenges: []
    }
  }
};

// Données gamification unifiées avec badges, quêtes et défis
const userGamification = ref({
  maison: null,
  niveau: 1,
  xp: 0,
  totalXP: 0,
  xpToNext: 100,
  lastXPGain: null,
  loginStreak: 0,
  badges: [],
  quests: [],
  challenges: []
});

const xpPercent = computed(() => {
  if (!userGamification.value.xpToNext) return 0;
  return Math.round((userGamification.value.xp / userGamification.value.xpToNext) * 100);
});
const xpColor = computed(() => {
  switch ((userGamification.value.maison || '').toLowerCase()) {
    case 'harmonis': return '#608E62';
    case 'elaris': return '#B15E56';
    case 'doloris': return '#D4B25B';
    case 'solencia': return '#668DA3';
    default: return '#6366F1';
  }
});

// Computed pour détecter si c'est un Game Master
const isGameMaster = computed(() => {
  if (!userGamification.value || !userGamification.value.maison) {
    return false;
  }
  return userGamification.value.maison.toLowerCase() === 'gamemaster';
});

// Computed pour valider si l'utilisateur a une maison valide
const hasValidHouse = computed(() => {
  if (!userGamification.value || !userGamification.value.maison) {
    return false;
  }
  const validHouses = ['harmonis', 'elaris', 'doloris', 'solencia', 'gamemaster'];
  return validHouses.includes(userGamification.value.maison.toLowerCase());
});

// Méthode pour démarrer le quiz HES
const startHESQuiz = () => {
  router.push('/hes-house-quiz');
};

// Fonction pour ajouter de l'XP à l'utilisateur avec le service Supabase
const giveUserXP = async (action, customXP = null) => {
  try {
    const userId = route.params.id || currentUserProfile.value?.uid
    if (!userId) return

    // Utiliser le service Supabase pour ajouter de l'XP
    const xpAmount = customXP || 10;
    const newData = await gamificationServiceSupabase.addUserXP(userId, action, xpAmount);

    // Mettre à jour les données locales avec les nouvelles données
    if (newData) {
      userGamification.value = {
        ...userGamification.value,
        maison: newData.maison || userGamification.value.maison,
        niveau: newData.niveau || 1,
        xp: newData.xp || 0,
        totalXP: newData.totalXP || 0,
        xpToNext: newData.xpToNext || 100,
        lastXPGain: newData.lastXPGain || null,
        loginStreak: newData.loginStreak || userGamification.value.loginStreak || 0
      };

      // Afficher une notification de gain d'XP
      if (newData.lastXPGain) {
        console.log(`+${newData.lastXPGain.amount} XP - ${newData.lastXPGain.description}`);
      }
    }

  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'XP:', error)
  }
}

// Fonction appelée lors de la sauvegarde du profil (pour donner de l'XP)
const saveProfileWithXP = async () => {
  try {
    await saveProfile()

    // NOUVEAU : Utiliser gamificationIntegration pour déclencher tous les événements
    const userId = route.params.id || currentUserProfile.value?.uid
    if (userId) {
      await gamificationIntegration.onProfileUpdate(userId, {
        profileCompleted: true,
        hasAvatar: !!user.value.photoURL,
        hasBio: !!user.value.bio,
        hasCity: !!user.value.ville,
        timestamp: Date.now()
      })

      // Recharger les données gamification pour voir les nouveaux badges/XP
      await fetchGamificationData(userId)
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde avec gamification:', error)
  }
}
</script>

<style scoped>
.surfaces-card,
.info-item {
  box-sizing: border-box;
}

.actions-row,
.info-item-full {
  width: 100%;
  box-sizing: border-box;
}

.save-btn {
  width: auto;
  min-width: 200px;
  max-width: 100%;
}

.p-dropdown {
  max-width: 100%;
  min-width: 0;
}

.surfaces-card {
  margin: 1.5rem 0;
  background: var(--surface-card);
  border: 1px solid var(--surface-border, rgba(148, 163, 184, 0.28));
  padding: 1.5rem;
  border-radius: 2rem;
  overflow: hidden;
  box-shadow: 0 2px 14px rgba(60, 60, 60, 0.08);
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1rem;
}
@media (max-width: 700px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
.info-item {
  display: flex;
  align-items: center;
  background: var(--surface-overlay, rgba(15, 23, 42, 0.05));
  border-radius: 1rem;
  padding: 0.7rem 1rem;
  gap: 0.7rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.info-icon {
  font-size: 1.25rem;
  color: var(--primary-color);
  flex-shrink: 0;
}
.info-label {
  font-size: 0.96rem;
  color: #aaa;
  margin-right: 0.5rem;
  min-width: 90px;
}
.info-value {
  font-size: 1.05rem;
  font-weight: 500;
  color: #fff;
  word-break: break-all;
}
.info-value.id {
  word-break: normal;
  overflow-x: auto;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}
.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
.save-btn {
  font-weight: 600;
  border-radius: 0.85rem;
}
.info-item-full {
  grid-column: 1 / -1;
  justify-content: flex-end;
  display: flex;
}
@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}

.info-item-respondant {
  flex-wrap: wrap;
  align-items: flex-start;
}
.info-item-respondant .info-label {
  min-width: unset;
  margin-bottom: 0.2rem;
}
.info-item-respondant .info-value {
  display: block;
  width: 100%;
  word-break: break-word;
}

/* --- Responsive Mobile Styles --- */
@media (max-width: 991px) {
  .mb-4 {
    margin-bottom: 1rem !important;
  }
  .p-pt-4, .p-pb-4, .p-4 {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
  .surfaces-card {
    border-radius: 1rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .flex.align-items-center {
    flex-direction: column !important;
    align-items: center !important;
    gap: 0.5rem;
  }
  img[alt="Avatar"] {
    width: 90px !important;
    height: 90px !important;
    margin: 0 auto;
    display: block;
  }
  h1.pl-4 {
    padding-left: 0 !important;
    font-size: 1.2rem;
    text-align: center;
    margin-top: 0.4rem;
  }
  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .info-item {
    flex-direction: column !important;
    align-items: flex-start !important;
    font-size: 0.98rem;
    padding: 0.2rem 0.1rem;
  }
  .actions-row {
    justify-content: center !important;
    display: flex;
  }
  .save-btn {
    width: 100% !important;
    font-size: 1rem;
  }
}
@media (max-width: 600px) {
  .surfaces-card {
    padding: 0.3rem !important;
  }
  h1.pl-4 {
    font-size: 1rem;
  }
}

.card-profile-responsive {
  padding: 1.2rem 1rem 1.2rem 1rem;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 1rem;
}
.avatar-wrapper img[alt="Avatar"] {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.75);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
  margin: 0 auto;
  display: block;
}
.avatar-wrapper h1 {
  padding-left: 0 !important;
  text-align: center;
  margin-top: 0.4rem;
}
@media (max-width: 991px) {
  .card-profile-responsive {
    padding: 1rem 0.7rem 1rem 0.7rem;
  }
  .avatar-wrapper img[alt="Avatar"] {
    width: 90px !important;
    height: 90px !important;
  }
  .avatar-wrapper {
    padding-bottom: 0.7rem;
  }
}
@media (max-width: 600px) {
  .card-profile-responsive {
    padding: 0.5rem 0.2rem 0.5rem 0.2rem;
  }
  .avatar-wrapper img[alt="Avatar"] {
    width: 70px !important;
    height: 70px !important;
  }
}

/* Styles pour le prompt du quiz HES */
.house-quiz-prompt {
  margin-bottom: 1rem;
}

.quiz-prompt-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.quiz-prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.quiz-prompt-icon {
  font-size: 3rem;
  color: #FFD700;
  margin-bottom: 0.5rem;
}

.quiz-prompt-card h3 {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 700;
}

.quiz-prompt-card p {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.5;
}

.quiz-prompt-button {
  background: #FFD700;
  color: #2c3e50;
  border: none;
  padding: 1rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.quiz-prompt-button:hover {
  background: #FFC107;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.quiz-prompt-button i {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .quiz-prompt-card {
    padding: 1.5rem;
  }

  .quiz-prompt-icon {
    font-size: 2.5rem;
  }

  .quiz-prompt-card h3 {
    font-size: 1.3rem;
  }

  .quiz-prompt-button {
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>