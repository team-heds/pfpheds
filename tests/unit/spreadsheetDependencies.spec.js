import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'

describe('dépendances d’export tableur', () => {
  it('génère et relit un classeur SheetJS', () => {
    const worksheet = XLSX.utils.json_to_sheet([{ nom: 'Alice', classe: 'BA24' }])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Étudiants')

    const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const parsed = XLSX.read(output, { type: 'array' })
    const rows = XLSX.utils.sheet_to_json(parsed.Sheets['Étudiants'])

    expect(rows).toEqual([{ nom: 'Alice', classe: 'BA24' }])
  })

  it('sérialise un classeur ExcelJS avec la dépendance UUID corrigée', async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Planning')
    worksheet.columns = [
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Enseignant', key: 'teacher', width: 24 }
    ]
    worksheet.addRow({ module: 'Soins', teacher: 'Alice' })

    const output = await workbook.xlsx.writeBuffer()
    const parsed = new ExcelJS.Workbook()
    await parsed.xlsx.load(output)

    expect(parsed.getWorksheet('Planning').getRow(2).values).toEqual([
      undefined,
      'Soins',
      'Alice'
    ])
  })
})
