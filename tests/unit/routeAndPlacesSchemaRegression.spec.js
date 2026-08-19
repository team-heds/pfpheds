import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (path) => readFileSync(join(process.cwd(), path), 'utf8')

describe('Documents PFP route contract', () => {
  const pagesRoutes = readSource('src/router/routes/pages.js')
  const votationsRoutes = readSource('src/router/routes/votations.js')

  it('déclare une seule route nommée DocumentsPFP', () => {
    const declarations = `${pagesRoutes}\n${votationsRoutes}`.match(/name:\s*['"]DocumentsPFP['"]/g) || []
    expect(declarations).toHaveLength(1)
  })

  it('conserve les URL historiques comme alias', () => {
    expect(pagesRoutes).toContain("path: '/documents_pfp'")
    expect(pagesRoutes).toContain("alias: ['/documents', '/document_pfp']")
  })
})

describe('Admin places schema contract', () => {
  const dashboard = readSource('src/components/admin/AdminDashboardPFP.vue')

  it('interroge uniquement les colonnes réellement présentes en production', () => {
    expect(dashboard).toContain(".select('PlaceId,InstitutionId,NomPlace,fileurl,CreatedAt,UpdatedAt')")
    expect(dashboard).toContain(".select('PlaceId,NomPlace,CreatedAt')")
    expect(dashboard).toContain(".order('CreatedAt', { ascending: false })")
    expect(dashboard).not.toContain('fileURL,fileurl,pdfUrl,created_at,updated_at')
  })
})
