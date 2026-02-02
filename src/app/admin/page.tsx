import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity } from "lucide-react"

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
                <p className="text-slate-500">Bem-vindo ao painel de administração da plataforma.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">
                            Usuários cadastrados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Logs do Sistema</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">
                            Ações registradas hoje
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for future charts or lists */}
            <div className="rounded-lg border border-dashed p-8 text-center text-slate-400">
                Mais métricas em breve...
            </div>
        </div>
    )
}
