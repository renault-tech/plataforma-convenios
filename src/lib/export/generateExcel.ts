import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface GenerateExcelParams {
    data: any[]
    columns: any[]
    serviceName: string
    isGlobal?: boolean
}

export const generateExcel = async ({ data, columns, serviceName, isGlobal }: GenerateExcelParams) => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Dados')

    workbook.creator = 'GovManager Platform'
    workbook.lastModifiedBy = 'User'
    workbook.created = new Date()

    // 1. Define Columns
    // If Global (Home), we use fixed columns
    // If Service (Table/Dashboard), we use dynamic columns
    let excelColumns: Partial<ExcelJS.Column>[] = []

    if (isGlobal) {
        excelColumns = [
            { header: 'Título', key: 'title', width: 40 },
            { header: 'Serviço', key: 'service_name', width: 25 },
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Data Criação', key: 'created_at', width: 20 },
        ]
    } else {
        // Dynamic Columns from Service Config
        // Map types to widths
        excelColumns = (columns || []).map(col => ({
            header: col.label,
            key: col.id,
            width: col.type === 'text' ? 30 : col.type === 'date' ? 18 : 15,
            style: col.type === 'currency' ? { numFmt: '"R$"#,##0.00' } : undefined
        }))

        // Add System Columns if not present
        excelColumns.unshift({ header: 'ID', key: 'id', width: 10, hidden: true })
        excelColumns.push({ header: 'Criado em', key: 'created_at', width: 20 })
    }

    worksheet.columns = excelColumns

    // 2. Style Header Row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' } // Blue 600
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 30

    // 3. Add Data
    data.forEach(item => {
        let rowData: any = {}

        if (isGlobal) {
            rowData = {
                title: item.title,
                service_name: item.service_name,
                status: item.status,
                created_at: new Date(item.created_at).toLocaleDateString('pt-BR')
            }
        } else {
            // Flatten data object for Service items
            // item = { id, data: { col1: val1 }, created_at }

            // Map dynamic columns
            (columns || []).forEach(col => {
                let val = item.data ? item.data[col.id] : item[col.id]

                // Format Dates for Excel logic (if string)
                if (col.type === 'date' && val) {
                    val = new Date(val)
                }
                // Currency is number
                if (col.type === 'currency' && val) {
                    val = Number(val)
                }

                rowData[col.id] = val
            })

            // System cols
            rowData.id = item.id
            rowData.created_at = new Date(item.created_at) // Excel handles Date objects well
        }

        worksheet.addRow(rowData)
    })

    // 4. Auto Filter
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: excelColumns.length }
    }

    // 5. Zebra Striping (Optional)
    worksheet.eachRow((row, rowNumber) => {
        // Set alignment for all rows (including header, though header is already styled)
        // But let's only override data rows to keep it safe, or just set strictly for data.
        if (rowNumber > 1) {
            row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }

            if (rowNumber % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8FAFC' } // Slate 50
                }
            }
        }
    })

    // 6. Generate Buffer & Save
    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `${serviceName.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.xlsx`

    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, fileName)
}
