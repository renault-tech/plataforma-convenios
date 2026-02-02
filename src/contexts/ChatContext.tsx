"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { RealtimeChannel } from "@supabase/supabase-js"

// Types
export type ChatType = 'global' | 'service' | 'group'

export interface ChatUser {
    id: string
    full_name: string
    avatar_url?: string
}

export interface Conversation {
    id: string
    type: ChatType
    context_id?: string | null
    name?: string
    created_at: string
    updated_at: string
    last_message?: Message
    unread_count?: number
    participants?: ChatUser[]
}

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    created_at: string
    is_system_message: boolean
    sender?: ChatUser
}

export interface ChatSettings {
    theme_color: string
    enter_to_send: boolean
    auto_open: boolean
    status?: 'online' | 'offline'
}

interface ChatContextType {
    conversations: Conversation[]
    messages: Message[]
    activeConversation: Conversation | null
    isLoading: boolean
    currentUser: ChatUser | null
    settings: ChatSettings
    openConversation: (conversationId: string) => void
    createConversation: (userIds: string[], type: ChatType, contextId?: string) => Promise<string | null>
    sendMessage: (content: string) => Promise<boolean>
    deleteConversation: (conversationId: string) => Promise<void>
    closeChat: () => void
    refreshConversations: () => Promise<void>
    updateSettings: (newSettings: Partial<ChatSettings>) => Promise<void>
    toggleStatus: () => void
    markAsRead: (conversationId: string) => Promise<void>
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType)

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [settings, setSettings] = useState<ChatSettings>({
        theme_color: '#3b82f6',
        enter_to_send: true,
        auto_open: true,
        status: 'online'
    })

    const supabase = createClient()
    const channelRef = useRef<RealtimeChannel | null>(null)

    // Load User & Settings
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUser(user)
                // Load settings
                const { data } = await supabase.from('chat_settings').select('*').eq('user_id', user.id).single()
                if (data) setSettings({
                    theme_color: data.theme_color,
                    enter_to_send: data.enter_to_send,
                    auto_open: data.auto_open,
                    status: 'online'
                })
                else {
                    // Create default settings if not exists
                    await supabase.from('chat_settings').insert({ user_id: user.id })
                }
            }
        }
        init()
    }, [])

    const toggleStatus = async () => {
        setSettings(prev => ({ ...prev, status: prev.status === 'online' ? 'offline' : 'online' }))
    }

    // Improved fetch with unread logic
    const fetchConversations = useCallback(async () => {
        if (!currentUser) return

        setIsLoading(true)
        try {
            // Get detailed conversations
            const { data: participations, error } = await supabase
                .from('chat_participants')
                .select(`
                    conversation_id,
                    last_read_at,
                    conversation:chat_conversations (
                        id, type, context_id, name, updated_at,
                        participants:chat_participants(
                            user:profiles!user_id(id, full_name, avatar_url)
                        )
                    )
                `)
                .eq('user_id', currentUser.id)
                .order('joined_at', { ascending: false })

            if (error) throw error

            const validConvos = participations
                .map((p: any) => {
                    const c = p.conversation
                    if (!c) return null

                    // Filter out ghost chats (no name, no other participants)
                    const otherParticipants = c.participants?.filter((part: any) => part.user?.id !== currentUser.id) || []
                    const hasName = !!c.name
                    // If Global chat with no name and no other participants, it's a ghost/empty chat -> skip
                    if (c.type === 'global' && !hasName && otherParticipants.length === 0) return null

                    // Unread Count Logic (Approximate based on timestamps)
                    const lastRead = p.last_read_at ? new Date(p.last_read_at).getTime() : 0
                    const updated = new Date(c.updated_at).getTime()
                    const isUnread = updated > lastRead

                    return {
                        ...c,
                        participants: c.participants.map((part: any) => ({
                            id: part.user?.id,
                            full_name: part.user?.full_name,
                            avatar_url: part.user?.avatar_url
                        })),
                        unread_count: isUnread ? 1 : 0
                    }
                })
                .filter(Boolean)
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

            setConversations(validConvos as Conversation[])

        } catch (err) {
            console.error("Error fetching conversations:", JSON.stringify(err, null, 2))
        } finally {
            setIsLoading(false)
        }
    }, [currentUser])

    useEffect(() => {
        if (currentUser) fetchConversations()
    }, [currentUser, fetchConversations])


    // Global Subscription for List Updates (Unread indicators)
    useEffect(() => {
        if (!currentUser) return

        const channel = supabase
            .channel('global_chat_updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    if (payload.new.sender_id !== currentUser.id) {
                        console.log("Global message received, refreshing list...", payload)
                        fetchConversations()
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_conversations' },
                () => {
                    fetchConversations()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUser, fetchConversations])

    // Messages Subscription (active conversation)
    useEffect(() => {
        if (!activeConversation) {
            setMessages([])
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
            return
        }

        // Fetch initial messages
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:profiles!sender_id (id, full_name, avatar_url)
                `)
                .eq('conversation_id', activeConversation.id)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)
        }
        fetchMessages()

        // Subscribe
        const channel = supabase
            .channel(`chat:${activeConversation.id}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${activeConversation.id}` },
                async (payload) => {
                    // Fetch sender info for the new message
                    const { data: sender } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', payload.new.sender_id).single()

                    const newMessage = { ...payload.new, sender } as Message
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMessage.id)) return prev
                        return [...prev, newMessage]
                    })

                    // If I am active, I should mark as read (locally at least)
                    // But realistically we should call markAsRead. 
                    // However, calling async inside realtime handler is fine.
                    // Let's do nothing here to avoid double update loop if markAsRead triggers list refresh.
                }
            )
            .subscribe()

        channelRef.current = channel

        // Mark as read immediately when opening/switching
        markAsRead(activeConversation.id)

        return () => {
            supabase.removeChannel(channel)
        }

    }, [activeConversation, supabase])


    // Mark as Read
    const markAsRead = async (conversationId: string) => {
        if (!currentUser) return
        try {
            await supabase
                .from('chat_participants')
                .update({ last_read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUser.id)

            setConversations(prev => prev.map(c => {
                if (c.id === conversationId) {
                    return { ...c, unread_count: 0 }
                }
                return c
            }))
        } catch (err) {
            console.error("Error marking as read:", err)
        }
    }


    const closeChat = () => setActiveConversation(null)

    const sendMessage = async (content: string) => {
        if (!activeConversation || !currentUser || !content.trim()) return false

        try {
            // 1. Insert Message
            const { data: sentMessage, error: fetchError } = await supabase
                .from('chat_messages')
                .insert({
                    conversation_id: activeConversation.id,
                    sender_id: currentUser.id,
                    content: content.trim()
                })
                .select()
                .single()

            if (fetchError) throw fetchError

            // 2. Update Conversation Timestamp
            await supabase
                .from('chat_conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', activeConversation.id)

            // Add sender info
            const fullMessage = { ...sentMessage, sender: currentUser } as Message
            setMessages(prev => [...prev, fullMessage])

            return true
        } catch (err) {
            console.error("Error sending message:", err)
            toast.error("Erro ao enviar mensagem")
            return false
        }
    }

    const deleteConversation = async (conversationId: string) => {
        if (!currentUser) return

        try {
            const { error } = await supabase
                .from('chat_participants')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUser.id)

            if (error) throw error

            setConversations(prev => prev.filter(c => c.id !== conversationId))
            if (activeConversation?.id === conversationId) {
                setActiveConversation(null)
            }
            toast.success("Conversa removida")
        } catch (err) {
            console.error("Error deleting conversation:", err)
            toast.error("Erro ao remover conversa")
        }
    }

    const createConversation = async (userIds: string[], type: ChatType, contextId?: string) => {
        if (!currentUser) return null

        try {
            if (type === 'service' && contextId) {
                const { data: existingList } = await supabase
                    .from('chat_conversations')
                    .select('id')
                    .eq('context_id', contextId)
                    .eq('type', 'service')
                    .order('created_at', { ascending: true })
                    .limit(1)

                const existing = existingList?.[0]

                if (existing) {
                    await supabase
                        .from('chat_participants')
                        .upsert(
                            { conversation_id: existing.id, user_id: currentUser.id },
                            { onConflict: 'conversation_id,user_id' }
                        )

                    await fetchConversations()
                    return existing.id
                }
            }

            const { data: convo, error: convoError } = await supabase
                .from('chat_conversations')
                .insert({ type, context_id: contextId })
                .select()
                .single()

            if (convoError) throw convoError

            const allUsers = [...userIds, currentUser.id]
            const participants = allUsers.map(uid => ({
                conversation_id: convo.id,
                user_id: uid
            }))

            const { error: partError } = await supabase
                .from('chat_participants')
                .insert(participants)

            if (partError) throw partError

            await fetchConversations()
            setActiveConversation(convo as Conversation)
            return convo.id

        } catch (err) {
            console.error("Error creating conversation:", err)
            toast.error("Erro ao criar conversa")
            return null
        }
    }

    const updateSettings = async (newSettings: Partial<ChatSettings>) => {
        if (!currentUser) return

        try {
            const updated = { ...settings, ...newSettings }
            setSettings(updated)

            await supabase
                .from('chat_settings')
                .update(newSettings)
                .eq('user_id', currentUser.id)

        } catch (err) {
            console.error("Error updating settings", err)
        }
    }

    const openConversation = (conversationId: string) => {
        const convo = conversations.find(c => c.id === conversationId)
        if (convo) {
            setActiveConversation(convo)
            // markAsRead handled by useEffect when activeConversation changes
        }
    }

    return (
        <ChatContext.Provider value={{
            conversations,
            messages,
            activeConversation,
            isLoading,
            currentUser,
            settings: { ...settings, status: settings.status || 'online' },
            openConversation,
            createConversation,
            sendMessage,
            deleteConversation,
            closeChat,
            refreshConversations: fetchConversations,
            updateSettings,
            toggleStatus,
            markAsRead
        }}>
            {children}
        </ChatContext.Provider>
    )
}

export const useChat = () => useContext(ChatContext)
