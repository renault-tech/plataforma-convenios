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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const result = await addColumnToTableBlock(serviceId, tableBlockId, {
                name,
                type,
                options: [] // TODO: Support options for status
            })

            if (result.success) {
                toast.success("Coluna adicionada com sucesso!")
                setName("")
                setType("text")
                onOpenChange(false)
                onSuccess?.()
                // Force reload to update UI completely if needed, but context update should handle it
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
