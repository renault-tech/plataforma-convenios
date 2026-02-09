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
                primary_color: color,
                icon: icon
                // Note: metadata field removed for compatibility
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

        if (serviceError) throw serviceError

        // DETECT MULTI-TABLE IMPORT
        // If we have tableBlocks and more than 1 block, or even just 1 block but prefer new structure?
        // Let's use new structure if tableBlocks is present.

        // However, parseExcel ALWAYS returns tableBlocks now.
        // So we should decide based on:
        // 1. If length > 1 -> Definitely use table_blocks
        // 2. If length === 1 -> Could use legacy service_columns for backward compatibility with existing features?
        //    Using legacy service_columns ensures standard features (sorting, filtering on single table) work out of box
        //    without modifying ServiceView heavily for single table case.

        const hasMultipleTables = importData.tableBlocks && importData.tableBlocks.length > 1

        if (hasMultipleTables) {
            // 2. Create Table Blocks
            console.log(`Creating ${importData.tableBlocks.length} table blocks...`)

            for (let i = 0; i < importData.tableBlocks.length; i++) {
                const block = importData.tableBlocks[i]

                // Create Table Block
                const { data: tableBlock, error: blockError } = await supabase
                    .from('table_blocks')
                    .insert({
                        service_id: service.id,
                        title: block.title || `Tabela ${i + 1}`,
                        order: i,
                        columns: block.columns
                    })
                    .select()
                    .single()

                if (blockError) throw blockError

                // Create Items for this block
                // Data rows are already objects { "colId": val }
                // We need to map them to item structure

                const itemsToInsert = block.data.map((row: any) => ({
                    service_id: service.id,
                    table_block_id: tableBlock.id,
                    data: row
                }))

                // Batch insert items
                console.log(`Block ${i} (${block.title}): Inserting ${itemsToInsert.length} items...`)
                if (itemsToInsert.length > 0) {
                    const { error: itemsError, data: insertedItems } = await supabase
                        .from("items")
                        .insert(itemsToInsert)
                        .select('id')

                    if (itemsError) {
                        console.error(`Error inserting items for block ${i}:`, itemsError)
                        throw itemsError
                    }
                    console.log(`Block ${i}: Successfully inserted ${insertedItems?.length} items.`)
                }
            }

        } else {
            // SINGLE TABLE (LEGACY MODE)
            // Use the first block (or legacy properties)
            const columnsData = importData.columns
            const itemsData = importData.data

            // 2. Create Columns in service_columns
            const columns = columnsData.map((col: any, index: number) => ({
                service_id: service.id,
                name: col.name,
                type: col.type === 'date' ? 'date' : col.type === 'number' ? 'currency' : 'text',
                order: index
            }))

            // We need to know the IDs of created columns to map data if we were using normalized data
            // But here items store data as JSON with column names/ids as keys.
            // Just inserting columns is enough for schema definition.
            const { error: columnsError } = await supabase
                .from("service_columns")
                .insert(columns)

            if (columnsError) throw columnsError

            // 3. Prepare Items Data
            const itemsToInsert = itemsData.map((row: any) => {
                const itemData: Record<string, any> = {}
                Object.keys(row).forEach(header => {
                    itemData[header] = row[header]
                })
                return {
                    service_id: service.id,
                    data: itemData
                }
            })

            // 4. Batch Insert Items
            if (itemsToInsert.length > 0) {
                const { error: itemsError } = await supabase
                    .from("items")
                    .insert(itemsToInsert)

                if (itemsError) throw itemsError
            }
        }

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
