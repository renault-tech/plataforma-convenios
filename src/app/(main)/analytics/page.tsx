"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useInbox } from "@/contexts/InboxContext"
import { StatusDistributionWidget } from "@/components/inbox/widgets/StatusDistributionWidget"
import { CompletionRateWidget } from "@/components/inbox/widgets/CompletionRateWidget"
import { TimelineWidget } from "@/components/inbox/widgets/TimelineWidget"
import { QuickStatsWidget } from "@/components/inbox/widgets/QuickStatsWidget"

export default function AnalyticsPage() {
    const { metrics, isLoading } = useInbox()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                <BarChart3 className="h-8 w-8 text-blue-600" />
                                Analytics
                            </h1>
                            <p className="text-slate-500">Análise visual completa de todas as planilhas</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Total de Itens</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">
                                {isLoading ? "..." : metrics.quickStats.totalItems}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Planilhas Ativas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-600">
                                {isLoading ? "..." : metrics.quickStats.totalServices}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Média por Planilha</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600">
                                {isLoading ? "..." : metrics.quickStats.avgPerService.toFixed(1)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Crescimento Semanal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${metrics.quickStats.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isLoading ? "..." : `${metrics.quickStats.growthRate > 0 ? '+' : ''}${metrics.quickStats.growthRate.toFixed(1)}%`}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <StatusDistributionWidget
                        data={metrics.statusDistribution}
                        isLoading={isLoading}
                    />

                    <CompletionRateWidget
                        data={metrics.completionRate}
                        isLoading={isLoading}
                    />
                </div>

                {/* Timeline - Full Width */}
                <TimelineWidget
                    data={metrics.timeline}
                    isLoading={isLoading}
                />

                {/* Additional Insights */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900">Alertas Ativos</CardTitle>
                            <CardDescription>Itens com vencimento nos próximos 30 dias</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-600">
                                {isLoading ? "..." : metrics.alertsDeadlines}
                            </div>
                            <p className="text-sm text-slate-500 mt-2">
                                {metrics.detailedAlerts.length} itens requerem atenção
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900">Valor Total</CardTitle>
                            <CardDescription>Soma de todos os valores monetários</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-emerald-600">
                                {isLoading ? "..." : new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(metrics.totalValues)}
                            </div>
                            <p className="text-sm text-slate-500 mt-2">
                                {metrics.detailedValues.length} itens com valores registrados
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
