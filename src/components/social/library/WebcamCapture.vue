<template>
  <div class="webcam-capture-modal">
    <video ref="video" autoplay playsinline width="320" height="400"></video>
    <div class="controls">
      <button @click="capture">Prendre la photo</button>
      <button @click="$emit('cancel')">Annuler</button>
    </div>
    <canvas ref="canvas" width="320" height="400" style="display:none"></canvas>
  </div>
</template>

<script>
export default {
  name: 'WebcamCapture',
  mounted() {
    this.startWebcam();
  },
  beforeDestroy() {
    this.stopWebcam();
  },
  methods: {
    async startWebcam() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.$refs.video.srcObject = this.stream;
      } catch (e) {
        alert('Impossible d\'accéder à la webcam.');
        this.$emit('cancel');
      }
    },
    stopWebcam() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
    },
    capture() {
      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        this.stopWebcam();
        this.$emit('captured', blob);
      }, 'image/jpeg', 0.95);
    }
  }
};
</script>

<style scoped>
.webcam-capture-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
</style>