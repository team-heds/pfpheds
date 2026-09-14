import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  buildPlacesExportRows,
  createPlacesWorkbook,
  getAcademicYearLabel
} from '@/utils/placesExcelExport'

describe('export Excel des places de formation pratique', () => {
  const places = [
    {
      PlaceId: 42,
      InstitutionId: 7,
      NomPlace: 'Rééducation ambulatoire',
      PFP1A: { 2027: '2' },
      PFP1B: { 2027: 1 },
      PFP2: { 2027: '' },
      PFP3: { 2027: '3' },
      PFP4: { 2027: 'sur demande' },
      MSQ: true,
      SYSINT: false,
      NEUROGER: '1',
      AIGU: false,
      REHAB: true,
      AMBU: true,
      FR: true,
      DE: true,
      praticiensFormateurs: ['11', '12'],
      Remarques: { 2027: 'Contacter avant attribution' },
      fileurl: 'https://example.test/fiche.pdf'
    },
    {
      PlaceId: 43,
      InstitutionId: 8,
      NomPlace: 'Place sans offre cette année',
      PFP1A: { 2027: '' },
      PFP2: { 2026: 2 }
    }
  ]

  it('prépare les données de l’année sélectionnée sans perdre les valeurs métier', () => {
    const rows = buildPlacesExportRows({
      places,
      year: '2027',
      institutionNameById: { 7: 'Clinique du Rhône' },
      institutionCantonById: { 7: 'VS' }
    })

    expect(rows).toEqual([
      expect.objectContaining({
        Institution: 'Clinique du Rhône',
        Place: 'Rééducation ambulatoire',
        Canton: 'VS',
        PFP1A: 2,
        PFP1B: 1,
        PFP2: '',
        PFP3: 3,
        PFP4: 'sur demande',
        Total: 6,
        Remarques: 'Contacter avant attribution'
      })
    ])
  })

  it('crée un classeur stylé, filtrable et relisible', async () => {
    const rows = buildPlacesExportRows({ places, year: '2027' })
    const workbook = createPlacesWorkbook(ExcelJS, {
      rows,
      yearLabel: '2026-2027',
      generatedAt: new Date('2026-09-10T08:00:00Z')
    })
    const output = await workbook.xlsx.writeBuffer()
    const parsed = new ExcelJS.Workbook()
    await parsed.xlsx.load(output)
    const worksheet = parsed.getWorksheet('Offres 2026-2027')

    expect(worksheet.getCell('A2').value).toBe('Offres de formation pratique — 2026-2027')
    expect(worksheet.getCell('A7').value).toBe('Institution')
    expect(worksheet.getCell('D8').value).toBe(2)
    expect(worksheet.getCell('I8').value).toBe(6)
    expect(worksheet.getCell('J8').value).toBe('Contacter avant attribution')
    expect(worksheet.views[0]).toEqual(
      expect.objectContaining({ state: 'frozen', xSplit: 3, ySplit: 7 })
    )
    expect(worksheet.getCell('A7').fill.fgColor.argb).toBe('FF24577A')
  })

  it('affiche le libellé académique plutôt que la clé technique', () => {
    expect(getAcademicYearLabel('2027', [{ label: '2026-2027', value: '2027' }])).toBe('2026-2027')
  })
})
