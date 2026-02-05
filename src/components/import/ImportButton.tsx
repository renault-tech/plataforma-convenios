"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { UploadCloud, Loader2 } from "lucide-react"
import { parseExcelFile, type ParsedSheet } from "@/lib/import/parseExcel"
import { ImportPreviewDialog } from "./ImportPreviewDialog"
import { toast } from "sonner"
import { createServiceFromImport } from "@/app/actions/import" // Will create this next
import { useRouter } from "next/navigation"

export function ImportButton({ className }: { className?: string }) {
    const [isParsing, setIsParsing] = useState(false)
    const [previewData, setPreviewData] = useState<ParsedSheet | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsParsing(true)
        try {
            const data = await parseExcelFile(file)
            if (data) {
                setPreviewData(data)
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

    const handleCreateService = async (name: string, data: ParsedSheet, color: string) => {
        try {
            const result = await createServiceFromImport(name, data, color)

            if (result.success) {
                toast.success("Planilha criada com sucesso!")
                // Full page reload to update sidebar
                if (result.slug) {
                    window.location.href = `/servicos/${result.slug}`
                } else {
                    window.location.reload()
                }
            } else {
                toast.error("Erro ao criar planilha: " + result.error)
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

            <ImportPreviewDialog
                open={showPreview}
                onOpenChange={setShowPreview}
                parsedData={previewData}
                onConfirm={handleCreateService}
            />
        </>
    )
}
