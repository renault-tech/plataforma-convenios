"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Code } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type AccessPolicy = {
    id: string
    name: string
    description: string | null
    filter_logic: FilterLogic
}

type FilterLogic = {
    column: string
    operator: 'eq' | 'neq' | 'ilike' | 'gt' | 'lt'
    value: string
}

const OPERATORS = [
    { value: 'eq', label: 'Igual a (=)' },
    { value: 'neq', label: 'Diferente de (!=)' },
    { value: 'ilike', label: 'Contém (Texto)' },
]

export function PoliciesManager() {
    const [policies, setPolicies] = useState<AccessPolicy[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const supabase = createClient()

    // Form State
    const [name, setName] = useState("")
    const [column, setColumn] = useState("")
    const [operator, setOperator] = useState<string>("eq")
    const [value, setValue] = useState("")

    useEffect(() => {
        fetchPolicies()
    }, [])

    const fetchPolicies = async () => {
        setIsLoading(true)
        const { data, error } = await supabase.from("access_policies").select("*").order("name")
        if (error) {
            toast.error("Erro ao carregar políticas")
        } else {
            setPolicies(data || [])
        }
        setIsLoading(false)
    }

    const createPolicy = async () => {
        if (!name.trim() || !column.trim() || !value.trim()) {
            toast.error("Preencha todos os campos")
            return
        }

        const logic: FilterLogic = {
            column: column.trim(),
            operator: operator as any,
            value: value.trim()
        }

        const { data, error } = await supabase
            .from("access_policies")
            .insert({
                name: name.trim(),
                filter_logic: logic
            })
            .select()
            .single()

        if (error) {
            toast.error("Erro ao criar critério")
        } else {
            setPolicies([...policies, data])
            resetForm()
            setIsCreating(false)
            toast.success("Critério criado com sucesso!")
        }
    }

    const deletePolicy = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este critério?")) return

        const { error } = await supabase.from("access_policies").delete().eq("id", id)
        if (error) {
            toast.error("Erro ao excluir")
        } else {
            setPolicies(policies.filter(p => p.id !== id))
            toast.success("Critério excluído")
        }
    }

    const resetForm = () => {
        setName("")
        setColumn("")
        setOperator("eq")
        setValue("")
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Critérios Definidos</h3>
                    <p className="text-sm text-muted-foreground">Regras para filtrar visualização de dados.</p>
                </div>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" /> Novo Critério</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Novo Critério de Acesso</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome do Critério</Label>
                                <Input placeholder="Ex: Apenas Secretaria de Saúde" value={name} onChange={e => setName(e.target.value)} />
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Lógica do Filtro</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Coluna da Planilha</Label>
                                        <Input placeholder="Ex: secretaria" value={column} onChange={e => setColumn(e.target.value)} />
                                        <p className="text-xs text-muted-foreground">Nome exato da coluna na planilha.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Operador</Label>
                                        <Select value={operator} onValueChange={setOperator}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {OPERATORS.map(op => (
                                                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor Esperado</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="Ex: SAUDE" value={value} onChange={e => setValue(e.target.value)} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Use <strong>{"{{user_name}}"}</strong> para pegar o nome do usuário logado dinamicamente.
                                        <br />Ex: Se a coluna for "Responsavel", valor {"{{user_name}}"} mostrará apenas linhas do "João".
                                    </p>
                                </div>
                            </div>

                            <Button onClick={createPolicy} className="w-full">Salvar Critério</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map(policy => (
                    <Card key={policy.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base">{policy.name}</CardTitle>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => deletePolicy(policy.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <CardDescription className="font-mono text-xs bg-slate-100 p-2 rounded mt-2">
                                {policy.filter_logic.column} {policy.filter_logic.operator === 'eq' ? '==' : policy.filter_logic.operator} "{policy.filter_logic.value}"
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
                {policies.length === 0 && !isLoading && (
                    <div className="col-span-full text-center py-10 border border-dashed rounded-lg text-muted-foreground">
                        Nenhum critério definido.
                    </div>
                )}
            </div>
        </div>
    )
}
