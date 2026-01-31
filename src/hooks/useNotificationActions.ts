import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useService } from "@/contexts/ServiceContext"

export type Notification = {
    id: string
    title: string
    message: string
    created_at: string
    read_at: string | null
    type: string
    metadata: any
    action_link?: string
}

export function useNotificationActions() {
    const supabase = createClient()
    const { refreshServices } = useService()

    const markAsRead = async (id: string) => {
        await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id)
    }

    const deleteNotification = async (id: string) => {
        try {
            await supabase.from("notifications").delete().eq("id", id)
            toast.success("Notificação removida.")
            return true
        } catch (error) {
            console.error("Failed to delete notification", error)
            toast.error("Erro ao remover notificação.")
            return false
        }
    }

    const handleAccept = async (notification: Notification) => {
        console.log("handleAccept started", notification)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.error("handleAccept: No user found")
                return false
            }

            // Get user name for feedback
            const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
            const acceptorName = profile?.full_name || profile?.email || "Usuário"

            if (notification.type === 'service_share') {
                console.log("Processing service_share", notification.metadata)
                if (notification.metadata?.permission_id) {
                    // NEW FLOW: Permission exists, update to active
                    console.log("Updating permission", notification.metadata.permission_id)
                    const { error } = await supabase
                        .from('service_permissions')
                        .update({ status: 'active' })
                        .eq('id', notification.metadata.permission_id)

                    if (error) {
                        console.error("Error updating permission", error)
                        throw error
                    }
                } else {
                    // LEGACY: Fallback insert
                    console.log("Legacy insert permission")
                    const { error } = await supabase
                        .from('service_permissions')
                        .insert({
                            service_id: notification.metadata.service_id,
                            grantee_type: notification.metadata.grantee_type || 'user',
                            grantee_id: notification.metadata.grantee_id || user.id,
                            permission_level: notification.metadata.permission_level || 'view',
                            policy_id: notification.metadata.policy_id,
                            status: 'active'
                        })
                    if (error) {
                        console.error("Error inserting permission", error)
                        throw error
                    }
                }

                // Notify Sender
                if (notification.metadata.sender_id) {
                    await supabase.from('notifications').insert({
                        user_id: notification.metadata.sender_id,
                        title: 'Convite Aceito',
                        message: `${acceptorName} aceitou o convite para acessar "${notification.metadata.service_slug || 'o serviço'}"`,
                        type: 'info'
                    })
                }
                toast.success("Acesso aceito!")

            } else if (notification.type === 'group_invite' && notification.metadata?.group_id) {
                // ... Existing Group Logic
                console.log("Processing group_invite", notification.metadata.group_id)
                const { error } = await supabase
                    .from('access_group_members')
                    .insert({
                        group_id: notification.metadata.group_id,
                        user_id: user.id,
                        status: 'active'
                    })

                if (error) {
                    if (error.code === '42501') {
                        console.warn("RLS Error on group accept (Legacy Invite?):", error)
                        toast.info("Este convite é antigo. Solicite ao dono para lhe adicionar novamente.")
                        // Allow to proceed to delete/mark as read
                    } else {
                        console.error("Error accepting group invite", error)
                        throw error
                    }
                } else {
                    toast.success("Convite de grupo aceito!")
                }
            }

            // Success Actions
            await refreshServices()
            await markAsRead(notification.id)
            return true

        } catch (error: any) {
            console.error("handleAccept caught error:", error)
            console.error("Error details:", JSON.stringify(error, null, 2))
            toast.error(`Falha ao aceitar: ${error.message || 'Erro desconhecido'}`)
            return false
        }
    }

    const handleDecline = async (notification: Notification) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && notification.metadata?.sender_id) {
                const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
                const declinerName = profile?.full_name || profile?.email || "Usuário"

                await supabase.from('notifications').insert({
                    user_id: notification.metadata.sender_id,
                    title: 'Convite Recusado',
                    message: `${declinerName} recusou o convite para acessar "${notification.metadata.service_slug || 'o serviço'}"`,
                    type: 'info' // Just info, no action needed
                })
            }

            await refreshServices()
            toast.success("Convite recusado.")
            await markAsRead(notification.id)
            return true
        } catch (e) {
            console.error(e)
            toast.error("Erro ao recusar.")
            return false
        }
    }

    return {
        handleAccept,
        handleDecline,
        deleteNotification,
        markAsRead,
        createClient // Export incase needed, but mainly actions
    }
}
