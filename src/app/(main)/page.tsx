"use client"

import { useEffect, useState } from "react"
import { useService } from "@/contexts/ServiceContext"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { PlusCircle, LayoutDashboard, Bell, FileText, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useNotificationActions } from "@/hooks/useNotificationActions"

import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react" // Added Suspense import

export default function Home() {
  const { services } = useService()

  // Decide which view to show
  if (services.length === 0) {
    return <HeroEmptyState />
  }

  return (
    <Suspense fallback={null}>
      <WelcomeHandler />
      <InboxDashboard services={services} />
    </Suspense>
  )
}

function WelcomeHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      // Small delay to ensure UI is ready
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
  // This component replaces the old dashboard with a simpler "Inbox" feel
  const [stats, setStats] = useState({ alerts: 0, pending: 0, updates: 0 })
  const [notifications, setNotifications] = useState<any[]>([])
  const supabase = createClient()
  const { activeService } = useService()

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
      const pending = data.filter(n =>
        !n.read_at && (n.type === 'service_share' || n.type === 'group_invite')
      ).length

      // Update stats
      setStats(prev => ({ ...prev, pending }))
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
      className="space-y-8 max-w-6xl mx-auto -m-8 p-8"
      style={{
        background: activeService ? `linear-gradient(to bottom, ${activeService.primary_color}15 0%, #ffffff 400px)` : undefined
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Caixa de Entrada</h2>
          <p className="text-slate-500">Resumo das suas atividades e alertas.</p>
        </div>
        <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-full border shadow-sm">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Alertas e Prazos</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.alerts}</div>
            <p className="text-xs text-slate-500">Vencimentos próximos</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-amber-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Pendências</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
            <p className="text-xs text-slate-500">Aguardando aprovação</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Atualizações</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.updates}</div>
            <p className="text-xs text-slate-500">Novos itens nesta semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content: Services */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Meus Aplicativos</CardTitle>
              <CardDescription>Acesso rápido aos seus serviços gerenciados.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {services.map(service => (
                <Link key={service.id} href={`/servicos/${service.slug}`}>
                  <div className="group flex items-center p-4 border rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer bg-white h-full">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center mr-4 text-white shadow-sm transition-transform"
                      style={{ backgroundColor: service.primary_color || '#3b82f6' }}
                    >
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-700">{service.name}</h4>
                      <p className="text-xs text-slate-500">Gerenciar dados</p>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/configuracoes?tab=servicos">
                <div className="flex items-center p-4 border border-dashed border-slate-300 rounded-xl hover:bg-white hover:border-blue-400 transition-all cursor-pointer bg-slate-50/50 justify-center text-slate-500 hover:text-blue-600 h-full">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Novo Aplicativo</span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Notifications */}
        <div className="md:col-span-1">
          <DashboardNotifications notifications={notifications} onRefresh={fetchNotes} />
        </div>
      </div>
    </div>
  )
}

function DashboardNotifications({ notifications, onRefresh }: { notifications: any[], onRefresh: () => void }) {
  const { handleAccept, handleDecline, deleteNotification } = useNotificationActions()

  const onAccept = async (n: any) => {
    const success = await handleAccept(n)
    if (success) onRefresh()
  }

  const onDecline = async (n: any) => {
    const success = await handleDecline(n)
    if (success) onRefresh()
  }

  // Pendencies are: Unread AND (service_share OR group_invite)
  const pendingItems = notifications.filter(n =>
    !n.read_at && (n.type === 'service_share' || n.type === 'group_invite')
  )

  // Recent History (everything else)
  const recentHistory = notifications.filter(n =>
    !pendingItems.includes(n)
  ).slice(0, 5)


  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* PENDÊNCIAS CARD - Only shows if there are pending items */}
      {pendingItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30 shadow-sm animate-in fade-in slide-in-from-right-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              Pendências ({pendingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.map(n => (
              <div key={n.id} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                <h4 className="font-semibold text-sm text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 mb-3">{n.message}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => onAccept(n)}>
                    Aceitar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => onDecline(n)}>
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* RECENT NOTIFICATIONS - Normal list */}
      <Card className="flex-1 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Últimas Atualizações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentHistory.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Nenhuma atualização recente.</p>
          ) : (
            recentHistory.map(note => (
              <div key={note.id} className="flex gap-3 items-start pb-3 border-b last:border-0 last:pb-0">
                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${note.read_at ? 'bg-slate-300' : 'bg-blue-500'}`} />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{note.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{note.message}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Database(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}
