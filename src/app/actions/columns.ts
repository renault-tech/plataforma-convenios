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
