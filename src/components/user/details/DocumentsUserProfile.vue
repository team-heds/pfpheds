<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/supabase';
import { useToast } from 'primevue/usetoast';

// Initialisation des données
const folders = ref([
  { name: 'Documents de stage', path: 'documents-stage/', icon: 'pi pi-folder' },
  { name: 'Certificats', path: 'certificats/', icon: 'pi pi-folder' },
  { name: 'Contrats', path: 'contrats/', icon: 'pi pi-folder' }
]);

const selectedFolder = ref(null);  // Dossier sélectionné
const files = ref([]);  // Fichiers dans le dossier sélectionné
const subFolders = ref([]);  // Sous-dossiers dans le dossier sélectionné
const uploadFiles = ref([]);  // Fichiers à uploader
const currentUser = ref(null);  // Utilisateur courant
const userFolderPath = ref('');  // Chemin de stockage spécifique à l'utilisateur
const fileUploaderRef = ref(null);  // Référence au composant FileUpload
const toast = useToast();

// Fonction pour charger les fichiers et sous-dossiers à partir du Storage Supabase
const loadFilesAndSubFoldersFromFolder = async (folderPath) => {
  try {
    const fullPath = `${userFolderPath.value}${folderPath}`;
    
    // Nettoyer les fichiers et sous-dossiers actuels
    files.value = [];
    subFolders.value = [];

    // Lister les fichiers dans le dossier
    const { data: filesList, error } = await supabase.storage
      .from('user-documents')
      .list(fullPath, {
        limit: 100,
        offset: 0,
      });

    if (error) throw error;

    if (filesList) {
      // Séparer fichiers et dossiers
      filesList.forEach((item) => {
        if (item.id) {
          // C'est un fichier
          const { data: urlData } = supabase.storage
            .from('user-documents')
            .getPublicUrl(`${fullPath}${item.name}`);
          
          files.value.push({ 
            name: item.name, 
            url: urlData.publicUrl 
          });
        } else {
          // C'est un dossier
          subFolders.value.push({ 
            name: item.name, 
            path: `${fullPath}${item.name}/` 
          });
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des fichiers:', error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du chargement des fichiers', life: 4000 });
  }
};

// Gérer le clic sur un dossier
const onFolderClick = (folder) => {
  selectedFolder.value = folder;
  loadFilesAndSubFoldersFromFolder(folder.path);  // Charger les fichiers et sous-dossiers
};

// Gérer l'upload de fichiers dans le dossier sélectionné
const onSelectedFiles = async (event) => {
  if (!selectedFolder.value || !currentUser.value) {
    toast.add({ severity: 'warn', summary: 'Avertissement', detail: 'Sélectionnez un dossier avant de télécharger.', life: 4000 });
    return;
  }

  for (const file of event.files) {
    const acceptedFormats = ['image/jpeg', 'image/png', 'audio/mpeg', 'video/mp4', 'application/pdf'];

    if (!acceptedFormats.includes(file.type)) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Type de fichier non accepté. Veuillez uploader un fichier JPG, PNG, MP3, MP4 ou PDF.', life: 4000 });
      continue;
    }

    try {
      // Utiliser le chemin spécifique de l'utilisateur pour stocker le fichier
      const filePath = `${userFolderPath.value}${selectedFolder.value.path}${file.name}`;
      
      // Uploader le fichier dans Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;
      files.value.push({ name: file.name, url: fileUrl });
      
      toast.add({ severity: 'success', summary: 'Succès', detail: `Fichier "${file.name}" uploadé avec succès`, life: 3000 });
    } catch (error) {
      console.error('Erreur d\'upload pour le fichier', file.name, error);
      toast.add({ severity: 'error', summary: 'Erreur', detail: `Erreur lors de l'upload de "${file.name}"`, life: 4000 });
    }
  }
};

// Gérer le choix de fichier pour uploader
const onChooseUploadFiles = () => {
  fileUploaderRef.value.choose();  // Ouvrir le sélecteur de fichiers
};

// Surveiller l'état de connexion de l'utilisateur
onMounted(async () => {
  try {
    // Récupérer l'utilisateur connecté depuis Supabase
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (user) {
      currentUser.value = user;
      userFolderPath.value = `users/${user.id}/`;  // Utiliser l'ID utilisateur pour son chemin dans Storage
      console.log(`Chemin de stockage pour cet utilisateur : ${userFolderPath.value}`);
    } else {
      currentUser.value = null;
      userFolderPath.value = '';
    }
    
    // Écouter les changements d'authentification
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        currentUser.value = session.user;
        userFolderPath.value = `users/${session.user.id}/`;
      } else {
        currentUser.value = null;
        userFolderPath.value = '';
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    currentUser.value = null;
    userFolderPath.value = '';
  }
});
</script>

<template>
  <div class="grid">
    <!-- Section pour uploader des fichiers -->
    <div class="col-12 md:col-5 xl:col-3">
      <div class="card p-0">
        <div class="card">
          <FileUpload
            ref="fileUploaderRef"
            id="files-fileupload"
            name="demo[]"
            accept=".jpg,.png,.mp3,.mp4,.pdf"
          customUpload
          multiple
          auto
          class="upload-button-hidden w-full"
          @select="onSelectedFiles"
          :pt="{
          buttonbar: { class: 'hidden' },
          content: { class: 'border-none' }
          }"
          >
          <template #empty>
            <div v-if="uploadFiles.length < 1" @click="onChooseUploadFiles" class="w-full py-3" :style="{ cursor: 'copy' }">
              <div class="h-full flex flex-column justify-content-center align-items-center">
                <i class="pi pi-upload text-900 text-2xl mb-3"></i>
                <span class="font-bold text-900 text-xl mb-3">Télécharger des fichiers</span>
                <span class="font-medium text-600 text-md text-center">Déposez ou sélectionnez des fichiers</span>
              </div>
            </div>
          </template>
          </FileUpload>
        </div>
      </div>
    </div>

    <!-- Section pour afficher les dossiers, sous-dossiers et fichiers -->
    <div class="col-12 md:col-7 xl:col-9">
      <div class="card">
        <div class="text-900 text-xl font-semibold mb-3">Dossiers</div>
        <div class="grid">
          <!-- Afficher les dossiers principaux -->
          <div v-for="(folder, i) in folders" :key="i" class="col-12 md:col-6 xl:col-4" @click="onFolderClick(folder)">
            <div class="p-3 border-1 surface-border flex align-items-center justify-content-between hover:surface-100 cursor-pointer border-round">
              <div class="flex align-items-center">
                <i class="text-2xl mr-3" :class="folder.icon"></i>
                <span class="text-900 text-lg font-medium">{{ folder.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Afficher les sous-dossiers si un dossier principal est sélectionné -->
        <div v-if="subFolders.length > 0" class="mt-4">
          <h3 class="text-lg font-semibold">Sous-dossiers</h3>
          <div class="grid">
            <div v-for="(subFolder, i) in subFolders" :key="i" class="col-12 md:col-6 xl:col-4" @click="onFolderClick(subFolder)">
              <div class="p-3 border-1 surface-border flex align-items-center justify-content-between hover:surface-100 cursor-pointer border-round">
                <div class="flex align-items-center">
                  <i class="pi pi-folder text-2xl mr-3"></i>
                  <span class="text-900 text-lg font-medium">{{ subFolder.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Afficher les fichiers dans le dossier sélectionné -->
        <div v-if="files.length > 0" class="mt-4">
          <h3 class="text-lg font-semibold">Fichiers dans {{ selectedFolder.name }}</h3>
          <ul>
            <li v-for="file in files" :key="file.name">
              <a :href="file.url" target="_blank">{{ file.name }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
