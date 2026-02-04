'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitFeedback(data: { message: string, url: string, type?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    const { error } = await supabase
        .from('feedback')
        .insert({
            user_id: user.id,
            message: data.message,
            url: data.url,
            type: data.type || 'general',
            status: 'new'
        })

    if (error) {
        console.error("Error submitting feedback:", error)
        return { error: "Erro ao enviar feedback" }
    }

    return { success: true }
}

export async function getFeedbackList() {
    const supabase = await createClient()

    // Check admin based on RLS (policy will handle it, but good to check here too if needed/optimization)
    // We rely on RLS.

    const { data, error } = await supabase
        .from('feedback')
        .select(`
            *,
            profiles:user_id (
                email,
                full_name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching feedback:", JSON.stringify(error, null, 2))
        return []
    }

    return data
}

export async function updateFeedbackStatus(id: string, status: 'new' | 'read' | 'archived') {
    const supabase = await createClient()

    // RLS ensures only admin can update
    const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error("Error updating feedback:", error)
        return { error: "Erro ao atualizar status" }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function deleteFeedback(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: "Erro ao excluir" }
    }

    revalidatePath('/admin')
    return { success: true }
}
