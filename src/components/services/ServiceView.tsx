"use client"

import { ServiceHeader } from "@/components/services/ServiceHeader"
import { ServiceNavigation } from "@/components/services/ServiceNavigation"

import * as React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useService } from "@/contexts/ServiceContext"
import { ItemsTable } from "@/components/services/ItemsTable"
import { ItemForm } from "@/components/services/ItemForm"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { X, HelpCircle, LayoutDashboard, Calendar as CalendarIcon, DollarSign, Activity, CheckCircle2, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { ServiceChatTrigger } from "@/components/chat/ServiceChatTrigger"
import { ServiceChatSheet } from "@/components/chat/ServiceChatSheet"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { createItemAction, updateItemAction, deleteItemAction } from "@/app/actions/items"
import { useTutorial } from "@/hooks/useTutorial"
import { AddColumnDialog } from "@/components/services/AddColumnDialog"

// Widget Imports REMOVED as requested

interface ServiceViewProps {
    initialService: any
    initialItems: any[]
}

export function ServiceView({ initialService, initialItems }: ServiceViewProps) {
    const { activeService: contextActiveService, setActiveService, lastViews, updateService, markServiceViewed, isLoading: serviceLoading, services } = useService()
    const { startTutorial } = useTutorial()

    // Use initialService for rendering immediately to avoid wait time and runtime errors
    const activeService = initialService || contextActiveService

    const [items, setItems] = useState<any[]>(initialItems)
    const supabase = createClient()
    const searchParams = useSearchParams()
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [addColumnOpen, setAddColumnOpen] = useState(false)
    const [targetBlockId, setTargetBlockId] = useState<string | undefined>(undefined)
    const [initialFormData, setInitialFormData] = useState<any>(undefined)

    // Alert Settings State REMOVED (No widgets)

    // Dnd Sensors REMOVED (No widgets)

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
    const [initialLastViewed] = useState(() => activeService ? lastViews[activeService.id] : undefined)

    // Mark as viewed IMMEDIATELY on mount/entry/change
    useEffect(() => {
        if (activeService?.id) {
            markServiceViewed(activeService.id)
        }
    }, [activeService?.id, markServiceViewed])

    // Sync items from props
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

    // Handle highlight from Inbox navigation
    useEffect(() => {
        const highlightId = searchParams.get('highlight')
        if (highlightId) {
            setHighlightedItemId(highlightId)

            setTimeout(() => {
                const element = document.querySelector(`[data-item-id="${highlightId}"]`)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }, 500)

            setTimeout(() => {
                setHighlightedItemId(null)
            }, 2500)
        }
    }, [searchParams])

    const handleSaveTitle = useCallback(async () => {
        if (!activeService || !titleVal.trim()) return
        try {
            await updateService(activeService.id, { name: titleVal })
            setIsEditingTitle(false)
        } catch (error) {
            console.error(error)
        }
    }, [activeService, titleVal, updateService])

    const uploadFiles = useCallback(async (files: FileList): Promise<any[]> => {
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
                type: 'file',
                url: publicUrl,
                name: file.name,
                size: file.size,
                mime: file.type
            })
        }
        return uploaded
    }, [activeService?.id, supabase.storage])

    // --- Widget Logic Removed ---

    const handleCreateItem = async (formData: any, tableBlockId?: string) => {
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
            const result = await createItemAction(activeService.id, { ...cleanData, attachments }, tableBlockId)

            if (!result.success) throw new Error(result.error)

            const newItem = result.data

            const normalizedItem = {
                id: newItem.id,
                service_id: newItem.service_id,
                table_block_id: newItem.table_block_id,
                created_at: newItem.created_at,
                updated_at: newItem.updated_at,
                ...newItem.data
            }

            setItems(prev => [...prev, normalizedItem])
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

            const result = await updateItemAction(id, { ...cleanData, attachments: combinedAttachments })

            if (!result.success) throw new Error(result.error)

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

    // Transform service_columns from DB into columns_config format for ItemsTable
    const columnsConfig = React.useMemo(() => {
        let cols: any[] = []
        if (activeService?.service_columns && Array.isArray(activeService.service_columns)) {
            cols = activeService.service_columns.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        } else {
            cols = activeService?.columns_config || []
        }

        const seenIds = new Map<string, number>()

        return cols.map((col: any) => {
            const originalId = col.id || col.name
            let finalId = originalId

            if (seenIds.has(originalId)) {
                const count = seenIds.get(originalId)! + 1
                seenIds.set(originalId, count)
                finalId = `${originalId}_${count}`
            } else {
                seenIds.set(originalId, 1)
            }

            return {
                id: finalId,
                label: col.name || col.id || "Campo sem nome", // Fallback to ID
                type: col.type as any,
                width: col.width || 150,
                required: false
            }
        })
    }, [activeService?.service_columns, activeService?.columns_config])


    const tableBlocks = React.useMemo(() => {
        return activeService?.table_blocks?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) || []
    }, [activeService?.table_blocks])

    /* Helper helper to get columns for a specific block or fallback to global */
    const getBlockColumns = useCallback((blockId?: string) => {
        if (!blockId || tableBlocks.length === 0) return columnsConfig

        const block = tableBlocks.find((b: any) => b.id === blockId)
        if (!block) return columnsConfig

        const seenIds = new Map<string, number>()

        return block.columns.map((col: any) => {
            const originalId = col.id || col.name
            let finalId = originalId

            if (seenIds.has(originalId)) {
                const count = seenIds.get(originalId)! + 1
                seenIds.set(originalId, count)
                finalId = `${originalId}_${count}`
            } else {
                seenIds.set(originalId, 1)
            }

            return {
                id: finalId,
                label: col.name || col.id || "Campo sem nome", // Fallback to ID
                type: col.type,
                width: col.width || 150,
                required: false
            }
        })
    }, [tableBlocks, columnsConfig])

    const lastViewedAt = initialLastViewed

    if (!activeService) return null

    return (
        <div className="space-y-6">

            {/* 0. NAVIGATION TABS */}
            <ServiceNavigation
                services={services}
                activeServiceId={activeService.id}
            />

            {/* 1. HEADER & ACTIONS */}
            <ServiceHeader
                service={activeService}
                itemsCount={items?.length || 0}
                isEditingTitle={isEditingTitle}
                titleVal={titleVal}
                setTitleVal={setTitleVal}
                setIsEditingTitle={setIsEditingTitle}
                handleSaveTitle={handleSaveTitle}
                isMounted={isMounted}
                onAddRow={() => {
                    setInitialFormData(undefined)
                    setFormOpen(true)
                }}
                onAddColumn={() => setAddColumnOpen(true)}
                items={items}
            />

            {/* 2. MAIN CONTENT (MULTI-TABLE or SINGLE TABLE) */}
            {
                tableBlocks.length > 0 ? (
                    // MULTI WAFFLE
                    <div className="space-y-12">
                        {tableBlocks.map((block: any) => {
                            const blockColumns = getBlockColumns(block.id)
                            const blockItems = items?.filter(i => i.table_block_id === block.id) || []

                            return (
                                <div key={block.id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-slate-800 border-l-4 border-slate-400 pl-3">
                                            {block.title}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-2 text-slate-500 hover:text-blue-600"
                                            onClick={() => {
                                                setInitialFormData({ table_block_id: block.id })
                                                setFormOpen(true)
                                            }}
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                            Adicionar Item
                                        </Button>
                                    </div>

                                    <div className="rounded-md border bg-white">
                                        <ItemsTable
                                            columns={blockColumns}
                                            data={blockItems}
                                            serviceId={activeService.id}
                                            tableBlockId={block.id}
                                            onEdit={setEditingItem}
                                            onDelete={setItemToDelete}
                                            onStatusChange={(id, data) => handleUpdateItem(id, data)}
                                            primaryColor={activeService.primary_color}
                                            lastViewedAt={lastViewedAt}
                                            isLoading={serviceLoading}
                                            highlightedItemId={highlightedItemId}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    // SINGLE TABLE (LEGACY)
                    <div
                        className="rounded-md border bg-white"
                        id="items-table-container"
                        data-tour-group="service"
                        data-tour-title="Tabela Inteligente"
                        data-tour-desc="Esta tabela tem superpoderes: <br/>• <b>Clique na linha</b> para expandir e ver detalhes completos.<br/>• <b>Sinalização Azul:</b> Indica dados novos ou atualizados desde sua última visita.<br/>• <b>Cabeçalhos:</b> Clique para ordenar."
                        data-tour-order="4"
                        data-tour-align="center"
                    >
                        <ItemsTable
                            columns={columnsConfig}
                            data={items || []}
                            serviceId={activeService.id}
                            onEdit={setEditingItem}
                            onDelete={setItemToDelete}
                            onStatusChange={(id, data) => handleUpdateItem(id, data)}
                            primaryColor={activeService.primary_color}
                            lastViewedAt={lastViewedAt}
                            isLoading={serviceLoading}
                            highlightedItemId={highlightedItemId}
                        />
                    </div>
                )
            }

            {/* Dialogs */}

            {/* Add Item Form */}
            <ItemForm
                columns={columnsConfig}
                onSave={(data) => handleCreateItem(data, data.table_block_id)}
                serviceName={activeService.name}
                tableBlocks={tableBlocks}
                open={formOpen}
                initialData={initialFormData}
                onOpenChange={(open) => {
                    setFormOpen(open)
                    if (!open) setInitialFormData(undefined)
                }}
            />

            {/* Add Column Dialog */}
            <AddColumnDialog
                open={addColumnOpen}
                onOpenChange={setAddColumnOpen}
                serviceId={activeService.id}
                tableBlockId={targetBlockId}
                onSuccess={() => {
                    // Refresh logic handled by page reload in dialog for now
                }}
            />

            {/* Edit Item Dialog */}
            {
                editingItem && isMounted && (
                    <ItemForm
                        columns={editingItem ? getBlockColumns(editingItem.table_block_id) : columnsConfig}
                        onSave={(data) => handleUpdateItem(editingItem.id, data)}
                        initialData={editingItem}
                        open={!!editingItem}
                        onOpenChange={(open) => !open && setEditingItem(null)}
                        serviceName={activeService.name}
                    />
                )
            }

            <ConfirmDialog
                open={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                title="Excluir Item"
                description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
                onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete.id)}
                variant="destructive"
            />

            {/* Floating Chat Trigger */}
            <div
                className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none"
                id="service-chat-trigger-container"
                data-tour-group="service"
                data-tour-title="Chat da Planilha"
                data-tour-desc="Bate-papo exclusivo desta planilha."
                data-tour-order="2"
                data-tour-align="end"
            >
                <div className="pointer-events-auto">
                    <ServiceChatTrigger
                        serviceId={activeService.id}
                        serviceName={activeService.name}
                        primaryColor={activeService.primary_color}
                    />
                </div>
            </div>

            {
                isMounted && (
                    <ServiceChatSheet
                        serviceId={activeService.id}
                        serviceName={activeService.name}
                        primaryColor={activeService.primary_color}
                    />
                )
            }
        </div >
    )
}
