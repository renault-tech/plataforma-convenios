"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChat } from "@/contexts/ChatContext"
import { Badge } from "@/components/ui/badge"

interface ServiceChatTriggerProps {
    serviceId: string
    serviceName: string
    primaryColor?: string
}

export function ServiceChatTrigger({ serviceId, serviceName, primaryColor = '#3b82f6' }: ServiceChatTriggerProps) {
    const { createConversation, openConversation, activeConversation } = useChat()

    // We need to find if a conversation for this service already exists and open it,
    // or keep the trigger ready to create/open on click.
    // Ideally, the ChatContext should have a 'getServiceConversation(serviceId)' helper,
    // but for now we'll handle the click logic: "Open chat for this context".

    const handleClick = async () => {
        // Logic to open service chat.
        // We probably want to invoke a method in context like `openServiceChat(serviceId, serviceName)`
        // Since we don't have that exact helper, we can treat it as a conversation creation/retrieval.

        // Let's assume createConversation handles "get or create" logic for service type.
        // const convoId = await createConversation([], 'service', serviceId)
        // if (convoId) openConversation(convoId)

        // Actually, to keep it clean, let's expose specific Service Chat opener in context or handle it here.
        // Let's call a method that we'll add to context or just use createConversation which returns ID.

        const convoId = await createConversation([], 'service', serviceId)
        if (convoId) openConversation(convoId)
    }

    return (
        <Button
            size="icon"
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-xl z-40 transition-transform hover:scale-105"
            style={{ backgroundColor: primaryColor }}
            onClick={handleClick}
        >
            <MessageCircle className="h-7 w-7 text-white" />
            {/* Optional: Unread badge if we can track unreads per service context efficiently */}
            {/* <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 rounded-full">3</Badge> */}
        </Button>
    )
}
