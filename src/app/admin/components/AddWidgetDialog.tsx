"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAdminDashboard, WidgetType } from "@/hooks/useAdminDashboard"
import { WIDGET_CONFIG } from "./DashboardWidgets"
import { cn } from "@/lib/utils"

export function AddWidgetDialog() {
    const { addWidget, availableWidgets } = useAdminDashboard()

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer group">
                    <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                        <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600">Personalizar Dashboard</span>
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Widget</DialogTitle>
                    <DialogDescription>
                        Escolha um widget para adicionar ao seu painel.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-4">
                    {availableWidgets.map((type) => {
                        const config = WIDGET_CONFIG[type]
                        if (!config) return null

                        return (
                            <Button
                                key={type}
                                variant="outline"
                                className="h-auto flex-col items-start p-4 gap-2 hover:border-blue-500 hover:bg-blue-50"
                                onClick={() => addWidget(type)}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <config.icon className="h-4 w-4 text-blue-500" />
                                    <span className="font-semibold">{config.title}</span>
                                </div>
                                <span className="text-xs text-slate-500 text-left line-clamp-2">
                                    {config.description}
                                </span>
                            </Button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
