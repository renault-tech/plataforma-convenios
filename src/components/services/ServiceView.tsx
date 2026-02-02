"use client"

import { useEffect, useState, useRef } from "react"
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
import { ServiceIcon } from "@/components/services/ServiceIcon"
import { createItemAction, updateItemAction, deleteItemAction } from "@/app/actions/items"
import { markServiceAsViewed } from "@/app/actions/service-views"

interface ServiceViewProps {
    initialService: any
    initialItems: any[]
}

export function ServiceView({ initialService, initialItems }: ServiceViewProps) {
    const { activeService: contextActiveService, setActiveService, lastViews, updateService } = useService()

    // Use initialService for rendering immediately to avoid wait time and runtime errors
    const activeService = initialService || contextActiveService

    const [items, setItems] = useState<any[]>(initialItems)
    const supabase = createClient()

    // Verify mount state for hydration mismatch prevention for Radix Dialogs
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Sync active service if needed
    useEffect(() => {
        if (initialService && contextActiveService?.id !== initialService.id) {
            setActiveService(initialService)
        }
    }, [initialService, contextActiveService?.id, setActiveService])

    // Capture the initial last viewed time to persist highlights during the session
    // This allows us to clear the global notification (Sidebar) immediately while keeping 
    // the "New" highlights visible in the table until the user leaves.
    // We use a ref to initialize it only once per mount
    const [initialLastViewed] = useState(() => activeService ? lastViews[activeService.id] : undefined)

    // Mark as viewed IMMEDIATELY on mount/entry
    useEffect(() => {
        if (activeService?.id) {
            markServiceAsViewed(activeService.id)
        }
    }, [activeService?.id])

    // Sync items from props (important for Server Actions revalidation)
    useEffect(() => {
        if (initialItems) {
            setItems(initialItems)
        }
    }, [initialItems])

    // Title Editing Logic
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [titleVal, setTitleVal] = useState("")

    useEffect(() => {
        if (activeService) setTitleVal(activeService.name)
    }, [activeService])

    const handleSaveTitle = async () => {
        if (!activeService || !titleVal.trim()) return
        try {
            await updateService(activeService.id, { name: titleVal })
            setIsEditingTitle(false)
        } catch (error) {
            console.error(error)
        }
    }

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
                size: file.size
            })
        }
        return uploaded
    }

    const handleCreateItem = async (formData: any) => {
        try {
            if (!activeService) {
                toast.error("Serviço não identificado.")
                return
            }

            const files = formData.files_upload as FileList
            const { files_upload, ...cleanData } = formData

            let attachments: any[] = []
            if (files && files.length > 0) {
                const uploadPromise = uploadFiles(files)
                toast.promise(uploadPromise, {
                    loading: 'Enviando arquivos...',
                    success: 'Arquivos enviados!',
                    error: 'Erro no envio dos arquivos'
                })
                attachments = await uploadPromise
            }

            // Server Action
            const result = await createItemAction(activeService.id, { ...cleanData, attachments })

            if (!result.success) throw new Error(result.error)

            const newItem = result.data

            const normalizedItem = {
                id: newItem.id,
                service_id: newItem.service_id,
                created_at: newItem.created_at,
                updated_at: newItem.updated_at,
                ...newItem.data
            }

            // Optimistic/Immediate update (Server revalidation will eventually consistent this)
            setItems(prev => [normalizedItem, ...prev])
            toast.success("Item adicionado!")
        } catch (error: any) {
            console.error("Error creating item:", error)
            toast.error("Erro ao criar item: " + error.message)
        }
    }

    const handleUpdateItem = async (id: string, formData: any) => {
        try {
            const files = formData.files_upload as FileList
            const { files_upload, ...cleanData } = formData

            // If new files are provided, upload them and MERGE with existing attachments
            let newAttachments: any[] = []
            if (files && files.length > 0) {
                const uploadPromise = uploadFiles(files)
                toast.promise(uploadPromise, {
                    loading: 'Enviando arquivos...',
                    success: 'Arquivos enviados!',
                    error: 'Erro no envio dos arquivos'
                })
                newAttachments = await uploadPromise
            }

            const currentItem = items.find(i => i.id === id)
            const existingAttachments = currentItem?.attachments || []
            const combinedAttachments = [...existingAttachments, ...newAttachments]

            // Server Action
            const result = await updateItemAction(id, { ...cleanData, attachments: combinedAttachments })

            if (!result.success) throw new Error(result.error)

            // Optimistic/Immediate update
            setItems(prev => prev.map(i => i.id === id ? { ...i, ...cleanData, attachments: combinedAttachments, updated_at: new Date().toISOString() } : i))
            toast.success("Item atualizado!")
            setEditingItem(null)
        } catch (error: any) {
            console.error("Error updating item:", error)
            toast.error("Erro ao atualizar item: " + error.message)
        }
    }

    const handleDeleteItem = async (id: string) => {
        try {
            const result = await deleteItemAction(id)
            if (!result.success) throw new Error(result.error)

            setItems(prev => prev.filter(i => i.id !== id))
            toast.success("Item excluído.")
            setItemToDelete(null)
        } catch (error: any) {
            console.error("Error deleting item:", error)
            toast.error("Erro ao excluir item: " + error.message)
        }
    }

    const [editingItem, setEditingItem] = useState<any | null>(null)
    const [itemToDelete, setItemToDelete] = useState<any | null>(null)

    // Derived columns for creating item form
    // We can use activeService.columns_config directly
    const columnsConfig = activeService?.columns_config || []

    // Get last viewed time for highlighting "New" items from the CAPTURED initial state
    const lastViewedAt = initialLastViewed

    if (!activeService) return null

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <ServiceIcon name={activeService.icon} className="h-8 w-8 text-blue-500" />
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={titleVal}
                                    onChange={(e) => setTitleVal(e.target.value)}
                                    className="text-2xl font-bold border rounded px-2 py-1 max-w-[300px]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle()
                                        if (e.key === 'Escape') setIsEditingTitle(false)
                                    }}
                                />
                                <button onClick={handleSaveTitle} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Salvar</button>
                                <button onClick={() => setIsEditingTitle(false)} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded hover:bg-slate-200">Cancelar</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h1 className="text-2xl font-bold" style={{ color: activeService.primary_color }}>
                                    {activeService.name}
                                </h1>
                                <button
                                    onClick={() => setIsEditingTitle(true)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400"
                                    title="Editar nome"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-10">
                        {items?.length || 0} registros
                        {activeService.shared_via && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Compartilhado via {activeService.shared_via.type === 'group' ? 'Grupo' : 'Usuário'}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Render actions only on client to avoid Radix UI ID mismatches during hydration */}
                    {isMounted && (
                        <>
                            <ServiceInfoDialog service={activeService} />
                            <ShareServiceDialog service={activeService} />
                            <ItemForm
                                columns={columnsConfig}
                                onSave={handleCreateItem}
                                serviceName={activeService.name}
                                trigger={
                                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" style={{ backgroundColor: activeService.primary_color }}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Adicionar Item
                                    </button>
                                }
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <ItemsTable
                    columns={columnsConfig}
                    data={items || []}
                    onEdit={setEditingItem}
                    onDelete={setItemToDelete}
                    primaryColor={activeService.primary_color}
                    lastViewedAt={lastViewedAt}
                />
            </div>

            {/* Edit Dialog */}
            {editingItem && isMounted && (
                <ItemForm
                    columns={columnsConfig}
                    onSave={(data) => handleUpdateItem(editingItem.id, data)}
                    initialData={editingItem}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                    serviceName={activeService.name}
                />
            )}

            <ConfirmDialog
                open={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                title="Excluir Item"
                description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
                onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete.id)}
                variant="destructive"
            />

            {/* Floating Chat Trigger */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
                <div className="pointer-events-auto">
                    <ServiceChatTrigger
                        serviceId={activeService.id}
                        serviceName={activeService.name}
                        primaryColor={activeService.primary_color}
                    />
                </div>
            </div>

            {isMounted && (
                <ServiceChatSheet
                    serviceId={activeService.id}
                    serviceName={activeService.name}
                    primaryColor={activeService.primary_color}
                />
            )}
        </div>
    )
}
