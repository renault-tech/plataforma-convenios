"use client"

import { CardContent } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DistributionChartWidget() {
    const [data, setData] = useState<{ name: string; value: number }[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // First get all services to count by owner
            const { data: services } = await supabase
                .from('services')
                .select('owner_id')

            if (!services) return

            // Group by owner
            const counts: Record<string, number> = {}
            services.forEach(s => {
                const owner = s.owner_id
                if (owner) counts[owner] = (counts[owner] || 0) + 1
            })

            // Sort and take top 5
            const topOwners = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)

            // Fetch names for these owners
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', topOwners.map(([id]) => id))

            if (error) console.error("Error fetching profiles:", JSON.stringify(error, null, 2))

            const chartData = topOwners.map(([id, count]) => {
                const profile = profiles?.find(p => p.id === id)
                // console.log("Mapping:", id, profile) // Debug

                let displayName = 'Usuário'
                // Use full name if available, otherwise email, otherwise ID
                if (profile?.full_name) displayName = profile.full_name
                else if (profile?.email) displayName = profile.email
                else displayName = `ID: ${id.slice(0, 4)}`

                return {
                    name: displayName,
                    value: count,
                    full: profile?.full_name || profile?.email || id // For tooltip
                }
            })

            setData(chartData)
        }
        fetchData()
    }, [])

    return (
        <CardContent className="h-full min-h-[250px] p-2 pt-6">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value, name, props) => [`${value} Serviços`, props.payload.full]}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    )
}
