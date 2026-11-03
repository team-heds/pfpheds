import { describe, expect, it } from 'vitest'

import {
  SI_POSTULATION_ACCESS,
  SI_PLANNING_ACCESS,
  SI_RM_ACCESS,
  SI_RM_DASHBOARD_ACCESS,
  SI_SECRETARIAT_ACCESS,
  SI_TEACHER_ACCESS,
  SI_WEEKLY_PLANNING_ACCESS
} from '../../src/config/siAccess'
import { evaluateRouteAccess } from '../../src/router/accessControl'
import adminRoutes from '../../src/router/routes/admin'

function accessFor(permissions, need, overrides = {}) {
  const active = new Set(permissions)
  return evaluateRouteAccess({ requiresAuth: true, need, ...overrides }, {
    isAuthenticated: true,
    isSuper: active.has('super.all'),
    can: requirement => {
      const requested = Array.isArray(requirement) ? requirement : [requirement]
      return requested.some(permission => active.has(permission))
    }
  })
}

describe('SI route access matrix', () => {
  it.each([
    { role: 'AdminSoins', secretariat: true, rm: true, teacher: true, postulation: true },
    { role: 'RMSoins', secretariat: false, rm: true, teacher: true, postulation: true },
    { role: 'EnseignantSoins', secretariat: false, rm: false, teacher: true, postulation: true },
    { role: 'EtudiantSoins', secretariat: false, rm: false, teacher: false, postulation: false },
    { role: 'super.all', secretariat: true, rm: true, teacher: true, postulation: true }
  ])('applique toute la matrice au rôle $role', ({ role, secretariat, rm, teacher, postulation }) => {
    expect(accessFor([role], SI_SECRETARIAT_ACCESS).allowed).toBe(secretariat)
    expect(accessFor([role], SI_RM_ACCESS).allowed).toBe(rm)
    expect(accessFor([role], SI_TEACHER_ACCESS).allowed).toBe(teacher)
    expect(accessFor([role], SI_POSTULATION_ACCESS).allowed).toBe(postulation)
  })

  it('keeps the secretariat area for SI administrators', () => {
    expect(accessFor(['AdminSoins'], SI_SECRETARIAT_ACCESS).allowed).toBe(true)
    expect(accessFor(['page2.access'], SI_SECRETARIAT_ACCESS).allowed).toBe(true)
    expect(accessFor(['RMSoins'], SI_SECRETARIAT_ACCESS)).toMatchObject({
      allowed: false,
      reason: 'permission'
    })
    expect(accessFor(['EnseignantSoins'], SI_SECRETARIAT_ACCESS).allowed).toBe(false)
  })

  it('gives an RM their management area without granting it to a teacher', () => {
    expect(accessFor(['RMSoins'], SI_RM_ACCESS).allowed).toBe(true)
    expect(accessFor(['EnseignantSoins'], SI_RM_ACCESS).allowed).toBe(false)
    expect(accessFor(['auth.redirect.dashboard_rm'], SI_RM_DASHBOARD_ACCESS).allowed).toBe(true)
    expect(accessFor(['auth.redirect.dashboard_rm'], SI_RM_ACCESS).allowed).toBe(false)
  })

  it('lets teachers vote while RM and SI administrators retain oversight', () => {
    expect(accessFor(['EnseignantSoins'], SI_POSTULATION_ACCESS).allowed).toBe(true)
    expect(accessFor(['RMSoins'], SI_POSTULATION_ACCESS).allowed).toBe(true)
    expect(accessFor(['AdminSoins'], SI_POSTULATION_ACCESS).allowed).toBe(true)
  })

  it('lets a teacher open the weekly detail without granting planning management', () => {
    expect(accessFor(['EnseignantSoins'], SI_WEEKLY_PLANNING_ACCESS).allowed).toBe(true)
    expect(accessFor(['EnseignantSoins'], SI_PLANNING_ACCESS).allowed).toBe(false)
  })

  it('uses the same array semantics for routes and menu visibility', () => {
    expect(accessFor(['EnseignantSoins'], ['admin', 'EnseignantSoins']).allowed).toBe(true)
    expect(accessFor(['EtudiantSoins'], ['admin', 'EnseignantSoins']).allowed).toBe(false)
  })

  it('rejects protected routes for anonymous visitors', () => {
    expect(evaluateRouteAccess({ requiresAuth: true, need: SI_TEACHER_ACCESS }, {
      isAuthenticated: false,
      can: () => false
    })).toMatchObject({ allowed: false, reason: 'authentication' })
  })

  it('maps the canonical SI routes to the centralized access rules', () => {
    const byName = Object.fromEntries(adminRoutes.map(route => [route.name, route]))

    expect(byName.DashboardSecretariatSI.meta.need).toBe(SI_SECRETARIAT_ACCESS)
    expect(byName.DashboardRM.meta.need).toBe(SI_RM_DASHBOARD_ACCESS)
    expect(byName.DashboardEnseignantSI.meta.need).toBe(SI_TEACHER_ACCESS)
    expect(byName.PlanningRemediationView.meta.need).toBe(SI_SECRETARIAT_ACCESS)
    expect(byName.SIPostulationCoursesView.meta.need).toBe(SI_POSTULATION_ACCESS)
    expect(byName.WeeklyPlanningAdminView.meta.need).toBe(SI_WEEKLY_PLANNING_ACCESS)
    expect(byName.DashboardEnseignant.redirect).toBe('/admin/soins-infirmiers/dashboard-enseignant')
    expect(byName.DashboardEnseignant.meta.need).not.toContain('EnseignantPhysio')
  })
})
