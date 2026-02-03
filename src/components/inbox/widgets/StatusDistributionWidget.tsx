"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface StatusDistributionWidgetProps {
    data: { status: string; count: number; color: string }[]
    isLoading?: boolean
}

const CHART_COLORS = {
    primary: '#3b82f6',   // blue-500
    success: '#10b981',   // emerald-500
    warning: '#f59e0b',   // amber-500
    danger: '#ef4444',    // red-500
    info: '#06b6d4',      // cyan-500
    secondary: '#64748b', // slate-500
}

export function StatusDistributionWidget({ data, isLoading }: StatusDistributionWidgetProps) {
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

    const total = data.reduce((sum, item) => sum + item.count, 0)

    return (
        <Card className="col-span-2 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Distribuição de Status</CardTitle>
                <CardDescription>Contabilização de status em todas as planilhas ({total} itens)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis
                            type="category"
                            dataKey="status"
                            stroke="#64748b"
                            fontSize={12}
                            width={90}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[0, 8, 8, 0]}
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
