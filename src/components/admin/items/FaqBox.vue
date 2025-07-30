<template>
  <!-- Traffic sources START -->
  <div class="col-lg-12 col-xxl-8">
    <div class="card shadow h-100">
      <!-- Card header -->
      <div class="card-header border-bottom d-flex justify-content-between align-items-center p-4">
        <h5 class="card-header-title">FAQ'S</h5>
        <a href="#" class="btn btn-link p-0 mb-0">Voir</a>  <!-- Ajouter un lien vers la page FAQ -->
      </div>
      <!-- Card body START -->
      <div class="card-body p-4">
        <!-- FAQ START -->
        <div class="accordion accordion-icon accordion-bg-light" id="accordionExample2">
          <!-- Item -->
          <div class="accordion-item mb-3" v-for="(faq, index) in faqs" :key="index">
            <h6 class="accordion-header font-base" :id="'heading-' + index">
              <button
                  class="accordion-button fw-bold rounded d-inline-block collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  :data-bs-target="'#collapse-' + index"
                  aria-expanded="false"
                  :aria-controls="'collapse-' + index"
              >
                {{ faq.question }}
              </button>
            </h6>
            <!-- Body -->
            <div :id="'collapse-' + index" class="accordion-collapse collapse" :aria-labelledby="'heading-' + index" data-bs-parent="#accordionExample2">
              <div class="accordion-body mt-3">
                {{ faq.answer }}
              </div>
            </div>
          </div>
        </div>
        <!-- FAQ END -->
      </div>
      <!-- Card body END -->
    </div>
  </div>
  <!-- Traffic sources END -->
</template>

<script>
export default {
  name: 'FaqBox',
  data() {
    return {
      faqs: [
        {
          question: "QU'EST-CE QUE LE CONTRAT PÉDAGOGIQUE TRIPARTITE ET À QUOI SERT-IL ?",
          answer: "Le contrat pédagogique tripartite (CPT) indique les objectifs à atteindre par l’étudiant·e durant la PFP. Plus précisément, ce dernier doit servir à développer les rôles et les compétences présentés dans le référentiel de compétence.\n" +
              "Il précise également les ressources mises à sa disposition.\n" +
              "Ce contrat, cosigné par l’étudiant·e, la·le formateur·trice HES et le·la PF permet à chaque partie de formaliser ses attentes et de s’entendre sur les objectifs d’apprentissage visés.\n" +
              "Unterlagen Dreiervertrag / Documents contrat tripartite\n" +
              "Zuteilung Lehrer / Répartition répondant.e.s HES"},
        {
          question: "How to edit my Profile?",
          answer: "What deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. Improved own provided blessing may peculiar domestic. Sight house has sex never. No visited raising gravity outward subject my cottage Mr be."
        },
        {
          question: "What's are the difference between a college and a university?",
          answer: "Post no so what deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. Improved own provided blessing may peculiar domestic. Sight house has sex never. No visited raising gravity outward subject my cottage Mr be. Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting in. Off melancholy alteration principles old. Is do speedily kindness properly oh. Respect article painted cottage he is offices parlors."
        },
        {
          question: "What's are the difference between a college and a university?",
          answer: "Post no so what deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. Improved own provided blessing may peculiar domestic. Sight house has sex never. No visited raising gravity outward subject my cottage Mr be. Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting in. Off melancholy alteration principles old. Is do speedily kindness properly oh. Respect article painted cottage he is offices parlors."
        },
        {
          question: "What's are the difference between a college and a university?",
          answer: "Post no so what deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. Improved own provided blessing may peculiar domestic. Sight house has sex never. No visited raising gravity outward subject my cottage Mr be. Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting in. Off melancholy alteration principles old. Is do speedily kindness properly oh. Respect article painted cottage he is offices parlors."
        },
        {
          question: "What's are the difference between a college and a university?",
          answer: "Post no so what deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. Improved own provided blessing may peculiar domestic. Sight house has sex never. No visited raising gravity outward subject my cottage Mr be. Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting in. Off melancholy alteration principles old. Is do speedily kindness properly oh. Respect article painted cottage he is offices parlors."
        },
        // ajoutez plus de FAQ comme nécessaire
      ]
    }
  }
}
</script>

<style scoped>
/* Ajoutez vos styles CSS ici si nécessaire */
</style>
