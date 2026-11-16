// Libellés français des composants PrimeVue (calendriers, confirmations…).
// Sans eux, les calendriers affichaient « Choose Date », les mois en anglais et
// une semaine commençant le dimanche (recette du 16.11).
// Le format de date par défaut n'est PAS modifié : les écrans fixent déjà le leur.
import { defaultOptions } from 'primevue/config'

export const primevueLocaleFr = Object.freeze({
  ...defaultOptions.locale,
  clear: 'Effacer',
  apply: 'Appliquer',
  accept: 'Oui',
  reject: 'Non',
  choose: 'Choisir',
  upload: 'Envoyer',
  cancel: 'Annuler',
  dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  dayNamesShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
  monthNames: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  monthNamesShort: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  chooseYear: 'Choisir l’année',
  chooseMonth: 'Choisir le mois',
  chooseDate: 'Choisir la date',
  prevDecade: 'Décennie précédente',
  nextDecade: 'Décennie suivante',
  prevYear: 'Année précédente',
  nextYear: 'Année suivante',
  prevMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  prevHour: 'Heure précédente',
  nextHour: 'Heure suivante',
  prevMinute: 'Minute précédente',
  nextMinute: 'Minute suivante',
  today: 'Aujourd’hui',
  weekHeader: 'Sem.',
  firstDayOfWeek: 1,
  emptyFilterMessage: 'Aucun résultat',
  emptySearchMessage: 'Aucun résultat',
  emptyMessage: 'Aucune option disponible',
})
