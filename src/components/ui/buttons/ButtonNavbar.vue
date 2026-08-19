<template>
  <Button
    type="button"
    :class="['navbar-icon-button', customClass, { 'navbar-icon-button--active': active }]"
    :style="buttonStyle"
    @click="onClick"
    :title="title"
    :aria-label="ariaLabel || title"
    :aria-current="active ? 'page' : undefined"
  >
    <i :class="icon" :style="iconStyle" aria-hidden="true"></i>
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
    },
    ariaLabel: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: false,
    }
  },
  computed: {
    buttonStyle() {
      return {
        backgroundColor: this.bgColor,
        border: "none",
        borderRadius: "32%",
        width: "var(--navbar-control-size, 44px)",
        minWidth: "var(--navbar-control-size, 44px)",
        height: "var(--navbar-control-size, 44px)",
        minHeight: "var(--navbar-control-size, 44px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 150ms ease, background-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
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
.navbar-icon-button:hover {
  background-color: var(--surface-hover) !important;
}

.navbar-icon-button--active {
  color: var(--surface-overlay);
  background-color: var(--primary-color) !important;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary-color) 65%, transparent);
}

.navbar-icon-button--active :deep(i) {
  color: var(--surface-overlay) !important;
}

.navbar-icon-button:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
}

.navbar-icon-button:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .navbar-icon-button {
    transition: none !important;
  }
}


.inputcolor {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
}
</style>
