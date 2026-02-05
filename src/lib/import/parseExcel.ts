import ExcelJS from 'exceljs'

export interface ParsedColumn {
    id: string
    name: string
    type: 'text' | 'date' | 'currency' | 'number'
    preview: any[]
}

export interface ParsedSheet {
    name: string
    columns: ParsedColumn[]
    data: any[]
}

export async function parseExcelFile(file: File): Promise<ParsedSheet | null> {
    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) return null

    const data: any[] = []
    const headers: string[] = []
    let maxColNumber = 0

    // Helper to safely extract value
    const getCellValue = (cell: ExcelJS.Cell): any => {
        let value = cell.value

        // Handle rich text, formulas, hyperlinks
        if (typeof value === 'object' && value !== null) {
            if ('result' in value) value = (value as any).result
            else if ('richText' in value) value = (value as any).richText.map((t: any) => t.text).join('')
            else if ('text' in value && 'hyperlink' in value) value = (value as any).text
            // Add other object handlers if needed, but usually result/richText covers it
        }

        // ExcelJS sometimes returns object for dates or errors
        // Clean up
        if (value && typeof value === 'object' && !(value instanceof Date)) {
            // Fallback for unknown objects
            value = String(value)
            if (value === '[object Object]') value = ''
        }

        return value
    }

    // Smart Header Detection: Find the actual header row
    // Skip title rows and empty rows to find the real table
    const allRows: any[] = []
    worksheet.eachRow({ includeEmpty: true }, (row: ExcelJS.Row, rowNumber: number) => {
        const cells: any[] = []
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cells[colNumber] = getCellValue(cell)
            if (colNumber > maxColNumber) maxColNumber = colNumber
        })
        allRows.push({ rowNumber, cells })
    })

    // Detect header row by finding first row with 3+ non-empty cells followed by data
    let headerRowIndex = 0
    let dataStartIndex = 1

    for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i]
        const nonEmptyCells = row.cells.filter((c: any) => c !== null && c !== undefined && c !== '').length

        // Skip completely empty rows
        if (nonEmptyCells === 0) continue

        // Skip likely title rows with multiple detection methods
        if (nonEmptyCells <= 2) {
            continue // Very sparse row, likely a title or section header
        }

        // Check if this looks like a title row (even with multiple cells)
        const firstNonEmptyCell = row.cells.find((c: any) => c !== null && c !== undefined && c !== '')
        if (firstNonEmptyCell && typeof firstNonEmptyCell === 'string') {
            // Skip if first cell is very long (likely a title/description)
            if (firstNonEmptyCell.length > 50) {
                continue
            }

            // Skip if the row has only one unique value repeated (merged cell pattern)
            const uniqueValues = new Set(row.cells.filter((c: any) => c !== null && c !== undefined && c !== ''))
            if (uniqueValues.size === 1) {
                continue // All non-empty cells have the same value = merged title cell
            }
        }

        // Potential header row: has 3+ cells with different values
        if (nonEmptyCells >= 3) {
            // Check if next row also has data (confirms this is a table)
            const nextRow = allRows[i + 1]
            if (nextRow) {
                const nextNonEmpty = nextRow.cells.filter((c: any) => c !== null && c !== undefined && c !== '').length
                if (nextNonEmpty >= 2) {
                    // Additional validation: header cells should be relatively short
                    const cellLengths = row.cells
                        .filter((c: any) => c && typeof c === 'string')
                        .map((c: string) => c.length)
                    const avgLength = cellLengths.reduce((a, b) => a + b, 0) / cellLengths.length

                    // If average cell length is very long, might still be a title
                    if (avgLength > 100) {
                        continue
                    }

                    // Found it! This is the header row
                    headerRowIndex = i
                    dataStartIndex = i + 1
                    break
                }
            }
        }
    }

    // Extract headers from detected header row
    if (headerRowIndex < allRows.length) {
        const headerRow = allRows[headerRowIndex]
        headerRow.cells.forEach((cellValue: any, colNumber: number) => {
            if (colNumber > 0) { // Skip index 0
                headers[colNumber] = cellValue ? String(cellValue) : `Coluna ${colNumber}`
            }
        })
    }

    // Extract data rows starting from dataStartIndex
    for (let i = dataStartIndex; i < allRows.length; i++) {
        const row = allRows[i]
        const rowData: any = {}

        // Check if row is completely empty
        const hasData = row.cells.some((c: any) => c !== null && c !== undefined && c !== '')
        if (!hasData) continue // Skip empty rows

        row.cells.forEach((cellValue: any, colNumber: number) => {
            if (colNumber > 0) {
                rowData[`__col_${colNumber}`] = cellValue
            }
        })
        data.push(rowData)
    }

    // Fill missing headers
    for (let i = 1; i <= maxColNumber; i++) {
        if (!headers[i]) headers[i] = `Coluna ${i}`
    }

    // Deduplicate Headers
    const headerCounts: Record<string, number> = {}
    for (let i = 1; i <= maxColNumber; i++) {
        const original = headers[i]
        if (headerCounts[original]) {
            headerCounts[original]++
            headers[i] = `${original}_${headerCounts[original]}`
        } else {
            headerCounts[original] = 1
        }
    }

    // Normalize Data with final headers
    const normalizedData = data.map(rawRow => {
        const newRow: any = {}
        for (let i = 1; i <= maxColNumber; i++) {
            const header = headers[i]
            const val = rawRow[`__col_${i}`]
            newRow[header] = val
        }
        return newRow
    })

    // Identify non-empty columns
    const nonEmptyColumns: number[] = []
    for (let i = 1; i <= maxColNumber; i++) {
        const header = headers[i]
        const hasData = normalizedData.some(row => {
            const val = row[header]
            return val !== null && val !== undefined && val !== ''
        })

        // Keep column if it has a real header OR has any data
        const hasRealHeader = !header.startsWith('Coluna ')
        if (hasRealHeader || hasData) {
            nonEmptyColumns.push(i)
        }
    }

    // Filter normalized data to only include non-empty columns
    const filteredData = normalizedData.map(row => {
        const newRow: any = {}
        nonEmptyColumns.forEach(colIndex => {
            const header = headers[colIndex]
            newRow[header] = row[header]
        })
        return newRow
    })

    // Infer Column Types only for non-empty columns
    const columns: ParsedColumn[] = []
    nonEmptyColumns.forEach(colIndex => {
        const header = headers[colIndex]

        let type: ParsedColumn['type'] = 'text'
        const sampleValues = filteredData.slice(0, 10).map(d => d[header])

        const isDate = sampleValues.some(v => v instanceof Date)
        if (isDate) type = 'date'
        else {
            const isNumber = sampleValues.some(v => typeof v === 'number')
            if (isNumber) type = 'number'
        }

        columns.push({
            id: header,
            name: header,
            type,
            preview: sampleValues
        })
    })

    return {
        name: file.name.replace(/\.xlsx?$/i, ''), // Use filename, remove extension
        columns,
        data: filteredData
    }
}
