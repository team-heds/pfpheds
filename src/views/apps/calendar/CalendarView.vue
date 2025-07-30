<script setup>
import { ref, onMounted } from 'vue';
import { EventService } from '@/service/EventService';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

onMounted(async () => {
  evenements.value = await obtenirEvenements();
  options.value = { ...options.value, ...{ events: evenements.value } };
  evenements.value.forEach((item) => tags.value.push(item.tag));
});

const tags = ref([]);
let evenementClique = null;
const vue = ref('afficher');
const afficherDialogue = ref(false);
const evenementModifie = ref({
  titre: '',
  debut: '',
  fin: '',
  jourEntier: false,
  lieu: '',
  couleurBordure: '',
  couleurTexte: '',
  description: '',
  tag: {
    nom: 'Entreprise A',
    couleur: '#FFB6B6'
  }
});
const options = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialDate: '2022-05-11',
  height: 720,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  eventClick: (e) => surClicEvenement(e),
  select: (e) => surSelectionDate(e)
});

const evenements = ref(null);
const serviceEvenement = ref(new EventService());

const obtenirEvenements = async () => {
  const response = serviceEvenement.value.getEvents();
  return response;
};

const surClicEvenement = (e) => {
  evenementClique = e.event;
  let evenementSimple = e.event.toPlainObject({ collapseExtendedProps: true, collapseColor: true });
  vue.value = 'afficher';
  afficherDialogue.value = true;

  evenementModifie.value = { ...evenementSimple, ...evenementClique };
  evenementModifie.value.debut = evenementClique.start;
  evenementModifie.value.fin = evenementClique.end ? evenementClique.end : evenementClique.start;
};

const surClicEditer = () => {
  vue.value = 'editer';
};

const gererSauvegarde = () => {
  const dateValide = evenementModifie.value.debut && evenementModifie.value.fin;
  if (!dateValide) {
    return;
  }

  afficherDialogue.value = false;
  evenementClique = { ...evenementModifie.value, backgroundColor: evenementModifie.value.tag.couleur, borderColor: evenementModifie.value.tag.couleur, textColor: '#212121' };

  definirEvenements();

  options.value = { ...options.value, ...{ events: evenements.value } };

  evenementClique = null;
};

const surSelectionDate = (e) => {
  vue.value = 'nouveau';
  afficherDialogue.value = true;
  evenementModifie.value = {
    ...e,
    titre: '',
    lieu: '',
    couleurBordure: '',
    couleurTexte: '',
    description: '',
    tag: {
      nom: 'Entreprise A',
      couleur: '#FFB6B6'
    }
  };
};

const definirEvenements = () => {
  const evenementCliqueAUnId = Object.keys(evenementClique).some((key) => key === 'id');
  if (evenementCliqueAUnId) {
    evenements.value = evenements.value.map((i) => (i.id.toString() === evenementClique.id.toString() ? (i = evenementClique) : i));
  } else {
    evenements.value = [...evenements.value, { ...evenementClique, id: Math.floor(Math.random() * 10000) }];
  }
};
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <h5>Calendrier</h5>
        <FullCalendar :events="evenements" :options="options" />

        <Dialog
          v-model:visible="afficherDialogue"
          :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
          :style="{
                        width: '36rem'
                    }"
          modal
          closable
          @onHide="vue = ''"
        >
          <template #header>
            <span class="text-900 font-semibold text-xl">{{ vue === 'afficher' ? evenementModifie.titre : vue === 'nouveau' ? 'Nouvel Événement' : 'Modifier l\'Événement' }}</span>
          </template>

          <div v-if="vue === 'afficher'">
            <span class="text-900 font-semibold block mb-2">Description</span>
            <span class="block mb-3">{{ evenementModifie.description }}</span>

            <div class="grid">
              <div class="col-6">
                <div class="text-900 font-semibold mb-2">Début</div>
                <p class="flex align-items-center m-0">
                  <i class="pi pi-fw pi-clock text-700 mr-2"></i>
                  <span>{{ evenementModifie.debut.toISOString().slice(0, 10) }}</span>
                </p>
              </div>
              <div class="col-6">
                <div class="text-900 font-semibold mb-2">Fin</div>
                <p class="flex align-items-center m-0">
                  <i class="pi pi-fw pi-clock text-700 mr-2"></i>
                  <span>{{ evenementModifie.fin.toISOString().slice(0, 10) }}</span>
                </p>
              </div>
              <div class="col-12">
                <div class="text-900 font-semibold mb-2">Lieu</div>
                <p class="flex align-items-center m-0">
                  <i class="pi pi-fw pi-map-marker text-700 mr-2"></i>
                  <span>{{ evenementModifie.lieu }}</span>
                </p>
              </div>
              <div class="col-12">
                <div class="text-900 font-semibold mb-2">Couleur</div>
                <p class="flex align-items-center m-0">
                  <span :style="{ 'background-color': evenementModifie.couleur }" class="inline-flex flex-shrink-0 w-1rem h-1rem mr-2 border-circle"></span>
                  <span>{{ evenementModifie.tag.nom }}</span>
                </p>
              </div>
            </div>
          </div>
          <div v-if="vue !== 'afficher'">
            <div class="grid p-fluid formgrid">
              <div class="col-12 md:col-6 field">
                <label for="titre" class="text-900 font-semibold">Titre</label>
                <IconField iconPosition="left">
                  <InputIcon class="pi pi-pencil" />
                  <InputText id="titre" type="text" placeholder="Titre" v-model="evenementModifie.titre" />
                </IconField>
              </div>
              <div class="col-12 md:col-6 field">
                <label for="lieu" class="text-900 font-semibold">Lieu</label>
                <IconField iconPosition="left">
                  <InputIcon class="pi pi-map-marker" />
                  <InputText id="lieu" type="text" placeholder="Lieu" v-model="evenementModifie.lieu" />
                </IconField>
              </div>
              <div class="col-12 field">
                <label for="description" class="text-900 font-semibold">Description de l'événement</label>
                <Textarea id="description" type="text" :rows="5" v-model="evenementModifie.description" style="resize: none"></Textarea>
              </div>

              <div class="col-12 md:col-6 field">
                <label for="debut" class="text-900 font-semibold">Date de début</label>
                <Calendar dateFormat="mm-dd-yy" :max-date="evenementModifie.fin" showTime required inputId="debut" v-model="evenementModifie.debut"></Calendar>
              </div>
              <div class="col-12 md:col-6 field">
                <label for="fin" class="text-900 font-semibold">Date de fin</label>
                <Calendar dateFormat="mm-dd-yy" :minDate="evenementModifie.debut" showTime required inputId="fin" v-model="evenementModifie.fin"></Calendar>
              </div>
              <div class="col-12 field">
                <label for="couleur-entreprise" class="text-900 font-semibold">Couleur</label>
                <Dropdown inputId="couleur-entreprise" :options="tags" v-model="evenementModifie.tag" optionLabel="nom">
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <div :style="{ 'background-color': slotProps.option.couleur }" class="flex-shrink-0 w-1rem h-1rem mr-2 border-circle"></div>
                      <div>{{ slotProps.option.nom }}</div>
                    </div>
                  </template>
                  <template #value="slotProps">
                    <div class="flex align-items-center">
                      <div :style="{ 'background-color': slotProps.value.couleur }" class="flex-shrink-0 w-1rem h-1rem mr-2 border-circle"></div>
                      <div>{{ slotProps.value.nom }}</div>
                    </div>
                  </template>
                </Dropdown>
              </div>
            </div>
          </div>

          <template #footer>
            <Button v-if="vue === 'afficher'" label="Éditer" icon="pi pi-pencil" @click="surClicEditer"></Button>
            <Button v-if="vue === 'nouveau' || vue === 'editer'" label="Enregistrer" icon="pi pi-check" @click="gererSauvegarde()" :disabled="!evenementModifie.debut || !evenementModifie.fin"></Button>
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.fc-header-toolbar) {
  .fc-button {
    line-height: 1;
    min-height: 2.07rem;
  }
}
</style>
