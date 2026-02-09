'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createItemAction(serviceId: string, itemData: any, tableBlockId?: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('items')
            .insert({
                service_id: serviceId,
                table_block_id: tableBlockId || null,
                data: itemData
            })
            .select()
            .single()

        if (error) throw error

        // Touch Service Updated At
        await supabase
            .from('services')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', serviceId)

        revalidatePath(`/servicos/[slug]`, 'page') // Revalidate generic service page
        return { success: true, data }
    } catch (error: any) {
        console.error("Error creating item:", error)
        return { success: false, error: error.message }
    }
}

export async function updateItemAction(itemId: string, itemData: any) {
    const supabase = await createClient()

    try {
        // First get service_id to touch it (or use subquery, but fetching is safe)
        const { data: item } = await supabase.from('items').select('service_id, data').eq('id', itemId).single()

        if (!item) throw new Error("Item not found")

        // MERGE existing data with new data to prevent overwrite
        const updatedData = { ...item.data, ...itemData }

        const { data, error } = await supabase
            .from('items')
            .update({
                data: updatedData
            })
            .eq('id', itemId)
            .select()
            .single()

        if (error) throw error

        if (item?.service_id) {
            await supabase
                .from('services')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', item.service_id)
        }

        revalidatePath(`/servicos/[slug]`, 'page')
        return { success: true, data }
    } catch (error: any) {
        console.error("Error updating item:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteItemAction(itemId: string) {
    const supabase = await createClient()

    try {
        const { data: item } = await supabase.from('items').select('service_id').eq('id', itemId).single()

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', itemId)

        if (error) throw error

        if (item?.service_id) {
            await supabase
                .from('services')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', item.service_id)
        }

        revalidatePath(`/servicos/[slug]`, 'page')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting item:", error)
        return { success: false, error: error.message }
    }
}
