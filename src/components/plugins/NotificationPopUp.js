// src/plugins/NotificationPlugin.js
import mitt from 'mitt';

const emitter = mitt();

export default {
  install(app) {
    // Ajouter une méthode globale $notify
    app.config.globalProperties.$notify = (options) => {
      emitter.emit('notify', options);
    };

    // Rendre l'émetteur accessible si nécessaire
    app.config.globalProperties.emitter = emitter;
  },
};
