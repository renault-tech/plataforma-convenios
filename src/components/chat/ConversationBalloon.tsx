"use client"

import { useEffect, useRef, useState } from "react"
import { useChat, Message } from "@/contexts/ChatContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Settings, ArrowLeft, MoreVertical, Paperclip } from "lucide-react"
import { ChatSettingsPanel } from "./ChatSettingsPanel"

interface ConversationBalloonProps {
    isOpen: boolean
    onClose: () => void
    anchorRef: React.RefObject<HTMLDivElement | null> // Relaxed type
}

export function ConversationBalloon({ isOpen, onClose, anchorRef }: ConversationBalloonProps) {
    const { activeConversation, messages, sendMessage, settings, closeChat, isLoading, currentUser, toggleStatus } = useChat()
    const [newMessage, setNewMessage] = useState("")
    const [showSettings, setShowSettings] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

    const balloonRef = useRef<HTMLDivElement>(null)

    // Update position based on anchor
    useEffect(() => {
        if (isOpen && anchorRef.current) {
            setAnchorRect(anchorRef.current.getBoundingClientRect())
        }
    }, [isOpen, anchorRef])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                balloonRef.current &&
                !balloonRef.current.contains(event.target as Node) &&
                anchorRef.current &&
                !anchorRef.current.contains(event.target as Node)
            ) {
                onClose()
                closeChat()
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen, onClose, closeChat, anchorRef])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    // Auto-focus input
    const inputRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        if (isOpen) {
            // Small timeout to allow animation/mount
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
    }, [isOpen])

    const handleSend = async () => {
        if (!newMessage.trim()) return
        const success = await sendMessage(newMessage)
        if (success) setNewMessage("")
    }

    // Auto-resize input
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
        }
    }, [newMessage])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && settings.enter_to_send) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!isOpen || !activeConversation || !anchorRect) return null

    const style = {
        top: anchorRect.top,
        left: anchorRect.right + 16, // 16px gap
        height: 'calc(100vh - 40px)', // Almost full height
        maxHeight: '600px',
    }

    return (
        <div
            ref={balloonRef}
            className="fixed z-50 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300"
            style={style}
        >
            {/* Header */}
            <div
                className="h-14 px-4 flex items-center justify-between border-b shrink-0 transition-colors"
                style={{ backgroundColor: settings.theme_color }}
            >
                <div className="flex items-center text-white">
                    {showSettings ? (
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="text-white hover:bg-white/20 mr-2 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Avatar className="h-8 w-8 mr-3 border-2 border-white/20">
                            {/* Logic to show other participant's avatar */}
                            <AvatarFallback className="bg-white/20 text-white text-xs">U</AvatarFallback>
                        </Avatar>
                    )}

                    <div className="flex flex-col">
                        <span
                            className="text-sm font-bold leading-none cursor-pointer hover:opacity-80"
                            onClick={() => {
                                // Minimize/Collapse logic
                                // User asked to "recolher" by clicking on name
                                onClose()
                                closeChat()
                            }}
                            title="Recolher conversa"
                        >
                            {showSettings ? "Configurações" : (() => {
                                const other = activeConversation.participants?.find(p => p.id !== currentUser?.id)
                                return activeConversation.name || other?.full_name || "Chat"
                            })()}
                        </span>
                        {!showSettings && (
                            <span
                                className="text-[10px] opacity-80 cursor-pointer hover:underline flex items-center gap-1"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleStatus && toggleStatus()
                                }}
                                title="Alterar status"
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${settings.status === 'online' ? 'bg-green-400' : 'bg-slate-400'}`} />
                                {settings.status === 'online' ? 'Online' : 'Invisível'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center">
                    {!showSettings && (
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-white hover:bg-white/20 h-8 w-8">
                            <Settings className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { onClose(); closeChat(); }} className="text-white hover:bg-white/20 h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content Swapper */}
            {showSettings ? (
                <ChatSettingsPanel />
            ) : (
                <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                        {messages.map((msg, i) => {
                            const isMe = currentUser?.id === msg.sender_id
                            // Quick hack: assume if sender_id != msg.sender_id (we need current user ID in context)
                            // For now, let's use a placeholder class logic or pass currentUserId from context
                            return (
                                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                                            isMe ? "text-white rounded-br-none" : "bg-white text-slate-950 border border-slate-200 rounded-bl-none"
                                        )}
                                        style={isMe ? { backgroundColor: settings.theme_color } : {}}
                                    >
                                        {msg.content}
                                        <div className={cn("text-[9px] mt-1 text-right opacity-70", isMe ? "text-white" : "text-slate-400")}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-100">
                        <div className="relative">
                            <textarea
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Digite sua mensagem..."
                                className="w-full min-h-[40px] max-h-[120px] pr-10 resize-none rounded-xl border-slate-200 focus:border-blue-400 focus:ring-0 text-sm text-slate-900 py-2 px-3 overflow-hidden"
                                rows={1}
                            />
                            <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                                <Button size="icon" variant="ghost" onClick={handleSend} className="h-7 w-7 text-slate-400 hover:text-blue-500">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
