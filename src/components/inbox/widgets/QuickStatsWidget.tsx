"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, LayoutDashboard, Activity } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface QuickStatsWidgetProps {
    stats: {
        totalItems: number
        totalServices: number
        avgPerService: number
        growthRate: number
    }
    isLoading?: boolean
}

export function QuickStatsWidget({ stats, isLoading }: QuickStatsWidgetProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const statItems = [
        {
            label: 'Total de Itens',
            value: stats.totalItems,
            icon: LayoutDashboard,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Planilhas',
            value: stats.totalServices,
            icon: Activity,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Média/Planilha',
            value: stats.avgPerService.toFixed(1),
            icon: DollarSign,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50'
        },
        {
            label: 'Crescimento',
            value: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
            icon: TrendingUp,
            color: stats.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600',
            bgColor: stats.growthRate >= 0 ? 'bg-emerald-50' : 'bg-red-50'
        }
    ]

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    {statItems.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div
                                key={index}
                                className={`${stat.bgColor} rounded-lg p-3 transition-all duration-200 hover:scale-105`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                                <div className={`text-2xl font-bold ${stat.color}`}>
                                    {stat.value}
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                    {stat.label}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
