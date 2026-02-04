import { Document, Packer, Paragraph, Table, TableCell, TableRow, WebReferenceNode, WidthType, BorderStyle, HeadingLevel, TextRun, VerticalAlign } from "docx"
import { saveAs } from "file-saver"

interface GenerateWordParams {
    data: any[]
    columns: any[]
    serviceName: string
    isGlobal?: boolean
}

export const generateWord = async ({ data, columns, serviceName, isGlobal }: GenerateWordParams) => {
    // 1. Prepare Table Header
    let tableHeaders: TableCell[] = []

    if (isGlobal) {
        tableHeaders = [
            new TableCell({ children: [new Paragraph({ text: "Título", style: "TableHeader" })] }),
            new TableCell({ children: [new Paragraph({ text: "Serviço", style: "TableHeader" })] }),
            new TableCell({ children: [new Paragraph({ text: "Status", style: "TableHeader" })] }),
            new TableCell({ children: [new Paragraph({ text: "Data", style: "TableHeader" })] }),
        ]
    } else {
        tableHeaders = (columns || []).map(col =>
            new TableCell({
                children: [new Paragraph({ text: col.label, style: "TableHeader" })],
                width: { size: 100 / (columns?.length || 1), type: WidthType.PERCENTAGE }
            })
        )
        // Add Created At
        tableHeaders.push(new TableCell({ children: [new Paragraph({ text: "Criado em", style: "TableHeader" })] }))
    }

    // 2. Prepare Table Rows
    const tableRows = data.map(item => {
        let cells: TableCell[] = []

        if (isGlobal) {
            cells = [
                new TableCell({ children: [new Paragraph(item.title || "")] }),
                new TableCell({ children: [new Paragraph(item.service_name || "")] }),
                new TableCell({ children: [new Paragraph(item.status || "")] }),
                new TableCell({ children: [new Paragraph(new Date(item.created_at).toLocaleDateString("pt-BR"))] }),
            ]
        } else {
            cells = (columns || []).map(col => {
                let val = item.data ? item.data[col.id] : item[col.id]
                // Format
                if (col.type === 'currency' && val) val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val))
                if (col.type === 'date' && val) val = new Date(val).toLocaleDateString('pt-BR')

                return new TableCell({
                    children: [new Paragraph(String(val || ""))],
                    verticalAlign: VerticalAlign.CENTER
                })
            })
            // Add Created At
            cells.push(new TableCell({
                children: [new Paragraph(new Date(item.created_at).toLocaleDateString("pt-BR"))],
                verticalAlign: VerticalAlign.CENTER
            }))
        }

        return new TableRow({ children: cells })
    })

    // 3. Create Document
    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "TableHeader",
                    name: "Table Header",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        bold: true,
                        color: "FFFFFF",
                    },
                    paragraph: {
                        alignment: "center",
                    }
                }
            ]
        },
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: serviceName || "Relatório Global",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
                    spacing: { after: 400 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: tableHeaders,
                            tableHeader: true,
                            cantSplit: true,
                            shading: { fill: "2563EB" } // Blue 600
                        }),
                        ...tableRows
                    ],
                }),
            ],
        }],
    })

    // 4. Generate & Save
    const blob = await Packer.toBlob(doc)
    const fileName = `${serviceName.replace(/\s+/g, '_')}_Relatorio_${new Date().toISOString().split('T')[0]}.docx`
    saveAs(blob, fileName)
}
