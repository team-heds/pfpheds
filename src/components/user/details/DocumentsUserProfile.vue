<script setup>
import { ref, onMounted, computed } from 'vue';
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
const isUploading = ref(false);
const uploadProgress = ref(0);
const selectedFiles = ref(new Set());
const selectedCount = computed(() => selectedFiles.value.size);

const toggleFileSelection = (fileName) => {
  const next = new Set(selectedFiles.value);
  next.has(fileName) ? next.delete(fileName) : next.add(fileName);
  selectedFiles.value = next;
};

const clearSelection = () => {
  selectedFiles.value = new Set();
};
const openSelectedFiles = () => {
  files.value.filter((file) => selectedFiles.value.has(file.name)).forEach((file) => window.open(file.url, '_blank', 'noopener,noreferrer'));
};

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
  clearSelection();
  loadFilesAndSubFoldersFromFolder(folder.path);  // Charger les fichiers et sous-dossiers
};

// Gérer l'upload de fichiers dans le dossier sélectionné
const onSelectedFiles = async (event) => {
  if (!selectedFolder.value || !currentUser.value) {
    toast.add({ severity: 'warn', summary: 'Avertissement', detail: 'Sélectionnez un dossier avant de télécharger.', life: 4000 });
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  let completedFiles = 0;

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
    } finally {
      completedFiles += 1;
      uploadProgress.value = Math.round((completedFiles / event.files.length) * 100);
    }
  }

  isUploading.value = false;
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
            <button v-if="uploadFiles.length < 1" type="button" @click="onChooseUploadFiles" class="document-upload-trigger w-full py-3">
              <div class="h-full flex flex-column justify-content-center align-items-center">
                <i class="pi pi-upload text-900 text-2xl mb-3"></i>
                <span class="font-bold text-900 text-xl mb-3">Télécharger des fichiers</span>
                <span class="font-medium text-600 text-md text-center">Déposez ou sélectionnez des fichiers</span>
              </div>
            </button>
          </template>
          </FileUpload>
          <div v-if="isUploading" class="upload-progress" role="status" aria-live="polite">
            <div class="upload-progress__label"><span>Envoi en cours</span><strong>{{ uploadProgress }} %</strong></div>
            <progress :value="uploadProgress" max="100">{{ uploadProgress }} %</progress>
          </div>
        </div>
      </div>
    </div>

    <!-- Section pour afficher les dossiers, sous-dossiers et fichiers -->
    <div class="col-12 md:col-7 xl:col-9">
      <div class="card">
        <nav class="documents-breadcrumb" aria-label="Fil d'Ariane">
          <button v-if="selectedFolder" type="button" @click="selectedFolder = null; files = []; subFolders = []; clearSelection()">Documents</button>
          <span v-else aria-current="page">Documents</span>
          <template v-if="selectedFolder"><i class="pi pi-angle-right" aria-hidden="true"></i><span aria-current="page">{{ selectedFolder.name }}</span></template>
        </nav>
        <div class="text-900 text-xl font-semibold mb-3">Dossiers</div>
        <div class="grid">
          <!-- Afficher les dossiers principaux -->
          <div v-for="(folder, i) in folders" :key="i" class="col-12 md:col-6 xl:col-4">
            <button type="button" class="document-folder p-3 border-1 surface-border flex align-items-center justify-content-between border-round" @click="onFolderClick(folder)" :aria-pressed="selectedFolder?.path === folder.path">
              <div class="flex align-items-center">
                <i class="text-2xl mr-3" :class="folder.icon"></i>
                <span class="text-900 text-lg font-medium">{{ folder.name }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Afficher les sous-dossiers si un dossier principal est sélectionné -->
        <div v-if="subFolders.length > 0" class="mt-4">
          <h3 class="text-lg font-semibold">Sous-dossiers</h3>
          <div class="grid">
            <div v-for="(subFolder, i) in subFolders" :key="i" class="col-12 md:col-6 xl:col-4">
              <button type="button" class="document-folder p-3 border-1 surface-border flex align-items-center justify-content-between border-round" @click="onFolderClick(subFolder)">
                <div class="flex align-items-center">
                  <i class="pi pi-folder text-2xl mr-3"></i>
                  <span class="text-900 text-lg font-medium">{{ subFolder.name }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Afficher les fichiers dans le dossier sélectionné -->
        <div v-if="files.length > 0" class="mt-4">
          <h3 class="text-lg font-semibold">Fichiers dans {{ selectedFolder.name }}</h3>
          <div v-if="selectedCount" class="documents-actionbar" role="status">
            <strong>{{ selectedCount }} sélectionné{{ selectedCount > 1 ? 's' : '' }}</strong>
            <div><button type="button" @click="openSelectedFiles">Ouvrir</button><button type="button" @click="clearSelection">Désélectionner</button></div>
          </div>
          <ul class="document-file-list">
            <li v-for="file in files" :key="file.name">
              <input :id="`document-${file.name}`" type="checkbox" :checked="selectedFiles.has(file.name)" @change="toggleFileSelection(file.name)" />
              <a :href="file.url" target="_blank">{{ file.name }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-upload-trigger,.document-folder{border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.document-folder{width:100%;transition:background-color .2s ease,border-color .2s ease}.document-folder:hover,.document-folder[aria-pressed=true]{background:var(--surface-hover)}.document-upload-trigger:focus-visible,.document-folder:focus-visible,.documents-breadcrumb button:focus-visible,.documents-actionbar button:focus-visible{outline:3px solid var(--primary-color);outline-offset:3px}.upload-progress{padding:0 1rem 1rem}.upload-progress__label{display:flex;justify-content:space-between;margin-bottom:.5rem}.upload-progress progress{width:100%;accent-color:var(--primary-color)}.documents-breadcrumb{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;color:var(--text-color-secondary)}.documents-breadcrumb button,.documents-actionbar button{border:0;background:none;color:var(--primary-color);font:inherit;cursor:pointer}.documents-actionbar{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;margin-bottom:.75rem;border-radius:.75rem;background:var(--surface-ground)}.document-file-list{list-style:none;padding:0}.document-file-list li{display:flex;align-items:center;gap:.75rem;padding:.65rem 0}
@media (prefers-reduced-motion:reduce){.document-folder{transition:none}}
@media(max-width:48rem){.documents-actionbar{align-items:stretch;flex-direction:column;gap:.75rem}.documents-actionbar div{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.document-file-list li{align-items:flex-start}.document-file-list a{overflow-wrap:anywhere}}
</style>
