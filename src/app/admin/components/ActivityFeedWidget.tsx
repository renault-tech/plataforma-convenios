"use client"

import { CardContent } from "@/components/ui/card"
import { Activity, AlertTriangle, CheckCircle, Info } from "lucide-react"

// Mock Data for now - assuming no logs table yet or specialized access
const MOCK_ACTIVITY = [
    { id: 1, type: 'info', message: 'Sistema iniciado', time: '10 min atrás' },
    { id: 2, type: 'success', message: 'Novo usuário registrado: Admin', time: '1h atrás' },
    { id: 3, type: 'warning', message: 'Tentativa de login falhou', time: '2h atrás' },
    { id: 4, type: 'success', message: 'Serviço "Saúde" criado', time: '3h atrás' },
]

export function ActivityFeedWidget() {
    return (
        <CardContent className="pt-2 px-2">
            <div className="relative border-l border-slate-200 ml-3 space-y-6 py-2">
                {MOCK_ACTIVITY.map((item) => (
                    <div key={item.id} className="ml-6 relative">
                        <span className="absolute -left-[31px] top-1 h-6 w-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                            {item.type === 'info' && <Info className="h-3 w-3 text-blue-500" />}
                            {item.type === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                            {item.type === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-700">{item.message}</span>
                            <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    )
}
