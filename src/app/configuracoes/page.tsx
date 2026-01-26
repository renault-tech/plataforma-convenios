"use client"

import { useForm } from "react-hook-form"
import { Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useStore, ColumnDefinition } from "@/lib/store"

export default function SettingsPage() {
    const { columns, addColumn, removeColumn } = useStore()
    const { register, handleSubmit, reset } = useForm()

    const onSubmit = (data: any) => {
        // Generate valid ID from label
        const id = data.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_')

        if (columns.some(c => c.id === id)) {
            alert("Já existe uma coluna com este nome.")
            return
        }

        addColumn({
            id,
            label: data.label,
            type: data.type,
            required: false // Default to optional for custom fields
        })
        reset()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Nova Coluna</CardTitle>
                        <CardDescription>
                            Crie novos campos para o formulário e tabela de convênios.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Nome do Campo</Label>
                                <Input id="label" placeholder="Ex: Processo SEI" {...register("label", { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de Dado</Label>
                                <select
                                    id="type"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("type", { required: true })}
                                >
                                    <option value="text">Texto</option>
                                    <option value="number">Número</option>
                                    <option value="currency">Moeda (R$)</option>
                                    <option value="date">Data</option>
                                    <option value="status">Status</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Campo
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Colunas Ativas</CardTitle>
                        <CardDescription>
                            Gerencie a estrutura da sua planilha.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campo</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {columns.map((col) => (
                                    <TableRow key={col.id}>
                                        <TableCell className="font-medium">{col.label}</TableCell>
                                        <TableCell>{col.type}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm('Tem certeza? Isso ocultará os dados desta coluna.')) {
                                                        removeColumn(col.id)
                                                    }
                                                }}
                                                disabled={['numero', 'objeto'].includes(col.id)} // Prevent deleting core fields
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
