"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Loader2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { generateExcel } from "@/lib/export/generateExcel"
import { generateWord } from "@/lib/export/generateWord"
import { generatePDF } from "@/lib/export/generatePDF"
import { generateDashboardSnapshot } from "@/lib/export/generateDashboardSnapshot"

// Placeholder functions for now
// const exportExcel = async () => { await new Promise(r => setTimeout(r, 1000)); toast.success("Excel exportado!") }
// const exportWord = async () => { await new Promise(r => setTimeout(r, 1000)); toast.success("Word exportado!") }
// const exportPDF = async () => { await new Promise(r => setTimeout(r, 1000)); toast.success("PDF exportado!") }

interface ExportDropdownProps {
    className?: string
    context: 'dashboard' | 'table'
    data?: any
    columns?: any[]
    serviceName?: string
}

export function ExportDropdown({ className, context, data, columns, serviceName }: ExportDropdownProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [progress, setProgress] = useState(0)

    const getExportData = () => {
        let exportData: any[] = []
        let isGlobal = false

        if (context === 'table') {
            exportData = data // data is items[]
        } else if (context === 'dashboard') {
            if (data.items && Array.isArray(data.items)) {
                exportData = data.items
            } else if (data.detailedUpdates) {
                isGlobal = true
                if (data.statusGroups) {
                    exportData = data.statusGroups.flatMap((g: any) => g.items)
                }
            }
        }
        return { exportData, isGlobal }
    }

    const handleAction = async (fn: Function) => {
        const { exportData, isGlobal } = getExportData()

        // Allow export if we have data OR if it's a dashboard view (for snapshot)
        if ((!exportData || exportData.length === 0) && context !== 'dashboard') {
            toast.error("Sem dados")
            return
        }

        let dashboardImage = null
        // If Dashboard Context & PDF, try to capture snapshot of widgets
        // We assume there's a container with id="home-widgets" or "dashboard-widgets"
        if (context === 'dashboard' && fn === generatePDF) {
            // Try specific dashboard containers
            let containerId = document.getElementById('dashboard-widgets') ? 'dashboard-widgets' : 'home-widgets'
            // If not found, try body but that's risky. Let's stick to known IDs or the parent of dropdown?
            // Actually, in DashboardPage we have DndContext wrapping widgets. Let's assume we can capture the grid.
            // We need to add an ID to the grid in DashboardPage and HomePage: 'widgets-grid'
            dashboardImage = await generateDashboardSnapshot(containerId)
        }

        await fn({
            data: exportData || [],
            columns: columns || [],
            serviceName: serviceName || 'Global',
            isGlobal,
            dashboardImage
        })
    }

    const handleExport = async (type: 'excel' | 'word' | 'pdf', fn: () => Promise<void>) => {
        setIsExporting(true)
        setProgress(10)
        try {
            await fn()
            setProgress(100)
            toast.success("Download iniciado!")
        } catch (error) {
            console.error(error)
            toast.error(`Erro ao exportar ${type}`)
        } finally {
            setTimeout(() => {
                setIsExporting(false)
                setProgress(0)
            }, 500)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {isExporting && (
                <span className="text-xs text-slate-500 animate-pulse tabular-nums">
                    {progress}%
                </span>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isExporting}
                        className={className}
                        title="Exportar documentos"
                    >
                        {isExporting && (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500 mr-2" />
                        )}
                        <span className="text-slate-700">Exportar</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Exportar como...</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('pdf', () => handleAction(generatePDF))}>
                        <FileText className="mr-2 h-4 w-4 text-red-500" />
                        <span>Relatório PDF (Formal)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel', () => handleAction(generateExcel))}>
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                        <span>Excel (Planilha)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('word', () => handleAction(generateWord))}>
                        <ImageIcon className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Word (Editável)</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
