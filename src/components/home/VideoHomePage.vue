<template>

  <section class="bg-light position-relative">

      <div class="container">
        <div class="row">
    <!-- SVG decoration -->
    <figure class="position-absolute bottom-0 start-0 d-none d-lg-block">
      <svg width="822.2px" height="301.9px" viewBox="0 0 822.2 301.9"	>
        <path class="fill-warning" d="M752.5,51.9c-4.5,3.9-8.9,7.8-13.4,11.8c-51.5,45.3-104.8,92.2-171.7,101.4c-39.9,5.5-80.2-3.4-119.2-12.1 c-32.3-7.2-65.6-14.6-98.9-13.9c-66.5,1.3-128.9,35.2-175.7,64.6c-11.9,7.5-23.9,15.3-35.5,22.8c-40.5,26.4-82.5,53.8-128.4,70.7 c-2.1,0.8-4.2,1.5-6.2,2.2L0,301.9c3.3-1.1,6.7-2.3,10.2-3.5c46.1-17,88.1-44.4,128.7-70.9c11.6-7.6,23.6-15.4,35.4-22.8 c46.7-29.3,108.9-63.1,175.1-64.4c33.1-0.6,66.4,6.8,98.6,13.9c39.1,8.7,79.6,17.7,119.7,12.1C634.8,157,688.3,110,740,64.6 c4.5-3.9,9-7.9,13.4-11.8C773.8,35,797,16.4,822.2,1l-0.7-1C796.2,15.4,773,34,752.5,51.9z"/>
      </svg>
    </figure>

    <!-- SVG decoration -->
    <figure class="position-absolute top-0 end-0">
      <svg width="822.2px" height="301.9px" viewBox="0 0 822.2 301.9"	>
        <path class="fill-primary" d="M752.5,51.9c-4.5,3.9-8.9,7.8-13.4,11.8c-51.5,45.3-104.8,92.2-171.7,101.4c-39.9,5.5-80.2-3.4-119.2-12.1 c-32.3-7.2-65.6-14.6-98.9-13.9c-66.5,1.3-128.9,35.2-175.7,64.6c-11.9,7.5-23.9,15.3-35.5,22.8c-40.5,26.4-82.5,53.8-128.4,70.7 c-2.1,0.8-4.2,1.5-6.2,2.2L0,301.9c3.3-1.1,6.7-2.3,10.2-3.5c46.1-17,88.1-44.4,128.7-70.9c11.6-7.6,23.6-15.4,35.4-22.8 c46.7-29.3,108.9-63.1,175.1-64.4c33.1-0.6,66.4,6.8,98.6,13.9c39.1,8.7,79.6,17.7,119.7,12.1C634.8,157,688.3,110,740,64.6 c4.5-3.9,9-7.9,13.4-11.8C773.8,35,797,16.4,822.2,1l-0.7-1C796.2,15.4,773,34,752.5,51.9z"/>
      </svg>
    </figure>

    <!-- SVG decoration -->
    <figure class="position-absolute bottom-0 start-50 translate-middle-x ms-n9 mb-5">
      <svg width="23px" height="23px">
        <path class="fill-primary" d="M23.003,11.501 C23.003,17.854 17.853,23.003 11.501,23.003 C5.149,23.003 -0.001,17.854 -0.001,11.501 C-0.001,5.149 5.149,-0.000 11.501,-0.000 C17.853,-0.000 23.003,5.149 23.003,11.501 Z"></path>
      </svg>
    </figure>

    <!-- SVG decoration -->
    <figure class="position-absolute bottom-0 end-0 me-5 mb-5">
      <svg width="22px" height="22px">
        <path class="fill-warning" d="M22.003,11.001 C22.003,17.078 17.077,22.003 11.001,22.003 C4.925,22.003 -0.001,17.078 -0.001,11.001 C-0.001,4.925 4.925,-0.000 11.001,-0.000 C17.077,-0.000 22.003,4.925 22.003,11.001 Z"></path>
      </svg>
    </figure>

    <div class="container position-relative">
      <div class="row justify-content-between align-items-center my-5">

        <div class="col-lg-5 position-relative">
          <!-- SVG decoration -->
          <figure class="position-absolute top-0 start-0 translate-middle mt-n5">
            <svg width="29px" height="29px">
              <path class="fill-orange" d="M29.004,14.502 C29.004,22.512 22.511,29.004 14.502,29.004 C6.492,29.004 -0.001,22.512 -0.001,14.502 C-0.001,6.492 6.492,-0.001 14.502,-0.001 C22.511,-0.001 29.004,6.492 29.004,14.502 Z"></path>
            </svg>
          </figure>

          <!-- Title -->
          <h2 class="h2">Comment utiliser la plateforme de formation pratique</h2>
        </div>

        <div class="col-lg-5 position-relative mt-4 mt-lg-0">
          <!-- Image -->
          <img src="../../assets/images/about/03.jpg" class="border border-5 border-white rounded-2" alt="">
          <div class="position-absolute top-50 start-50 translate-middle">
            <!-- Video link -->
            <a href="https://vimeo.com/780429698" class="btn text-danger btn-round btn-white-shadow btn-lg mb-0" data-glightbox data-gallery="video-tour">
              <i class="fas fa-play"></i>
            </a>
          </div>
        </div>

      </div>
    </div>
    </div>
   </div>
  </section>
</template>

<script>
import Plyr from "plyr";

export default {
  name: "VideoHomePage",
  mounted() {
    // Assurez-vous que le style Plyr est inclus dans votre projet pour que le lecteur soit stylisé correctement
    require("plyr/dist/plyr.css");

    // Initialisation de Plyr
    this.player = new Plyr(this.$refs.player);
  },
  beforeDestroy() {
    // Nettoyez le lecteur lorsque le composant est détruit
    if (this.player) {
      this.player.destroy();
    }
  },
  data() {
    return {
      player: null
    };
  }
};
</script>

<style scoped>
/* Si vous avez des styles spécifiques pour ce composant, ajoutez-les ici. */
</style>
