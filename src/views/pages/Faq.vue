<script setup>
import { ref } from 'vue';
import { usePrimeVue } from 'primevue/config';
const $primevue = usePrimeVue();

defineExpose({
    $primevue
});

const activeIndex = ref(0);
const items = ref([
    {
        label: 'Organisation générale de la formation pratique (FP)',
        icon: 'pi pi-fw pi-info-circle',
        questions: [
            'GLOSSAIRE',
            'Comment est organisée la formation pratique dans la filière physiothérapie romande ?',
            'Comment est organisée la formation pratique sur le site de Loèche-Les-Bains ?',
            'Combien y a-t-il de périodes de formation pratique dans le cursus BSC en physiothérapie ?',
            'Comment sont réparties les places de formation pratique ?',
            'Que se passe-t-il si je ne respecte pas les critères demandés ?'
        ],
        answers: [
            'CPT : contrat pédagogique tripartite<br>FP: Formation pratique<br>PFP: Période de formation pratique<br>PF: Practitien·ne formateur·trice<br>SAE: Sport-art-études',
            'La plupart des places de FP sont propre à chaque filière cependant certaines places font partie d’un pot commun entre les différentes filières romandes de physiothérapies.',
            'Vous trouverez la réponse à ces informations dans les fiches modules des périodes de formations pratiques (PFP), qui sont identiques entre tous les sites de la filière romande de physiothérapie, sur intranet',
            'Le cursus BSC en physiothérapie compte 4 périodes de formations pratique, ce qui représente environ 1/3 de votre formation.  <br> Ces 4 périodes durent :  6 semaines (PFP1) ; 10 semaines (PFP2) ; 10 semaines (PFP3) ; 8 semaines (PFP4). ',
            'Le responsable formation pratique vous soumettra, environ 3 mois avant le début de la formation pratique de l’année en cours, un fichier Excel regroupant la liste des places disponibles.<br>Nous vous conseillons de prendre le temps de lire le document “Attribution des places de FP / Zuteilung Praktikumsplätze” qui reprend point par point le processus d’attribution des places de FP ainsi que les critères à respecter.<br>A noter que l’attribution des places de PFP pour les étudiant·e·s SAE se fait en amont. ',
            'Si un·e d’entre vous ne respecte pas les critères demandés, la répartition des places proposées sera refusée. En cas de récidive, les dispositions nécessaires seront prises.'
        ]
    },
    {
        label: 'Processus Formation Pratique',
        icon: 'pi pi-fw pi-envelope',
        questions: [
            'Quel est l échéancier concernant votre formation pratique',
            'Mis à part le responsable de formation pratique, divers autres formateur·trice·s HES le soutiennent.<br>Le rôle de ces formateur·trice·s HES est d’accompagner et de soutenir les étudiant-e-s lors de la réalisation et/ou de la signature de leur CPT ainsi que lors du suivi de leur FP d’un point de vue pédagogique et du débriefing post FP.',
            "Le contrat pédagogique tripartite (CPT) indique les objectifs à atteindre par l’étudiant·e durant la PFP. Plus précisément, ce dernier doit servir à développer les rôles et les compétences présentés dans le référentiel de compétence. Il précise également les ressources mises à sa disposition. Ce contrat, cosigné par l’étudiant·e, la·le formateur·trice HES et le·la PF permet à chaque partie de formaliser ses attentes et de s’entendre sur les objectifs d’apprentissage visés.",
            'Puis-je bénéficier d’aide pour la réalisation de mon contrat pédagogique tripartite ?',
            'Quelle est la procédure d’évaluation à laquelle je serais soumis·e durant la formation pratique ?',
            'Comment suis-je impliqué dans mon évaluation de PFP ?',
            'Je suis en échec à la fin de ma période de formation pratique, que va-t-il se passer ?',
            'En cas de double échec lors d’une PFP, que se passe-t-il ?',
            'J’ai été absent lors de ma période de formation pratique, quelles sont les conséquences ?',
            'Puis-je prendre congé durant ma formation pratique ?',
            'Quels sont les horaires que je serais amené à faire durant ma période de formation pratique ?',
            'Nous avons l’habitude de devoir évaluer tous nos modules (EEE), en est-il de même pour la formation pratique ?',
            'Puis-je profiter d’une place de formation pratique d’un autre site ?',
            'Je souhaiterai ouvrir une nouvelle place de FP, puis-je contacter directement l’institution ?',
            "Est-il possible d'effectuer une PFP à l'étranger ?",
            'Y-a-t-il un lieu où nous pouvons retrouver tous les documents présentés dans cette FAQ ?',]
        ,
        answers: [
            "Env. 3 mois avant le début de la PFP  : Envoi de la liste des places de FP par le resp. FP -Répartition des places de FP par les étudiant·e·s <br>Env. 2 ½ mois avant le début de la PFP - Transmission de la répartition des places de FP par les délégué·e·s de classe au resp. FPEnv. 2 mois avant le début de la PFP- 	Confirmation de la répartition des places de FP aux étudiant·e·s par le resp. FPPrise de contact avec les institution par l’étudiant·e Prise de contact avec le·la formateur·trice HES par l’étudiant·e, rédaction et échanges en lien avec le CPT<br>Au plus tard 2 sem. avant le début de la PFP- Envoi du CPT à l’institution par le·la formateur·trice HES<br>2ème – 3ème semaines de FP-Discussion et Signature du CPT1 avec formateur·trice HES et praticien formateur (PF)<br>Durant la PFP-Votre formateur·trice HES ainsi que le resp. FP se tiennent à votre entière disposition en cas de nécessité.<br>Mi PFP-Evaluation et échange avec les signataires du CPT2<br> Fin de PFP-Evaluation, signature (PF + étudiant·e) et transmission par voie électronique des documents d’évaluation au resp. FP par le·la PF<br>2ème – 3ème semaine post PFP-Débrief de la PFP entre formateur·trice HES et étudiant·e<br><br>1- en 3ème BSC l’étudiant·e se charge lui-même de la discussion de son CPT avec son PF. En cas de demande particulière, votre formateur·trice HES organisera une séance Teams ou se déplacera sur site pour en discuter.<br>2-En cas d’échec/difficultés notables à mi PFP ou si le·la PF et/ou l’étudiant·e l’estime nécessaire, une rencontre est organisée entre les signataires du CPT.<br><br>",
            'QUI-SONT LES FORMATEUR·TRICE·S HES ET QUELLES SONT LEURS TÂCHES ? Mis à part le responsable de formation pratique, divers autres formateur·trice·s HES le soutiennent. Le rôle de ces formateur·trice·s HES est d’accompagner et de soutenir les étudiant-e-s lors de la réalisation et/ou de la signature de leur CPT ainsi que lors du suivi de leur FP d’un point de vue pédagogique et du débriefing post FP. Christophe Baur (Resp. FP) christophe.baur@hevs.ch Patrick Crettenand patrick.crettenand@hevs.ch Jonathan Tam jonathan.tam@hevs.ch Anne Henrion-Dourcy anne.henrion@hevs.ch Marie-Christine Demilt-Blanjean marie-christine.demilt-blanjean@hevs.ch Seraina Obrist seraina.obrist@hevs.ch Marie Curdy marie.curdy@hevs.ch Yohan Houlmann yohan.houlmann@hevs.ch',
            "Le contrat pédagogique tripartite (CPT) indique les objectifs à atteindre par l’étudiant·e durant la PFP. Plus précisément, ce dernier doit servir à développer les rôles et les compétences présentés dans le référentiel de compétence. Il précise également les ressources mises à sa disposition. Ce contrat, cosigné par l’étudiant·e, la·le formateur·trice HES et le·la PF permet à chaque partie de formaliser ses attentes et de s’entendre sur les objectifs d’apprentissage visés. ",
            'Votre formateur·trice HES est là pour vous épauler et vous coacher dans la réalisation de votre CPT. Il est par ailleurs essentiel qu’avant de débuter, vous vous renseigniez sur le lieu de FP dans lequel vous allez effectuer votre PFP ainsi que des spécificités qui sont proposées. Pour ce faire, vous trouverez les descriptifs de nos partenaires de terrain sur Cyberlearn sous l’onglet « Beschreibung Institution / Description de l’institution ». Le document “Réalisation d’un contrat pédagogique tripartite” vous permettra de vous guider au travers des différentes étapes à réaliser.',
            'A minima le·la PF vous évaluera à la moitié de la PFP et en fin de PFP. L’évaluation se base sur le référentiel de compétences relatif à la PFP en cours. Le document d’évaluation doit être rempli à mi-parcours et en fin de PFP par votre PF. Tous les documents d’évaluation ainsi que les critères et indicateurs y relatifs sont disponible sur cyberlearn : documents d’évaluation. Pour rappel, en cas de situation d’échec/difficultés notables à mi PFP ou si le·la PF et/ou l’étudiant·e l’estime nécessaire, une rencontre est organisée entre les signataires du CPT.',
            'Il vous est demandé de remplir une partie du document d’évaluation (mi et fin de PFP). De plus, vous devez impérativement contrôler que toutes les données vous concernant figure sur ce document avant de le signer. Par votre signature vous attestez avoir pris connaissance de la note qui vous a été attribuée. Cette note varie de A à F, FX n’existant pas en FP. Comme dans tous modules, vous pouvez contester cette note moyennant les procédures en vigueur.',
            'En cas d’échec lors de votre période de formation pratique une note F vous est attribuée. La note FX n’existant pas dans l’échelle de notation de la formation pratique. Votre PFP ne sera alors pas validée et vous devrez la répéter lors de la prochaine PFP agendée dans le calendrier académique. De ce fait, vous devrez prolonger votre formation d’au minimum un semestre et vous acquitter des taxes d’études. Un document vous précisant ces modalités vous sera remis par votre resp. FP pour signature. A titre d’exemple : si vous avez échoué votre PFP1 vous devrez la répéter l’année académique suivante durant le temps dédié à la PFP2. Il est important de noter qu’il n’est pas possible de suivre la PFP suivante tant que la PFP précédente n’a pas été validée. Ceci signifie que vous ne pourrez pas réaliser votre PFP2 tant que vous n’aurez pas validé votre PFP1.',
            'Si vous vous retrouvez en double échec sur une même période de formation pratique, vous serez alors exmatriculé de la filière.',
            'Jusqu’à 3 jours d’absences justifiées, en principe, il n’y a pas de conséquences directes sur votre formation pratique. Si vos absences sont supérieures à 3 jours, il vous faudra alors compenser l’entier des jours d’absences. Cette compensation (dates et modalités) sera à discuter avec votre PF et le resp. FP. A noter qu’il est impératif d’informer votre PF ainsi que votre formateur·trice HES de toutes absences durant votre PFP. Si vous savez en amont de votre FP que vous devrez absolument vous libérer pour juste motif (rendez-vous médicaux par exemple) il est important d’en discuter avec votre PF lors de la signature du CPT. Finalement, nous vous encourageons à lire le document “Cadre de réalisation FP - PEC 22 / Rahmenbedingungen_Praxisausbildung- PEC 22“ qui reprend explicitement tout ce que vous devriez savoir en lien avec les absences lors de votre PFP',
            'En principe vous n’avez le droit à aucun jour de congé durant votre période de formation pratique sauf demande préalable exceptionnelle validée par votre praticien formateur et le responsable formation pratique. A ce moment-là, les jours de congés devront être rattrapés.', 'En règle générale vous travaillerez du lundi au vendredi, en vous calquant sur le nombre d heures que préconise votre institution formatrice (bien souvent 42h30 semaines). Il se peut cependant que vous soyez amené à travailler durant les weekends. A ce moment-là, vous compenserez les jours travaillés la semaine suivante. Les plages horaires que vous réaliserez dépendront des milieux pratiques dans lesquels vous suivrez votre formation pratique (institution hospitalière, cabinet privé, club de sport professionnel, …).',
            'Effectivement, il en va de même pour vos différentes PFP. Nous vous demandons d’aller évaluer chacune de vos périodes de formation pratique sur IS Academia, comme vous avez l’habitude de le faire. ',
            'Il est imaginable de pouvoir profiter d’une place de FP proposée par un autre site. Il est cependant impératif de passer par le resp. FP de votre site qui se chargera alors d’adresser votre demande à ses collègues. Vous ne devez en aucun cas passer en direct avec un·e autre resp. FP. Il ne vous est non plus pas permis de prendre contact directement avec un potentiel lieu de FP. Vous devez impérativement passer par votre resp. FP.',
            'Non, si une place de FP vous intéresse et qu’elle n’est pas dans la liste proposée, il faut que vous communiquiez directement avec votre resp. FP. Ce dernier évaluera l’intérêt et la possibilité de prendre contact avec cette potentielle nouvelle institution. ',
            "Oui, nous privilégions ces PFP en 3ème année bachelor (PFP3 & PFP4). Pour toute information concernant une place de stage à l’étranger nous vous laissons vous référer aux documents suivants : « place de stage à l’étranger » et remplir le document « Intérêt à suivre une PFP à l'étranger».",
            'Vous retrouverez les documents essentiels à votre FP sur Cyberlearn',]
    },

]);

const changeItem = (index) => {
    activeIndex.value = index;
};
</script>

<template>
    <div>
        <div class="font-bold text-900 text-5xl mb-3 text-center">FAQ's</div>
        <div class="text-700 text-center mb-5 line-height-3"> </div>

        <div class="flex flex-column md:flex-row gap-5">
            <div class="card mb-0 md:w-20rem">
                <div class="text-900 block font-bold mb-3">Catégories</div>
                <ul class="list-none m-0 p-0">
                    <li v-for="(item, i) in items" :key="i" @click="changeItem(i)" class="mb-2">
                        <a v-ripple
                            class="p-ripple flex align-items-center cursor-pointer select-none p-3 transition-colors transition-duration-150 border-round"
                            :class="{
                                'bg-primary': activeIndex === i,
                                'hover:surface-hover': activeIndex !== i
                            }">
                            <i class="mr-2 text-lg" :class="item.icon"></i>
                            <span class="text-sm">{{ item.label }}</span>
                        </a>
                    </li>
                </ul>
            </div>
            <div class="card flex-1">
                <Accordion>
                    <AccordionTab v-for="(question, i) in items[activeIndex].questions" :key="i" :header="question">
                        <p class="line-height-3 m-0 p-0" v-html="items[activeIndex].answers[i]"></p>
                    </AccordionTab>
                </Accordion>
            </div>
        </div>
    </div>
</template>
