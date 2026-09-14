const PFP_FIELDS = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

const yearValue = (place, field, year) => {
  const value = place?.[field]
  if (value == null) return ''
  if (typeof value !== 'object') return value

  const selected = value[year]
  if (selected != null && selected !== '') return selected

  // La vue conserve ce report historique pour PFP3 en 2027-2028.
  if (field === 'PFP3' && year === '2028') return value['2027'] ?? ''
  return ''
}

const excelValue = (value) => {
  if (value == null || value === '') return ''
  const normalized = typeof value === 'string' ? value.trim() : value
  if (normalized === '') return ''
  const number = Number(normalized)
  return Number.isFinite(number) ? number : normalized
}

export const getAcademicYearLabel = (year, options = []) => {
  return options.find((option) => option.value === year)?.label || String(year || '')
}

export const buildPlacesExportRows = ({
  places = [],
  year,
  institutionNameById = {},
  institutionCantonById = {}
}) => {
  return places.flatMap((place) => {
    const capacities = Object.fromEntries(
      PFP_FIELDS.map((field) => [field, excelValue(yearValue(place, field, year))])
    )
    if (!PFP_FIELDS.some((field) => capacities[field] !== '')) return []

    const totalCapacity = PFP_FIELDS.reduce((sum, field) => {
      const value = capacities[field]
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)

    return [
      {
        Institution: institutionNameById[place?.InstitutionId] || place?.InstitutionName || '',
        Place: place?.NomPlace || '',
        Canton: institutionCantonById[place?.InstitutionId] || place?.Canton || '',
        ...capacities,
        Total: totalCapacity,
        Remarques: place?.Remarques?.[year] || place?.Remarques?.note || ''
      }
    ]
  })
}

export const createPlacesWorkbook = (ExcelJS, { rows, yearLabel, generatedAt = new Date() }) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Plateforme HEdS'
  workbook.created = generatedAt
  workbook.modified = generatedAt

  const worksheet = workbook.addWorksheet(`Offres ${yearLabel}`.slice(0, 31), {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 7, topLeftCell: 'D8', showGridLines: false }],
    properties: { defaultRowHeight: 20 }
  })

  const columns = [
    ['Institution', 30],
    ['Place', 31],
    ['Canton', 12],
    ['PFP1A', 10],
    ['PFP1B', 10],
    ['PFP2', 10],
    ['PFP3', 10],
    ['PFP4', 10],
    ['Total', 11],
    ['Remarques', 42]
  ]
  worksheet.columns = columns.map(([key, width]) => ({ key, width }))

  const title = worksheet.getCell('A2')
  title.value = `Offres de formation pratique — ${yearLabel}`
  title.font = { name: 'Aptos', size: 16, bold: true, color: { argb: 'FF17324D' } }
  title.alignment = { vertical: 'middle', horizontal: 'left' }
  worksheet.getRow(2).height = 28

  const subtitle = worksheet.getCell('A3')
  subtitle.value = `Export du ${generatedAt.toLocaleDateString('fr-CH')} · ${rows.length} offre${rows.length > 1 ? 's' : ''}`
  subtitle.font = { name: 'Aptos', size: 10, italic: true, color: { argb: 'FF526579' } }
  subtitle.alignment = { vertical: 'middle' }
  worksheet.getRow(3).height = 22
  for (let columnIndex = 1; columnIndex <= columns.length; columnIndex += 1) {
    worksheet.getRow(3).getCell(columnIndex).border = {
      bottom: { style: 'thin', color: { argb: 'FF8EA8B7' } }
    }
  }

  const capacity = rows.reduce((sum, row) => sum + (Number(row.Total) || 0), 0)
  const institutions = new Set(rows.map((row) => row.Institution).filter(Boolean)).size
  const filledPfp = rows.reduce(
    (sum, row) => sum + PFP_FIELDS.filter((field) => row[field] !== '').length,
    0
  )
  const cards = [
    ['A5', 'B5', 'Offres exportées', rows.length],
    ['D5', 'E5', 'Institutions', institutions],
    ['G5', 'H5', 'Capacité totale', capacity],
    ['I5', 'J5', 'PFP renseignées', filledPfp]
  ]

  for (const [labelAddress, valueAddress, label, value] of cards) {
    const labelCell = worksheet.getCell(labelAddress)
    const valueCell = worksheet.getCell(valueAddress)
    labelCell.value = label
    valueCell.value = value
    labelCell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FF526579' } }
    valueCell.font = { name: 'Aptos', size: 14, bold: true, color: { argb: 'FF0D766E' } }
    for (const cell of [labelCell, valueCell]) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F7F6' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFC9DED9' } },
        bottom: { style: 'thin', color: { argb: 'FFC9DED9' } },
        left: { style: 'thin', color: { argb: 'FFC9DED9' } },
        right: { style: 'thin', color: { argb: 'FFC9DED9' } }
      }
    }
  }
  worksheet.getRow(5).height = 30

  const dataRows = rows.length
    ? rows.map((row) => columns.map(([key]) => row[key]))
    : [columns.map(() => '')]
  worksheet.addTable({
    name: `Offres_${String(yearLabel).replace(/[^A-Za-z0-9]/g, '_')}`,
    ref: 'A7',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: columns.map(([name]) => ({ name })),
    rows: dataRows
  })

  const headerRow = worksheet.getRow(7)
  headerRow.height = 30
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF24577A' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })

  for (let rowIndex = 8; rowIndex <= 7 + dataRows.length; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex)
    row.alignment = { vertical: 'top', wrapText: true }
    row.height = 34

    for (let columnIndex = 4; columnIndex <= 9; columnIndex += 1) {
      row.getCell(columnIndex).alignment = { vertical: 'middle', horizontal: 'right' }
    }
    for (let columnIndex = 4; columnIndex <= 9; columnIndex += 1) {
      const cell = row.getCell(columnIndex)
      if (typeof cell.value === 'number' && cell.value > 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EE' } }
        cell.font = { bold: true, color: { argb: 'FF086C5C' } }
      }
    }
  }

  worksheet.autoFilter = { from: 'A7', to: 'J7' }
  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
  }
  worksheet.headerFooter.oddFooter = `&LPlateforme HEdS&C${yearLabel}&RPage &P / &N`

  return workbook
}
