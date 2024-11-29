<template>
  <Button
    :class="customClass"
    :style="buttonStyle"
    @click="onClick"
  >
    <i :class="icon" :style="iconStyle"></i>
  </Button>
</template>

<script>
import { defineComponent } from "vue";
import Button from "primevue/button";

export default defineComponent({
  name: "ButtonNavbar",
  components: { Button },
  props: {
    icon: {
      type: String,
      default: "pi pi-home", // Icône par défaut
    },
    customClass: {
      type: String,
      default: "",
    },
    bgColor: {
      type: String,
      default: "var(--surface-overlay)", // Couleur de fond par défaut
    },
    hoverBgColor: {
      type: String,
      default: "var(--surface-hover)", // Couleur de fond au survol
    },
    iconColor: {
      type: String,
      default: "var(--primary-color)", // Couleur de l'icône
    },
  },
  computed: {
    buttonStyle() {
      return {
        backgroundColor: this.bgColor,
        border: "none",
        borderRadius: "25%",
        width: "50px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.3s ease",
      };
    },
    iconStyle() {
      return {
        color: this.iconColor,
        fontSize: "20px",
      };
    },
  },
  methods: {
    onClick() {
      this.$emit("click");
    },
  },
});
</script>

<style scoped>
/* Effet au survol */
.p-button:hover {
  background-color: var(--surface-hover) !important;
}
</style>
