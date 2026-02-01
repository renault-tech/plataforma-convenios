"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useService } from "@/contexts/ServiceContext"
import { ItemsTable } from "@/components/services/ItemsTable"
import { ItemForm } from "@/components/services/ItemForm"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

import { ShareServiceDialog } from "@/components/services/ShareServiceDialog"
import { ServiceInfoDialog } from "@/components/services/ServiceInfoDialog"
import { ServiceChatTrigger } from "@/components/chat/ServiceChatTrigger"
import { ServiceChatSheet } from "@/components/chat/ServiceChatSheet"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

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

    const uploadFiles = async (files: FileList): Promise<any[]> => {
        const uploaded: any[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`
            const filePath = `${activeService?.id}/${fileName}`

            const { data, error } = await supabase.storage
                .from('attachments')
                .upload(filePath, file)

            if (error) {
                console.error(`Error uploading ${file.name}:`, error)
                toast.error(`Erro ao enviar ${file.name}`)
                continue
            }

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath)

            uploaded.push({
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size,
                path: filePath
            })
        }
        return uploaded
    }

    const handleSaveItem = async (formData: any) => {
        if (!activeService) return

        try {
            // Extract files
            const files = formData.files_upload as FileList
            delete formData.files_upload

            let attachments: any[] = []
            if (files && files.length > 0) {
                toast.info("Enviando arquivos...")
                attachments = await uploadFiles(files)
            }

            // Combine data
            const itemData = {
                ...formData,
                attachments: attachments.length > 0 ? attachments : undefined
            }

            const { error } = await supabase
                .from('items')
                .insert({
                    service_id: activeService.id,
                    data: itemData
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
    const [isRenaming, setIsRenaming] = useState(false)
    const [newName, setNewName] = useState("")

    const handleStartRename = () => {
        if (activeService) {
            setNewName(activeService.name)
            setIsRenaming(true)
        }
    }

    const handleRename = async () => {
        if (!activeService) return
        if (!newName.trim() || newName === activeService.name) {
            setIsRenaming(false)
            return
        }

        try {
            const { error } = await supabase
                .from('services')
                .update({ name: newName })
                .eq('id', activeService.id)

            if (error) throw error

            toast.success("Nome atualizado!")
            setActiveService({ ...activeService, name: newName }) // Optimistic update
            refreshServices() // Update sidebar
            setIsRenaming(false)
        } catch (error) {
            console.error("Error renaming service:", error)
            toast.error("Erro ao renomear serviço.")
        }
    }

    // ... (useEffect fetches)

    const [itemToDelete, setItemToDelete] = useState<any | null>(null)

    const handleDeleteItem = (item: any) => {
        setItemToDelete(item)
    }

    const confirmDelete = async () => {
        if (!itemToDelete) return

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', itemToDelete.id)

            if (error) throw error

            toast.success("Item excluído.")
            setItems(prev => prev.filter(i => i.id !== itemToDelete.id))
        } catch (e: any) {
            console.error("Error deleting item:", e)
            toast.error("Erro ao excluir item.")
        } finally {
            setItemToDelete(null)
        }
    }

    const handleUpdateItem = async (formData: any) => {
        if (!activeService || !editingItem) return

        try {
            // Extract files
            const files = formData.files_upload as FileList
            delete formData.files_upload

            let newAttachments: any[] = []
            if (files && files.length > 0) {
                toast.info("Enviando arquivos...")
                newAttachments = await uploadFiles(files)
            }

            // Merge with existing attachments if any
            const existingAttachments = editingItem.attachments || []
            const finalAttachments = [...existingAttachments, ...newAttachments]

            const itemData = {
                ...formData,
                attachments: finalAttachments.length > 0 ? finalAttachments : undefined
            }

            const { error } = await supabase
                .from('items')
                .update({
                    data: itemData // We update the JSONB data
                })
                .eq('id', editingItem.id)

            if (error) throw error

            toast.success("Item atualizado!")
            setEditingItem(null)

            // Refresh items (or optimistic update)
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i))

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
        <div
            className="space-y-6 -m-8 p-8"
            style={{
                background: `linear-gradient(to bottom, ${activeService.primary_color || '#3b82f6'}10 0%, #ffffff 350px)`
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 group/header">
                    <div className="flex flex-col flex-1">
                        {isRenaming ? (
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="text-2xl font-bold uppercase tracking-tight bg-transparent border-none outline-none text-slate-900 w-full"
                                style={{ color: activeService.primary_color || '#3b82f6' }}
                            />
                        ) : (
                            <div className="flex items-center gap-3">
                                <h2
                                    className="text-2xl font-bold uppercase tracking-tight cursor-text hover:opacity-80 transition-opacity flex items-center gap-2"
                                    style={{ color: activeService.primary_color || '#3b82f6' }}
                                    onClick={handleStartRename}
                                    title="Clique para renomear"
                                >
                                    {activeService.name}
                                    <span className="opacity-0 group-hover/header:opacity-100 transition-opacity text-slate-300">
                                        <Pencil className="h-4 w-4" />
                                    </span>
                                </h2>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <ShareServiceDialog service={activeService} />
                        <ServiceInfoDialog service={activeService} />
                    </div>
                </div>
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
                    primaryColor={activeService.primary_color}
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

            {/* Service Chat */}
            <ServiceChatTrigger
                serviceId={activeService.id}
                serviceName={activeService.name}
                primaryColor={activeService.primary_color}
            />
            <ServiceChatSheet
                serviceId={activeService.id}
                serviceName={activeService.name}
                primaryColor={activeService.primary_color}
            />

            <ConfirmDialog
                open={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir item"
                description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
                variant="destructive"
            />
        </div>
    )
}
