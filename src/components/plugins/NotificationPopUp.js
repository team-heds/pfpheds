// src/plugins/NotificationPlugin.js
import { useToast } from 'primevue/usetoast';

export default {
install(app) {
// Ajouter une méthode globale $notify
app.config.globalProperties.$notify = (options) => {
const toast = useToast();
toast.add(options);
};
},
};
