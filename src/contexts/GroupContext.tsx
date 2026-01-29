"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export type AccessGroup = {
    id: string
    name: string
    description?: string | null
    owner_id?: string
    color?: string
}

type GroupContextType = {
    groups: AccessGroup[]
    isLoading: boolean
    refreshGroups: () => Promise<void>
    createGroup: (name: string, description?: string, color?: string) => Promise<AccessGroup | null>
    updateGroup: (id: string, updates: Partial<AccessGroup>) => Promise<void>
    deleteGroup: (id: string) => Promise<void>
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export function GroupProvider({ children }: { children: React.ReactNode }) {
    const [groups, setGroups] = useState<AccessGroup[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const fetchGroups = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("access_groups")
                .select("*")
                .order("name")

            if (error) throw error
            setGroups(data || [])
        } catch (error) {
            console.error("Error fetching groups:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchGroups()
    }, [fetchGroups])

    const createGroup = async (name: string, description?: string, color?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user")

            const { data, error } = await supabase
                .from("access_groups")
                .insert({ name, description, owner_id: user.id, color: color || '#0f172a' })
                .select()
                .single()

            if (error) throw error
            setGroups(prev => [...prev, data])
            toast.success("Grupo criado!")
            return data
        } catch (error: any) {
            console.error("Error creating group:", error)
            toast.error("Erro ao criar grupo.")
            return null
        }
    }

    const updateGroup = async (id: string, updates: Partial<AccessGroup>) => {
        try {
            const { error } = await supabase
                .from("access_groups")
                .update(updates)
                .eq("id", id)

            if (error) throw error
            setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
            toast.success("Grupo atualizado!")
        } catch (error) {
            console.error("Error updating group:", error)
            toast.error("Erro ao atualizar grupo.")
        }
    }

    const deleteGroup = async (id: string) => {
        try {
            const { error } = await supabase
                .from("access_groups")
                .delete()
                .eq("id", id)

            if (error) throw error
            setGroups(prev => prev.filter(g => g.id !== id))
            toast.success("Grupo excluído!")
        } catch (error) {
            console.error("Error deleting group:", error)
            toast.error("Erro ao excluir grupo.")
        }
    }

    return (
        <GroupContext.Provider value={{
            groups,
            isLoading,
            refreshGroups: fetchGroups,
            createGroup,
            updateGroup,
            deleteGroup
        }}>
            {children}
        </GroupContext.Provider>
    )
}

export function useGroup() {
    const context = useContext(GroupContext)
    if (context === undefined) {
        throw new Error("useGroup must be used within a GroupProvider")
    }
    return context
}
