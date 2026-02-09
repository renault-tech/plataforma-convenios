"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { UploadCloud, Loader2 } from "lucide-react"
import { parseExcelFile, type ParsedSheet } from "@/lib/import/parseExcel"
import { ImportPreviewDialog } from "./ImportPreviewDialog"
import { toast } from "sonner"
import { createServiceFromImport } from "@/app/actions/import"
import { useRouter } from "next/navigation"

export function ImportButton({ className }: { className?: string }) {
    const [isParsing, setIsParsing] = useState(false)
    const [previewData, setPreviewData] = useState<ParsedSheet[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsParsing(true)
        try {
            const sheets = await parseExcelFile(file)
            if (sheets && sheets.length > 0) {
                setPreviewData(sheets)
                setShowPreview(true)
            } else {
                toast.error("Não foi possível ler os dados do arquivo.")
            }
        } catch (error) {
            console.error("Import error:", error)
            toast.error("Erro ao processar o arquivo Excel.")
        } finally {
            setIsParsing(false)
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleCreateServices = async (sheets: ParsedSheet[], color: string) => {
        try {
            const results = []

            for (const sheet of sheets) {
                const result = await createServiceFromImport(sheet.name, sheet, color)
                results.push(result)

                if (!result.success) {
                    toast.error(`Erro ao criar "${sheet.name}": ${result.error}`)
                }
            }

            const successCount = results.filter(r => r.success).length

            if (successCount > 0) {
                toast.success(`${successCount} planilha(s) criada(s) com sucesso!`)
                // Redirect to first created service
                const firstSuccess = results.find(r => r.success && r.slug)
                if (firstSuccess?.slug) {
                    window.location.href = `/servicos/${firstSuccess.slug}`
                } else {
                    window.location.reload()
                }
            }
        } catch (e: any) {
            toast.error("Erro crítico: " + e.message)
        }
    }

    return (
        <>
            <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />
            <Button
                variant="ghost"
                size="sm"
                className={className}
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
                title="Importar Excel"
            >
                {isParsing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500 mr-2" />
                ) : (
                    <UploadCloud className="h-4 w-4 text-slate-700 mr-2" />
                )}
                <span className="text-slate-700">Importar</span>
            </Button>

            {previewData.length > 0 && (
                <ImportPreviewDialog
                    open={showPreview}
                    onOpenChange={setShowPreview}
                    sheets={previewData}
                    onConfirm={handleCreateServices}
                />
            )}
        </>
    )
}
