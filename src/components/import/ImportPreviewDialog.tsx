"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileSpreadsheet } from "lucide-react"
import type { ParsedSheet } from "@/lib/import/parseExcel"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ImportPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sheets: ParsedSheet[]
    onConfirm: (sheets: ParsedSheet[], color: string) => Promise<void>
}

const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
    "#64748b"
]

export function ImportPreviewDialog({ open, onOpenChange, sheets, onConfirm }: ImportPreviewDialogProps) {
    const [selectedColor, setSelectedColor] = useState("#22c55e")
    const [isLoading, setIsLoading] = useState(false)

    if (sheets.length === 0) return null

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            await onConfirm(sheets, selectedColor)
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const totalRows = sheets.reduce((sum, sheet) => sum + sheet.data.length, 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importar Planilha</DialogTitle>
                    <DialogDescription>
                        {sheets.length} tabela(s) detectada(s) com {totalRows} registro(s) no total.
                        {sheets.length > 1 && " Cada tabela será criada como um serviço separado."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4 flex-1 overflow-hidden">
                    <div className="space-y-2">
                        <Label>Cor de Identificação</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full transition-all border-2 ${selectedColor === color
                                        ? "border-slate-900 scale-110"
                                        : "border-transparent hover:scale-105"
                                        }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <ScrollArea className="flex-1 border rounded-md">
                        <div className="p-4 space-y-8">
                            {sheets.map((sheet, sheetIndex) => (
                                <div key={`sheet-${sheetIndex}`} className="space-y-6">
                                    {/* Sheet Info (if needed, or just handle blocks) */}
                                    {/* Iterating Blocks */}
                                    {(sheet.tableBlocks || [{ title: sheet.name, columns: sheet.columns, data: sheet.data }]).map((block, blockIndex) => (
                                        <div key={`block-${sheetIndex}-${blockIndex}`} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                                                <h3 className="font-semibold text-sm">
                                                    {block.title || sheet.name}
                                                </h3>
                                                <Badge variant="secondary" className="text-xs">
                                                    {block.data.length} linhas
                                                </Badge>
                                            </div>

                                            <div className="border rounded-md overflow-hidden">
                                                <div className="overflow-x-auto max-h-[300px]">
                                                    <Table className="w-max border-collapse">
                                                        <TableHeader>
                                                            <TableRow>
                                                                {block.columns.map((col, colIndex) => (
                                                                    <TableHead key={`col-${sheetIndex}-${blockIndex}-${col.id}-${colIndex}`} className="w-[150px] min-w-[150px] px-4 py-2 bg-slate-50 border-b">
                                                                        <div className="flex flex-col gap-1 w-full">
                                                                            <span className="truncate block font-medium text-slate-700" title={col.name}>{col.name}</span>
                                                                            <Badge variant="outline" className="w-fit text-[10px] h-5">
                                                                                {col.type}
                                                                            </Badge>
                                                                        </div>
                                                                    </TableHead>
                                                                ))}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {block.data.slice(0, 5).map((row, rowIndex) => (
                                                                <TableRow key={`row-${sheetIndex}-${blockIndex}-${rowIndex}`} className="border-b last:border-0 hover:bg-slate-50/50">
                                                                    {block.columns.map((col, colIndex) => {
                                                                        let val = row[col.id];
                                                                        if (val instanceof Date) {
                                                                            try {
                                                                                val = format(val, 'dd/MM/yyyy', { locale: ptBR })
                                                                            } catch (e) { val = String(val) }
                                                                        }
                                                                        return (
                                                                            <TableCell key={`cell-${sheetIndex}-${blockIndex}-${rowIndex}-${col.id}-${colIndex}`} className="text-xs truncate max-w-[150px] p-2 border-r last:border-0" title={String(val ?? "")}>
                                                                                {String(val ?? "")}
                                                                            </TableCell>
                                                                        )
                                                                    })}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Criar {sheets.length} Planilha(s)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
