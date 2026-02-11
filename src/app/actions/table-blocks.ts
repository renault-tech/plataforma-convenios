"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ColumnConfig } from "@/components/services/ItemsTable"

export interface AddColumnResult {
    success: boolean
    error?: string
    data?: any
}

export async function addColumnToTableBlock(
    serviceId: string,
    tableBlockId: string | undefined, // undefined for legacy single-table
    columnDef: { name: string, type: string, options?: string[] }
): Promise<AddColumnResult> {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
        return { success: false, error: "Usuário não autenticado" }
    }

    try {
        // 1. Validate Service Ownership
        const { data: service, error: serviceError } = await supabase
            .from("services")
            .select("owner_id, service_permissions(grantee_id, status)")
            .eq("id", serviceId)
            .single()

        if (serviceError || !service) return { success: false, error: "Serviço não encontrado" }

        const isOwner = service.owner_id === user.id
        const hasPermission = service.service_permissions?.some((p: any) => p.grantee_id === user.id && p.status === 'active')

        if (!isOwner && !hasPermission) {
            return { success: false, error: "Sem permissão para editar este serviço" }
        }

        // 2. Handle Table Block (Multi-table)
        if (tableBlockId) {
            // Fetch current block
            const { data: block, error: blockErr } = await supabase
                .from("table_blocks")
                .select("*")
                .eq("id", tableBlockId)
                .single()

            if (blockErr || !block) return { success: false, error: "Bloco de tabela não encontrado" }

            const currentColumns = block.columns || []

            // Generate ID
            const newId = columnDef.name.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "_")

            // Ensure uniqueness
            let finalId = newId
            let counter = 1
            while (currentColumns.some((c: any) => (c.id || c.name) === finalId)) {
                finalId = `${newId}_${counter}`
                counter++
            }

            const newColumn = {
                id: finalId,
                name: columnDef.name,
                type: columnDef.type,
                options: columnDef.options || []
            }

            const updatedColumns = [...currentColumns, newColumn]

            const { error: updateErr } = await supabase
                .from("table_blocks")
                .update({ columns: updatedColumns })
                .eq("id", tableBlockId)

            if (updateErr) throw updateErr

            revalidatePath(`/servicos/[slug]`)
            return { success: true, data: newColumn }
        }

        // 3. Handle Legacy Single Table (service_columns)
        else {
            // Get max order
            const { data: maxOrderData } = await supabase
                .from("service_columns")
                .select("order")
                .eq("service_id", serviceId)
                .order("order", { ascending: false })
                .limit(1)

            const nextOrder = (maxOrderData?.[0]?.order ?? -1) + 1

            const { error: insertErr } = await supabase
                .from("service_columns")
                .insert({
                    service_id: serviceId,
                    name: columnDef.name,
                    type: columnDef.type,
                    order: nextOrder,
                    ...(columnDef.options && columnDef.options.length > 0 ? { options: columnDef.options } : {})
                })

            if (insertErr) throw insertErr

            revalidatePath(`/servicos/[slug]`)
            return { success: true }
        }

    } catch (error: any) {
        console.error("Error adding column:", error)
        return { success: false, error: error.message }
    }
}
