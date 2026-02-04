import { WidgetType } from "@/hooks/useAdminDashboard"
import { Users, Activity, AlertTriangle, ShieldCheck } from "lucide-react"

// Types
export interface WidgetProps {
    id: string
}

// Widget Configuration (Title, Icon, Description)
export const WIDGET_CONFIG: Record<WidgetType, { title: string, icon: any, description: string }> = {
    stats_users: { title: "Total de Usuários", icon: Users, description: "Usuários cadastrados na plataforma" },
    stats_services: { title: "Serviços Ativos", icon: ShieldCheck, description: "Convênios e serviços em operação" },
    stats_errors: { title: "Erros do Sistema", icon: AlertTriangle, description: "Logs de erro nas últimas 24h" },
    stats_active_users: { title: "Sessões Ativas", icon: Activity, description: "Usuários online agora" },
    activity_feed: { title: "Atividade Recente", icon: Activity, description: "Timeline de eventos do sistema" },
    recent_users: { title: "Novos Usuários", icon: Users, description: "Últimos cadastros realizados" },
    chart_growth: { title: "Crescimento", icon: Activity, description: "Gráfico de novos usuários e serviços" },
    chart_distribution: { title: "Distribuição", icon: Users, description: "Tipos de usuários e serviços" },
}
