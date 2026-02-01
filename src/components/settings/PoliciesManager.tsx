"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Code, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useService } from "@/contexts/ServiceContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type AccessPolicy = {
    id: string
    name: string
    description: string | null
    filter_logic: FilterLogic
    service_id?: string
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

interface PoliciesManagerProps {
    serviceId?: string
}

export function PoliciesManager({ serviceId }: PoliciesManagerProps) {
    const [policies, setPolicies] = useState<AccessPolicy[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const supabase = createClient()
    const { services } = useService()

    // Get current service columns if serviceId is provided
    const currentService = services.find(s => s.id === serviceId)
    // The columns_config array contains the defined columns. Assuming all present are valid/active.
    // Based on Config page, there is no 'active' boolean in the type, so we use the array as is.
    const activeColumns = (currentService?.columns_config as ColumnConfig[]) || []

    // Form State
    const [name, setName] = useState("")
    const [column, setColumn] = useState("")
    const [operator, setOperator] = useState<string>("eq")
    const [value, setValue] = useState("")

    useEffect(() => {
        fetchPolicies()
    }, [serviceId])

    const fetchPolicies = async () => {
        setIsLoading(true)
        let query = supabase.from("access_policies").select("*").order("name")

        // If we are in a specific service context, show policies for that service OR global ones (if any)
        // For now, let's assume policies are strictly per-service if serviceId is provided.
        if (serviceId) {
            query = query.eq("service_id", serviceId)
        } else {
            // If global (e.g. from main settings without service context), maybe show all?
            // Or maybe AccessControlView is only used within a service context now per user request?
            // User asked for "columns of the spreadsheet being configured", implying strict service context.
        }

        const { data, error } = await query
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

        if (!serviceId) {
            toast.error("Erro: Contexto do serviço não encontrado")
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
                filter_logic: logic,
                service_id: serviceId
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

    const [policyToDelete, setPolicyToDelete] = useState<string | null>(null)

    const deletePolicy = (id: string) => {
        setPolicyToDelete(id)
    }

    const confirmDeletePolicy = async () => {
        if (!policyToDelete) return
        const { error } = await supabase.from("access_policies").delete().eq("id", policyToDelete)
        if (error) {
            toast.error("Erro ao excluir")
        } else {
            setPolicies(policies.filter(p => p.id !== policyToDelete))
            toast.success("Critério excluído")
        }
        setPolicyToDelete(null)
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
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">Critérios Definidos</h3>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[400px] p-4 text-sm leading-relaxed">
                                    <div className="space-y-3">
                                        <p className="font-semibold text-base">📘 Como funcionam os Critérios de Acesso?</p>
                                        <p>
                                            Os critérios funcionam como <strong>filtros de segurança</strong> que restringem quais linhas da planilha um usuário pode ver.
                                        </p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Você cria uma regra (ex: "Apenas Secretaria de Saúde").</li>
                                            <li>A regra define que a coluna <strong>Secretaria</strong> deve ser igual a <strong>SAUDE</strong>.</li>
                                            <li>Ao convidar um usuário (botão Compartilhar), você seleciona essa regra.</li>
                                        </ul>
                                        <div className="bg-slate-100 p-2 rounded border border-slate-200 text-slate-700">
                                            <p className="font-medium text-xs uppercase mb-1">💡 Dica Avançada</p>
                                            <p>
                                                Use <strong>{"{{user_name}}"}</strong> no campo "Valor" para criar regras dinâmicas.
                                                <br />
                                                <em>Exemplo:</em> Se você criar a regra com Coluna="Responsavel" e Valor="{"{{user_name}}"}":
                                                <br />
                                                O usuário "João" verá apenas as linhas onde Responsável é "João".
                                                <br />
                                                A usuária "Maria" verá apenas as linhas onde Responsável é "Maria".
                                            </p>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {serviceId ? `Regras para o serviço: ${currentService?.name}` : "Selecione um serviço para gerenciar regras."}
                    </p>
                </div>
                {serviceId && (
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
                                            <Select value={column} onValueChange={setColumn}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione uma coluna..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeColumns.map(col => (
                                                        <SelectItem key={col.id} value={col.key || col.id}>
                                                            {col.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Coluna que será verificada.</p>
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
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>Use <strong>{"{{user_name}}"}</strong> para pegar o nome do usuário logado.</p>
                                            <p>Ex: Se a coluna for "Responsavel", o valor <strong>{"{{user_name}}"}</strong> mostrará apenas as linhas onde o responsável é o usuário atual.</p>
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={createPolicy} className="w-full">Salvar Critério</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
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
                        {serviceId ? "Nenhum critério definido para este serviço." : "Selecione um serviço para ver os critérios."}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!policyToDelete}
                onOpenChange={(open) => !open && setPolicyToDelete(null)}
                onConfirm={confirmDeletePolicy}
                title="Excluir Critério?"
                description="Tem certeza que deseja remover este critério de acesso? Isso pode afetar a visibilidade de dados para alguns usuários."
                variant="destructive"
            />
        </div>
    )
}
