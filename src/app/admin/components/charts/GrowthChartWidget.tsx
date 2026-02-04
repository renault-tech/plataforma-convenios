"use client"

import { CardContent } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

export function GrowthChartWidget() {
    const [data, setData] = useState<{ name: string; users: number; services: number }[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))
            const stats = await Promise.all(months.map(async (date) => {
                const start = startOfMonth(date).toISOString()
                const end = endOfMonth(date).toISOString()

                const { count: usersCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .lte('created_at', end) // Cumulative growth

                const { count: servicesCount } = await supabase
                    .from('services')
                    .select('*', { count: 'exact', head: true })
                    .lte('created_at', end) // Cumulative growth

                return {
                    name: format(date, 'MMM', { locale: ptBR }),
                    users: usersCount || 0,
                    services: servicesCount || 0
                }
            }))
            setData(stats)
        }
        fetchData()
    }, [])

    return (
        <CardContent className="h-full min-h-[250px] p-2 pt-6">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Usuários" />
                    <Line type="monotone" dataKey="services" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Serviços" />
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
    )
}
