<template>
  <div class="row g-4 mb-4">
    <div class="col-xxl-12">
      <div class="card shadow h-100">
        <div class="card-header p-4 border-bottom">
          <h5 class="card-header-title">{{ chartTitle }}</h5>
        </div>
        <div class="card-body chart-container">
          <div :id="`ChartPayout-${chartId}`"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsBox',
  props: {
    chartId: {
      type: Number,
      required: true
    },
    chartData: {
      type: Array,
      required: true
    },
    chartTitle: {
      type: String,
      default: "Stats"
    }
  },
  mounted() {
    const options = {
      chart: {
        type: 'line',
        height: 300  // ajuster la hauteur ici
      },
      series: this.chartData,
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", 'Dec']
      }
    };

    new window.ApexCharts(document.querySelector(`#ChartPayout-${this.chartId}`), options).render();
  }
};
</script>

<style scoped>
.chart-container {
  height: 320px;
}
</style>