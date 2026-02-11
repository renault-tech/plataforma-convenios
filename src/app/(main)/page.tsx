"use client"

import { useEffect, useState, Suspense } from "react"
import { useService } from "@/contexts/ServiceContext"
import { Button } from "@/components/ui/button"
import { PlusCircle, LayoutDashboard, Bell, FileText, CheckCircle2, DollarSign, BarChart3, Activity, Link as LinkIcon, Clock, ArrowRight, X, AlertOctagon, HelpCircle, CalendarOff } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useInbox, InboxProvider } from "@/contexts/InboxContext"
import { GlobalCard } from "@/components/inbox/GlobalCard"
import { CardDetailModal } from "@/components/inbox/CardDetailModal"
import { DateTimeWidget } from "@/components/inbox/DateTimeWidget"
import { WidgetGallery } from "@/components/inbox/WidgetGallery"
import { ExportDropdown } from "@/components/export/ExportDropdown"
import { AlertSettingsDialog } from "@/components/inbox/AlertSettingsDialog"
import { AlertsWidget } from "@/components/inbox/AlertsWidget"
import { DetailedDeadlineWidget } from "@/components/inbox/DetailedDeadlineWidget"
import { ConsolidatedStatusWidget } from "@/components/inbox/ConsolidatedStatusWidget"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTutorial } from "@/hooks/useTutorial"
import { getStatusCategory } from "@/lib/constants/status"
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
function SortableWidget({ id, children, onRemove, onClick }: { id: string, children: React.ReactNode, onRemove: () => void, onClick: () => void }) {
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
      <div
        onClick={onClick}
        className="h-full hover:shadow-md transition-shadow rounded-xl hover:ring-2 hover:ring-slate-200/50"
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const { services } = useService()

  if (services.length === 0) {
    return <HeroEmptyState />
  }

  return (
    <InboxProvider>
      <Suspense fallback={null}>
        <WelcomeHandler />
        <InboxDashboard services={services} />
      </Suspense>
    </InboxProvider>
  )
}

function WelcomeHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setTimeout(() => {
        toast.success("Cadastro confirmado com sucesso!", {
          description: "Seja bem-vindo(a) à plataforma. Comece criando seu primeiro serviço.",
          duration: 8000,
        })
      }, 500)
    }
  }, [searchParams])

  return null
}

function HeroEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4">
        <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
          <PlusCircle className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Bem-vindo ao GovManager
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Você ainda não tem nenhum serviço criado. Comece agora para organizar convênios, parcerias e processos da sua organização.
        </p>
      </div>

      <Link href="/configuracoes?tab=servicos">
        <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="mr-2 h-5 w-5" />
          Criar Meu Primeiro Serviço
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-10 text-left">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <LayoutDashboard className="h-8 w-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Painéis Dinâmicos</h3>
          <p className="text-sm text-slate-500">Visualize dados financeiros e prazos em tempo real.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <FileText className="h-8 w-8 text-emerald-500 mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Colunas Personalizáveis</h3>
          <p className="text-sm text-slate-500">Crie tipos de dados específicos para sua necessidade.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CheckCircle2 className="h-8 w-8 text-amber-500 mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Controle de Prazos</h3>
          <p className="text-sm text-slate-500">Receba alertas automáticos de vencimentos.</p>
        </div>
      </div>
    </div>
  )
}

function InboxDashboard({ services }: { services: any[] }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // Widget Logic
  const [showWidgetGallery, setShowWidgetGallery] = useState(false)
  const [showAlertSettings, setShowAlertSettings] = useState(false)
  const supabase = createClient()
  const { activeService } = useService()
  const { startTutorial } = useTutorial()

  // Auto-start tutorial on home page
  useEffect(() => {
    // Add a small delay to ensure widgets are rendered
    const timer = setTimeout(() => {
      startTutorial(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Using useInbox context for metrics
  const { metrics, isLoading: metricsLoading, userSettings } = useInbox()

  // Persistence for user card preferences (order/visibility)
  // Initialize with default order if nothing saved
  const [cardOrder, setCardOrder] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('inbox-card-order')
    if (saved) {
      try { setCardOrder(JSON.parse(saved)) } catch { setCardOrder(['priority_high', 'alerts', 'no_deadline', 'pending', 'consolidated_progress']) }
    } else {
      setCardOrder(['priority_high', 'alerts', 'no_deadline', 'pending', 'consolidated_progress'])
    }
  }, [])

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('inbox-card-order', JSON.stringify(newOrder))
        return newOrder;
      });
    }
  }

  // Helpers
  const getContrastYIQ = (hexcolor: string) => {
    if (!hexcolor) return 'black'
    hexcolor = hexcolor.replace("#", "")
    const r = parseInt(hexcolor.substr(0, 2), 16)
    const g = parseInt(hexcolor.substr(2, 2), 16)
    const b = parseInt(hexcolor.substr(4, 2), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return (yiq >= 128) ? 'black' : 'white'
  }

  // Dynamic card data fetcher
  const getCardItems = (cardId: string) => {
    if (!cardId) return []
    if (cardId === 'alerts') return metrics.detailedAlerts
    if (cardId === 'values') return metrics.detailedValues
    if (cardId === 'active') return metrics.detailedActive
    if (cardId === 'updates') return metrics.detailedUpdates
    if (cardId === 'priority_high') return []
    if (cardId === 'no_deadline') return []
    if (cardId === 'pending') return metrics.detailedPending || [] // Use consolidated items

    // Status Logic
    if (cardId.startsWith('status-')) {
      const statusName = cardId.replace('status-', '')
      const group = metrics.statusGroups.find(g => g.status === statusName)
      return group?.items || []
    }
    if (cardId === 'consolidated_progress') {
      const allItems = metrics.statusGroups.flatMap(g => g.items)
      return allItems.sort((a, b) => {
        const getScore = (item: any) => {
          const s = (item.status || '').toLowerCase()
          if (['pendente', 'aguardando', 'analise', 'análise'].some(k => s.includes(k))) return 3
          if (['execução', 'andamento'].some(k => s.includes(k))) return 2
          if (['concluído', 'concluido'].some(k => s.includes(k))) return 1
          return 0
        }
        return getScore(b) - getScore(a)
      })
    }
    return []
  }

  // --- Handlers (Keep existing logic) ---
  const handleAddWidget = (id: string) => {
    if (!cardOrder.includes(id)) {
      const newOrder = [...cardOrder, id]
      setCardOrder(newOrder)
      localStorage.setItem('inbox-card-order', JSON.stringify(newOrder))
      toast.success("Widget adicionado à Caixa de Entrada!")
    } else {
      toast.info("Este widget já está na tela.")
    }
    setShowWidgetGallery(false)
  }

  // Delete widget
  const handleRemoveWidget = (id: string) => {
    const newOrder = cardOrder.filter(widgetId => widgetId !== id)
    setCardOrder(newOrder)
    localStorage.setItem('inbox-card-order', JSON.stringify(newOrder))
    toast.success("Widget removido.")
  }

  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq('user_id', user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
    }
  }

  useEffect(() => {
    fetchNotes()
    const channel = supabase
      .channel('dashboard-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchNotes()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div
      className="space-y-6 w-full -m-8 p-8 min-h-screen"
      style={{
        background: activeService ? `linear-gradient(to bottom, ${activeService.primary_color}15 0%, #ffffff 400px)` : undefined
      }}
    >
      <AlertSettingsDialog
        open={showAlertSettings}
        onOpenChange={setShowAlertSettings}
      />

      <CardDetailModal
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
        title={
          selectedCard === 'alerts' ? 'Alertas e Prazos' :
            selectedCard === 'values' ? 'Valores Totais' :
              selectedCard === 'active' ? 'Itens Ativos' :
                selectedCard === 'updates' ? 'Atualizações Recentes' :
                  selectedCard === 'priority_high' ? 'Alta Prioridade' :
                    selectedCard === 'no_deadline' ? 'Sem Prazo' :
                      selectedCard === 'pending' ? 'Pendências' :
                        selectedCard === 'consolidated_progress' ? 'Progresso Geral' :
                          selectedCard?.startsWith('status-') ? `Status: ${selectedCard.replace('status-', '')}` :
                            'Detalhes'
        }
        description={`Lista de itens de ${selectedCard?.startsWith('status-') ? selectedCard.replace('status-', '') :
          'interesse'
          }`}
        items={getCardItems(selectedCard || '')}
        type={selectedCard?.startsWith('status-') ? 'status_dynamic' : selectedCard === 'alerts' ? 'alerts' : selectedCard as any}
      />

      <WidgetGallery
        open={showWidgetGallery}
        onOpenChange={setShowWidgetGallery}
        existingWidgets={cardOrder}
        onAddWidget={handleAddWidget}
      />

      {/* Header */}
      <div
        id="home-header"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm"
        data-tour-group="home"
        data-tour-title="Caixa de Entrada"
        data-tour-desc="Sua visão geral de tarefas e alertas. Personalize com widgets."
        data-tour-order="5"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Caixa de Entrada</h1>
          <p className="text-slate-500 mt-1">Visão geral de todas as suas pendências e prazos.</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown context="dashboard" data={metrics} />
          <DateTimeWidget onAddWidget={() => setShowWidgetGallery(true)} />
        </div>
      </div>


      {/* 1. CARDS GRID (Top Row) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <div
            id="home-widgets"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            data-tour-group="home"
            data-tour-title="Widgets Interativos"
            data-tour-desc="Seus indicadores são flexíveis: <br/>• <b>Arrastar:</b> Clique e segure para mudar a ordem.<br/>• <b>Clicar:</b> Abre detalhes completos.<br/>• <b>Excluir:</b> Use o 'X' para remover da tela."
            data-tour-order="6"
          >
            {cardOrder.map(cardId => {
              // Dynamic Status Cards
              if (cardId.startsWith('status-')) {
                const statusName = cardId.replace('status-', '')
                const group = metrics.statusGroups.find(g => g.status === statusName)
                if (!group) return null

                return (
                  <SortableWidget key={cardId} id={cardId} onClick={() => setSelectedCard(cardId)} onRemove={() => handleRemoveWidget(cardId)}>
                    <div className="h-full relative">
                      <GlobalCard
                        title={group.status}
                        value={group.count}
                        description="Itens neste status"
                        icon={CheckCircle2}
                        iconColor="text-slate-600"
                        borderColor="border-slate-200"
                        isLoading={metricsLoading}
                      />
                      <div className="absolute top-4 right-8 w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: group.color }} />
                    </div>
                  </SortableWidget>
                )
              }

              // Normal Cards
              switch (cardId) {
                case 'alerts_widget':
                  return (
                    <SortableWidget key="alerts_widget" id="alerts_widget" onClick={() => setSelectedCard(null)} onRemove={() => handleRemoveWidget('alerts_widget')}>
                      <AlertsWidget />
                    </SortableWidget>
                  )
                case 'alerts':
                  // Calculate split
                  const shortTerm = metrics.detailedAlerts.filter(i => i.isShortTerm).length
                  const longTerm = metrics.detailedAlerts.length - shortTerm
                  return (
                    <SortableWidget key="alerts" id="alerts" onClick={() => setSelectedCard('alerts')} onRemove={() => handleRemoveWidget('alerts')}>
                      <DetailedDeadlineWidget
                        shortTermCount={shortTerm}
                        shortTermDays={userSettings.alert_days_short}
                        longTermCount={longTerm}
                        longTermDays={userSettings.alert_days_long}
                        onConfigure={() => setShowAlertSettings(true)}
                      />
                    </SortableWidget>
                  )
                case 'values':
                  return (
                    <SortableWidget key="values" id="values" onClick={() => setSelectedCard('values')} onRemove={() => handleRemoveWidget('values')}>
                      <GlobalCard
                        title="Valores Totais"
                        value={metrics.totalValues}
                        description="Soma de valores monetários"
                        icon={DollarSign}
                        iconColor="text-emerald-500"
                        borderColor="border-emerald-100"
                        isLoading={metricsLoading}
                        formatValue={(val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val as number)}
                      />
                    </SortableWidget>
                  )
                case 'active':
                  return (
                    <SortableWidget key="active" id="active" onClick={() => setSelectedCard('active')} onRemove={() => handleRemoveWidget('active')}>
                      <GlobalCard
                        title="Status Ativos"
                        value={metrics.activeStatus}
                        description="Itens em execução"
                        icon={CheckCircle2}
                        iconColor="text-amber-500"
                        borderColor="border-amber-100"
                        isLoading={metricsLoading}
                      />
                    </SortableWidget>
                  )
                case 'updates':
                  return (
                    <SortableWidget key="updates" id="updates" onClick={() => setSelectedCard('updates')} onRemove={() => handleRemoveWidget('updates')}>
                      <GlobalCard
                        title="Atualizações"
                        value={metrics.recentUpdates}
                        description="Novos itens da semana"
                        icon={LayoutDashboard}
                        iconColor="text-purple-500"
                        borderColor="border-purple-100"
                        isLoading={metricsLoading}
                      />
                    </SortableWidget>
                  )
                case 'priority_high':
                  return (
                    <SortableWidget key="priority_high" id="priority_high" onClick={() => setSelectedCard('priority_high')} onRemove={() => handleRemoveWidget('priority_high')}>
                      <GlobalCard
                        title="Alta Prioridade"
                        value={0} // Placeholder
                        description="Itens urgentes"
                        icon={AlertOctagon}
                        iconColor="text-red-500"
                        borderColor="border-red-100"
                        isLoading={metricsLoading}
                      />
                    </SortableWidget>
                  )
                case 'no_deadline':
                  return (
                    <SortableWidget key="no_deadline" id="no_deadline" onClick={() => setSelectedCard('no_deadline')} onRemove={() => handleRemoveWidget('no_deadline')}>
                      <GlobalCard
                        title="Sem Prazo"
                        value={0} // Placeholder
                        description="Ativos sem data"
                        icon={CalendarOff}
                        iconColor="text-orange-500"
                        borderColor="border-orange-100"
                        isLoading={metricsLoading}
                      />
                    </SortableWidget>
                  )
                case 'pending':
                  return (
                    <SortableWidget key="pending" id="pending" onClick={() => setSelectedCard('pending')} onRemove={() => handleRemoveWidget('pending')}>
                      <GlobalCard
                        title="Pendências"
                        value={metrics.detailedPending?.length || 0}
                        description="Itens aguardando"
                        icon={Bell}
                        iconColor="text-indigo-500"
                        borderColor="border-indigo-100"
                        isLoading={metricsLoading}
                      />
                    </SortableWidget>
                  )
                case 'consolidated_progress':
                  // Calculate Consolidated Counts from Status Groups
                  let done = 0
                  let inProgress = 0
                  let toDo = 0
                  let other = 0

                  metrics.statusGroups.forEach(group => {
                    const cat = getStatusCategory(group.status)
                    if (cat === 'done') done += group.count
                    else if (cat === 'active') inProgress += group.count
                    else if (cat === 'pending') toDo += group.count
                    else other += group.count
                  })

                  const totalCount = done + inProgress + toDo + other

                  // Data for the widget visualization
                  const statusData = [
                    { label: 'Pendente', count: toDo, color: 'bg-yellow-500' },
                    { label: 'Em Execução', count: inProgress, color: 'bg-blue-600' },
                    { label: 'Concluído', count: done, color: 'bg-emerald-500' },
                    // { label: 'Outros', count: other, color: 'bg-slate-200' }
                  ].filter(d => d.count > 0)

                  return (
                    <SortableWidget key="consolidated_progress" id="consolidated_progress" onClick={() => setSelectedCard('consolidated_progress')} onRemove={() => handleRemoveWidget('consolidated_progress')}>
                      <ConsolidatedStatusWidget
                        data={statusData}
                        total={totalCount}
                      />
                    </SortableWidget>
                  )
                default: return null
              }
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* 2. LOWER SECTION (Shortcuts & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Shortcuts (Left/Center - 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div
            id="home-shortcuts"
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
            data-tour-group="home"
            data-tour-title="Seus Serviços"
            data-tour-desc="Acesso rápido aos seus aplicativos e criação de novos serviços."
            data-tour-order="7"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-blue-500" />
                Meus Serviços
              </h3>
              <Link href="/configuracoes?tab=servicos" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.slice(0, 6).map(service => (
                <Link
                  key={service.id}
                  href={`/servicos/${service.slug}`}
                  className="group flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-8 rounded-full shadow-sm" style={{ backgroundColor: service.primary_color }} />
                    <span className="font-medium text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
                      {service.name}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-slate-400 group-hover:text-blue-500">
                    <span>Acessar</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </Link>
              ))}
              <Link
                href="/configuracoes?tab=servicos"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-600 gap-2 cursor-pointer"
              >
                <PlusCircle className="h-6 w-6" />
                <span className="font-medium text-sm">Novo Serviço</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity (Right - 1/3 width) */}
        <div className="lg:col-span-1">
          <div
            id="home-activity"
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full max-h-[500px] overflow-hidden flex flex-col"
            data-tour-group="home"
            data-tour-title="Atividade Recente"
            data-tour-desc="Histórico global de mudanças em todos os seus serviços."
            data-tour-order="8"
          >
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Atividade Recente
            </h3>

            <div className="space-y-6 relative flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Timeline Line */}
              <div className="absolute left-2.5 top-2 bottom-0 w-px bg-slate-100" />

              {metrics.detailedUpdates.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-10">
                  Nenhuma atividade recente registrada.
                </p>
              ) : (
                metrics.detailedUpdates.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="relative pl-8 group">
                    <div className="absolute left-1 top-1.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full z-10 group-hover:border-blue-500 group-hover:scale-110 transition-all" />

                    <div className="mb-1">
                      <span className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="px-1.5 py-0.5 rounded-md bg-opacity-10 font-medium"
                        style={{
                          backgroundColor: `${item.service_color}15`,
                          color: item.service_color
                        }}
                      >
                        {item.service_name}
                      </span>
                      {/* Could add generic relative time here if available in item */}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      <NotificationList />
    </div >
  )
}

function NotificationList() {
  const { notifications, acceptNotification, declineNotification } = useInbox()
  const safeNotifications = Array.isArray(notifications) ? notifications : []

  if (safeNotifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {safeNotifications.map(n => (
        <div key={n.id} className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 animate-in slide-in-from-right-full">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-slate-900">{n.title}</h4>
              <p className="text-xs text-slate-600 mb-3">{n.message}</p>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => acceptNotification(n.id)}>
                  Aceitar
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => declineNotification(n.id)}>
                  Recusar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
