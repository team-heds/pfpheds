<script setup>
import { ref, onMounted } from 'vue';
import { ref as storageRef, listAll, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { storage} from '../../../firebase.js';
import Navbar from '@/components/Utils/Navbar.vue'

// Initialisation des données
const folders = ref([
  { name: 'Documents généraux FP', path: 'documents-généraux/', icon: 'pi pi-folder' },
  { name: 'CPT', path: 'cpt/', icon: 'pi pi-folder' },
  { name: 'Évaluation PFP', path: 'evaluation/', icon: 'pi pi-folder' },
  { name: 'Débrief post PFP', path: 'débriefPostPFP/', icon: 'pi pi-folder' },
]);

const selectedFolder = ref(null);  // Dossier sélectionné
const files = ref([]);  // Fichiers dans le dossier sélectionné
const subFolders = ref([]);  // Sous-dossiers dans le dossier sélectionné
const uploadFiles = ref([]);  // Fichiers à uploader
const currentUser = ref(null);  // Utilisateur courant
const userFolderPath = ref('');  // Chemin de stockage spécifique à l'utilisateur

// Fonction pour charger les fichiers et sous-dossiers à partir du Storage Firebase
const loadFilesAndSubFoldersFromFolder = async (folderPath) => {
  const folderRef = storageRef(storage, `${userFolderPath.value}${folderPath}`);
  const result = await listAll(folderRef);

  // Nettoyer les fichiers et sous-dossiers actuels
  files.value = [];
  subFolders.value = [];

  // Parcourir les fichiers et les sous-dossiers
  result.items.forEach(async (itemRef) => {
    const fileUrl = await getDownloadURL(itemRef);
    files.value.push({ name: itemRef.name, url: fileUrl });
  });

  result.prefixes.forEach((subFolderRef) => {
    subFolders.value.push({ name: subFolderRef.name, path: subFolderRef.fullPath });
  });
};

// Gérer le clic sur un dossier
const onFolderClick = (folder) => {
  selectedFolder.value = folder;
  loadFilesAndSubFoldersFromFolder(folder.path);  // Charger les fichiers et sous-dossiers
};

// Gérer l'upload de fichiers dans le dossier sélectionné
const onSelectedFiles = async (event) => {
  if (!selectedFolder.value || !currentUser.value) {
    alert('Sélectionnez un dossier avant de télécharger.');
    return;
  }

  for (const file of event.files) {
    const acceptedFormats = [
      'image/jpeg',
      'image/png',
      'audio/mpeg',
      'video/mp4',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel' // Optionnel, pour la compatibilité avec les anciennes versions
    ];

    if (!acceptedFormats.includes(file.type)) {
      alert('Type de fichier non accepté. Veuillez uploader un fichier JPG, PNG, MP3, MP4 ou PDF.');
      continue;
    }

    // Utiliser le chemin spécifique de l'utilisateur pour stocker le fichier
    const fileRef = storageRef(storage, `${userFolderPath.value}${selectedFolder.value.path}${file.name}`);
    await uploadBytes(fileRef, file);  // Uploader le fichier dans Firebase Storage
    const fileUrl = await getDownloadURL(fileRef);
    files.value.push({ name: file.name, url: fileUrl });  // Ajouter à la liste des fichiers affichés
  }
};

// Gérer le choix de fichier pour uploader
const onChooseUploadFiles = () => {
  fileUploaderRef.value.choose();  // Ouvrir le sélecteur de fichiers
};

// Surveiller l'état de connexion de l'utilisateur
onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user;
      userFolderPath.value = `users/${user.uid}/`;  // Utiliser l'ID utilisateur pour son chemin dans Storage
      console.log(`Chemin de stockage pour cet utilisateur : ${userFolderPath.value}`);
    } else {
      currentUser.value = null;
      userFolderPath.value = '';
    }
  });
});
</script>

<template>
  <Navbar />
  <div class="grid">
    <!-- Section pour uploader des fichiers -->
    <div class="col-12 md:col-5 xl:col-3">
      <div class="card p-0">
        <div class="card">
          <FileUpload
            ref="fileUploaderRef"
            id="files-fileupload"
            name="demo[]"
            accept=".jpg,.png,.mp3,.mp4,.pdf, .docx, .xlsx, .doc, .xls"
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
