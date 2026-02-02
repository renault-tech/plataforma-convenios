"use client"

import { Bell, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeedbackButton } from "./FeedbackButton"
import { UserMenu } from "./UserMenu"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsPopover } from "./NotificationsPopover"

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

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <div className="flex-1">
                <h1 className="text-lg font-semibold">Gestão de Parcerias</h1>
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
