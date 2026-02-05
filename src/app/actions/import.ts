"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createServiceFromImport(name: string, importData: any, color: string = "#16a34a", icon: string = "FileSpreadsheet") {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
        return { success: false, error: "Usuário não autenticado" }
    }

    try {
        // 1. Create Service
        // Generate Slug
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "") || `imported-${Date.now()}`

        console.log("--- CREATE SERVICE FROM IMPORT ---")
        console.log("Name:", name)
        console.log("Generated Slug:", slug)
        console.log("Owner ID:", user.id)

        if (!slug) {
            console.error("CRITICAL: Slug is empty/null!")
            throw new Error("Slug cannot be generated")
        }

        let service: any = null
        let serviceError: any = null

        // Try inserting with new columns
        const attempt1 = await supabase
            .from("services")
            .insert({
                name: name,
                slug: slug,
                owner_id: user.id,
                color: color,
                icon: icon
            })
            .select()
            .single()

        if (attempt1.error && attempt1.error.message.includes("column") && attempt1.error.message.includes("color")) {
            console.warn("Color column missing, falling back to legacy insert")
            // Fallback: Insert without color/icon
            const attempt2 = await supabase
                .from("services")
                .insert({
                    name: name,
                    slug: slug,
                    owner_id: user.id
                })
                .select()
                .single()
            service = attempt2.data
            serviceError = attempt2.error
        } else {
            service = attempt1.data
            serviceError = attempt1.error
        }



        // 2. Create Columns
        const columns = importData.columns.map((col: any, index: number) => ({
            service_id: service.id,
            name: col.name,
            type: col.type === 'date' ? 'date' : col.type === 'number' ? 'currency' : 'text',
            order: index
        }))

        // We need to know the IDs of created columns to map data!
        // So we must insert and return IDs.
        const { data: createdColumns, error: columnsError } = await supabase
            .from("service_columns")
            .insert(columns)
            .select()

        if (columnsError) throw columnsError

        // Map column name to new column ID
        const columnMap: Record<string, string> = {}
        createdColumns.forEach((col: any) => {
            columnMap[col.name] = col.id
        })

        // 3. Prepare Items Data
        // importData.data is array of objects { "Header Name": Value }
        // We need to transform to { "col_uuid": Value }

        const itemsToInsert = importData.data.map((row: any) => {
            const itemData: Record<string, any> = {}
            Object.keys(row).forEach(header => {
                // Use column name directly as key (matches how ServiceView expects data)
                itemData[header] = row[header]
            })
            return {
                service_id: service.id,
                data: itemData
            }
        })

        // 4. Batch Insert Items
        // Supabase limits? Maybe chunk it if > 1000? 
        // For MVP assuming reasonable size.
        const { error: itemsError } = await supabase
            .from("items")
            .insert(itemsToInsert)

        if (itemsError) throw itemsError

        revalidatePath("/") // Refresh sidebar
        revalidatePath("/dashboard")
        revalidatePath("/configuracoes")
        revalidatePath("/servicos") // Refresh services list
        return { success: true, serviceId: service.id, slug: service.slug }

    } catch (error: any) {
        console.error("Import Server Action Error:", error)
        return { success: false, error: error.message }
    }
}
