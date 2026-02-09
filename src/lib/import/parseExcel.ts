import ExcelJS from 'exceljs'

export interface ParsedColumn {
    id: string
    name: string
    type: 'text' | 'date' | 'currency' | 'number'
    preview: any[]
    originalIndex?: number // Store the original column index for robust data mapping
}

export interface TableBlock {
    title: string
    columns: ParsedColumn[]
    data: any[]
    headerRowIndex?: number
}

export interface ParsedSheet {
    name: string
    tableBlocks: TableBlock[]
    // Backward compatibility
    columns: ParsedColumn[]
    data: any[]
}

export async function parseExcelFile(file: File): Promise<ParsedSheet[]> {
    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) return []

    const tableBlocks = detectTableBlocks(worksheet)

    if (tableBlocks.length === 0) return []

    // For backward compatibility, use the first block as the main one
    const firstBlock = tableBlocks[0]

    return [{
        name: file.name.replace(/\.xlsx?$/i, ''),
        tableBlocks,
        columns: firstBlock.columns,
        data: firstBlock.data
    }]
}

function detectTableBlocks(worksheet: ExcelJS.Worksheet): TableBlock[] {
    // Convert worksheet to array to allow lookahead
    const rows: any[][] = []
    // ExcelJS uses 1-based indexing for rows
    worksheet.eachRow((row, rowIndex) => {
        const cells: any[] = []
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            // ExcelJS uses 1-based indexing for columns
            // We map to 0-based array index, but keep empty cells
            cells[colNumber] = cell.value
        })
        rows[rowIndex] = cells
    })

    // If worksheet is empty
    if (rows.length === 0) return []

    const blocks: TableBlock[] = []
    let currentBlock: TableBlock | null = null
    let pendingTitle = ''

    // Start from row 1 (1-based index to match ExcelJS logic in array, though array index 0 is empty/unused usually)
    // We'll iterate up to the last row index found
    let i = 1

    while (i < rows.length) {
        const currentRow = rows[i] || []
        const nextRow = rows[i + 1] || [] // Lookahead

        // Helper to get non-empty cells
        const currentNonEmpty = currentRow.filter(c => c !== null && c !== undefined && c !== '')
        const nextNonEmpty = nextRow.filter(c => c !== null && c !== undefined && c !== '')

        // Case 1: Empty Row
        if (currentNonEmpty.length === 0) {
            // If we have a current block and hit empty rows, we might be ending a block
            if (currentBlock) {
                // Check if next row is also empty or start of new block
                // For now, let's treat empty row as end of data for current block
                if (currentBlock.data.length > 0) {
                    blocks.push(currentBlock)
                    currentBlock = null
                }
            }
            i++
            continue
        }

        // Case 2: DETECT TITLE (Text row + Lookahead for Header)
        // A row is a title if it has few cells AND a header (larger row) appears soon after.
        // This handles consecutive title rows (e.g. "Title 1" -> "Title 2" -> Empty -> "Header")

        // Conditions:
        // 1. Current row matches title characteristics (<= 2 cells)
        // 2. Lookahead finds a significantly larger row (Header) OR an Empty row (Separator) within X rows

        let isTitle = false
        const lookaheadLimit = 5
        let foundHeader = false
        let foundSeparator = false

        if (currentNonEmpty.length > 0 && currentNonEmpty.length <= 2) {
            // Special check: If next row is empty, it's a strong separator signal
            if (nextNonEmpty.length === 0) {
                isTitle = true
                foundSeparator = true
            } else {
                // Lookahead for Header
                for (let k = 1; k <= lookaheadLimit; k++) {
                    const checkRowIdx = i + k
                    if (checkRowIdx >= rows.length) break

                    const checkRow = rows[checkRowIdx] || []
                    const checkNonEmpty = checkRow.filter(c => c !== null && c !== undefined && c !== '')

                    if (checkNonEmpty.length === 0) {
                        // Found separator before header? Ambiguous, but suggests title group
                        foundSeparator = true
                        isTitle = true
                        break
                    }

                    // Header detection threshold: >= current + 2 cols (or absolute >= 3)
                    if (checkNonEmpty.length >= Math.max(3, currentNonEmpty.length + 2)) {
                        isTitle = true
                        foundHeader = true
                        break
                    }

                    // If we find another small row, continue scan
                    if (checkNonEmpty.length <= 2) continue

                    break
                }
            }
        }

        if (isTitle) {
            // Found a title
            if (currentBlock && currentBlock.data.length > 0) {
                blocks.push(currentBlock)
                currentBlock = null
            }

            let thisTitle = String(currentNonEmpty[0]).trim() // Assuming title is first cell or joined
            if (currentNonEmpty.length > 1) thisTitle = currentNonEmpty.join(' ').trim()

            if (pendingTitle) {
                pendingTitle += " " + thisTitle
            } else {
                pendingTitle = thisTitle
            }

            i++  // Skip this title row
            continue
        }

        // Case 3: DETECT HEADER (Start of Table)
        // A row with multiple cells, and we don't have a current block (or just closed one)
        // Arbitrary threshold: >= 1 column (if it didn't match title above)
        if (!currentBlock && currentNonEmpty.length >= 1) {
            // It's a header

            const columns: ParsedColumn[] = []
            const seenNames = new Map<string, number>()

            // We iterate using forEach on the sparse array to get index
            currentRow.forEach((cellValue, idx) => {
                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                    const originalName = String(cellValue)
                    // Ensure unique ID
                    let id = originalName

                    if (seenNames.has(originalName)) {
                        const count = seenNames.get(originalName)! + 1
                        seenNames.set(originalName, count)
                        id = `${originalName}_${count}`
                    } else {
                        seenNames.set(originalName, 1)
                    }

                    columns.push({
                        id,
                        name: originalName,
                        type: 'text',
                        preview: [],
                        originalIndex: idx // Store the original index
                    })
                }
            })

            if (columns.length > 0) {
                currentBlock = {
                    title: pendingTitle || `Tabela ${blocks.length + 1}`,
                    columns,
                    data: [],
                    headerRowIndex: i
                }
                pendingTitle = ''
                i++
                continue
            }
        }

        // Case 4: DATA ROW
        if (currentBlock) {
            const rowData: any = {}
            let hasData = false

            // Iterate the current row cells
            currentRow.forEach((cellValue, colIdx) => {
                // Find the column definition that corresponds to this index
                const column = currentBlock!.columns.find(c => c.originalIndex === colIdx)

                if (column) {
                    rowData[column.id] = cellValue
                    if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                        hasData = true
                    }
                }
            })

            if (hasData) {
                currentBlock.data.push(rowData)
                // Extend preview (legacy support)
                // currentBlock.columns.forEach(col => { ... })
            }
        }

        i++
    }

    // Add last block
    if (currentBlock && currentBlock.data.length > 0) {
        blocks.push(currentBlock)
    }

    return blocks
}
