<template>
  <Button
    :class="customClass"
    :style="buttonStyle"
    @click="onClick"
    :title="title"
  >
    <i :class="icon" :style="iconStyle"></i>
  </Button>
</template>

<script>
import { defineComponent } from "vue";
import Button from 'primevue/button';

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
    title: {
      type: String,
      default: '',
    }
  },
  computed: {
    buttonStyle() {
      return {
        backgroundColor: this.bgColor,
        border: "none",
        borderRadius: "32%",
        width: "44px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.3s ease",
        cursor: 'pointer',
      };
    },
    iconStyle() {
      return {
        color: this.iconColor,
        fontSize: "20px",
      };
    }
  },
  methods: {
    onClick(e) {
      this.$emit("click", e);
    }
  }
});
</script>

<style scoped>
.p-button:hover {
  background-color: var(--surface-hover) !important;
}


.inputcolor {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
}
</style>