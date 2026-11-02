import VotationPlaceCards from './VotationPlaceCards.vue'

const places = [
  { PlaceId: 'meyriez-1', InstitutionId: 'meyriez', InstitutionName: 'Hôpital de Meyriez', NomPlace: 'Orthopédie et réadaptation', InstitutionCategory: 'Hôpital', MSQ: true, REHAB: true, FR: true, url: 'https://example.invalid/meyriez' },
  { PlaceId: 'fribourg-1', InstitutionId: 'fribourg', InstitutionName: 'HFR Fribourg', NomPlace: 'Médecine interne', InstitutionCategory: 'Hôpital', SYSINT: true, AIGU: true, DE: true, url: 'https://example.invalid/fribourg' },
]

export default {
  title: 'Formation pratique/Votation/Cartes de places',
  component: VotationPlaceCards,
  args: { places, selectedPlaces: [places[0], null, null, null, null], votesAggregation: { 'meyriez-1': { total: 4 }, 'fribourg-1': { total: 2 } }, missingCriteria: ['REHAB', 'DE'], adminPreview: false }
}

export const Mobile = {}

export const ApercuAdministrateur = {
  args: {
    adminPreview: true,
    selectedPlaces: [null, null, null, null, null],
    votesAggregation: {
      'meyriez-1': { total: 7, top1: 3, top2: 2, top3: 1, top4: 1, top5: 0 },
      'fribourg-1': { total: 4, top1: 1, top2: 0, top3: 2, top4: 1, top5: 0 }
    }
  }
}
