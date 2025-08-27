require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient');

async function importFilePhysio() {
  try {
    // 1) Lire le JSON source
    const filePath = path.join(__dirname, '../../../pfpheds-default-rtdb-FilePFPPhysio-export.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw); // tableau d’items top-level

    // 2) Construire les tableaux d’upsert
    const foldersMap = new Map(); // éviter les doublons par id
    const filesMap = new Map();

    const addFolder = (folder) => {
      if (!folder.id) return;
      // on normalise: { id, name, icon?, parent_id?, created_at? }
      foldersMap.set(folder.id, {
        id: folder.id,
        name: folder.name || null,
        icon: folder.icon || null,
        parent_id: folder.parent_id || null,
      });
    };

    const addFile = (file) => {
      if (!file.id) return;
      filesMap.set(file.id, {
        id: file.id,
        name: file.name || null,
        url: file.url || null,
        folder_id: file.folder_id, // requis
      });
    };

    for (const top of data) {
      // Dossier top-level
      addFolder({
        id: top.id,
        name: top.name,
        icon: top.icon || null,
        parent_id: null,
      });

      // Fichiers directement sous le dossier top-level (si présents)
      if (Array.isArray(top.files)) {
        for (const f of top.files) {
          addFile({
            id: f.id,
            name: f.name,
            url: f.url,
            folder_id: top.id,
          });
        }
      }

      // Sous-dossiers (si présents)
      if (Array.isArray(top.subFolders)) {
        for (const sub of top.subFolders) {
          addFolder({
            id: sub.id,
            name: sub.name,
            icon: null,
            parent_id: top.id,
          });

          if (Array.isArray(sub.files)) {
            for (const f of sub.files) {
              addFile({
                id: f.id,
                name: f.name,
                url: f.url,
                folder_id: sub.id,
              });
            }
          }
        }
      }
    }

    const folders = Array.from(foldersMap.values());
    const files = Array.from(filesMap.values());

    if (folders.length === 0) {
      console.log('Aucun dossier à importer.');
      return;
    }
    console.log(`Préparation import - Dossiers: ${folders.length}, Fichiers: ${files.length}`);

    // 3) Upsert dossiers
    {
      const { error } = await supabase
        .from('file_physio_folders')
        .upsert(folders, { onConflict: 'id' });
      if (error) {
        console.error('Erreur Supabase (folders):', error.message);
        throw error;
      }
      console.log('Dossiers insérés/mis à jour.');
    }

    // 4) Upsert fichiers (si présents)
    if (files.length > 0) {
      const { error } = await supabase
        .from('file_physio_files')
        .upsert(files, { onConflict: 'id' });
      if (error) {
        console.error('Erreur Supabase (files):', error.message);
        throw error;
      }
      console.log('Fichiers insérés/mis à jour.');
    }

    console.log('Import FilePhysio terminé avec succès.');
  } catch (err) {
    console.error('Échec import FilePhysio:', err);
  }
}

// Lancer l’import
importFilePhysio();