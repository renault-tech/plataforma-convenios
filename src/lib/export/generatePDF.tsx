import { pdf, Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'

// Define styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20, // Reduced padding
        fontFamily: 'Helvetica',
        fontSize: 10,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#112233',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    headerSub: {
        fontSize: 10,
        color: '#666666'
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1
    },
    table: {
        width: '100%', // Force full width
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
        width: '100%' // Force row width
    },
    tableColHeader: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#2563EB',
        color: '#FFFFFF',
        padding: 8
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 8,
        justifyContent: 'center' // Vertically center content
    },
    tableCellHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    tableCell: {
        fontSize: 9,
        textAlign: 'left'
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10
    }
});

// PDF Component
const FormalReport = ({ data, columns, serviceName, isGlobal, dashboardImage }: any) => {
    // Prepare columns for table
    let tableCols: any[] = []

    // 1. Determine base columns
    if (isGlobal && !dashboardImage) {
        tableCols = [
            { label: 'Título', key: 'title' },
            { label: 'Serviço', key: 'service_name' },
            { label: 'Status', key: 'status' },
            { label: 'Data', key: 'created_at' },
        ]
    } else if (columns) {
        // Take up to 6 custom columns
        tableCols = (columns || []).slice(0, 6).map((col: any) => ({
            label: col.label,
            key: col.id,
            type: col.type
        }))

        // If we have few columns, maybe add "Data"?
        // Only if we don't have enough to fill the page (e.g. < 4)
        if (tableCols.length < 4) {
            tableCols.push({ label: 'Data', key: 'created_at', type: 'date' })
        }
    }

    // 2. Calculate Widths
    const colCount = tableCols.length
    if (colCount > 0) {
        const widthPerCol = 100 / colCount
        tableCols = tableCols.map(c => ({ ...c, width: `${widthPerCol}%` }))
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>{serviceName || "Relatório Geral"}</Text>
                        <Text style={styles.headerSub}>Plataforma de Gestão de Convênios</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 9 }}>{new Date().toLocaleDateString('pt-BR')}</Text>
                    </View>
                </View>

                {/* Dashboard Snapshot (if available) */}
                {dashboardImage && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Visão Geral do Painel</Text>
                        <Image src={dashboardImage} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                    </View>
                )}

                {/* Table (if data available) */}
                {data && data.length > 0 && tableCols.length > 0 && (
                    <View style={styles.table}>
                        {/* Header Row */}
                        <View style={styles.tableRow}>
                            {tableCols.map((col: any, idx: number) => (
                                <View style={{ ...styles.tableColHeader, width: col.width }} key={idx}>
                                    <Text style={styles.tableCellHeader}>{col.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Data Rows */}
                        {data.map((item: any, idx: number) => (
                            <View style={styles.tableRow} key={idx} wrap={false}>
                                {tableCols.map((col: any, cIdx: number) => {
                                    let val = isGlobal ? item[col.key] : (item.data ? item.data[col.key] : item[col.key])
                                    if (col.key === 'created_at') val = item.created_at

                                    // Formatting
                                    if (col.type === 'currency' && val) val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val))
                                    if ((col.type === 'date' || col.key === 'created_at') && val) val = new Date(val).toLocaleDateString('pt-BR')

                                    return (
                                        <View style={{ ...styles.tableCol, width: col.width }} key={cIdx}>
                                            <Text style={styles.tableCell}>{String(val || "-")}</Text>
                                        </View>
                                    )
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Página ${pageNumber} de ${totalPages} - Documento gerado automaticamente`
                )} fixed />
            </Page>
        </Document>
    )
}

// Generate Function
export const generatePDF = async ({ data, columns, serviceName, isGlobal, dashboardImage }: any) => {
    const blob = await pdf(
        <FormalReport
            data={data}
            columns={columns}
            serviceName={serviceName}
            isGlobal={isGlobal}
            dashboardImage={dashboardImage}
        />
    ).toBlob()
    const fileName = `${serviceName.replace(/\s+/g, '_')}_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`
    saveAs(blob, fileName)
}
