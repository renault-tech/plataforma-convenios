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
    // Generic Cell Data Structure
    type CellData = {
        value: any
        numFmt?: string
    }

    // Convert worksheet to array to allow lookahead
    const rows: CellData[][] = []

    // ExcelJS uses 1-based indexing for rows
    worksheet.eachRow((row, rowIndex) => {
        const cells: CellData[] = []
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            let val = cell.value
            const numFmt = cell.numFmt

            // Handle ExcelJS Hyperlink object { text, hyperlink }
            if (val && typeof val === 'object' && 'text' in val) {
                val = (val as any).text
            } else if (val && typeof val === 'object' && 'hyperlink' in val) {
                val = (val as any).hyperlink
            }

            // Handle ExcelJS Formula object { formula, result }
            if (val && typeof val === 'object' && 'formula' in val) {
                const formulaObj = val as { result?: any }
                val = formulaObj.result !== undefined ? formulaObj.result : null
            }

            // Handle Rich Text (array of objects)
            if (val && typeof val === 'object' && 'richText' in val) {
                val = (val as any).richText.map((rt: any) => rt.text).join('')
            }

            cells[colNumber] = { value: val, numFmt }
        })
        rows[rowIndex] = cells
    })

    if (rows.length === 0) return []

    const blocks: TableBlock[] = []
    let currentBlock: TableBlock | null = null
    let pendingTitle = ''

    // Helper: Count non-empty cells
    const getNonEmptyCount = (row: CellData[]) => {
        if (!row) return 0
        return row.filter(c => c?.value !== null && c?.value !== undefined && c?.value !== '').length
    }

    // Helper: Determine "Block Width" by looking ahead
    const getBlockWidth = (startIndex: number): number => {
        let max = 0
        let consistentCount = 0
        for (let k = 0; k < 15; k++) {
            const r = rows[startIndex + k]
            if (!r) continue
            const count = getNonEmptyCount(r)
            if (count > max) max = count
            if (count > 3 && count === max) consistentCount++
            if (consistentCount >= 3) break
        }
        return max
    }

    let i = 1
    while (i < rows.length) {
        const currentRow = rows[i] || []
        const nonEmptyCount = getNonEmptyCount(currentRow)

        // Case 1: Empty Row (Separator)
        if (nonEmptyCount === 0) {
            if (currentBlock && currentBlock.data.length > 0) {
                blocks.push(currentBlock)
                currentBlock = null
            }
            i++
            continue
        }

        const lookaheadWidth = getBlockWidth(i)
        const uniqueValues = new Set(currentRow.filter(c => c?.value !== null && c?.value !== undefined && c?.value !== '').map(c => String(c.value))).size
        const repetitionRatio = nonEmptyCount > 0 ? uniqueValues / nonEmptyCount : 1
        const isNarrow = (nonEmptyCount <= 3) || (nonEmptyCount < lookaheadWidth * 0.6)
        const isRepetitive = nonEmptyCount > 3 && repetitionRatio < 0.5
        const isBlockWide = lookaheadWidth >= 4

        // Case 2: TITLE
        if (!currentBlock && isBlockWide && (isNarrow || isRepetitive)) {
            let thisTitle = ""
            const validCells = currentRow.filter(c => c?.value !== null && c?.value !== undefined && c?.value !== '')

            if (isRepetitive) {
                thisTitle = String(validCells[0]?.value || "").trim()
            } else if (nonEmptyCount > 1) {
                thisTitle = validCells.map(c => c.value).join(' ').trim()
            } else {
                thisTitle = String(validCells[0]?.value || "").trim()
            }

            if (pendingTitle) {
                pendingTitle += " - " + thisTitle
            } else {
                pendingTitle = thisTitle
            }
            i++
            continue
        }

        // Case 3: HEADER (Start of Table)
        if (!currentBlock) {
            const columns: ParsedColumn[] = []
            const seenNames = new Map<string, number>()

            currentRow.forEach((cell, idx) => {
                const cellValue = cell?.value
                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                    const originalName = String(cellValue)
                    let id = originalName
                    if (seenNames.has(originalName)) {
                        const count = seenNames.get(originalName)! + 1
                        seenNames.set(originalName, count)
                        id = `${originalName}_${count}`
                    } else {
                        seenNames.set(originalName, 1)
                    }

                    // Initial basic type guess
                    let type: 'text' | 'date' | 'currency' | 'number' = 'text'
                    const lowerName = originalName.toLowerCase()
                    const normalizedName = originalName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

                    if (/\b(data|date|dt|nasc|venc|inicio|fim|vigencia|assinat)\b|dt_/i.test(normalizedName)) {
                        type = 'date'
                    } else if (/\b(total|valor|preco|custo|orcamento|soma|fatura|repass|contrap)\b/i.test(normalizedName)) {
                        type = 'currency'
                    } else if (/qtd|quantidade|num|n\u00ba|numero|id|cpf|cnpj/i.test(lowerName) && !/nome|endereco/i.test(lowerName)) {
                        type = 'text'
                    }

                    columns.push({
                        id,
                        name: originalName,
                        type,
                        preview: [],
                        originalIndex: idx
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

        // Case 4: DATA
        if (currentBlock) {
            const rowData: any = {}
            let hasData = false

            currentRow.forEach((cell, colIdx) => {
                const column = currentBlock!.columns.find(c => c.originalIndex === colIdx)
                if (column) {
                    let finalVal = cell.value

                    // Final Safety Check: Ensure no objects leak
                    if (finalVal && typeof finalVal === 'object') {
                        if (finalVal instanceof Date) {
                            // Keep Dates
                        } else if ('result' in finalVal && finalVal.result !== undefined) {
                            // Try to rescue formula result again if missed
                            finalVal = finalVal.result
                        } else if ('richText' in finalVal) {
                            finalVal = finalVal.richText.map((rt: any) => rt.text).join('')
                        } else if ('text' in finalVal) {
                            finalVal = finalVal.text
                        } else {
                            // Last resort: If it's still an object (e.g. error object), stringify or null
                            // If it looks like a formula error { error: "#DIV/0!" }
                            if ('error' in finalVal) {
                                finalVal = null // or finalVal.error
                            } else {
                                finalVal = null // Prevent [object Object]
                            }
                        }
                    }

                    // Double check after rescue
                    if (finalVal && typeof finalVal === 'object' && !(finalVal instanceof Date)) {
                        finalVal = null
                    }

                    rowData[column.id] = finalVal

                    if (finalVal !== null && finalVal !== undefined && finalVal !== '') hasData = true
                }
            })

            if (hasData) {
                currentBlock.data.push(rowData)
                // We implicitly assume block.data[k] corresponds to rows[ headerRowIndex + 1 + k ]
            }
        }

        i++
    }

    // Helper: Excel Serial Date to JS Date
    const parseExcelDate = (serial: number): Date | null => {
        // Excel base date: Dec 30, 1899 (dates are number of days since then)
        // But wait, ExcelJS usually returns Date objects if formatted correctly.
        // If it returns a number (e.g. 44386), we convert.
        if (!serial || isNaN(serial)) return null
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return date_info;
    }

    if (currentBlock && currentBlock.data.length > 0) {
        blocks.push(currentBlock)
    }

    // POST-PROCESSING: Refine Column Types based on Data Content & Format
    blocks.forEach(block => {
        if (!block.headerRowIndex) return

        block.columns.forEach(col => {
            let dateCount = 0
            let currencyCount = 0
            let numberCount = 0
            let fmtCurrencyCount = 0
            let fmtDateCount = 0
            let totalCount = 0

            // Check first 10 rows for content AND format analysis
            // block.data[k] corresponds to rows[ block.headerRowIndex + 1 + k ] (approximately, if no gaps)
            // But wait, our 'rows' index logic in loop was i++.
            // 'i' was strictly incrementing. 
            // So we can assume `item index + headerRowIndex + 1` is safe IF there were no gaps inside the block.
            // Our logic "Case 4" pushes to currentBlock.data as we iterate `i`.
            // So yes, row index is mapping 1:1.

            const checkLimit = Math.min(block.data.length, 20)
            for (let k = 0; k < checkLimit; k++) {
                const rowIdx = (block.headerRowIndex || 0) + k + 1 // +1 because we captured header at 'i', data starts next

                // Safe check bounds
                if (rowIdx >= rows.length) break

                const cellData = rows[rowIdx][col.originalIndex!]
                const val = cellData?.value
                const fmt = cellData?.numFmt || ''

                if (val === null || val === undefined || val === '') continue
                totalCount++

                // 1. Native Format Detection (Strong Signal)
                // Currency: R$, $, " accounting ", or specific formats
                // Common Excel formats: 
                // "R$ #,##0.00", "$#,##0.00", "#,##0.00", etc.
                if (/[R$£€¥]|accounting|currency/i.test(fmt) || fmt.includes('R$') || (fmt.includes('0.00') && !fmt.includes('year'))) {
                    fmtCurrencyCount++
                }

                // Date: dd/mm, yyyy, etc.
                if (/[dmy]/.test(fmt) && !/red|blue|color/i.test(fmt) && (fmt.includes('/') || fmt.includes('-'))) {
                    fmtDateCount++
                }

                // 2. Content Detection (Backup)
                const normalizedName = col.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

                if (val instanceof Date) {
                    dateCount++
                } else if (typeof val === 'number' && val > 20000 && val < 60000) {
                    // Check if format hints date
                    if (fmtDateCount > 0 || /\b(data|date|dt|nasc|venc|inicio|fim|vigencia|assinat)\b|dt_/i.test(normalizedName)) {
                        dateCount++
                    }
                }

                if (typeof val === 'number') {
                    numberCount++
                }
            }

            // Decision Logic
            const normalizedName = col.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
            const isNameCurrency = /\b(total|valor|preco|custo|orcamento|soma|fatura|repass|contrap)\b/i.test(normalizedName)

            if (totalCount > 0) {
                // Priority 1: High Format Confidence
                if (fmtCurrencyCount / totalCount > 0.5) {
                    col.type = 'currency'
                } else if (fmtDateCount / totalCount > 0.5) {
                    col.type = 'date'
                }
                // Priority 2: Data + Name Confidence (Aggressive)
                else if ((dateCount / totalCount) > 0.8) {
                    col.type = 'date'
                } else if (col.type === 'text' && numberCount > 0 && isNameCurrency) {
                    col.type = 'currency'
                }
                // Priority 3: STRONG Name fallback
                // If the column name implies currency/date specifically, and we have ANY numbers, force it.
                // This overrides "Text" default.
                else if (numberCount > 0) {
                    if (/\b(vr|valor|repasse|contrap|total|custo|orcamento|fatura)\b/i.test(normalizedName)) {
                        col.type = 'currency'
                    } else if (/\b(dt|data|date|venc|inicio|fim|vigencia|assinat)\b/i.test(normalizedName)) {
                        col.type = 'date'
                    }
                }
            }

            // Apply Data Conversion
            if (col.type === 'date') {
                block.data.forEach(row => {
                    const val = row[col.id]
                    if (typeof val === 'number') {
                        const date = parseExcelDate(val)
                        if (date) row[col.id] = date.toISOString()
                    } else if (val instanceof Date) {
                        row[col.id] = val.toISOString()
                    }
                })
            }
        })
    })

    return blocks
}
