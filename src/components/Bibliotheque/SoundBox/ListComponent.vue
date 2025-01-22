<!-- src/components/ListComponent.vue -->
<template>
  <Navbar />
  <div class="container flex-auto">
    <h2>Liste Complète des Composants PrimeVue</h2>

    <!-- BUTTONS -->
    <section class="p-mb-6">
      <h3>Buttons</h3>
      <Button label="Primary" class="p-button-primary p-mr-2" />
      <Button label="Secondary" class="p-button-secondary p-mr-2" />
      <Button label="Success" class="p-button-success p-mr-2" />
      <Button label="Info" class="p-button-info p-mr-2" />
      <Button label="Warning" class="p-button-warning p-mr-2" />
      <Button label="Danger" class="p-button-danger p-mr-2" />
      <Button label="Link" class="p-button-text p-mr-2" />
    </section>

    <!-- INPUTS -->
    <section class="p-mb-6">
      <h3>Inputs</h3>
      <!-- InputText -->
      <div class="p-mb-3">
        <label for="inputtext">InputText</label>
        <InputText id="inputtext" v-model="inputValue" placeholder="Entrez du texte" />
      </div>
      <!-- InputNumber -->
      <div class="p-mb-3">
        <label for="inputnumber">InputNumber</label>
        <InputNumber id="inputnumber" v-model="numberValue" :min="0" :max="100" />
      </div>
      <!-- Textarea -->
      <div class="p-mb-3">
        <label for="textarea">Textarea</label>
        <Textarea id="textarea" v-model="textareaValue" rows="3" cols="30" placeholder="Entrez du texte" />
      </div>
      <!-- Password -->
      <div class="p-mb-3">
        <label for="password">Password</label>
        <Password id="password" v-model="password" feedback />
      </div>
      <!-- Checkbox -->
      <div class="p-mb-3">
        <Checkbox v-model="checked" binary />
        <label class="p-checkbox-label">Checkbox</label>
      </div>
      <!-- RadioButton -->
      <div class="p-mb-3">
        <RadioButton v-model="radioValue" :value="1" /> Option 1
        <RadioButton v-model="radioValue" :value="2" class="p-ml-3" /> Option 2
      </div>
      <!-- ToggleButton -->
      <div class="p-mb-3">
        <ToggleButton v-model="toggleValue" onLabel="ON" offLabel="OFF" />
      </div>
      <!-- Slider -->
      <div class="p-mb-3">
        <label for="slider">Slider</label>
        <Slider id="slider" v-model="sliderValue" :min="0" :max="100" />
      </div>
      <!-- ColorPicker -->
      <div class="p-mb-3">
        <label for="colorpicker">ColorPicker</label>
        <ColorPicker id="colorpicker" v-model="colorValue" />
      </div>
      <!-- Calendar -->
      <div class="p-mb-3">
        <label for="calendar">Calendar</label>
        <Calendar id="calendar" v-model="calendarValue" dateFormat="dd/mm/yy" />
      </div>
    </section>

    <!-- SELECTS -->
    <section class="p-mb-6">
      <h3>Selects</h3>
      <!-- Dropdown -->
      <div class="p-mb-3">
        <label for="dropdown">Dropdown</label>
        <Dropdown id="dropdown" v-model="dropdownValue" :options="dropdownOptions" optionLabel="label" placeholder="Sélectionnez une option" />
      </div>
      <!-- MultiSelect -->
      <div class="p-mb-3">
        <label for="multiselect">MultiSelect</label>
        <MultiSelect id="multiselect" v-model="multiSelectValue" :options="dropdownOptions" optionLabel="label" placeholder="Sélectionnez plusieurs options" />
      </div>
      <!-- ListBox -->
      <div class="p-mb-3">
        <label for="listbox">ListBox</label>
        <ListBox id="listbox" v-model="listBoxValue" :options="dropdownOptions" optionLabel="label" multiple />
      </div>
      <!-- SelectButton -->
      <div class="p-mb-3">
        <label>SelectButton</label>
        <SelectButton v-model="selectButtonValue" :options="selectButtonOptions" />
      </div>
    </section>

    <!-- OVERLAY COMPONENTS -->
    <section class="p-mb-6">
      <h3>Overlay Components</h3>
      <!-- Dialog -->
      <div class="p-mb-3">
        <Button label="Afficher Dialog" icon="pi pi-external-link" @click="showDialog = true" />
        <Dialog header="Titre du Dialog" v-model:visible="showDialog" :modal="true" :closable="true">
          <p>Contenu du dialog...</p>
        </Dialog>
      </div>
      <!-- Tooltip -->
      <div class="p-mb-3">
        <Button label="Hover me" icon="pi pi-info-circle" v-tooltip="'Ceci est un tooltip!'" />
      </div>
      <!-- OverlayPanel -->
      <div class="p-mb-3">
        <Button label="Afficher OverlayPanel" icon="pi pi-bars" @click="toggleOverlay($event)" />
        <OverlayPanel ref="overlayPanel">
          <p>Contenu de l'OverlayPanel</p>
        </OverlayPanel>
      </div>
      <!-- Sidebar -->
      <div class="p-mb-3">
        <Button label="Afficher Sidebar" icon="pi pi-bars" @click="sidebarVisible = true" />
        <Sidebar v-model:visible="sidebarVisible" position="right">
          <h3>Sidebar Contenu</h3>
          <p>Contenu de la sidebar...</p>
          <Button label="Fermer" @click="sidebarVisible = false" />
        </Sidebar>
      </div>
      <!-- Toast -->
      <div class="p-mb-3">
        <Button label="Afficher Toast" icon="pi pi-info-circle" class="p-button-info" @click="showToast" />
      </div>
      <!-- ConfirmDialog -->
      <div class="p-mb-3">
        <Button label="Afficher ConfirmDialog" icon="pi pi-question-circle" class="p-button-warning" @click="confirmAction" />
      </div>
    </section>

    <!-- DATA DISPLAY -->
    <section class="p-mb-6">
      <h3>Data Display</h3>
      <!-- DataTable -->
      <div class="p-mb-3">
        <h4>DataTable</h4>
        <DataTable :value="products" paginator :rows="5" responsiveLayout="scroll">
          <Column field="code" header="Code"></Column>
          <Column field="name" header="Nom"></Column>
          <Column field="category" header="Catégorie"></Column>
          <Column field="quantity" header="Quantité"></Column>
        </DataTable>
      </div>
      <!-- DataView -->
      <div class="p-mb-3">
        <h4>DataView</h4>
        <DataView :value="products" layout="grid">
          <template #item="{ data }">
            <div class="p-col-12 p-md-4">
              <div class="p-card p-shadow-3">
                <div class="p-card-body">
                  <h5>{{ data.name }}</h5>
                  <p>Code: {{ data.code }}</p>
                  <p>Catégorie: {{ data.category }}</p>
                  <p>Quantité: {{ data.quantity }}</p>
                </div>
              </div>
            </div>
          </template>
        </DataView>
      </div>
      <!-- Galleria -->
      <div class="p-mb-3">
        <h4>Galleria</h4>
        <Galleria :value="images" circular autoplay :autoplayInterval="3000" />
      </div>
      <!-- Image -->
      <div class="p-mb-3">
        <h4>Image</h4>
        <Image src="https://primefaces.org/cdn/primereact/images/product-image.png" alt="Image" width="200" />
      </div>
      <!-- Avatar -->
      <div class="p-mb-3">
        <h4>Avatar</h4>
        <Avatar icon="pi pi-user" />
        <Avatar label="AB" shape="circle" class="p-ml-2" />
        <Avatar image="https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png" shape="circle" class="p-ml-2" />
      </div>
      <!-- Badge -->
      <div class="p-mb-3">
        <h4>Badge</h4>
        <span class="p-tag p-tag-success">Succès</span>
        <span class="p-tag p-tag-info p-ml-2">Info</span>
        <span class="p-tag p-tag-warning p-ml-2">Avertissement</span>
        <span class="p-tag p-tag-danger p-ml-2">Erreur</span>
      </div>
      <!-- ProgressBar -->
      <div class="p-mb-3">
        <h4>ProgressBar</h4>
        <ProgressBar :value="progress" />
        <Button label="Augmenter" class="p-mt-2" @click="increaseProgress" />
      </div>
      <!-- Rating -->
      <div class="p-mb-3">
        <h4>Rating</h4>
        <Rating v-model="ratingValue" />
        <p>Valeur: {{ ratingValue }}</p>
      </div>
      <!-- Tag -->
      <div class="p-mb-3">
        <h4>Tag</h4>
        <Tag value="Nouveau" severity="success" />
        <Tag value="En cours" severity="info" class="p-ml-2" />
        <Tag value="Terminé" severity="warning" class="p-ml-2" />
        <Tag value="Erreur" severity="danger" class="p-ml-2" />
      </div>
    </section>

    <!-- NAVIGATION -->
    <section class="p-mb-6">
      <h3>Navigation</h3>
      <!-- Menu -->
      <div class="p-mb-3">
        <h4>Menu</h4>
        <Menu :model="menuItems" />
      </div>
      <!-- Menubar -->
      <div class="p-mb-3">
        <h4>Menubar</h4>
        <Menubar :model="menuItems" />
      </div>
      <!-- Breadcrumb -->
      <div class="p-mb-3">
        <h4>Breadcrumb</h4>
        <Breadcrumb :model="breadcrumbItems" />
      </div>
      <!-- TabView -->
      <div class="p-mb-3">
        <h4>TabView</h4>
        <TabView>
          <TabPanel header="Accueil">
            <p>Contenu de l'onglet Accueil.</p>
          </TabPanel>
          <TabPanel header="Profil">
            <p>Contenu de l'onglet Profil.</p>
          </TabPanel>
          <TabPanel header="Paramètres">
            <p>Contenu de l'onglet Paramètres.</p>
          </TabPanel>
        </TabView>
      </div>
      <!-- Steps -->
      <div class="p-mb-3">
        <h4>Steps</h4>
        <Steps :model="steps" :readonly="false" />
      </div>
    </section>

    <!-- LAYOUT -->
    <section class="p-mb-6">
      <h3>Layout</h3>
      <!-- Grid CSS -->
      <div class="p-mb-3">
        <h4>Grid CSS</h4>
        <div class="p-grid">
          <div class="p-col-12 p-md-4 p-lg-3" v-for="n in 4" :key="n">
            <div class="p-card p-shadow-3">
              <div class="p-card-body">
                <p>Colonne {{ n }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Panel -->
      <div class="p-mb-3">
        <h4>Panel</h4>
        <Panel header="Titre du Panel">
          <p>Contenu du panel...</p>
        </Panel>
      </div>
      <!-- Accordion -->
      <div class="p-mb-3">
        <h4>Accordion</h4>
        <Accordion>
          <AccordionTab header="Section 1">
            <p>Contenu de la section 1.</p>
          </AccordionTab>
          <AccordionTab header="Section 2">
            <p>Contenu de la section 2.</p>
          </AccordionTab>
          <AccordionTab header="Section 3">
            <p>Contenu de la section 3.</p>
          </AccordionTab>
        </Accordion>
      </div>
      <!-- Card -->
      <div class="p-mb-3">
        <h4>Card</h4>
        <Card>
          <template #title>
            Titre de la Card
          </template>
          <template #content>
            <p>Contenu de la card...</p>
          </template>
          <template #footer>
            <Button label="Action" />
          </template>
        </Card>
      </div>
    </section>

    <!-- UTILITIES -->
    <section class="p-mb-6">
      <h3>Utilities</h3>
      <!-- Divider -->
      <div class="p-mb-3">
        <h4>Divider</h4>
        <Divider />
      </div>
      <!-- Tag -->
      <div class="p-mb-3">
        <h4>Tag</h4>
        <Tag value="Exemple de Tag" />
      </div>
      <!-- ProgressSpinner -->
      <div class="p-mb-3">
        <h4>ProgressSpinner</h4>
        <ProgressSpinner />
      </div>
      <!-- Skeleton -->
      <div class="p-mb-3">
        <h4>Skeleton</h4>
        <Skeleton width="200px" height="20px" />
      </div>
    </section>
  </div>
</template>

<script>
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox';
import RadioButton from 'primevue/radiobutton';
import ToggleButton from 'primevue/togglebutton';
import Slider from 'primevue/slider';
import ColorPicker from 'primevue/colorpicker';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import ListBox from 'primevue/listbox';
import SelectButton from 'primevue/selectbutton';
import Dialog from 'primevue/dialog';
import OverlayPanel from 'primevue/overlaypanel';
import Sidebar from 'primevue/sidebar';
import Toast from 'primevue/toast';
import Galleria from 'primevue/galleria';
import Image from 'primevue/image';
import Avatar from 'primevue/avatar';
import ProgressBar from 'primevue/progressbar';
import Rating from 'primevue/rating';
import Tag from 'primevue/tag';
import Menu from 'primevue/menu';
import Menubar from 'primevue/menubar';
import Breadcrumb from 'primevue/breadcrumb';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Steps from 'primevue/steps';
import Panel from 'primevue/panel';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import ProgressSpinner from 'primevue/progressspinner';
import Skeleton from 'primevue/skeleton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import DataView from 'primevue/dataview';
import ConfirmDialog from 'primevue/confirmdialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Navbar from '@/components/Utils/Navbar.vue';

export default {
  name: 'ListComponent',
  components: {
    Navbar,
    Button,
    InputText,
    InputNumber,
    Textarea,
    Password,
    Checkbox,
    RadioButton,
    ToggleButton,
    Slider,
    ColorPicker,
    Calendar,
    Dropdown,
    MultiSelect,
    ListBox,
    SelectButton,
    Dialog,
    OverlayPanel,
    Sidebar,
    Toast,
    Galleria,
    Image,
    Avatar,
    ProgressBar,
    Rating,
    Tag,
    Menu,
    Menubar,
    Breadcrumb,
    TabView,
    TabPanel,
    Steps,
    Panel,
    Accordion,
    AccordionTab,
    Card,
    Divider,
    ProgressSpinner,
    Skeleton,
    DataTable,
    Column,
    DataView,
    ConfirmDialog,
  },
  setup() {
    // Inputs
    const inputValue = ref('');
    const numberValue = ref(null);
    const textareaValue = ref('');
    const password = ref('');
    const checked = ref(false);
    const radioValue = ref(null);
    const toggleValue = ref(false);
    const sliderValue = ref(50);
    const colorValue = ref('#ff0000');
    const calendarValue = ref(null);

    // Selects
    const dropdownOptions = [
      { label: 'Option 1', value: 1 },
      { label: 'Option 2', value: 2 },
      { label: 'Option 3', value: 3 },
    ];
    const dropdownValue = ref(null);
    const multiSelectValue = ref([]);
    const listBoxValue = ref([]);
    const selectButtonOptions = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ];
    const selectButtonValue = ref(null);

    // Dialog
    const showDialog = ref(false);

    // OverlayPanel
    const overlayPanel = ref(null);

    // Sidebar
    const sidebarVisible = ref(false);

    // Toast
    const toast = useToast();

    const showToast = () => {
      toast.add({ severity: 'info', summary: 'Information', detail: 'Ceci est un toast!', life: 3000 });
    };

    // ConfirmDialog
    const confirm = useConfirm();

    const confirmAction = () => {
      confirm.require({
        message: 'Voulez-vous continuer?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          toast.add({ severity: 'success', summary: 'Confirmé', detail: 'Action confirmée!', life: 3000 });
        },
        reject: () => {
          toast.add({ severity: 'error', summary: 'Rejeté', detail: 'Action annulée!', life: 3000 });
        },
      });
    };

    // Data Display
    const products = ref([
      { code: 'P001', name: 'Produit 1', category: 'Catégorie A', quantity: 100 },
      { code: 'P002', name: 'Produit 2', category: 'Catégorie B', quantity: 200 },
      { code: 'P003', name: 'Produit 3', category: 'Catégorie A', quantity: 150 },
      { code: 'P004', name: 'Produit 4', category: 'Catégorie C', quantity: 300 },
    ]);

    const images = ref([
      { itemImageSrc: 'https://primefaces.org/cdn/primereact/images/galleria/galleria1.jpg' },
      { itemImageSrc: 'https://primefaces.org/cdn/primereact/images/galleria/galleria2.jpg' },
      { itemImageSrc: 'https://primefaces.org/cdn/primereact/images/galleria/galleria3.jpg' },
      { itemImageSrc: 'https://primefaces.org/cdn/primereact/images/galleria/galleria4.jpg' },
      { itemImageSrc: 'https://primefaces.org/cdn/primereact/images/galleria/galleria5.jpg' },
    ]);

    // ProgressBar
    const progress = ref(0);
    const increaseProgress = () => {
      if (progress.value < 100) {
        progress.value += 10;
      } else {
        progress.value = 0;
      }
    };

    // Rating
    const ratingValue = ref(3);

    // Menu
    const menuItems = ref([
      {
        label: 'Fichier',
        icon: 'pi pi-fw pi-file',
        items: [
          { label: 'Nouveau', icon: 'pi pi-fw pi-plus', command: () => { toast.add({ severity: 'success', summary: 'Nouveau', detail: 'Nouvel élément créé!', life: 3000 }); } },
          { label: 'Ouvrir', icon: 'pi pi-fw pi-download' },
          { label: 'Quitter', icon: 'pi pi-fw pi-times' },
        ],
      },
      {
        label: 'Editer',
        icon: 'pi pi-fw pi-pencil',
        items: [
          { label: 'Annuler', icon: 'pi pi-fw pi-undo' },
          { label: 'Rétablir', icon: 'pi pi-fw pi-redo' },
        ],
      },
      {
        label: 'Aide',
        icon: 'pi pi-fw pi-question',
      },
    ]);

    // Breadcrumb
    const breadcrumbItems = ref([
      { label: 'Accueil', url: '/' },
      { label: 'Liste des Composants' },
    ]);

    // Steps
    const steps = ref([
      { label: 'Étape 1', command: () => { toast.add({ severity: 'info', summary: 'Étape 1', detail: 'Vous êtes à l\'étape 1', life: 3000 }); } },
      { label: 'Étape 2', command: () => { toast.add({ severity: 'info', summary: 'Étape 2', detail: 'Vous êtes à l\'étape 2', life: 3000 }); } },
      { label: 'Étape 3', command: () => { toast.add({ severity: 'info', summary: 'Étape 3', detail: 'Vous êtes à l\'étape 3', life: 3000 }); } },
    ]);

    const toggleOverlay = (event) => {
      overlayPanel.value.toggle(event);
    };

    return {
      // Inputs
      inputValue,
      numberValue,
      textareaValue,
      password,
      checked,
      radioValue,
      toggleValue,
      sliderValue,
      colorValue,
      calendarValue,

      // Selects
      dropdownOptions,
      dropdownValue,
      multiSelectValue,
      listBoxValue,
      selectButtonOptions,
      selectButtonValue,

      // Dialog
      showDialog,

      // OverlayPanel
      overlayPanel,

      // Sidebar
      sidebarVisible,

      // Toast
      showToast,

      // ConfirmDialog
      confirmAction,

      // Data Display
      products,
      images,

      // ProgressBar
      progress,
      increaseProgress,

      // Rating
      ratingValue,

      // Menu
      menuItems,

      // Breadcrumb
      breadcrumbItems,

      // Steps
      steps,

      // Overlay
      toggleOverlay,
    };
  },
};
</script>

<style scoped>
.container {
  padding: 2rem;
}

.p-mb-6 {
  margin-bottom: 2rem;
}

.p-mb-3 {
  margin-bottom: 1.5rem;
}

.p-ml-2 {
  margin-left: 0.5rem;
}

.p-ml-3 {
  margin-left: 0.75rem;
}

.p-mr-2 {
  margin-right: 0.5rem;
}

.p-mt-2 {
  margin-top: 0.5rem;
}

.p-card {
  padding: 1rem;
}

.p-grid > .p-col-12 {
  margin-bottom: 1rem;
}
</style>
