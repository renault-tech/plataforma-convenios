"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function updateColumnWidthAction(
    serviceId: string,
    tableBlockId: string | undefined, // undefined = main service columns
    columnId: string,
    newWidth: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    try {
        if (tableBlockId) {
            // Update Table Block
            const { data: block, error: fetchError } = await supabase
                .from('table_blocks')
                .select('columns')
                .eq('id', tableBlockId)
                .single()

            if (fetchError || !block) throw new Error("Table block not found")

            const updatedColumns = (block.columns as any[]).map((col: any) => {
                if ((col.id === columnId) || (col.name === columnId)) { // Handle both ID styles
                    return { ...col, width: newWidth }
                }
                return col
            })

            const { error: updateError } = await supabase
                .from('table_blocks')
                .update({ columns: updatedColumns })
                .eq('id', tableBlockId)

            if (updateError) throw updateError

        } else {
            // Update Legacy Service Columns (service_columns or columns_config)
            const { data: service, error: fetchError } = await supabase
                .from('services')
                .select('service_columns, columns_config')
                .eq('id', serviceId)
                .single()

            if (fetchError || !service) throw new Error("Service not found")

            // Determine which column set to update
            const serviceData = service as any
            const targetField = (serviceData.service_columns && Array.isArray(serviceData.service_columns) && serviceData.service_columns.length > 0)
                ? 'service_columns'
                : 'columns_config'

            const columns = serviceData[targetField] || []
            const updatedColumns = columns.map((col: any) => {
                if ((col.id === columnId) || (col.name === columnId)) {
                    return { ...col, width: newWidth }
                }
                return col
            })

            const { error: updateError } = await supabase
                .from('services')
                .update({ [targetField]: updatedColumns } as any)
                .eq('id', serviceId)

            if (updateError) throw updateError
        }

        revalidateTag(`service-${serviceId}`)
        // We don't have slug here easily, but we can try generic revalidation if needed
        // @ts-ignore
        revalidatePath(`/servicos/[slug]`, 'page')
        return { success: true }

    } catch (error: any) {
        console.error("Error updating column width:", error)
        return { success: false, error: error.message }
    }
}

export async function reorderColumnsAction(
    serviceId: string,
    tableBlockId: string | undefined,
    newOrder: string[] // Array of column IDs in the new order
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    try {
        if (tableBlockId) {
            // Update Table Block
            const { data: block, error: fetchError } = await supabase
                .from('table_blocks')
                .select('columns')
                .eq('id', tableBlockId)
                .single()

            if (fetchError || !block) throw new Error("Table block not found")

            // Reorder columns based on newOrder array
            const currentColumns = block.columns as any[]
            const reorderedColumns = newOrder.map(id => currentColumns.find(c => c.id === id || c.name === id)).filter(Boolean)

            // Add any missing columns (safety)
            const reorderedIds = new Set(reorderedColumns.map(c => c.id || c.name))
            currentColumns.forEach(c => {
                if (!reorderedIds.has(c.id || c.name)) {
                    reorderedColumns.push(c)
                }
            })

            const { error: updateError } = await supabase
                .from('table_blocks')
                .update({ columns: reorderedColumns })
                .eq('id', tableBlockId)

            if (updateError) throw updateError

        } else {
            // Update Legacy Service Columns (Hybrid: DB service_columns + JSON columns_config)

            // 1. Update DB service_columns 'order' field
            // We can't do a single batch update easily with standard Supabase client without an RPC or multiple calls.
            // For now, let's look at how many columns we have. If < 50, multiple calls is okay-ish but slow.
            // Better: We likely only really care about the JSON config for view order in many cases, 
            // BUT `ServiceView` sorts by `order`. 

            // Let's do a loop for DB columns.
            const updates = newOrder.map((id, index) => ({ id, order: index }))

            // We need to know which IDs belong to DB columns to update them.
            const { data: dbColumns } = await supabase
                .from('service_columns')
                .select('id, name')
                .eq('service_id', serviceId)

            const dbColumnIds = new Set(dbColumns?.map(c => c.id) || [])
            const dbColumnNames = new Set(dbColumns?.map(c => c.name) || []) // Legacy fallback

            for (const item of updates) {
                // Check if this ID (or name) exists in DB columns
                // Note: newOrder might contain IDs like 'status_1', but DB might have 'status'. 
                // However, our frontend logic uses unique IDs. 
                // If it's a DB column, it has a UUID 'id'. 

                if (dbColumnIds.has(item.id)) {
                    await supabase
                        .from('service_columns')
                        .update({ order: item.order })
                        .eq('id', item.id)
                }
            }

            // 2. Update JSON columns_config 'order' field (and array order)
            const { data: service } = await supabase
                .from('services')
                .select('columns_config')
                .eq('id', serviceId)
                .single()

            if (service && service.columns_config) {
                let jsonCols = service.columns_config as any[]

                // Update internal order property
                jsonCols = jsonCols.map(col => {
                    const index = newOrder.indexOf(col.id || col.name)
                    if (index !== -1) {
                        return { ...col, order: index }
                    }
                    return col
                })

                // Sort the array itself too
                jsonCols.sort((a, b) => {
                    const indexA = newOrder.indexOf(a.id || a.name)
                    const indexB = newOrder.indexOf(b.id || b.name)
                    // If found in new order, use that. Else put at end.
                    const valA = indexA === -1 ? 9999 : indexA
                    const valB = indexB === -1 ? 9999 : indexB
                    return valA - valB
                })

                await supabase
                    .from('services')
                    .update({ columns_config: jsonCols })
                    .eq('id', serviceId)
            }
        }

        revalidateTag(`service-${serviceId}`)
        // @ts-ignore
        revalidatePath(`/servicos/[slug]`, 'page')
        return { success: true }

    } catch (error: any) {
        console.error("Error reordering columns:", error)
        return { success: false, error: error.message }
    }
}
