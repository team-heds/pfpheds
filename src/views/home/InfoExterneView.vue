<template>
  <Navbar />
  <section class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <div class="header">
      <h1 class="text-center">Document pour institution externe</h1>
    </div>
    <div class="content text-center">
      <h3>Entrez le code pour accéder aux documents:</h3>
      <InputText v-model="codeSecret" placeholder="Entrez le code ici" class="p-inputtext-lg w-full md:w-30rem" />
      <br>
      <Button label="Valider" class="p-button-primary mt-3" @click="validerCode" />
      <div v-if="afficherDocuments" class="documents mt-4">
        <h3>Liste des Documents</h3>
        <div class="grid">
          <div v-for="categorie in categories" :key="categorie.titre" class="col-12 md:col-6 xl:col-4">
            <div class="p-3 border-1 surface-border flex align-items-center justify-content-between hover:surface-100 cursor-pointer border-round mb-3">
              <div class="flex flex-column align-items-start w-full">
                <h4>{{ categorie.titre }}</h4>
                <ul class="list-none p-0 m-0">
                  <li v-for="doc in categorie.documents" :key="doc.nom" class="mb-2 flex align-items-center">
                    <i class="pi pi-file mr-2 text-primary"></i>
                    <a :href="doc.chemin" target="_blank" class="text-primary">{{ doc.nom }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Navbar from '@/components/common/utils/Navbar.vue';
import { useToast } from 'primevue/usetoast';

export default {
  name: 'InfoExterne',
  components: {
    InputText,
    Button,
    Navbar
  },
  setup() {
    const toast = useToast();
    const codeSecret = ref('');
    const afficherDocuments = ref(false);
    const categories = ref([
      {
        titre: 'Contrat pédagogique tripartite - Pädagogischer Dreiervertra',
        documents: [
          { nom: 'Contrat pédagogique tripartite', chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/07.03.20231_Cadre%20de%20r%C3%A9alisation%20FP.pdf?alt=media&token=ca908286-f213-4323-8274-ac0a4351bf8b' },
          { nom: 'Pädagogicher dreiparteivertrag ', chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/P%C3%A4dagogicher_dreiparteivertrag_leer.docx?alt=media&token=58921dda-fb5d-4bb5-8c09-7d800989f234' },
        ],
      },
      {
        titre: 'Document d évaluation -Evaluationsdokument',
        documents: [
          {
            nom: 'Evaluation DE FP 1A',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/Evaluation%20DE%20FP%201A%20vf%201.xlsx?alt=media&token=e9062533-6d35-4a6f-b5d1-2c6e9356d986'
          },
          {
            nom: 'Evaluation DE FP 2A ',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/Evaluation%20DE%20FP%202A%20vf%201.xlsx?alt=media&token=010da007-ce5e-4601-b8a6-8448d83b7dc6'
          },
          {
            nom: 'Evaluation FR FP 1A ',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/Evaluation%20FR%20FP%201A%20vf.xlsx?alt=media&token=2f59d16f-cbe1-41ee-9040-bacbf3a7397a'
          },
          {
            nom: 'Evaluation FR FP 2A',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/Evaluation%20FR%20FP%202A%20vf.xlsx?alt=media&token=6ab89155-eb75-4573-aa00-4fd9bb367540'
          },
        ],
      },
      {
        titre: 'Plan d étude cadre - Rahmenstudienplan',
        documents: [
          {
            nom: 'Kompetenzrahmen PHY_D_PEC22',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/R%C3%A9f%C3%A9rentiel%20de%20comp%C3%A9tence%20PHY_F_PEC22.pdf?alt=media&token=cdd29f35-b8d9-459b-8804-d780c07c8bcb'
          },
          {
            nom: 'Référentiel de compétence PHY_F_PEC22',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/Kompetenzrahmen%20PHY_D_PEC22.pdf?alt=media&token=ad926583-3e9b-4a5e-8fcf-089ded49c34e'
          },
        ],
      },
      {
        titre: 'Cadre de réalisation - Rahmenbedingungen',
        documents: [
          {
            nom: 'Cadre de réalisation',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/07.03.20231_Cadre%20de%20r%C3%A9alisation%20FP.pdf?alt=media&token=ca908286-f213-4323-8274-ac0a4351bf8b'
          },
          {
            nom: 'Rahmenbedingungen_Praxisausbildung',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/07.03.2023_Rahmenbedingungen_Praxisausbildung-%20PEC%2022.pdf?alt=media&token=e75ebcb4-12ab-447c-afcf-9683a2c1e182'
          },
        ],
      },
      {
        titre: 'Référentiel de compétence - Kompetenzrahmen',
        documents: [
          {
            nom: 'PEC_2022_Physiothérapie_BSC_DE ',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/PEC_2022_Physioth%C3%A9rapie_BSC_DE%201.pdf?alt=media&token=3806a5b4-1212-46fa-997b-0a005a1afec3'
          },
          {
            nom: 'PEC_2022_Physiothérapie_BSC_FR ',
            chemin: 'https://firebasestorage.googleapis.com/v0/b/fpformationheds.appspot.com/o/PEC_2022_Physioth%C3%A9rapie_BSC_FR%201.pdf?alt=media&token=30b5e5f9-9421-4d69-9b9e-42982a69a4d9'
          },
        ],
      },
      {
        titre: 'Documents divers - Verschiedene Dokumente',
        documents: [],
      },
    ]);

    const validerCode = () => {
      if (codeSecret.value === "123123") {
        afficherDocuments.value = true;
      } else {
        afficherDocuments.value = false;
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Code incorrect. Veuillez réessayer.', life: 4000 });
      }
    };

    return {
      codeSecret,
      afficherDocuments,
      categories,
      validerCode
    };
  }
};
</script>

<style scoped>
.document-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
}

.input-code {
  display: block;
  margin: 0 auto 20px auto;
  padding: 10px;
  width: 80%;
  max-width: 400px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.documents {
  margin-top: 20px;
}

.categorie h4 {
  margin-bottom: 10px;
}

.categorie ul {
  list-style-type: none;
  padding: 0;
}

.categorie li {
  margin-bottom: 5px;
}

.categorie li a {
  color: #007bff;
  text-decoration: none;
}

.categorie li a:hover {
  text-decoration: underline;
}
</style>
