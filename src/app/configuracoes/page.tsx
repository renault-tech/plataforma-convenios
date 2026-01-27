"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Plus, Trash2, Save, X, Settings as SettingsIcon, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useService, Service } from "@/contexts/ServiceContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// --- Types ---
type ColumnType = 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean'

interface ColumnConfig {
    id: string
    label: string
    type: ColumnType
    required?: boolean
    options?: string[] // For select/status types
}

interface ServiceData {
    name: string
    primary_color: string
    columns_config: ColumnConfig[]
}

export default function ConfiguracoesPage() {
    const { services, refreshServices } = useService()
    const [activeTab, setActiveTab] = useState<string>("new")
    const [isLoading, setIsLoading] = useState(false)

    // Set initial active tab when services load
    useEffect(() => {
        if (services.length > 0 && activeTab === "new" && !isLoading) {
            // Keep 'new' or select first? User didn't specify default.
            // Usually selecting the first service is better UX if services exist.
            if (services.length > 0) setActiveTab(services[0].id);
        }
    }, [services.length]) // Only run when length changes to avoid forcing reset on every update

    const handleTabChange = (value: string) => {
        setActiveTab(value)
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

                    {/* Service Tabs (Inline with Title) */}
                    <div className="flex flex-wrap items-center gap-2">
                        {services.map((service) => (
                            <Button
                                key={service.id}
                                variant={activeTab === service.id ? "default" : "outline"}
                                className={cn(
                                    "h-9 px-4 rounded-full transition-colors font-medium",
                                    activeTab === service.id
                                        ? "text-white hover:opacity-90 border-transparent shadow-sm"
                                        : "hover:bg-slate-100 text-slate-600 border-slate-200"
                                )}
                                style={activeTab === service.id ? { backgroundColor: service.primary_color } : {}}
                                onClick={() => handleTabChange(service.id)}
                            >
                                {service.name}
                            </Button>
                        ))}
                        <Button
                            variant={activeTab === "new" ? "default" : "secondary"}
                            className={cn(
                                "h-9 px-4 rounded-full gap-2 border shadow-sm",
                                activeTab === "new" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-slate-900 hover:bg-slate-50 border-slate-200"
                            )}
                            onClick={() => handleTabChange("new")}
                        >
                            <Plus className="h-4 w-4" />
                            Novo Serviço
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-2">
                {activeTab === "new" ? (
                    <CreateServiceForm onSuccess={(id) => setActiveTab(id)} />
                ) : (
                    <ServiceConfigView
                        serviceId={activeTab}
                        key={activeTab} // Force re-mount on tab change to reset state
                    />
                )}
            </div>
        </div>
    )
}

// --- Sub-Components ---

function CreateServiceForm({ onSuccess }: { onSuccess: (id: string) => void }) {
    const { createService } = useService()
    const [loading, setLoading] = useState(false)
    const form = useForm<ServiceData>({
        defaultValues: {
            name: "",
            primary_color: "#000000",
            columns_config: []
        }
    })

    const onSubmit = async (data: ServiceData) => {
        setLoading(true)
        try {
            const slug = data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-')
            const newService = await createService({
                ...data,
                slug,
                icon: "FileText" // Default icon
            })

            if (newService) {
                onSuccess(newService.id)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-xl">
            <CardHeader>
                <CardTitle>Criar Novo Serviço</CardTitle>
                <CardDescription>Defina o nome e a cor de identificação do novo serviço.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Nome do Serviço</Label>
                        <Input {...form.register("name", { required: true })} placeholder="Ex: Contratos, Convênios, Licitações..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Cor de Identificação</Label>
                        <div className="flex gap-3 items-center">
                            <Input
                                type="color"
                                {...form.register("primary_color")}
                                className="w-16 h-12 p-1 cursor-pointer"
                            />
                            <div className="flex-1 text-sm text-muted-foreground">
                                Escolha uma cor para diferenciar este serviço nos relatórios e navegação.
                            </div>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Criando..." : "Criar Serviço"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function ServiceConfigView({ serviceId }: { serviceId: string }) {
    const { services, updateService, deleteService } = useService()
    const service = services.find(s => s.id === serviceId)

    // RHF for managing the active columns list (robust array manipulation)
    const { control, handleSubmit, reset } = useForm<{ columns_config: ColumnConfig[] }>({
        defaultValues: {
            columns_config: service?.columns_config || []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "columns_config",
        keyName: "_rid" // Use a custom key name to avoid conflict with 'id' property in data
    });

    // Local state for the "Add New Column" form
    const [newColName, setNewColName] = useState("")
    const [newColType, setNewColType] = useState<ColumnType>("text")
    const [editingIndex, setEditingIndex] = useState<number | null>(null) // Track which item is being edited

    useEffect(() => {
        if (service) {
            reset({
                columns_config: service.columns_config || []
            })
        }
    }, [service, reset])

    if (!service) return <div>Serviço não encontrado.</div>

    // --- Handlers ---

    const handleAddColumn = () => {
        if (!newColName.trim()) return

        // If editing
        if (editingIndex !== null) {
            const currentField = fields[editingIndex] as any;

            // Update the field at editingIndex
            // We keep the SAME ID to avoid breaking existing data linkage
            const updatedColumn: ColumnConfig = {
                id: currentField.id,
                label: newColName.trim(),
                type: newColType,
                required: currentField.required || false
            }

            // Move the logic to update specific index
            // Since useFieldArray doesn't have a direct 'update' that triggers re-render easily for deep nested in some versions, 
            // we remove and insert, BUT 'update' is standard if available. 
            // For simplicity and safety with RHF versions:
            const currentFields = [...fields];
            currentFields[editingIndex] = updatedColumn as any;
            reset({ columns_config: currentFields });

            setEditingIndex(null)
            setNewColName("")
            setNewColType("text")

            // Trigger save
            setTimeout(() => handleSubmit(saveChanges)(), 10);
            return;
        }

        // Generate ID
        const id = newColName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '_')

        // Check for duplicates in current fields
        if (fields.some((f: any) => f.id === id)) {
            toast.error("Já existe uma coluna com este nome.")
            return
        }

        const newColumn: ColumnConfig = {
            id,
            label: newColName.trim(),
            type: newColType,
            required: false
        } as any

        // Add to RHF state
        append(newColumn)

        // Reset local form
        setNewColName("")
        setNewColType("text")

        // Trigger save immediately
        handleSubmit(saveChanges)()
    }

    const handleEditColumn = (index: number) => {
        const field = fields[index] as any
        setNewColName(field.label)
        setNewColType(field.type || 'text') // Default to text if missing
        setEditingIndex(index)
    }

    const handleCancelEdit = () => {
        setNewColName("")
        setNewColType("text")
        setEditingIndex(null)
    }

    const handleDeleteColumn = (index: number) => {
        if (editingIndex === index) handleCancelEdit();
        remove(index)
        // Trigger save immediately after state update (using a small timeout to let RHF update state)
        setTimeout(() => handleSubmit(saveChanges)(), 10);
    }

    // Main Save Handler
    const saveChanges = async (data: { columns_config: ColumnConfig[] }) => {
        try {
            await updateService(service.id, {
                columns_config: data.columns_config
            })
            toast.success("Configuração salva!")
        } catch (e) {
            toast.error("Erro ao salvar alterações.")
            console.error(e)
        }
    }

    const handleDeleteService = async () => {
        // Double confirmation for safety
        if (confirm(`Tem certeza que deseja excluir o serviço "${service.name}"?`)) {
            if (confirm("Esta ação apagará TODOS os dados e configurações deste serviço e não pode ser desfeita. Confirmar exclusão?")) {
                await deleteService(service.id)
                toast.success("Serviço excluído.")
            }
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Main Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Add/Edit Column Form */}
                <Card className={editingIndex !== null ? "border-blue-500 ring-1 ring-blue-500" : ""}>
                    <CardHeader>
                        <CardTitle>{editingIndex !== null ? "Editar Coluna" : "Adicionar Nova Coluna"}</CardTitle>
                        <CardDescription>
                            {editingIndex !== null ? "Editando campo existente." : "Crie novos campos para o formulário e tabela."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome do Campo</Label>
                            <Input
                                value={newColName}
                                onChange={(e) => setNewColName(e.target.value)}
                                placeholder="Ex: Processo SEI"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddColumn()
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Dado</Label>
                            <Select
                                value={newColType}
                                onValueChange={(v) => setNewColType(v as ColumnType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Texto</SelectItem>
                                    <SelectItem value="number">Número</SelectItem>
                                    <SelectItem value="currency">Moeda (R$)</SelectItem>
                                    <SelectItem value="date">Data</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button
                                className={cn("flex-1", editingIndex !== null ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800")}
                                onClick={handleAddColumn}
                                disabled={!newColName.trim()}
                            >
                                {editingIndex !== null ? (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Alteração
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Campo
                                    </>
                                )}
                            </Button>

                            {editingIndex !== null && (
                                <Button variant="outline" onClick={handleCancelEdit}>
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Active Columns List */}
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Colunas Ativas</CardTitle>
                                <CardDescription>Estrutura atual do formulário.</CardDescription>
                            </div>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteService}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Excluir Serviço
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {/* Header Row */}
                            <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground bg-slate-50 px-4 py-2">
                                <div className="col-span-6">CAMPO</div>
                                <div className="col-span-4">TIPO</div>
                                <div className="col-span-2 text-right">AÇÕES</div>
                            </div>

                            {/* List Rows */}
                            {fields.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    Nenhuma coluna configurada.
                                </div>
                            )}

                            {fields.map((field: any, index) => (
                                <div
                                    key={field._rid}
                                    className={cn(
                                        "grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50 transition-colors group",
                                        editingIndex === index ? "bg-blue-50 hover:bg-blue-50" : ""
                                    )}
                                >
                                    <div className="col-span-6 font-medium text-sm truncate pr-2 text-slate-700" title={field.label}>
                                        {field.label}
                                    </div>
                                    <div className="col-span-4 flex items-center">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
                                            !field.type ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                        )}>
                                            {!field.type ? 'Sem Tipo' :
                                                field.type === 'currency' ? 'Moeda' :
                                                    field.type === 'date' ? 'Data' :
                                                        field.type === 'number' ? 'Número' :
                                                            field.type === 'text' ? 'Texto' :
                                                                field.type === 'status' ? 'Status' : field.type}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 transition-all hover:bg-blue-100 hover:text-blue-600",
                                                editingIndex === index ? "text-blue-600 opacity-100" : "text-slate-400 opacity-0 group-hover:opacity-100"
                                            )}
                                            onClick={() => handleEditColumn(index)}
                                            title="Editar coluna"
                                        >
                                            <SettingsIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => handleDeleteColumn(index)}
                                            title="Excluir coluna"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
