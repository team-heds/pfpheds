<template>
    <div v-if="visible" class="modal-overlay">
      <div class="modal-content">
        <h2>Information</h2>
        <p>{{ message }}</p>
        <div class="text-right mt-4">
          <button class="btn btn-primary" @click="closeModal">OK</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "AlertModal",
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        default: ""
      }
    },
    methods: {
      closeModal() {
        this.$emit('close');
      }
    }
  };
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    display:flex;
    justify-content:center;
    align-items:center;
    z-index:9999;
  }
  
  .modal-content {
    background-color: var(--surface-card);
    padding: 30px;
    border-radius: 8px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    color: var(--text-color);
  }
  
  .modal-content h2 {
    margin-top:0;
    margin-bottom:15px;
  }
  
  .btn.btn-primary {
    background-color: var(--primary-color);
    color:white;
    border:none;
    padding: 0.5rem 1rem;
    border-radius:4px;
    cursor:pointer;
  }
  
  .btn.btn-primary:hover {
    background-color: var(--primary-color-hover);
  }
  </style>
  