import { Bell, DollarSign, CheckCircle2, LayoutDashboard, BarChart3, PieChart, TrendingUp, Activity } from "lucide-react"
import { GlobalCard } from "./GlobalCard"
import { StatusDistributionWidget } from "./widgets/StatusDistributionWidget"
import { CompletionRateWidget } from "./widgets/CompletionRateWidget"
import { TimelineWidget } from "./widgets/TimelineWidget"
import { QuickStatsWidget } from "./widgets/QuickStatsWidget"

export type WidgetKey =
    | 'alerts'
    | 'values'
    | 'active'
    | 'updates'
    | 'pending'
    | 'status_distribution'
    | 'completion_rate'
    | 'timeline'
    | 'quick_stats'

export interface WidgetConfig {
    key: WidgetKey
    title: string
    description: string
    icon: any
    type: 'card' | 'chart'
    defaultSize: 'small' | 'medium' | 'large' | 'wide'
    component: React.ComponentType<any>
}

export const WIDGET_REGISTRY: Record<WidgetKey, WidgetConfig> = {
    // Basic Cards
    alerts: {
        key: 'alerts',
        title: 'Alertas e Prazos',
        description: 'Vencimentos próximos nos próximos 30 dias',
        icon: Bell,
        type: 'card',
        defaultSize: 'medium',
        component: GlobalCard
    },
    values: {
        key: 'values',
        title: 'Valores Totais',
        description: 'Soma de valores monetários',
        icon: DollarSign,
        type: 'card',
        defaultSize: 'medium',
        component: GlobalCard
    },
    active: {
        key: 'active',
        title: 'Status Ativos',
        description: 'Itens em execução',
        icon: CheckCircle2,
        type: 'card',
        defaultSize: 'medium',
        component: GlobalCard
    },
    updates: {
        key: 'updates',
        title: 'Atualizações',
        description: 'Novos itens nesta semana',
        icon: LayoutDashboard,
        type: 'card',
        defaultSize: 'medium',
        component: GlobalCard
    },
    pending: {
        key: 'pending',
        title: 'Pendências',
        description: 'Aguardando aprovação',
        icon: CheckCircle2,
        type: 'card',
        defaultSize: 'medium',
        component: GlobalCard
    },

    // Chart Widgets
    status_distribution: {
        key: 'status_distribution',
        title: 'Distribuição de Status',
        description: 'Gráfico de barras com contagem de status',
        icon: BarChart3,
        type: 'chart',
        defaultSize: 'wide',
        component: StatusDistributionWidget
    },
    completion_rate: {
        key: 'completion_rate',
        title: 'Taxa de Conclusão',
        description: 'Gráfico de pizza com percentual de conclusão',
        icon: PieChart,
        type: 'chart',
        defaultSize: 'medium',
        component: CompletionRateWidget
    },
    timeline: {
        key: 'timeline',
        title: 'Linha do Tempo',
        description: 'Gráfico de área com criação de itens (30 dias)',
        icon: TrendingUp,
        type: 'chart',
        defaultSize: 'wide',
        component: TimelineWidget
    },
    quick_stats: {
        key: 'quick_stats',
        title: 'Estatísticas Rápidas',
        description: 'Grid 2x2 com métricas principais',
        icon: Activity,
        type: 'chart',
        defaultSize: 'medium',
        component: QuickStatsWidget
    }
}

export function getWidgetConfig(key: WidgetKey): WidgetConfig | undefined {
    return WIDGET_REGISTRY[key]
}

export function getAllWidgets(): WidgetConfig[] {
    return Object.values(WIDGET_REGISTRY)
}

export function getWidgetsByType(type: 'card' | 'chart'): WidgetConfig[] {
    return Object.values(WIDGET_REGISTRY).filter(w => w.type === type)
}
