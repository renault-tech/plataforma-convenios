"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addColumnToTableBlock } from "@/app/actions/table-blocks"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface AddColumnDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    serviceId: string
    tableBlockId?: string
    onSuccess?: () => void
}

export function AddColumnDialog({ open, onOpenChange, serviceId, tableBlockId, onSuccess }: AddColumnDialogProps) {
    const [name, setName] = useState("")
    const [type, setType] = useState("text")
    const [isLoading, setIsLoading] = useState(false)
    const [options, setOptions] = useState<string[]>([])
    const [newOption, setNewOption] = useState("")

    const handleAddOption = (e: React.KeyboardEvent | React.MouseEvent) => {
        if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !newOption.trim()) return
        e.preventDefault()
        if (!options.includes(newOption.trim())) {
            setOptions([...options, newOption.trim()])
        }
        setNewOption("")
    }

    const removeOption = (optToRemove: string) => {
        setOptions(options.filter(o => o !== optToRemove))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        // Validation for status
        if (type === 'status' && options.length === 0) {
            toast.error("Adicione pelo menos uma opção para o status")
            return
        }

        setIsLoading(true)
        try {
            const result = await addColumnToTableBlock(serviceId, tableBlockId, {
                name,
                type,
                options: type === 'status' ? options : []
            })

            if (result.success) {
                toast.success("Coluna adicionada com sucesso!")
                setName("")
                setType("text")
                setOptions([])
                onOpenChange(false)
                onSuccess?.()
                window.location.reload()
            } else {
                toast.error("Erro ao adicionar coluna: " + result.error)
            }
        } catch (error: any) {
            console.error(error)
            toast.error("Erro inesperado.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Coluna</DialogTitle>
                    <DialogDescription>
                        Crie uma nova coluna nesta tabela.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Tipo
                        </Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="currency">Moeda (R$)</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                                <SelectItem value="status">Status (Etiqueta)</SelectItem>
                                <SelectItem value="boolean">Sim/Não (Checkbox)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === 'status' && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Opções</Label>
                            <div className="col-span-3 space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        value={newOption}
                                        onChange={(e) => setNewOption(e.target.value)}
                                        onKeyDown={handleAddOption}
                                        placeholder="Nova opção (Enter)"
                                    />
                                    <Button type="button" onClick={handleAddOption} variant="secondary">
                                        +
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {options.map((opt) => (
                                        <div key={opt} className="bg-slate-100 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                            <span>{opt}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeOption(opt)}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !name.trim()}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Adicionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
