<template>
  <div class="row g-4 mb-4">
    <div v-for="(box, index) in counterBoxes" :key="index" class="col-md-6 col-xxl-3">
      <div class="card card-body p-4 h-100" :class="box.bgClass">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h2 class="purecounter mb-0 fw-bold" :data-purecounter-start="box.start" :data-purecounter-end="box.end" :data-purecounter-duration="1.0">0</h2>
            <span class="mb-0 h6 fw-light">{{ box.title }}</span>
          </div>
          <div class="icon-lg rounded-circle text-white mb-0" :class="box.iconBgClass">
            <i :class="box.iconClass"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CounterBoxes',
  data() {
    return {
      counterBoxes: [
        { start: 0, end: 87, title: 'Places de stages', bgClass: 'bg-warning bg-opacity-15', iconClass: 'fas fa-briefcase fa-fw', iconBgClass: 'bg-warning' },
        { start: 0, end: 81, title: 'institutions', bgClass: 'bg-danger bg-opacity-10', iconClass: 'fas fa-regular fa-hospital fa-fw', iconBgClass: 'bg-danger' },
        { start: 0, end: 270, title: 'Élèves', bgClass: 'bg-primary bg-opacity-10', iconClass: 'fas fa-solid fa-graduation-cap fa-fw', iconBgClass: 'bg-primary' },
        { start: 0, end: 8, title: 'Formateurs', bgClass: 'bg-success bg-opacity-10', iconClass: 'fas fa-user-tie fa-fw', iconBgClass: 'bg-success' },
      ],
    }
  },
  mounted() {
    new PureCounter();
  }
}
</script>

<style scoped>
/* Vos styles vont ici */
</style>
