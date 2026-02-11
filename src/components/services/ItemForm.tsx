"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { Plus, Calendar as CalendarIcon, Paperclip, ChevronDown, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

// Inline type to avoid import issues for now
export interface ColumnConfig {
    id: string
    label: string
    type: 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean'
    required?: boolean
    visible?: boolean
    options?: string[]
}

interface ItemFormProps {
    columns: ColumnConfig[]
    onSave: (data: any) => Promise<void>
    serviceName: string
    initialData?: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
    tableBlocks?: any[]
}

export function ItemForm({ columns, onSave, serviceName, initialData, open: controlledOpen, onOpenChange, trigger, tableBlocks = [] }: ItemFormProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (val: boolean) => {
        if (onOpenChange) onOpenChange(val)
        if (!isControlled) setInternalOpen(val)
    }

    const { register, handleSubmit, control, reset, formState: { isSubmitting } } = useForm({
    })

    // BLOCK SELECTION LOGIC
    const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(
        initialData?.table_block_id || (tableBlocks.length > 0 ? tableBlocks[0].id : undefined)
    )

    // Update selected block when initialData changes or dialogue opens
    useEffect(() => {
        if (open) {
            if (initialData?.table_block_id) {
                setSelectedBlockId(initialData.table_block_id)
            } else if (tableBlocks.length > 0) {
                // Default to first block if no initial data
                setSelectedBlockId(tableBlocks[0].id)
            }
        }
    }, [open, initialData, tableBlocks])

    // Derive active columns based on selection
    const activeColumns = useMemo(() => {
        if (!selectedBlockId || tableBlocks.length === 0) return columns

        const block = tableBlocks.find(b => b.id === selectedBlockId)
        if (!block) return columns

        // Transform block columns to config format if needed
        // Assuming block.columns matches the expected structure or we need to map it
        // The ServiceView passes `getBlockColumns` result usually, but here we might need raw mapping
        // However, if we change block, we need that block's config.

        // Helper to map raw block columns to ColumnConfig
        return block.columns.map((col: any) => ({
            id: col.id || col.name,
            label: col.name || col.id || "Campo sem nome", // Fallback to ID if name is missing
            type: col.type,
            required: false,
            // Add options if available in future
        }))
    }, [selectedBlockId, tableBlocks, columns])

    // Use activeColumns for rendering, fallback to passed columns
    const displayColumns = tableBlocks.length > 0 ? activeColumns : columns

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false)

    // Reset when initialData changes or dialog opens
    useEffect(() => {
        if (open) {
            reset(initialData || {})
            // Automatically open sections if they have data
            if (initialData?.details) setIsDetailsOpen(true)
            if (initialData?.attachments && initialData.attachments.length > 0) setIsAttachmentsOpen(true)
        }
    }, [open, initialData, reset])

    const onSubmit = async (data: any) => {
        // Convert numbers
        const formattedData = { ...data };
        displayColumns.forEach((col: any) => {
            if (formattedData[col.id]) {
                if (col.type === 'currency') {
                    // Check if it's a string, replace dots (thousands) and comma (decimal)
                    // e.g. "1.000,00" -> 1000.00
                    const val = String(formattedData[col.id])
                    // Remove thousands separator (.) and replace decimal separator (,) with (.)
                    const cleanVal = val.replace(/\./g, '').replace(',', '.')
                    formattedData[col.id] = Number(cleanVal)
                } else if (col.type === 'number') {
                    formattedData[col.id] = Number(formattedData[col.id])
                }
            }
        })


        // Add table_block_id if relevant
        if (selectedBlockId) {
            formattedData.table_block_id = selectedBlockId
        }

        await onSave(formattedData)
        setOpen(false) // Close dialog
        if (!initialData) reset() // Reset only if creating new
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo {serviceName}
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b bg-white z-10">
                    <DialogTitle className="text-xl font-semibold">
                        {initialData ? `Editar ${serviceName}` : `Novo ${serviceName}`}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Edite os dados do item.' : `Preencha os dados do ${serviceName.toLowerCase()}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <form id="item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Block Selector */}
                        {tableBlocks.length > 1 && (
                            <div className="space-y-2 p-3 bg-slate-50 rounded-md border text-sm">
                                <Label className="text-muted-foreground">Tabela de destino</Label>
                                <Select
                                    value={selectedBlockId}
                                    onValueChange={setSelectedBlockId}
                                    disabled={!!initialData?.table_block_id} // Disable if editing existing item
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Selecione a tabela" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tableBlocks.map(block => (
                                            <SelectItem key={block.id} value={block.id}>{block.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {displayColumns.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <p className="mb-2">Nenhum campo configurado para este serviço.</p>
                                <Button variant="link" asChild className="p-0 h-auto font-normal text-blue-600">
                                    <a href="/configuracoes">Ir para Configurações</a>
                                </Button>
                            </div>
                        ) : (
                            displayColumns.map((col: ColumnConfig, index: number) => {
                                if (col.visible === false) return null

                                // Fallback ID if missing
                                const colId = col.id || col.label?.toLowerCase().replace(/[^a-z0-9]/g, '_') || `col_${index}`
                                const colLabel = col.label || "Campo sem nome"

                                return (
                                    <div key={colId} className="grid w-full items-center gap-2">
                                        <Label htmlFor={colId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {colLabel}
                                        </Label>

                                        {col.type === 'status' ? (
                                            <Controller
                                                control={control}
                                                name={colId}
                                                defaultValue={initialData?.[colId] || "Pendente"}
                                                rules={{ required: col.required }}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Selecione o status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(col.options && col.options.length > 0
                                                                ? col.options
                                                                : ["Pendente", "Ativo", "Em Execução", "Em Andamento", "Concluído", "Cancelado"]
                                                            ).map((option: string) => (
                                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        ) : col.type === 'currency' ? (
                                            <Input
                                                id={colId}
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0,00"
                                                className="h-10 rounded-md border-input"
                                                {...register(colId, {
                                                    required: col.required,
                                                    onChange: (e) => {
                                                        // Allow only numbers, commas, and dots
                                                    }
                                                })}
                                            />
                                        ) : (
                                            <Input
                                                id={colId}
                                                type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
                                                step={col.type === 'number' ? "any" : undefined}
                                                placeholder={colLabel}
                                                className="h-10 rounded-md border-input"
                                                {...register(colId, { required: col.required })}
                                            />
                                        )}
                                    </div>
                                )
                            })
                        )}

                        {/* Standard Fields: Details and Attachments */}
                        <div className="pt-4 space-y-3">
                            {/* Details Collapsible */}
                            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen} className="border rounded-lg bg-slate-50/50">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="flex w-full items-center justify-between p-3 font-medium hover:bg-slate-100">
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            Detalhes Adicionais
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isDetailsOpen ? "rotate-180" : "")} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-3 pb-3">
                                    <Textarea
                                        id="details"
                                        placeholder="Insira observações, descrições detalhadas ou notas..."
                                        className="min-h-[120px] bg-white"
                                        {...register('details')}
                                    />
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Attachments Collapsible */}
                            <Collapsible open={isAttachmentsOpen} onOpenChange={setIsAttachmentsOpen} className="border rounded-lg bg-slate-50/50">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="flex w-full items-center justify-between p-3 font-medium hover:bg-slate-100">
                                        <span className="flex items-center gap-2">
                                            <Paperclip className="h-4 w-4 text-emerald-500" />
                                            Anexos e Documentos
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAttachmentsOpen ? "rotate-180" : "")} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-3 pb-3">
                                    <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-100/50 transition-colors bg-white">
                                        <Input
                                            id="attachments"
                                            type="file"
                                            multiple
                                            className="hidden"
                                            {...register('files_upload')}
                                        // We can add an onChange to the registered input if needed, 
                                        // but usually we just let react-hook-form handle it.
                                        // If we need preview, we can use watch('files_upload')
                                        />
                                        <Label htmlFor="attachments" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                                <Plus className="h-6 w-6" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Clique para adicionar arquivos</span>
                                            <span className="text-xs text-slate-500">PDF, Imagens, Excel (Max 10MB)</span>
                                        </Label>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </form>
                </div>

                <DialogFooter className="p-4 border-t bg-white mt-auto z-10">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="mr-auto sm:mr-0"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="item-form"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                        {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
