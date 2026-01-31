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
        auto_open: true
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
                    auto_open: data.auto_open
                })
                else {
                    // Create default settings if not exists
                    await supabase.from('chat_settings').insert({ user_id: user.id })
                }
            }
        }
        init()
    }, [])

    // Fetch Conversations
    const fetchConversations = useCallback(async () => {
        if (!currentUser) return

        setIsLoading(true)
        try {
            // Get detailed conversations (TODO: Optimize with view or joined query)
            // For now, simpler fetch strategy
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
                    // Flatten participants
                    const flatParticipants = c.participants?.map((part: any) => ({
                        id: part.user?.id,
                        full_name: part.user?.full_name,
                        avatar_url: part.user?.avatar_url
                    })) || []

                    return { ...c, participants: flatParticipants }
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
                    console.log("New message received:", payload)
                    // Fetch sender info for the new message
                    const { data: sender } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', payload.new.sender_id).single()

                    const newMessage = { ...payload.new, sender } as Message
                    setMessages(prev => {
                        // Avoid duplicates if optimistic update already added it (by ID)
                        if (prev.some(m => m.id === newMessage.id)) return prev
                        return [...prev, newMessage]
                    })
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
        }

    }, [activeConversation, supabase])

    // Actions
    const openConversation = (conversationId: string) => {
        const convo = conversations.find(c => c.id === conversationId)
        if (convo) setActiveConversation(convo)
    }

    const closeChat = () => setActiveConversation(null)

    const sendMessage = async (content: string) => {
        if (!activeConversation || !currentUser || !content.trim()) return false

        try {


            // Optimistic Update
            // We construct a temporary message. The ID will be provisional or we assume success.
            // Actually, we should wait for the real ID or use a temp one. 
            // Better to just push what we know and let the subscription dedup or replace it.
            // BUT: Subscription gives us the real created_at and ID.
            // Let's manually fetch or rely on the fact we just inserted it.
            // Simplest: Manual insert into state, but we need the ID generated by DB if we want to be correct.
            // However, Supabase insert().select() returns the data!

            // Let's refactor the insert to select()
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

            // Add sender info
            const fullMessage = { ...sentMessage, sender: currentUser } as Message
            setMessages(prev => [...prev, fullMessage])

            // Touch updated_at logic handled by DB trigger
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
            // Remove self from participants
            const { error } = await supabase
                .from('chat_participants')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUser.id)

            if (error) throw error

            // Update local state
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
            // 0. Check if exists (for 'service' type only, usually unique per service)
            if (type === 'service' && contextId) {
                console.log("[Chat] Checking existing service chat for:", contextId)
                // Use limit(1) to avoid PGRST116 if duplicates exist (legacy bug cleanup)
                const { data: existingList, error: findError } = await supabase
                    .from('chat_conversations')
                    .select('id')
                    .eq('context_id', contextId)
                    .eq('type', 'service')
                    .order('created_at', { ascending: true }) // Pick oldest (original)
                    .limit(1)

                if (findError) console.error("[Chat] Error finding existing:", JSON.stringify(findError, null, 2))

                const existing = existingList?.[0]

                if (existing) {
                    console.log("[Chat] Found existing conversation:", existing.id)
                    // Ensure I am a participant (if not already)
                    const { error: joinError } = await supabase
                        .from('chat_participants')
                        .upsert(
                            { conversation_id: existing.id, user_id: currentUser.id },
                            { onConflict: 'conversation_id,user_id' }
                        )

                    if (joinError) {
                        console.error("[Chat] Error joining existing chat:", joinError)
                    } else {
                        console.log("[Chat] Joined (or already in) conversation")
                    }

                    // Refresh to ensure we have it in state
                    await fetchConversations()

                    // We need to wait for state update? fetchConversations sets state.
                    // But state update is async. 
                    // However, we return the ID.
                    // The caller calls openConversation(id).
                    // openConversation finds in 'conversations'. 
                    // If not found yet (race condition), setActiveConversation might fail.

                    // Workaround: return ID, and let the caller wait or we force set active here?
                    // Let's rely on fetch completing. await fetchConversations() awaits the setConversations (if we awaited it? no setConversations is sync but render is next tick).
                    // Actually setConversations is ignored if we verify the found conversation inside it.

                    return existing.id
                }
            }

            // 1. Create Conversation
            const { data: convo, error: convoError } = await supabase
                .from('chat_conversations')
                .insert({ type, context_id: contextId })
                .select()
                .single()

            if (convoError) throw convoError

            // 2. Add Participants (Self + Others)
            const allUsers = [...userIds, currentUser.id]
            const participants = allUsers.map(uid => ({
                conversation_id: convo.id,
                user_id: uid
            }))

            const { error: partError } = await supabase
                .from('chat_participants')
                .insert(participants)

            if (partError) throw partError

            // Refresh and Open
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
            setSettings(updated) // Optimistic

            await supabase
                .from('chat_settings')
                .update(newSettings)
                .eq('user_id', currentUser.id)

        } catch (err) {
            console.error("Error updating settings", err)
            // Rollback if critical?
        }
    }

    return (
        <ChatContext.Provider value={{
            conversations,
            messages,
            activeConversation,
            isLoading,
            currentUser,
            settings,
            openConversation,
            createConversation,
            sendMessage,
            deleteConversation,
            closeChat,
            refreshConversations: fetchConversations,
            updateSettings
        }}>
            {children}
        </ChatContext.Provider>
    )
}

export const useChat = () => useContext(ChatContext)
