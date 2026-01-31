"use client"

import { useEffect, useRef, useState } from "react"
import { useChat, Message } from "@/contexts/ChatContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Settings, ArrowLeft, Users, Loader2 } from "lucide-react"

interface ServiceChatSheetProps {
    serviceId: string
    serviceName: string
    primaryColor?: string
}

export function ServiceChatSheet({ serviceId, serviceName, primaryColor = '#3b82f6' }: ServiceChatSheetProps) {
    const { activeConversation, messages, sendMessage, settings, closeChat, isLoading, currentUser } = useChat()
    const [newMessage, setNewMessage] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    // Only show if activeConversation matches this service context
    const isOpen = activeConversation?.type === 'service' && activeConversation.context_id === serviceId

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    // Auto-focus input
    const inputRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 300) // Slightly longer delay for sheet animation
        }
    }, [isOpen])

    const handleSend = async () => {
        if (!newMessage.trim()) return
        const success = await sendMessage(newMessage)
        if (success) setNewMessage("")
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && settings.enter_to_send) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => closeChat()} />

            <div
                className="relative h-full w-[600px] max-w-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200"
            >
                {/* Header */}
                <div
                    className="h-16 px-6 flex items-center justify-between shrink-0 shadow-sm z-10 bg-white"
                    style={{ borderTop: `4px solid ${primaryColor}` }}
                >
                    <div className="flex items-center">
                        <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center mr-4 text-white shadow-sm"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg leading-tight">{serviceName}</h2>
                            <p className="text-xs text-slate-500">Chat da Equipe</p>
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => closeChat()} className="text-slate-400 hover:text-slate-900">
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                            <Users className="h-16 w-16 mb-4 stroke-1" />
                            <p>Nenhuma mensagem ainda.</p>
                            <p className="text-sm">Inicie a conversa com sua equipe!</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isMe = currentUser?.id === msg.sender_id
                        return (
                            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                <div className="flex items-end gap-2 max-w-[85%]">
                                    {!isMe && (
                                        <Avatar className="h-8 w-8 mb-1">
                                            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-bold">
                                                {(msg.sender?.full_name?.[0] || 'U').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className={cn(
                                        "px-4 py-3 rounded-2xl shadow-sm text-sm",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                                    )}>
                                        {!isMe && (
                                            <span className="text-[10px] font-bold opacity-70 block mb-1 text-blue-600">
                                                {msg.sender?.full_name || 'Desconhecido'}
                                            </span>
                                        )}
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 mx-11">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )
                    })}
                    {isLoading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                        <textarea
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Mensagem para ${serviceName}...`}
                            className="w-full min-h-[50px] max-h-[150px] bg-transparent border-none focus:ring-0 resize-none text-sm text-slate-800 placeholder:text-slate-400 py-2 px-2"
                            rows={1}
                        />
                        <Button
                            size="icon"
                            className="mb-1 h-9 w-9 shrink-0 transition-all"
                            style={{ backgroundColor: newMessage.trim() ? primaryColor : '#94a3b8' }}
                            onClick={handleSend}
                            disabled={!newMessage.trim() || isLoading}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                        <p className="text-[10px] text-slate-400">
                            <strong>Enter</strong> para enviar, <strong>Shift + Enter</strong> para nova linha.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
