"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, AlertCircle, Activity } from "lucide-react"
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

const visionData = [
  { name: "Jan", total: 15000 },
  { name: "Fev", total: 22000 },
  { name: "Mar", total: 18000 },
  { name: "Abr", total: 28000 },
  { name: "Mai", total: 23000 },
  { name: "Jun", total: 32000 },
  { name: "Jul", total: 45000 },
]

const sparkData1 = [
  { value: 12 }, { value: 15 }, { value: 18 }, { value: 14 }, { value: 22 }, { value: 19 }, { value: 24 }
]
const sparkData2 = [
  { value: 400 }, { value: 300 }, { value: 450 }, { value: 380 }, { value: 420 }, { value: 460 }, { value: 480 }
]
const sparkData3 = [
  { value: 5 }, { value: 7 }, { value: 4 }, { value: 8 }, { value: 6 }, { value: 9 }, { value: 7 }
]
const sparkData4 = [
  { value: 65 }, { value: 68 }, { value: 72 }, { value: 70 }, { value: 75 }, { value: 78 }, { value: 89 }
]

export default function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              Total de Convênios
            </CardTitle>
            <FileText className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">124</div>
            <p className="text-[10px] text-muted-foreground mb-2">
              +12 novos este mês
            </p>
            <div className="h-[35px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData1}>
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip cursor={false} content={<></>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              Valor Total Ativo
            </CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">R$ 45.2M</div>
            <p className="text-[10px] text-muted-foreground mb-2">
              +2.1% vs mês anterior
            </p>
            <div className="h-[35px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData2}>
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip cursor={false} content={<></>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              A Vencer (30 dias)
            </CardTitle>
            <AlertCircle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">7</div>
            <p className="text-[10px] text-muted-foreground mb-2">
              Requer atenção
            </p>
            <div className="h-[35px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData3}>
                  <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip cursor={false} content={<></>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">
              Em Execução
            </CardTitle>
            <Activity className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">89</div>
            <p className="text-[10px] text-muted-foreground mb-2">
              71% do portfólio
            </p>
            <div className="h-[35px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData4}>
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip cursor={false} content={<></>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pb-2">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visionData}>
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
                    tickFormatter={(value) => `R$${value/1000}k`} 
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            {/* Added a small chart for activity volume */}
            <div className="h-[40px] mb-4 w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {v:10}, {v:20}, {v:15}, {v:30}, {v:25}, {v:40}, {v:35}, {v:20}, {v:10}, {v:25}
                ]}>
                  <Bar dataKey="v" fill="#e2e8f0" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Atualização de Status
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Convênio #2024/{i}0 desaprovado.
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-[10px] text-muted-foreground">
                    Há {i}h
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
