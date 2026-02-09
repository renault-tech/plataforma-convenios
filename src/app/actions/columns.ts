"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function updateColumnWidthAction(
    serviceId: string,
    tableBlockId: string | undefined, // undefined = main service columns
    columnId: string,
    newWidth: number
) {
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

            const updatedColumns = block.columns.map((col: any) => {
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
            // We need to check which one is being used. ServiceView prefers service_columns then columns_config.
            // But usually service_columns is the source of truth if it exists.

            const { data: service, error: fetchError } = await supabase
                .from('services')
                .select('service_columns, columns_config')
                .eq('id', serviceId)
                .single()

            if (fetchError || !service) throw new Error("Service not found")

            // Determine which column set to update
            // If service_columns has data, update it. If not, update columns_config.
            // Ideally we should adhere to the priority in ServiceView.
            const targetField = (service.service_columns && Array.isArray(service.service_columns) && service.service_columns.length > 0)
                ? 'service_columns'
                : 'columns_config'

            const columns = service[targetField] || []
            const updatedColumns = columns.map((col: any) => {
                if ((col.id === columnId) || (col.name === columnId)) {
                    return { ...col, width: newWidth }
                }
                return col
            })

            const { error: updateError } = await supabase
                .from('services')
                .update({ [targetField]: updatedColumns })
                .eq('id', serviceId)

            if (updateError) throw updateError
        }

        revalidateTag(`service-${serviceId}`)
        revalidatePath(`/servicos/[slug]`, 'page') // We don't have slug here easily, but we can try generic revalidation if needed
        return { success: true }

    } catch (error: any) {
        console.error("Error updating column width:", error)
        return { success: false, error: error.message }
    }
}
