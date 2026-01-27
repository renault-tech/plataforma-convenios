"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useService } from "@/contexts/ServiceContext"
import { ItemsTable } from "@/components/services/ItemsTable"
import { ItemForm } from "@/components/services/ItemForm"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function ServicePage() {
    const params = useParams()
    const slug = params.slug as string
    const { services, activeService, setActiveService, isLoading: isServicesLoading, refreshServices } = useService()
    const [items, setItems] = useState<any[]>([])
    const [isLoadingItems, setIsLoadingItems] = useState(false)
    const supabase = createClient()

    // Sync active service with URL slug
    useEffect(() => {
        // Only run if services are loaded and activeService needs update
        if (!isServicesLoading && services.length > 0) {
            const service = services.find(s => s.slug === slug)
            if (service && activeService?.id !== service.id) {
                setActiveService(service)
            }
        }
    }, [slug, services, isServicesLoading, activeService?.id, setActiveService])

    // Fetch items only when activeService matches the slug to avoid race conditions
    useEffect(() => {
        // Don't fetch if activeService is not yet the one we want
        if (!activeService || activeService.slug !== slug) return

        let isMounted = true;

        async function fetchItems() {
            setIsLoadingItems(true)
            try {
                const { data, error } = await supabase
                    .from('items')
                    .select('*')
                    .eq('service_id', activeService!.id) // non-null asserted because of check above
                    .order('created_at', { ascending: false })

                if (!isMounted) return

                if (error) {
                    console.error("Error fetching items:", error)
                    toast.error("Erro ao carregar itens.")
                } else {
                    const normalized = data.map(item => ({
                        id: item.id,
                        service_id: item.service_id,
                        created_at: item.created_at,
                        ...item.data
                    }))
                    setItems(normalized)
                }
            } catch (err) {
                console.error("Failed to fetch items", err)
            } finally {
                if (isMounted) setIsLoadingItems(false)
            }
        }

        fetchItems()

        return () => { isMounted = false }
    }, [activeService?.id, slug, supabase]) // Depend on ID, not full object

    const handleSaveItem = async (formData: any) => {
        if (!activeService) return

        try {
            const { error } = await supabase
                .from('items')
                .insert({
                    service_id: activeService.id,
                    data: formData
                })

            if (error) throw error

            toast.success("Item salvo com sucesso!")

            // Refresh items
            const { data: newData, error: fetchError } = await supabase
                .from('items')
                .select('*')
                .eq('service_id', activeService.id)
                .order('created_at', { ascending: false })

            if (!fetchError && newData) {
                const normalized = newData.map(item => ({
                    id: item.id,
                    service_id: item.service_id,
                    created_at: item.created_at,
                    ...item.data
                }))
                setItems(normalized)
            }

        } catch (err: any) {
            console.error("Error saving item:", JSON.stringify(err, null, 2))
            toast.error(`Erro ao salvar item: ${err.message || 'Erro desconhecido'}`)
        }
    }

    const [editingItem, setEditingItem] = useState<any | null>(null)

    // ... (useEffect fetches)

    const handleDeleteItem = async (item: any) => {
        if (confirm("Tem certeza que deseja excluir este item?")) {
            try {
                const { error } = await supabase
                    .from('items')
                    .delete()
                    .eq('id', item.id)

                if (error) throw error

                toast.success("Item excluído.")
                setItems(prev => prev.filter(i => i.id !== item.id))
            } catch (e: any) {
                console.error("Error deleting item:", e)
                toast.error("Erro ao excluir item.")
            }
        }
    }

    const handleUpdateItem = async (formData: any) => {
        if (!activeService || !editingItem) return

        try {
            const { error } = await supabase
                .from('items')
                .update({
                    data: formData // We update the JSONB data
                })
                .eq('id', editingItem.id)

            if (error) throw error

            toast.success("Item atualizado!")
            setEditingItem(null)

            // Refresh items (or optimistic update)
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } : i))

            // Re-fetch to be safe (optional)
        } catch (err: any) {
            console.error("Error updating item:", err)
            toast.error("Erro ao atualizar item.")
        }
    }

    if (isServicesLoading) return <div className="p-8">Carregando serviços...</div>

    // Fallback if service not found (only after loading)
    if (!services.find(s => s.slug === slug)) return <div className="p-8">Serviço não encontrado.</div>

    // Wait for activeService to sync (show nothing or skeleton)
    if (!activeService || activeService.slug !== slug) return <div className="p-8">Carregando dados do serviço...</div>

    // Use columns_config from the service. Default to empty array if missing.
    const columns = activeService.columns_config || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight" style={{ color: activeService.primary_color }}>
                    {activeService.name}
                </h2>
                <ItemForm
                    columns={columns}
                    onSave={handleSaveItem}
                    serviceName={activeService.name}
                />
            </div>

            {isLoadingItems ? (
                <div>Carregando itens...</div>
            ) : (
                <ItemsTable
                    columns={columns}
                    data={items}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={handleDeleteItem}
                />
            )}

            {/* Edit Dialog */}
            {editingItem && (
                <ItemForm
                    columns={columns}
                    onSave={handleUpdateItem}
                    serviceName={activeService.name}
                    initialData={editingItem} // Pass the flattened item (which includes data props)
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}
        </div>
    )
}
