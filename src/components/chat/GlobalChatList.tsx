"use client"

import { useState } from "react"
import { useChat } from "@/contexts/ChatContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function GlobalChatList({ onSelect }: { onSelect?: (rect: DOMRect) => void }) {
    const { conversations, activeConversation, openConversation, currentUser, deleteConversation } = useChat()

    // Filter for GLOBAL chats only (or DMs)
    // We assume 'global' type or null context_id implies a sidebar chat
    const filtered = conversations.filter(c => c.type === 'global' || !c.context_id)

    const handleSelect = (e: React.MouseEvent, conversationId: string) => {
        // If we are just opening, we might not need the rect if we change the UX
        // But let's keep it for the balloon positioning if we still use it
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        openConversation(conversationId)
        if (onSelect) onSelect(rect)
    }

    if (filtered.length === 0) {
        return (
            <div className="px-6 py-2 text-xs text-slate-500 italic">
                Nenhuma conversa.
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {filtered.map(convo => {
                const isActive = activeConversation?.id === convo.id
                // If it's a DM, find the other person's name/avatar
                const otherParticipant = convo.participants?.find(p => p.id !== currentUser?.id)
                const name = convo.name || otherParticipant?.full_name || "Chat"

                return (
                    <Button
                        key={convo.id}
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start pl-6 text-sm font-normal relative group/btn ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        onClick={(e) => handleSelect(e, convo.id)}
                        style={isActive ? { borderLeft: `4px solid #3b82f6` } : {}}
                    >
                        <div className="relative mr-2">
                            <Avatar className="h-4 w-4">
                                <AvatarFallback className="bg-slate-700 text-slate-300 text-[8px]">
                                    {(name[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <span className="truncate flex-1 text-left">{name}</span>

                        <div
                            className="opacity-0 group-hover/btn:opacity-100 transition-opacity p-1 hover:text-red-400"
                            onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation(convo.id)
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </div>
                    </Button>
                )
            })}
        </div>
    )
}
