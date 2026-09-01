import { describe, expect, it } from 'vitest'
import {
  ASSIGNMENT_REVIEW_STATUS,
  buildPlaceAssignmentReview,
  filterPlaceAssignmentReview,
  getPlaceAssignmentCapacity,
  getPublishableAssignmentIds
} from '@/service/placeAssignmentReviewService'

const places = [
  { PlaceId: 'p1', NomPlace: 'Cabinet du Lac', InstitutionName: 'Hôpital Alpha', PFP2: { 2027: 2 } },
  { PlaceId: 'p2', NomPlace: 'Centre Ville', InstitutionName: 'Clinique Beta', PFP2: { '2026-2027': 1 } },
  { PlaceId: 'p3', NomPlace: 'Sans offre', InstitutionName: 'Clinique Gamma', PFP2: {} }
]

const students = [
  { user_id: 'u1', display_name: 'Alice Martin', classe: 'BA25' },
  { user_id: 'u2', family_name: 'Dupont', forname: 'Léo', class: 'BA25' }
]

describe('placeAssignmentReviewService', () => {
  it('reads capacities from calendar and academic-year keys', () => {
    expect(getPlaceAssignmentCapacity(places[0], 'PFP2', '2027')).toBe(2)
    expect(getPlaceAssignmentCapacity(places[1], 'PFP2', '2027')).toBe(1)
    expect(getPlaceAssignmentCapacity(places[2], 'PFP2', '2027')).toBe(0)
  })

  it('builds searchable, ready rows from the Supabase assignment contract', () => {
    const [row] = buildPlaceAssignmentReview({
      places,
      students,
      assignments: [{ id: 'a1', user_id: 'u1', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p1', status: 'draft' }]
    })

    expect(row).toMatchObject({
      student_name: 'Alice Martin',
      student_class: 'BA25',
      place_name: 'Cabinet du Lac',
      institution_name: 'Hôpital Alpha',
      place_capacity: 2,
      review_status: ASSIGNMENT_REVIEW_STATUS.READY
    })
    expect(row.searchable_text).toContain('CABINET DU LAC')
  })

  it('supports academic-year keys and reports a missing offer as a warning', () => {
    const rows = buildPlaceAssignmentReview({
      places,
      students,
      assignments: [
        { id: 'a1', user_id: 'u1', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p2', status: 'draft' },
        { id: 'a2', user_id: 'u2', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p3', status: 'draft' }
      ]
    })

    expect(rows[0].review_status).toBe(ASSIGNMENT_REVIEW_STATUS.READY)
    expect(rows[1].review_status).toBe(ASSIGNMENT_REVIEW_STATUS.WARNING)
    expect(rows[1].review_issues.map(issue => issue.code)).toContain('missing_capacity')
  })

  it('blocks orphan and conflicting assignments', () => {
    const rows = buildPlaceAssignmentReview({
      places,
      students,
      assignments: [
        { id: 'a1', user_id: 'u1', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p1', status: 'draft' },
        { id: 'a2', user_id: 'u1', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p2', status: 'draft' },
        { id: 'a3', user_id: 'missing', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'unknown', status: 'draft' }
      ]
    })

    expect(rows.slice(0, 2).every(row => row.review_status === ASSIGNMENT_REVIEW_STATUS.BLOCKED)).toBe(true)
    expect(rows[2].review_issues.map(issue => issue.code)).toEqual(expect.arrayContaining(['missing_student', 'unknown_place']))
  })

  it('filters by place, class, PFP, year and statuses', () => {
    const rows = buildPlaceAssignmentReview({
      places,
      students,
      assignments: [
        { id: 'a1', user_id: 'u1', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p1', status: 'draft' },
        { id: 'a2', user_id: 'u2', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p3', status: 'published' }
      ]
    })

    expect(filterPlaceAssignmentReview(rows, { query: 'cabinet', studentClass: 'BA25', pfp: 'PFP2', year: '2027' }).map(row => row.id)).toEqual(['a1'])
    expect(filterPlaceAssignmentReview(rows, { pfp: 'ALL', year: '2027' })).toHaveLength(2)
    expect(filterPlaceAssignmentReview(rows, { reviewStatus: 'warning', publicationStatus: 'published' }).map(row => row.id)).toEqual(['a2'])
  })

  it('returns only unique, non-blocked and unpublished assignment ids', () => {
    expect(getPublishableAssignmentIds([
      { id: 'a1', review_status: 'ready', status: 'draft' },
      { id: 'a1', review_status: 'ready', status: 'draft' },
      { id: 'a2', review_status: 'warning', status: 'draft' },
      { id: 'a3', review_status: 'blocked', status: 'draft' },
      { id: 'a4', review_status: 'ready', status: 'published' }
    ])).toEqual(['a1', 'a2'])
  })
})
