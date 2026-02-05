"use client"

import { Bell, MessageSquarePlus, HelpCircle, Sun, Moon, AlarmClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { UserMenu } from "./UserMenu"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsPopover } from "./NotificationsPopover"
import { NotificationsInboxDialog } from "@/components/notifications/NotificationsInboxDialog"
import dynamic from "next/dynamic"
import { useTutorial } from "@/hooks/useTutorial"

import { ImportButton } from "@/components/import/ImportButton"

const FeedbackButton = dynamic(() => import('./FeedbackButton').then(mod => mod.FeedbackButton), { ssr: false })

export function Navbar() {
    const [count, setCount] = useState(0)
    const [showAlerts, setShowAlerts] = useState(false)
    const supabase = createClient()
    const { startTutorial } = useTutorial()

    useEffect(() => {
        // Start tour check
        startTutorial()
    }, [])

    useEffect(() => {
        const fetchCount = async () => {
            const { count } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .is("read_at", null)
            setCount(count || 0)
        }
        fetchCount()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('notifications-count')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => fetchCount()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])


    const { zoomLevel, increaseZoom, decreaseZoom, resetZoom, isDarkMode, toggleDarkMode } = useStore()

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background dark:bg-slate-900 dark:border-slate-700 px-6">
            <div className="flex-1">
                <h1 className="text-lg font-semibold dark:text-slate-50">Gestão de Parcerias</h1>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={decreaseZoom} disabled={zoomLevel <= 0.5}>
                    <span className="text-sm font-bold">-</span>
                </Button>
                <button onClick={resetZoom} className="text-xs font-medium w-12 text-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded px-1 py-0.5 transition-colors">
                    {Math.round(zoomLevel * 100)}%
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={increaseZoom} disabled={zoomLevel >= 1.5}>
                    <span className="text-sm font-bold">+</span>
                </Button>
            </div>

            {/* Excel Import */}
            <ImportButton className="mr-2" />

            {/* Global Alarms Inbox */}
            <Button
                id="my-alerts-trigger"
                variant="ghost"
                size="sm"
                className="mr-2 text-slate-600 hover:text-red-600 gap-2"
                onClick={() => setShowAlerts(true)}
                title="Meus Alertas Configurados"
                data-tour-group="global"
                data-tour-title="Central de Alertas"
                data-tour-desc="Gerencie todos os seus alertas de vencimento e notificações em um só lugar. Configure avisos para qualquer planilha."
                data-tour-order="3"
            >
                <AlarmClock className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Meus Alertas</span>
            </Button>

            {/* Dark Mode Toggle */}
            <button
                onClick={toggleDarkMode}
                className="relative h-9 w-16 bg-slate-200 dark:bg-slate-700 rounded-full p-1 transition-colors duration-300 hover:bg-slate-300 dark:hover:bg-slate-600 mr-2"
                title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
                <div className={`absolute top-1 left-1 h-7 w-7 bg-white dark:bg-slate-900 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}>
                    {isDarkMode ? (
                        <Moon className="h-4 w-4 text-slate-300" />
                    ) : (
                        <Sun className="h-4 w-4 text-yellow-500" />
                    )}
                </div>
            </button>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500 hover:text-blue-600"
                    onClick={() => startTutorial(true)}
                    title="Ajuda desta tela"
                >
                    <HelpCircle className="h-5 w-5" />
                </Button>
                <div
                    id="feedback-btn"
                    data-tour-group="global"
                    data-tour-title="Feedback e Sugestões"
                    data-tour-desc="Encontrou um erro ou tem uma ideia? Nos envie diretamente por aqui!"
                    data-tour-order="4"
                    data-tour-align="center"
                >
                    <FeedbackButton>
                        <Button variant="ghost" className="gap-2 text-slate-600">
                            <MessageSquarePlus className="h-5 w-5" />
                            <span>Feedback</span>
                        </Button>
                    </FeedbackButton>
                </div>
                <div
                    id="notifications-trigger"
                    data-tour-group="global"
                    data-tour-title="Notificações"
                    data-tour-desc="Fique por dentro de convites e atualizações importantes."
                    data-tour-order="5"
                    data-tour-align="end"
                >
                    <NotificationsPopover />
                </div>
                <div
                    id="user-menu-trigger"
                    data-tour-group="global"
                    data-tour-title="Seu Perfil & Ajuda"
                    data-tour-desc="Gerencie sua conta ou reveja este tour.<br/><br/><b>Dica de Ouro:</b> Em cada tela do sistema (Dashboard, Planilhas, Configurações), procure pelo botão <b>(?)</b> no topo para ver dicas exclusivas daquela área!"
                    data-tour-order="6"
                    data-tour-align="end"
                >
                    <UserMenu />
                </div>
            </div>
            <NotificationsInboxDialog
                open={showAlerts}
                onOpenChange={setShowAlerts}
                filterType="alert"
                customTitle="Meus Alarmes"
            />
        </header>
    )
}
