"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, DollarSign, CheckCircle2, LayoutDashboard, Plus, Sparkles, BarChart3, PieChart, TrendingUp, Activity, AlertOctagon, HelpCircle, CalendarOff, Users, ShieldCheck } from "lucide-react"
import { useInbox } from "@/contexts/InboxContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PresetWidget {
    key: string
    title: string
    description: string
    icon: any
    type: 'preset'
}

const PRESET_WIDGETS: PresetWidget[] = [
    {
        key: 'alerts_widget',
        title: 'Prazos e Alertas',
        description: 'Contagem de alertas pendentes e vencidos',
        icon: Bell,
        type: 'preset'
    },
    {
        key: 'stats_users',
        title: 'Total de Usuários',
        description: 'Usuários cadastrados na plataforma',
        icon: Users, // Need import
        type: 'preset'
    },
    {
        key: 'stats_services',
        title: 'Serviços Ativos',
        description: 'Convênios e serviços em operação',
        icon: ShieldCheck, // Need import
        type: 'preset'
    },
    {
        key: 'chart_growth',
        title: 'Crescimento',
        description: 'Gráfico de novos usuários e serviços',
        icon: TrendingUp,
        type: 'preset'
    },
    {
        key: 'chart_distribution',
        title: 'Distribuição',
        description: 'Tipos de usuários e serviços',
        icon: PieChart, // Need import
        type: 'preset'
    },
    {
        key: 'consolidated_progress',
        title: 'Progresso Geral',
        description: 'Visão consolidada de status (Pendente, Em Execução, Concluído)',
        icon: BarChart3,
        type: 'preset'
    },
    {
        key: 'activity_feed',
        title: 'Atividade Recente',
        description: 'Timeline de eventos do sistema',
        icon: Activity,
        type: 'preset'
    }
]

interface WidgetGalleryProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddWidget: (id: string) => void
    existingWidgets: string[]
}

export function WidgetGallery({ open, onOpenChange, onAddWidget, existingWidgets }: WidgetGalleryProps) {
    const { metrics } = useInbox()
    const { statusGroups } = metrics

    const handleAdd = (id: string) => {
        onAddWidget(id)
        toast.success("Widget adicionado ao painel!")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Galeria de Widgets</DialogTitle>
                    <DialogDescription>
                        Personalize seu painel com indicadores e atalhos.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="available" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="available">Padrões</TabsTrigger>
                        <TabsTrigger value="status">Por Status</TabsTrigger>
                    </TabsList>

                    <TabsContent value="available" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PRESET_WIDGETS.map((widget) => {
                                const Icon = widget.icon
                                const isAdded = existingWidgets.includes(widget.key)

                                return (
                                    <button
                                        key={widget.key}
                                        onClick={() => handleAdd(widget.key)}
                                        disabled={isAdded}
                                        className={cn(
                                            "flex flex-col items-start p-5 rounded-xl border text-left transition-all h-full relative group",
                                            isAdded
                                                ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                                                : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-1"
                                        )}
                                    >
                                        <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900 mb-1 text-lg">{widget.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{widget.description}</p>
                                        {isAdded && (
                                            <div className="mt-auto pt-3 text-xs font-medium text-blue-600 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Adicionado
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="status" className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                Widgets de Status
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                                Estes widgets são gerados automaticamente baseados nos status das suas planilhas.
                            </p>
                        </div>

                        {statusGroups.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                Nenhum status encontrado nas suas planilhas ainda.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {statusGroups.map((group) => {
                                    const widgetId = `status-${group.status}`
                                    const isAdded = existingWidgets.includes(widgetId)

                                    return (
                                        <button
                                            key={widgetId}
                                            onClick={() => handleAdd(widgetId)}
                                            disabled={isAdded}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                                                isAdded
                                                    ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                                                    : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md"
                                            )}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white"
                                                style={{ backgroundColor: group.color || '#cbd5e1' }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-slate-900 truncate">{group.status}</h3>
                                                <p className="text-sm text-slate-500">{group.count} itens</p>
                                            </div>
                                            {!isAdded && <Plus className="w-4 h-4 text-slate-400" />}
                                            {isAdded && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
