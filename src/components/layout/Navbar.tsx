"use client"

import { Bell, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { UserMenu } from "./UserMenu"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsPopover } from "./NotificationsPopover"
import dynamic from "next/dynamic"

const FeedbackButton = dynamic(() => import('./FeedbackButton').then(mod => mod.FeedbackButton), { ssr: false })

export function Navbar() {
    const [count, setCount] = useState(0)
    const supabase = createClient()

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

    const { zoomLevel, increaseZoom, decreaseZoom, resetZoom } = useStore()

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <div className="flex-1">
                <h1 className="text-lg font-semibold">Gestão de Parcerias</h1>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 mr-2 bg-slate-100 rounded-md p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={decreaseZoom} disabled={zoomLevel <= 0.5}>
                    <span className="text-sm font-bold">-</span>
                </Button>
                <button onClick={resetZoom} className="text-xs font-medium w-12 text-center hover:bg-slate-200 rounded px-1 py-0.5 transition-colors">
                    {Math.round(zoomLevel * 100)}%
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={increaseZoom} disabled={zoomLevel >= 1.5}>
                    <span className="text-sm font-bold">+</span>
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <FeedbackButton>
                    <Button variant="ghost" className="gap-2 text-slate-600">
                        <MessageSquarePlus className="h-5 w-5" />
                        <span>Feedback</span>
                    </Button>
                </FeedbackButton>
                <NotificationsPopover />
                <UserMenu />
            </div>
        </header>
    )
}
