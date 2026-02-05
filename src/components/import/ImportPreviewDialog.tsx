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
import { Loader2, FileSpreadsheet, ArrowRight } from "lucide-react"
import type { ParsedSheet } from "@/lib/import/excelParser"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ImportPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    parsedData: ParsedSheet | null
    onConfirm: (name: string, data: ParsedSheet, color: string) => Promise<void>
}

const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
    "#64748b"
]

export function ImportPreviewDialog({ open, onOpenChange, parsedData, onConfirm }: ImportPreviewDialogProps) {
    const [serviceName, setServiceName] = useState(parsedData?.name || "")
    const [selectedColor, setSelectedColor] = useState("#22c55e")
    const [isLoading, setIsLoading] = useState(false)

    // Update name if parsedData changes
    if (parsedData && serviceName === "" && parsedData.name) {
        setServiceName(parsedData.name)
    }

    if (!parsedData) return null

    const handleConfirm = async () => {
        if (!serviceName.trim()) return
        setIsLoading(true)
        try {
            await onConfirm(serviceName, parsedData, selectedColor)
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importar Planilha</DialogTitle>
                    <DialogDescription>
                        Revise os dados importados antes de criar a nova planilha.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Planilha</Label>
                            <Input
                                id="name"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                            />
                        </div>
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
                    </div>

                    <div className="border rounded-md w-full overflow-hidden">
                        <div className="overflow-x-auto max-w-[850px] max-h-[400px]">
                            <Table className="w-max border-collapse">
                                <TableHeader>
                                    <TableRow>
                                        {parsedData.columns.map((col) => (
                                            <TableHead key={col.id} className="w-[150px] min-w-[150px] px-4 py-2 bg-slate-50 border-b">
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
                                    {parsedData.data.slice(0, 5).map((row, i) => (
                                        <TableRow key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                                            {parsedData.columns.map((col) => {
                                                let val = row[col.id];
                                                if (val instanceof Date) {
                                                    try {
                                                        val = format(val, 'dd/MM/yyyy', { locale: ptBR })
                                                    } catch (e) { val = String(val) }
                                                }
                                                return (
                                                    <TableCell key={col.id} className="text-xs truncate max-w-[150px] p-2 border-r last:border-0" title={String(val ?? "")}>
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

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || !serviceName.trim()} className="bg-green-600 hover:bg-green-700 text-white">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Criar Planilha
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
