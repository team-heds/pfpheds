<template>
  <!-- On insère votre composant NavBar tout en haut -->
  <Navbar />

  <div class="grid">
    <!-- Colonne de gauche (titre/menu)
    <div class="col-12 md:col-3">
      <div class="card">
        <h2 class="mt-0 mb-2">Documents PFP</h2>
        <p class="text-600 m-0">
          Retrouvez ci-dessous les différentes catégories de documents.
        </p>
      </div>
    </div>
    -->

    <!-- Colonne de droite (les sections) -->
    <div class="col-12 md:col-12">
      <div class="grid">
        <!-- Chaque section/dossier en pleine largeur (col-12) -->
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="col-12"
        >
          <div class="card mb-3">
            <!-- En-tête de la section -->
            <div class="flex align-items-center mb-2">
              <i :class="[folder.icon, 'text-2xl', 'mr-3']"></i>
              <h3 class="m-0">{{ folder.name }}</h3>
            </div>

            <!-- CAS 1 : Le dossier contient des sous-sections (subFolders) -->
            <template v-if="folder.subFolders && folder.subFolders.length > 0">
              <!-- On affiche chaque sous-dossier dans une colonne (ex : col-12 md:col-6) -->
              <div class="grid">
                <div
                  v-for="sub in folder.subFolders"
                  :key="sub.id"
                  class="col-12 md:col-6"
                >
                  <div class="border-round border-1 surface-border p-2 mb-3">
                    <h4 class="mb-2">{{ sub.name }}</h4>

                    <!-- Liste des fichiers de la sous-section -->
                    <div v-if="sub.files && sub.files.length > 0">
                      <ul class="pl-3">
                        <li
                          v-for="file in sub.files"
                          :key="file.id"
                          class="mb-2"
                        >
                          <a
                            :href="file.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary hover:underline"
                          >
                            {{ file.name }}
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      <p class="text-600 m-0">
                        Aucun fichier pour cette sous-section.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- CAS 2 : Le dossier n'a PAS de sous-sections, on liste directement ses fichiers -->
            <template v-else>
              <div v-if="folder.files.length > 0">
                <ul class="pl-3">
                  <li
                    v-for="file in folder.files"
                    :key="file.id"
                    class="mb-2"
                  >
                    <a
                      :href="file.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary hover:underline"
                    >
                      {{ file.name }}
                    </a>
                  </li>
                </ul>
              </div>
              <div v-else>
                <p class="text-600 m-0">Aucun fichier n'est disponible.</p>
              </div>
            </template>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '@/components/Utils/Navbar.vue'

/**
 * Données des 7 sections (dossiers),
 * avec éventuelles sous-sections (subFolders).
 */
const folders = [
  {
    id: 'documentsGeneraux',
    name: 'Documents généraux FP',
    icon: 'pi pi-folder',
    subFolders: [
      {
        id: 'planEtudeCadre',
        name: 'Plan d’étude cadre',
        files: [
          {
            id: 'doc1',
            name: 'PEC_2022_PHY_FR.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FPEC_2022_PHY-F%203.pdf?alt=media&token=354a0075-be4e-4a5e-b101-8a85f4bb8cfb'
          },
          {
            id: 'doc2',
            name: 'PEC_2022_PHY_DE.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FPEC_2022_PHY-D%203.pdf?alt=media&token=b5ea1f60-23df-4111-b319-df7e816db930'
          },
          {
            id: 'doc3',
            name: 'PEC_2022_Santé_PHY_EN.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FPEC_2022_Sant%C3%A9_EnBref_Physioth%C3%A9rapie_EN%201.pdf?alt=media&token=8a7a5056-dce4-42e9-8d31-1feb82e7661b'
          }
        ]
      },
      {
        id: 'cadreRealisationFP',
        name: 'Cadre de réalisation FP',
        files: [
          {
            id: 'doc4',
            name: 'Cadre de réalisation FP_PEC 22.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FCadre%20de%20r%C3%A9alisation%20FP_PEC%2022%204.pdf?alt=media&token=9d47a460-0b41-4585-b5cc-06c389f8fac3'
          },
          {
            id: 'doc5',
            name: 'Rahmenbedingungen_Praxisausbildung_PEC 22.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FRahmenbedingungen_Praxisausbildung_PEC%2022%203.pdf?alt=media&token=cc300e73-1553-4af0-86b5-0756178f02e3'
          }
        ]
      }
    ],
    files: []
  },
  {
    id: 'cpt',
    name: 'CPT',
    icon: 'pi pi-folder',
    subFolders: [
      {
        id: 'cpt',
        name: 'Documents CPT',
        files: [
          {
            id: 'doc1',
            name: 'Contrat pédagogique tripartite vierge',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FContrat%20p%C3%A9dagogique%20tripartite_vide%202.docx?alt=media&token=e117726c-cadc-4ed1-a4df-e8d51786a1a0'
          },
          {
            id: 'doc3',
            name: 'Document explicatif CPT.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FDocument%20explicatif%20CPT.pdf?alt=media&token=57cfd14f-f45c-498e-ac82-899759f3bf57'
          },
          {
            id: 'doc4',
            name: 'Exemple CPT_FR.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FDocument%20explicatif%20CPT.pdf?alt=media&token=57cfd14f-f45c-498e-ac82-899759f3bf57'
          },
          {
            id: 'doc2',
            name: 'Leerer Pädagogicher dreiparteivertrag',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FP%C3%A4dagogicher_dreiparteivertrag_leer%203.docx?alt=media&token=0837e0d4-7efa-4869-8029-f1caad79c3e2'
          },
          {
            id: 'doc5',
            name: 'Erklärung Dreiervertrag.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FErkl%C3%A4rung%20Dreiervertrag.pdf?alt=media&token=0f20647d-a389-46e3-8e2b-0dead24ed01f'
          },
          {
            id: 'doc6',
            name: 'Beispiel PDV_DE 1.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FBeispiel%20PDV_DE%201.pdf?alt=media&token=d5ade314-2259-4653-85bc-b5658d3d655c'
          }
        ]
      },
  {
    id: 'competences',
    name: 'Compétences FP',
    files: [
      {
        id: 'doc1',
        name: 'Compétences_1BA.docx',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FComp%C3%A9tences_1BA.docx?alt=media&token=4e0efcc8-e5b5-4927-ae72-1705081b888c'
      },
      {
        id: 'doc2',
        name: 'Compétences_2BA.docx',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FComp%C3%A9tences_2BA.docx?alt=media&token=af62130a-7955-4a00-b2b4-1637793bfbb4'
      },
      {
        id: 'doc3',
        name: 'Compétences_3BA.docx',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FComp%C3%A9tences_3BA.docx?alt=media&token=a5eab991-1239-4bca-908f-1f878e6d43b8'
      },
      {
        id: 'doc4',
        name: 'Kompetenzen_1BA.docx',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FKompetenzen_1BA.docx?alt=media&token=85edb293-0747-4811-af3e-4f72e253bab1'
      },
      {
        id: 'doc5',
        name: 'Kompetenzen_2BA.docx',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FKompetenzen_2BA.docx?alt=media&token=65ed67b6-ced1-4b91-8d52-96bcd9bc3b88'
      },
      {
        id: 'doc6',
        name: 'Kompetenzen_3BA.docx',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FKompetenzen_3BA.docx?alt=media&token=cf31571d-3b1e-4b00-b56d-3de8b049c038'
      },
    ]
  }
    ],
    files: []
  },
  {
    id: 'journaldebord',
    name: 'Journal de bord',
    icon: 'pi pi-folder',
    subFolders: [],
    files: [
      {
        id: 'doc1',
        name: 'Journal de bord FP',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FJournal%20de%20bord%20FP.xls?alt=media&token=ca58bc23-b3b8-486d-89b4-7d0b397154e5'
      }
    ]
  },
  {
    id: 'evaluation',
    name: 'Évaluation PFP',
    icon: 'pi pi-folder',

    /* 4 sous-sections (PFP1, PFP2, PFP3, PFP4) */
    subFolders: [
      {
        id: 'pfp1',
        name: 'PFP1',
        files: [
          {
            id: 'doc1',
            name: 'Evaluation PFP1 - FR.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20FR%20FP%201A%20vf%203.xlsx?alt=media&token=edcee0d5-8778-4d63-9594-f1b0321d5e21'
          },
          {
            id: 'doc2',
            name: 'Evaluation PFP1 - DE.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20DE%20FP%201A%20vf%204.xlsx?alt=media&token=995641e2-db6a-432e-b6c9-b51c1aab731e'
          }
        ]
      },
      {
        id: 'pfp2',
        name: 'PFP2',
        files: [
          {
            id: 'doc1',
            name: 'Evaluation PFP2 - FR.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20FR%20FP%202A%20vf%205.xlsx?alt=media&token=02074fe8-06a4-46d6-a335-035884c8a51f'
          },
          {
            id: 'doc2',
            name: 'Evaluation PFP2 - DE.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20DE%20FP%202A%20vf%204.xlsx?alt=media&token=97fc56b2-bab3-40f6-b425-cf40a215cf86'
          }
        ]
      },
      {
        id: 'pfp3',
        name: 'PFP3',
        files: [
          {
            id: 'doc1',
            name: 'Evaluation PFP3 - FR.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20FR%20FP%203%20vf%202.xlsx?alt=media&token=7a6dcba5-1940-4cb0-a813-be3b83445355'
          },
          {
            id: 'doc2',
            name: 'Evaluation PFP3 - DE.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20DE%20FP%203%20vf%201.xlsx?alt=media&token=62eb1c59-e77e-4d69-a954-644f03bf4a04'
          }
        ]
      },
      {
        id: 'pfp4',
        name: 'PFP4',
        files: [
          {
            id: 'doc1',
            name: 'Evaluation PFP4 - FR.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20FR%20FP%204%20vf%202.xlsx?alt=media&token=509bebd2-232a-4942-9291-4f7a27c25976'
          },
          {
            id: 'doc2',
            name: 'Evaluation PFP4 - DE.xlsx',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FEvaluation%20DE%20FP%204%20vf%201.xlsx?alt=media&token=0aa40318-eb33-4dd5-b4c9-7cc9e6d31680'
          }
        ]
      }
    ],
    files: []
  },
  {
    id: 'debriefPostPFP',
    name: 'Débrief post PFP',
    icon: 'pi pi-folder',
    subFolders: [],
    files: [
      {
        id: 'doc1',
        name: 'Débrief post PFP',
        url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FD%C3%A9brief%20post%20PFP.docx?alt=media&token=049980f2-ea6b-43dd-a0ae-71cd66113dba'
      }
    ]
  },
  {
    id: 'MobilitesInternationales',
    name: 'Mobilité internationale',
    icon: 'pi pi-folder',
    subFolders: [
      {
        id: 'etranger',
        name: "Places de stage à l'étranger",
        files: [
          {
            id: 'doc2',
            name: 'Places de stages à l’étranger',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2F1.%20Places%20de%20stages%20%C3%A0%20l%27%C3%A9tranger.pdf?alt=media&token=e2008f34-dd3a-4a0d-9d31-d65408f47a19'
          },
          {
            id: 'doc3',
            name: 'Ablauf Auslandpraktikum',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2F2.%20Ablauf%20Auslandpraktikum.pdf?alt=media&token=d66a8e1f-3ebc-4509-b115-a1aa975376f2'
          },
          {
            id: 'doc1',
            name: 'Formulaire intérêt à suivre une PFP à l’étranger',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2F3.%20Formulaire%20int%C3%A9r%C3%AAt%20%C3%A0%20suivre%20une%20PFP%20%C3%A0%20l%E2%80%99%C3%A9tranger.pdf?alt=media&token=8fa9021f-4aed-405f-9e35-3259f49448b4'
          },
        ]
      },
      {
        id: 'pfp2',
        name: "Bourse d'étude",
        files: [
          {
            id: 'doc1',
            name: 'Relation internationale (RI) 2024.pdf',
            url: 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/documentPFP%2FRelation%20internationale%20(RI)%202024.pdf?alt=media&token=461f2f2e-2eb6-464f-ad24-f65f06dc0b90'
          }
        ]
      }
    ],
    files: []
  },
  {
    id: 'divers',
    name: 'Divers',
    icon: 'pi pi-folder',
    subFolders: [],
    files: [
      {
        id: 'doc1',
        name: '....',
        url: ''
      }
    ]
  }
]
</script>

<style scoped>
</style>
