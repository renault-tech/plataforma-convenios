"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChat } from "@/contexts/ChatContext"
import { Badge } from "@/components/ui/badge"
import { getContrastYIQ } from "@/lib/utils"

interface ServiceChatTriggerProps {
    serviceId: string
    serviceName: string
    primaryColor?: string
}

export function ServiceChatTrigger({ serviceId, serviceName, primaryColor = '#3b82f6' }: ServiceChatTriggerProps) {
    const { createConversation, openConversation, conversations } = useChat()

    // Find existing conversation for this service active for this user
    const conversation = conversations.find(c => c.type === 'service' && c.context_id === serviceId)
    const hasUnread = (conversation?.unread_count || 0) > 0

    const handleClick = async () => {
        const convoId = await createConversation([], 'service', serviceId)
        if (convoId) openConversation(convoId)
    }

    return (
        <Button
            size="icon"
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-xl z-40 transition-transform hover:scale-105"
            style={{
                backgroundColor: primaryColor,
                color: getContrastYIQ(primaryColor)
            }}
            onClick={handleClick}
        >
            <MessageCircle className="h-7 w-7" />

            {hasUnread && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white animate-in zoom-in duration-300">
                    !
                </span>
            )}
        </Button>
    )
}
