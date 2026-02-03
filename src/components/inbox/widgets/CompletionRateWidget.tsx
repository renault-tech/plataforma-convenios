"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface CompletionRateWidgetProps {
    data: { name: string; value: number; percentage: number }[]
    isLoading?: boolean
}

const COLORS = {
    completed: '#10b981',   // emerald-500
    inProgress: '#3b82f6',  // blue-500
    notStarted: '#64748b',  // slate-500
}

export function CompletionRateWidget({ data, isLoading }: CompletionRateWidgetProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full rounded-full" />
                </CardContent>
            </Card>
        )
    }

    const chartData = data.map((item, index) => ({
        ...item,
        color: index === 0 ? COLORS.completed : index === 1 ? COLORS.inProgress : COLORS.notStarted
    }))

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
        const RADIAN = Math.PI / 180
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)

        if (percentage < 5) return null

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-semibold text-sm"
            >
                {`${percentage.toFixed(0)}%`}
            </text>
        )
    }

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Taxa de Conclusão</CardTitle>
                <CardDescription>Percentual de itens por status de execução</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={100}
                            innerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value: number, name: string, props: any) => [
                                `${value} itens (${props.payload.percentage.toFixed(1)}%)`,
                                name
                            ]}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => (
                                <span className="text-sm text-slate-700">
                                    {value} ({entry.payload.percentage.toFixed(1)}%)
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
