"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TimelineWidgetProps {
    data: { date: string; count: number }[]
    isLoading?: boolean
}

export function TimelineWidget({ data, isLoading }: TimelineWidgetProps) {
    if (isLoading) {
        return (
            <Card className="col-span-2">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-2 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Linha do Tempo</CardTitle>
                <CardDescription>Criação de itens nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={11}
                            tickFormatter={(value) => {
                                try {
                                    return format(new Date(value), 'dd/MM', { locale: ptBR })
                                } catch {
                                    return value
                                }
                            }}
                        />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            labelFormatter={(value) => {
                                try {
                                    return format(new Date(value), "dd 'de' MMMM", { locale: ptBR })
                                } catch {
                                    return value
                                }
                            }}
                            formatter={(value: number | undefined) => [`${value || 0} itens`, 'Criados']}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            animationDuration={1000}
                            animationEasing="ease-in-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
