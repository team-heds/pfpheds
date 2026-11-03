import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import View from '../../src/views/admin/votations/VotationGenericView.vue'

const source = (file) => readFileSync(resolve(process.cwd(), file), 'utf8')

describe('expérience frontend de votation', () => {
  it('filtre les places par institution, intitulé, catégorie et critère', () => {
    const vm = {
      expandedPFPData: [
        { InstitutionName: 'Hôpital de Meyriez', NomPlace: 'Orthopédie', InstitutionCategory: 'Hôpital', REHAB: true },
        { InstitutionName: 'HFR Fribourg', NomPlace: 'Médecine interne', InstitutionCategory: 'Hôpital', AIGU: true },
      ],
      placeSearchQuery: 'rehab',
      normalizeLookupValue: View.methods.normalizeLookupValue,
    }

    expect(View.computed.filteredAvailablePlaces.call(vm)).toHaveLength(1)
    expect(View.computed.filteredAvailablePlaces.call(vm)[0].NomPlace).toBe('Orthopédie')
  })

  it('sélectionne et désélectionne un rang sans modifier les règles de doublon', () => {
    const place = { PlaceId: 'meyriez', seatIndex: 0, InstitutionId: 'i1', NomPlace: 'Orthopédie' }
    const vm = {
      isAdminPreview: false,
      selectedPlaces: [null, null, null, null, null],
      isPlaceDisabled: () => false,
      normalizeLookupValue: View.methods.normalizeLookupValue,
      $forceUpdate: () => {},
    }

    View.methods.selectPlaceForRank.call(vm, { place, choiceIndex: 0 })
    expect(vm.selectedPlaces[0]).toBe(place)
    View.methods.selectPlaceForRank.call(vm, { place, choiceIndex: 0 })
    expect(vm.selectedPlaces[0]).toBeNull()
  })

  it('utilise des cartes tactiles en mobile et conserve le tableau desktop', () => {
    const view = source('src/views/admin/votations/VotationGenericView.vue')
    const cards = source('src/components/votation/VotationPlaceCards.vue')

    expect(view).toContain('class="modern-votation-table desktop-place-table"')
    expect(view).toContain('class="mobile-place-cards"')
    expect(view).toContain('role="progressbar"')
    expect(view).toContain('type="search"')
    expect(view).toContain('@media (min-width: 769px) and (max-width: 1100px)')
    expect(cards).toContain('min-height: 52px')
    expect(cards).toContain(':aria-pressed="isSelected(place, rank - 1)"')
    expect(cards).toContain('role="group"')
  })

  it('conserve pour les administrateurs le formulaire à cinq choix en lecture seule', () => {
    const view = source('src/views/admin/votations/VotationGenericView.vue')
    const cards = source('src/components/votation/VotationPlaceCards.vue')

    expect(view).toContain('Formulaire de votation à cinq choix')
    expect(view).toContain('headerClass="choice-column-header"')
    expect(view).toContain('bodyClass="choice-column-cell"')
    expect(view).toContain(':header="\'Choix \' + i"')
    expect(cards).toContain(':disabled="adminPreview || isDisabled(place, rank - 1)"')
    expect(cards).toContain('v-for="rank in 5"')
  })

  it('active le tri par critères manquants pour la PFP2 étudiante sans l’appliquer à l’aperçu admin', () => {
    const hasSections = View.computed.hasPfp4Sections

    expect(hasSections.call({
      isAdminPreview: false,
      targetPFP: 'PFP2',
      pfp4MissingCriteria: ['MSQ', 'DE'],
    })).toBe(true)
    expect(hasSections.call({
      isAdminPreview: true,
      targetPFP: 'PFP2',
      pfp4MissingCriteria: ['MSQ', 'DE'],
    })).toBe(false)

    const view = source('src/views/admin/votations/VotationGenericView.vue')
    expect(view).toContain("this.targetPFP === 'PFP2'")
    expect(view).toContain('applyMissingCriteriaSections(eligibleRows)')
    expect(view).toContain('(sectionOrder[a.pfp4Section] ?? 2)')
  })

  it('ne donne pas de priorité spéciale à l allemand en PFP2', () => {
    const view = source('src/views/admin/votations/VotationGenericView.vue')

    expect(view).toContain("(this.targetPFP === 'PFP3' || this.targetPFP === 'PFP4')")
    expect(view).toContain("this.completedStageCount === 1")
    expect(view).toContain("missing.includes('DE')")
    expect(view).not.toContain("const prioritizeGerman = this.completedStageCount === 1")
  })

  it('exclut en PFP2 les lieux déjà fréquentés et les places sans critère manquant', () => {
    const eligible = View.methods.isPfp2PlaceEligible
    const base = {
      resolvePlaceId: (place) => place.PlaceId,
      visitedPlaceIdSet: new Set(['deja-visite']),
      getPriorityMissingCriteria: () => ['MSQ', 'DE'],
    }

    expect(eligible.call(base, { PlaceId: 'deja-visite', MSQ: true })).toBe(false)
    expect(eligible.call(base, { PlaceId: 'nouveau', FR: true, AMBU: true })).toBe(false)
    expect(eligible.call(base, { PlaceId: 'nouveau', FR: true, MSQ: true })).toBe(true)
    expect(eligible.call({ ...base, getPriorityMissingCriteria: () => [] }, {
      PlaceId: 'nouveau',
      FR: true,
    })).toBe(true)
  })

  it('bloque entièrement le formulaire lorsqu une place est déjà attribuée', () => {
    const blocked = View.computed.votingAccessBlocked

    expect(blocked.call({
      assignmentEligibilityChecked: true,
      existingCampaignAssignment: { assigned_place_id: 'place-1' },
      assignmentCheckError: '',
    })).toBe(true)
    expect(blocked.call({
      assignmentEligibilityChecked: true,
      existingCampaignAssignment: null,
      assignmentCheckError: '',
    })).toBe(false)

    const view = source('src/views/admin/votations/VotationGenericView.vue')
    const banner = source('src/components/social/library/VotationBanner.vue')
    expect(view).toContain('Une place vous est déjà attribuée')
    expect(view).toContain('await this.checkExistingCampaignAssignment()')
    expect(banner).toContain('removeAssignedCampaigns')
  })
})
