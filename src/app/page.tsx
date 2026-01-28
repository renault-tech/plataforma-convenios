"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, AlertCircle, Activity } from "lucide-react"
import { useService } from "@/contexts/ServiceContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button" // Ensure Button is imported
import { cn } from "@/lib/utils"
import { format, subMonths, isAfter, isBefore, addDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

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

export default function Home() {
  const { services, activeService, setActiveService } = useService()
  const [dashboardData, setDashboardData] = useState({
    totalCount: 0,
    totalValue: 0,
    expiringCount: 0,
    expiring90Count: 0,
    activeCount: 0,
    monthlyData: [] as any[],
    recentActivity: [] as any[]
  })
  const [isLoadingData, setIsLoadingData] = useState(false)

  const supabase = createClient()

  // Load data when activeService changes
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

        // 1. Identify columns for metrics (Smart Detection)
        const cols = activeService.columns_config || []

        // Find Date Column: Priority to "vencimento", "prazo", "data"
        let dateCol = cols.find((c: any) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
        if (!dateCol) dateCol = cols.find((c: any) => c.type === 'date')?.id // Fallback to first date

        // Find Currency Column: Priority to "valor", "total", "preço"
        let currencyCol = cols.find((c: any) => c.type === 'currency' && /valor|total|preço|montante/i.test(c.label))?.id
        if (!currencyCol) currencyCol = cols.find((c: any) => c.type === 'currency')?.id // Fallback

        // Find Status Column
        let statusCol = cols.find((c: any) => c.type === 'status')?.id

        // 2. Calculate Metrics
        let totalVal = 0
        let expiring = 0
        let expiring90 = 0
        let active = 0
        const today = new Date()
        const next30Days = addDays(today, 30)
        const next90Days = addDays(today, 90)

        items.forEach(item => {
          const itemData = item.data || {}

          // Value
          if (currencyCol && itemData[currencyCol]) {
            totalVal += Number(itemData[currencyCol]) || 0
          }

          // Expiration
          if (dateCol && itemData[dateCol] && typeof itemData[dateCol] === 'string') {
            try {
              const itemDate = parseISO(itemData[dateCol])

              // Only count future items for "A Vencer" (To Expire)
              // If you want to include overdue, remove the isAfter check or separate it.
              // Assuming "A Vencer" means "Coming Soon".
              if (isAfter(itemDate, today)) {
                // Check strict ranges
                if (isBefore(itemDate, next30Days) || format(itemDate, 'yyyy-MM-dd') === format(next30Days, 'yyyy-MM-dd')) {
                  // <= 30 days
                  expiring++
                } else if (isBefore(itemDate, next90Days) || format(itemDate, 'yyyy-MM-dd') === format(next90Days, 'yyyy-MM-dd')) {
                  // > 30 days AND <= 90 days
                  expiring90++
                }
              }
            } catch (e) {
              console.warn("Invalid date format", itemData[dateCol])
            }
          }

          // Active Status (naive check for 'Ativo' or 'Em Execução')
          if (statusCol && itemData[statusCol]) {
            const status = String(itemData[statusCol]).toLowerCase()
            if (status.includes('ativo') || status.includes('execução') || status.includes('andamento') || status.includes('vigente')) {
              active++
            }
          }
        })

        // 3. Monthly Data (Last 6 months)
        const monthsMap = new Map()
        for (let i = 5; i >= 0; i--) {
          const d = subMonths(new Date(), i)
          const key = format(d, 'MMM', { locale: ptBR })
          monthsMap.set(key, 0)
        }

        // Populate monthly data - grouping by created_at 
        items.forEach(item => {
          if (item.created_at && typeof item.created_at === 'string') {
            try {
              const d = parseISO(item.created_at)
              const key = format(d, 'MMM', { locale: ptBR })
              if (monthsMap.has(key)) {
                monthsMap.set(key, monthsMap.get(key) + 1)
              }
            } catch (e) { }
          }
        })

        const monthlyData = Array.from(monthsMap.entries()).map(([name, total]) => ({ name, total }))

        // 4. Recent Activity (Just map the simplified items)
        const recentActivity = items.slice(0, 5).map(item => ({
          id: item.id,
          // Try to find a 'title' or 'object' or first text column
          title: item.data[activeService.columns_config?.find((c: any) => c.type === 'text')?.id || ''] || 'Item sem título',
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
        console.error("Error loading dashboard data", e)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadDashboardData()
  }, [activeService, supabase])


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

          {/* Service Switcher Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {services.map(service => (
              <Button
                key={service.id}
                variant={activeService?.id === service.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full h-8 text-xs font-medium transition-all",
                  activeService?.id === service.id
                    ? "text-white shadow-sm hover:opacity-90"
                    : "text-muted-foreground hover:bg-slate-100"
                )}
                style={activeService?.id === service.id ? { backgroundColor: service.primary_color } : {}}
                onClick={() => setActiveService(service)}
              >
                {service.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              Total de {activeService?.name || 'Itens'}
            </CardTitle>
            <FileText className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">{dashboardData.totalCount}</div>
            <p className="text-[10px] text-muted-foreground mb-2">
              Registrados
            </p>
            {/* Keeping visual charts as placeholders for aesthetic consistency */}
            <div className="h-[35px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.monthlyData.length ? dashboardData.monthlyData : [{ value: 0 }]}>
                  <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip cursor={false} content={() => null} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              Valor Total Ativo
            </CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(dashboardData.totalValue)}
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              Somatório financeiro
            </p>
            <div className="h-[35px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{ value: 100 }, { value: 120 }, { value: dashboardData.totalValue }]}>
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip cursor={false} content={() => null} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Expiring (Split) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              Próximos Vencimentos
            </CardTitle>
            <AlertCircle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-2">
              {/* 90 Days */}
              <div className="border-r pr-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">90 Dias</p>
                <div className="text-lg font-bold text-yellow-600">{dashboardData.expiring90Count}</div>
                <div className="h-[25px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{ value: 2 }, { value: dashboardData.expiring90Count }, { value: 4 }]}>
                      <Area type="monotone" dataKey="value" stroke="#ca8a04" fill="#facc15" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip cursor={false} content={() => null} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 30 Days */}
              <div className="pl-1">
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">30 Dias</p>
                <div className="text-lg font-bold text-red-600">{dashboardData.expiringCount}</div>
                <div className="h-[25px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{ value: 5 }, { value: dashboardData.expiringCount }, { value: 2 }]}>
                      <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip cursor={false} content={() => null} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Active Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              Em Execução
            </CardTitle>
            <Activity className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">{dashboardData.activeCount}</div>
            <p className="text-[10px] text-muted-foreground mb-2">
              {dashboardData.totalCount > 0 ? Math.round((dashboardData.activeCount / dashboardData.totalCount) * 100) : 0}% do portfólio
            </p>
            <div className="h-[35px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{ value: 10 }, { value: 30 }, { value: dashboardData.activeCount }]}>
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip cursor={false} content={() => null} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Novos Itens (6 Meses)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pb-2">
            <div className="h-[200px] w-full">
              {dashboardData.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.monthlyData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" fill={activeService?.primary_color || "#0f172a"} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem dados suficientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-4">
              {dashboardData.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
              ) : (
                dashboardData.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <div className="ml-4 space-y-1 overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate w-[200px]" title={item.title}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {item.status}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(parseISO(item.created_at), "dd/MM HH:mm")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
