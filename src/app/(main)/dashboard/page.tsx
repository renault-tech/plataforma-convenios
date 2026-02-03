"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, AlertCircle, Activity, HelpCircle, X, LayoutDashboard, AlertOctagon, CalendarOff, PlusCircle } from "lucide-react"
import { useService } from "@/contexts/ServiceContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format, subMonths, isAfter, isBefore, addDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useTutorial } from "@/hooks/useTutorial"
import { toast } from "sonner"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts"

// Widgets
import { WidgetGallery } from "@/components/inbox/WidgetGallery"
import { DateTimeWidget } from "@/components/inbox/DateTimeWidget"
import { AlertSettingsDialog } from "@/components/inbox/AlertSettingsDialog"
import { CardDetailModal } from "@/components/inbox/CardDetailModal"
import { ServiceQuickButtons } from "@/components/services/ServiceQuickButtons"

// Drag and Drop
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Wrapper ---
function SortableWidget({ id, children, onRemove, onClick }: { id: string, children: React.ReactNode, onRemove: () => void, onClick?: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="relative group h-full cursor-move"
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-50 hover:text-red-500 shadow-sm border border-slate-100 cursor-pointer"
            >
                <X className="w-3.5 h-3.5" />
            </button>
            <div className="h-full hover:shadow-md transition-shadow rounded-xl hover:ring-2 hover:ring-slate-200/50" onClick={onClick}>
                {children}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { services, activeService, setActiveService } = useService()
    const { startTutorial } = useTutorial()
    const supabase = createClient()

    // Data State (Original Logic)
    const [dashboardData, setDashboardData] = useState({
        totalCount: 0,
        totalValue: 0,
        expiringCount: 0,
        expiring90Count: 0,
        activeCount: 0,
        monthlyData: [] as any[],
        recentActivity: [] as any[]
    })
    const [items, setItems] = useState<any[]>([]) // Restore items state for generic widgets
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Widget State
    const [showWidgetGallery, setShowWidgetGallery] = useState(false)
    // Mapeamento: 'total' (custom), 'values', 'active', 'alerts' (expiring)
    const [cardOrder, setCardOrder] = useState<string[]>([])
    const [selectedCard, setSelectedCard] = useState<string | null>(null)
    const [showAlertSettings, setShowAlertSettings] = useState(false)

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        setIsMounted(true)
        // Auto-start tutorial specific for dashboard
        setTimeout(() => startTutorial(false), 1000)
    }, [])

    // Load Data
    useEffect(() => {
        async function loadDashboardData() {
            if (!activeService) return
            setIsLoadingData(true)

            try {
                const { data: items, error } = await supabase
                    .from('items')
                    .select('*')
                    .eq('service_id', activeService.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                if (!items) return

                setItems(items) // Store raw items for widgets

                // 1. Identify columns
                const cols = activeService.columns_config || []
                let dateCol = cols.find((c: any) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
                if (!dateCol) dateCol = cols.find((c: any) => c.type === 'date')?.id

                let currencyCol = cols.find((c: any) => c.type === 'currency' && /valor|total|preço|montante/i.test(c.label))?.id
                if (!currencyCol) currencyCol = cols.find((c: any) => c.type === 'currency')?.id

                let statusCol = cols.find((c: any) => c.type === 'status')?.id

                // 2. Calculate
                let totalVal = 0
                let expiring = 0
                let expiring90 = 0
                let active = 0
                const today = new Date()
                const next30Days = addDays(today, 30)
                const next90Days = addDays(today, 90)

                items.forEach(item => {
                    const itemData = item.data || {}
                    if (currencyCol && itemData[currencyCol]) {
                        totalVal += Number(itemData[currencyCol]) || 0
                    }
                    if (dateCol && itemData[dateCol]) {
                        try {
                            const itemDate = parseISO(itemData[dateCol])
                            if (isAfter(itemDate, today)) {
                                if (isBefore(itemDate, next30Days)) expiring++
                                else if (isBefore(itemDate, next90Days)) expiring90++
                            }
                        } catch (e) { }
                    }
                    const created = new Date(item.created_at)
                    if (isAfter(created, subMonths(today, 1))) active++
                })

                // 3. Monthly Data
                const monthsMap = new Map()
                for (let i = 5; i >= 0; i--) {
                    const d = subMonths(new Date(), i)
                    const key = format(d, 'MMM', { locale: ptBR })
                    monthsMap.set(key, 0)
                }
                items.forEach(item => {
                    try {
                        const d = parseISO(item.created_at)
                        const key = format(d, 'MMM', { locale: ptBR })
                        if (monthsMap.has(key)) monthsMap.set(key, monthsMap.get(key) + 1)
                    } catch (e) { }
                })
                const monthlyData = Array.from(monthsMap.entries()).map(([name, total]) => ({ name, total }))

                // 4. Recent
                const recentActivity = items.slice(0, 5).map(item => ({
                    id: item.id,
                    title: item.data[cols.find((c: any) => c.type === 'text')?.id || ''] || 'Item sem título',
                    status: statusCol ? item.data[statusCol] : 'Registrado',
                    created_at: item.created_at
                }))

                setDashboardData({
                    totalCount: items.length,
                    totalValue: totalVal,
                    expiringCount: expiring,
                    expiring90Count: expiring90,
                    activeCount: active,
                    monthlyData,
                    recentActivity
                })
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoadingData(false)
            }
        }
        loadDashboardData()
    }, [activeService, supabase])

    // Load Order
    useEffect(() => {
        if (!activeService?.id) return
        const savedKey = `dashboard-${activeService.id}-card-order`
        // Default using generic IDs that match inbox logic where possible or custom ones
        // 'total' is specific to dashboard but we can use 'consolidated_progress' or map it
        // The user wants ORIGINAL cards. 
        // We will support: 'total', 'values', 'active', 'alerts'
        const defaultWidgets = ['total', 'values', 'alerts', 'active']

        try {
            const saved = localStorage.getItem(savedKey)
            if (saved) setCardOrder(JSON.parse(saved))
            else setCardOrder(defaultWidgets)
        } catch {
            setCardOrder(defaultWidgets)
        }
    }, [activeService?.id])

    // Handlers
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setCardOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                if (activeService?.id) localStorage.setItem(`dashboard-${activeService.id}-card-order`, JSON.stringify(newOrder))
                return newOrder;
            });
        }
    }

    const handleAddWidget = (id: string) => {
        if (cardOrder.includes(id)) return toast.info("Widget já adicionado")
        const newOrder = [...cardOrder, id]
        setCardOrder(newOrder);
        if (activeService?.id) localStorage.setItem(`dashboard-${activeService.id}-card-order`, JSON.stringify(newOrder))
        setShowWidgetGallery(false)
    }

    const handleRemoveWidget = (id: string) => {
        const newOrder = cardOrder.filter(w => w !== id)
        setCardOrder(newOrder);
        if (activeService?.id) localStorage.setItem(`dashboard-${activeService.id}-card-order`, JSON.stringify(newOrder))
    }

    // --- Helpers for Generic Widgets ---
    const getDateColumns = () => activeService?.columns_config?.filter((c: any) => c.type === 'date') || []

    const getWidgetItems = (widgetId: string) => {
        if (!items) return []
        switch (widgetId) {
            case 'updates':
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                return items.filter(i => new Date(i.created_at) > sevenDaysAgo)
            case 'priority_high':
                return items.filter(i => Object.values(i).some((val: any) =>
                    typeof val === 'string' && (val.toLowerCase().includes('alta') || val.toLowerCase().includes('urgente'))
                ))
            case 'no_deadline':
                const dateCols = getDateColumns()
                if (dateCols.length === 0) return []
                return items.filter(i => dateCols.every((col: any) => !i[col.key]))
            case 'alerts':
                const today = new Date()
                const next90Days = addDays(today, 90)
                const dateCol = activeService?.columns_config?.find((c: any) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
                    || activeService?.columns_config?.find((c: any) => c.type === 'date')?.id
                if (!dateCol) return []
                return items.filter(i => {
                    const val = i.data?.[dateCol]
                    if (!val) return false
                    try {
                        const d = parseISO(val)
                        return isAfter(d, today) && isBefore(d, next90Days)
                    } catch { return false }
                }).sort((a, b) => new Date(a.data[dateCol]).getTime() - new Date(b.data[dateCol]).getTime())
            case 'values':
                const currencyCol = activeService?.columns_config?.find((c: any) => c.type === 'currency' && /valor|total|preço/i.test(c.label))?.id
                    || activeService?.columns_config?.find((c: any) => c.type === 'currency')?.id
                if (!currencyCol) return []
                return items.filter(i => Number(i.data?.[currencyCol]) > 0).sort((a, b) => Number(b.data[currencyCol]) - Number(a.data[currencyCol]))
            case 'active':
                const monthAgo = subMonths(new Date(), 1)
                // Usar status se houver, senão data de criação
                const statusCol = activeService?.columns_config?.find((c: any) => c.type === 'status')?.id
                if (statusCol) {
                    return items.filter(i => {
                        const s = String(i.data?.[statusCol] || '').toLowerCase()
                        return ['ativo', 'execução', 'andamento'].some(k => s.includes(k))
                    })
                }
                return items.filter(i => isAfter(new Date(i.created_at), monthAgo))
            case 'total':
                return items
            default: return []
        }
    }

    const getCardConfig = (id: string) => {
        // Default config
        let conf = { title: 'Widget', icon: Activity, value: 0, sub: 'Itens' }

        if (id === 'updates') {
            conf = {
                title: 'Atualizações',
                icon: LayoutDashboard,
                value: getWidgetItems('updates').length,
                sub: 'Esta semana'
            }
        } else if (id === 'priority_high') {
            conf = {
                title: 'Alta Prioridade',
                icon: AlertOctagon,
                value: getWidgetItems('priority_high').length,
                sub: 'Urgentes'
            }
        } else if (id === 'no_deadline') {
            conf = {
                title: 'Sem Prazo',
                icon: CalendarOff,
                value: getWidgetItems('no_deadline').length,
                sub: 'Itens sem data'
            }
        } else if (id.startsWith('status-')) {
            const statusName = id.replace('status-', '')
            const count = items.filter(i => Object.values(i).some(v => v === statusName)).length
            conf = {
                title: statusName,
                icon: Activity, // Or dynamic icon if available
                value: count,
                sub: 'Itens com status'
            }
        }
        return conf
    }



    if (!isMounted) return null
    if (!activeService) return <div className="p-10 text-center text-slate-500">Selecione um serviço</div>

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Widget Gallery Dialog (Hidden) */}
            <WidgetGallery
                open={showWidgetGallery}
                onOpenChange={setShowWidgetGallery}
                existingWidgets={cardOrder}
                onAddWidget={handleAddWidget}
            />

            <AlertSettingsDialog open={showAlertSettings} onOpenChange={setShowAlertSettings} />

            <CardDetailModal
                open={!!selectedCard}
                onOpenChange={(open) => !open && setSelectedCard(null)}
                title={
                    selectedCard === 'alerts' ? 'Próximos Vencimentos' :
                        selectedCard === 'values' ? 'Composição dos Valores' :
                            selectedCard === 'active' ? 'Itens em Execução' :
                                selectedCard === 'updates' ? 'Atualizações da Semana' :
                                    selectedCard === 'total' ? 'Todos os Registros' :
                                        (getCardConfig(selectedCard || '').title || 'Detalhes')
                }
                description="Listagem completada dos itens relacionados."
                items={getWidgetItems(selectedCard || '').map(i => ({
                    ...i,
                    service_slug: activeService?.slug,
                    service_name: activeService?.name,
                    service_color: activeService?.primary_color
                }))}
                type={selectedCard as any}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div
                    id="dashboard-header"
                    data-tour-group="dashboard"
                    data-tour-title="Dashboard Geral"
                    data-tour-desc="Aqui você tem uma visão geral de todos os indicadores do serviço selecionado."
                    data-tour-order="1"
                >
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        Visão analítica de <strong style={{ color: activeService.primary_color }}>{activeService.name}</strong>
                    </p>
                </div>
                <div
                    className="flex items-center gap-3"
                    data-tour-group="dashboard"
                    data-tour-title="Widgets & Personalização"
                    data-tour-desc="Clique no relógio para adicionar novos widgets. Arraste os cards para organizar seu painel como preferir."
                    data-tour-order="2"
                >
                    {/* The explicit Add Button is removed as requested */}
                    {/* Tutorial Help Button logic can be here if needed */}
                    <button
                        onClick={() => startTutorial(true)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-full transition-colors hidden" // Hidden to reduce clutter since we have global help
                        title="Tutorial"
                    >
                        <HelpCircle className="h-5 w-5" />
                    </button>
                    <DateTimeWidget onAddWidget={() => setShowWidgetGallery(true)} />
                </div>
            </div>

            {/* Service Quick Buttons */}
            <div
                data-tour-group="dashboard"
                data-tour-title="Atalhos de Planilhas"
                data-tour-desc="Acesse rapidamente suas planilhas através destes botões."
                data-tour-order="3"
            >
                <ServiceQuickButtons />
            </div>

            {/* Draggable Widgets Grid */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {cardOrder.map(cardId => {
                            // RENDER ORIGINAL CARDS
                            if (cardId === 'total' || cardId === 'consolidated_progress') {
                                return (
                                    <SortableWidget key={cardId} id={cardId} onRemove={() => handleRemoveWidget(cardId)} onClick={() => setSelectedCard('total')}>
                                        <Card className="h-full">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{dashboardData.totalCount}</div>
                                                <p className="text-xs text-muted-foreground">Itens cadastrados</p>
                                                <div className="h-[35px] w-full mt-2">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={dashboardData.monthlyData.length ? dashboardData.monthlyData : [{ value: 0 }]}>
                                                            <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                                                            <Tooltip cursor={false} content={() => null} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </SortableWidget>
                                )
                            }
                            if (cardId === 'values') {
                                return (
                                    <SortableWidget key={cardId} id={cardId} onRemove={() => handleRemoveWidget(cardId)} onClick={() => setSelectedCard('values')}>
                                        <Card className="h-full">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(dashboardData.totalValue)}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Soma financeira</p>
                                                <div className="h-[35px] w-full mt-2">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={[{ value: 100 }, { value: 120 }, { value: dashboardData.totalValue }]}>
                                                            <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                                                            <Tooltip cursor={false} content={() => null} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </SortableWidget>
                                )
                            }
                            if (cardId === 'alerts') {
                                return (
                                    <SortableWidget key={cardId} id={cardId} onRemove={() => handleRemoveWidget(cardId)} onClick={() => setSelectedCard('alerts')}>
                                        <Card className="h-full">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Próximos Vencimentos</CardTitle>
                                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="border-r pr-2">
                                                        <p className="text-[10px] text-muted-foreground">90 Dias</p>
                                                        <div className="text-lg font-bold text-yellow-600">{dashboardData.expiring90Count}</div>
                                                    </div>
                                                    <div className="pl-1">
                                                        <p className="text-[10px] text-muted-foreground">30 Dias</p>
                                                        <div className="text-lg font-bold text-red-600">{dashboardData.expiringCount}</div>
                                                    </div>
                                                </div>
                                                <div className="h-[25px] w-full mt-2">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={[{ value: 2 }, { value: dashboardData.expiringCount }, { value: 4 }]}>
                                                            <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                                                            <Tooltip cursor={false} content={() => null} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </SortableWidget>
                                )
                            }
                            if (cardId === 'active') {
                                return (
                                    <SortableWidget key={cardId} id={cardId} onRemove={() => handleRemoveWidget(cardId)} onClick={() => setSelectedCard('active')}>
                                        <Card className="h-full">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Em Execução</CardTitle>
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{dashboardData.activeCount}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    {dashboardData.totalCount > 0 ? Math.round((dashboardData.activeCount / dashboardData.totalCount) * 100) : 0}% ativos
                                                </p>
                                                <div className="h-[35px] w-full mt-2">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={[{ value: 10 }, { value: 30 }, { value: dashboardData.activeCount }]}>
                                                            <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                                                            <Tooltip cursor={false} content={() => null} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </SortableWidget>
                                )
                            }
                            // Generic/Dynamic Widgets Handling (Fallback to Active Style)
                            // Config logic moved up to scope
                            const conf = getCardConfig(cardId)

                            return (
                                <SortableWidget key={cardId} id={cardId} onRemove={() => handleRemoveWidget(cardId)} onClick={() => setSelectedCard(cardId)}>
                                    <Card className="h-full">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">{conf.title}</CardTitle>
                                            <conf.icon className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{conf.value}</div>
                                            <p className="text-xs text-muted-foreground">{conf.sub}</p>
                                            <div className="h-[35px] w-full mt-2">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={[{ value: 10 }, { value: 30 }, { value: conf.value || 1 }]}>
                                                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                                                        <Tooltip cursor={false} content={() => null} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </SortableWidget>
                            )
                        })}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Static Charts Section (Preserved Original) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card
                    className="col-span-4"
                    data-tour-group="dashboard"
                    data-tour-title="Evolução Mensal"
                    data-tour-desc="Este gráfico mostra o volume de registros criados nos últimos 6 meses."
                    data-tour-order="3"
                >
                    <CardHeader>
                        <CardTitle>Evolução Mensal</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboardData.monthlyData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={activeService.primary_color} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={activeService.primary_color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="total" stroke={activeService.primary_color} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="col-span-3"
                    data-tour-group="dashboard"
                    data-tour-title="Atividade Recente"
                    data-tour-desc="Lista dos 5 últimos itens registrados ou modificados."
                    data-tour-order="4"
                >
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {dashboardData.recentActivity.map((item: any) => (
                                <div className="flex items-center" key={item.id}>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none max-w-[200px] truncate" title={item.title}>
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.status} ({new Date(item.created_at).toLocaleDateString()})
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {dashboardData.recentActivity.length === 0 && (
                                <div className="text-sm text-center py-4 text-muted-foreground">Nenhuma atividade.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
