"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Plus, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// Inline type to avoid import issues for now
export interface ColumnConfig {
    id: string
    label: string
    type: 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean'
    required?: boolean
    visible?: boolean
}

interface ItemFormProps {
    columns: ColumnConfig[]
    onSave: (data: any) => Promise<void>
    serviceName: string
    initialData?: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function ItemForm({ columns, onSave, serviceName, initialData, open: controlledOpen, onOpenChange, trigger }: ItemFormProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (val: boolean) => {
        if (onOpenChange) onOpenChange(val)
        if (!isControlled) setInternalOpen(val)
    }

    const { register, handleSubmit, control, reset, formState: { isSubmitting } } = useForm({
        defaultValues: initialData || {}
    })

    // Reset when initialData changes or dialog opens
    useEffect(() => {
        if (open) {
            reset(initialData || {})
        }
    }, [open, initialData, reset])

    const onSubmit = async (data: any) => {
        // Convert numbers
        const formattedData = { ...data };
        columns.forEach(col => {
            if ((col.type === 'currency' || col.type === 'number') && formattedData[col.id]) {
                formattedData[col.id] = Number(formattedData[col.id])
            }
        })

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
            <DialogContent className="sm:max-w-[500px] p-6">
                <DialogHeader className="pb-4 border-b mb-4">
                    <DialogTitle className="text-xl font-semibold">
                        {initialData ? `Editar ${serviceName}` : `Novo ${serviceName}`}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Edite os dados do item.' : `Preencha os dados do ${serviceName.toLowerCase()}.`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {columns.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <p className="mb-2">Nenhum campo configurado para este serviço.</p>
                            <Button variant="link" asChild className="p-0 h-auto font-normal text-blue-600">
                                <a href="/configuracoes">Ir para Configurações</a>
                            </Button>
                        </div>
                    ) : (
                        columns.map((col, index) => {
                            if (col.visible === false) return null

                            // Fallback ID if missing
                            const colId = col.id || col.label?.toLowerCase().replace(/[^a-z0-9]/g, '_') || `col_${index}`
                            const colLabel = col.label || "Campo sem nome"

                            // Check if initialData has the value, use it for default if necessary (useForm handles defaultValues mostly)

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
                                                        <SelectItem value="Ativo">Ativo</SelectItem>
                                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                                        <SelectItem value="Em Execução">Em Execução</SelectItem>
                                                        <SelectItem value="Concluído">Concluído</SelectItem>
                                                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    ) : (
                                        <Input
                                            id={colId}
                                            type={col.type === 'date' ? 'date' : col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                                            step={col.type === 'currency' ? "0.01" : "1"}
                                            placeholder={colLabel}
                                            className="h-10 rounded-md border-input"
                                            {...register(colId, { required: col.required })}
                                        />
                                    )}
                                </div>
                            )
                        })
                    )}

                    {columns.length > 0 && (
                        <DialogFooter className="pt-4 border-t mt-6">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                {isSubmitting ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    )
}
