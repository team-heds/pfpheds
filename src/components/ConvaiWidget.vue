<!-- src/components/ConvaiWidget.vue -->
<template>
  <div class="convai-widget-container">
    <elevenlabs-convai agent-id="uaDV4jFoX5IPj49zy95v"></elevenlabs-convai>
  </div>
</template>

<script>
export default {
  name: "ConvaiWidget",
  mounted() {
    if (!document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]')) {
      const script = document.createElement("script");
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }
  },
};
</script>

/* src/components/ConvaiWidget.vue */
<style scoped>
.convai-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

@media (max-width: 768px) {
  .convai-widget-container {
    bottom: 10px;
    right: 10px;
    width: 80px; /* Ajuster la taille pour les petits écrans */
    height: 80px;
  }
}
</style>
