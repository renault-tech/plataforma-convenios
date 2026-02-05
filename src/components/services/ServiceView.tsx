"use client"

import * as React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useService } from "@/contexts/ServiceContext"
import { ItemsTable } from "@/components/services/ItemsTable"
import { ItemForm } from "@/components/services/ItemForm"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Pencil, X, HelpCircle, PlusCircle, LayoutDashboard, Calendar as CalendarIcon, DollarSign, Activity, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { cn, getContrastYIQ, getLegibleTextColor } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { ShareServiceDialog } from "@/components/services/ShareServiceDialog"
import { ServiceInfoDialog } from "@/components/services/ServiceInfoDialog"
import { ServiceChatTrigger } from "@/components/chat/ServiceChatTrigger"
import { ServiceChatSheet } from "@/components/chat/ServiceChatSheet"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { ServiceIcon } from "@/components/services/ServiceIcon"
import { createItemAction, updateItemAction, deleteItemAction } from "@/app/actions/items"
import { useTutorial } from "@/hooks/useTutorial"
import { ServiceAlertsButton } from "@/components/notifications/ServiceAlertsButton"
import { ExportDropdown } from "@/components/export/ExportDropdown"

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
        if (activeService?.service_columns && Array.isArray(activeService.service_columns)) {
            return activeService.service_columns
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((col: any) => ({
                    id: col.name, // Use column name as ID (matches data keys in items)
                    label: col.name,
                    type: col.type as any,
                    required: false
                }))
        }
        // Fallback to columns_config if service_columns doesn't exist (legacy services)
        return activeService?.columns_config || []
    }, [activeService?.service_columns, activeService?.columns_config])


    const lastViewedAt = initialLastViewed

    if (!activeService) return null

    return (
        <div className="space-y-6">

            {/* 0. NAVIGATION TABS (Settings Style Match) */}
            <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-transparent">
                {services.map(service => {
                    const isActive = service.id === activeService.id
                    const textColor = isActive ? getContrastYIQ(service.primary_color) : undefined

                    return (
                        <Link key={service.id} href={`/servicos/${service.slug}`}>
                            <Button
                                variant={isActive ? "default" : "outline"}
                                className={cn(
                                    "h-9 px-4 rounded-full transition-colors font-medium",
                                    isActive
                                        ? "hover:opacity-90 border-transparent shadow-sm"
                                        : "hover:bg-slate-100 text-slate-600 border-slate-200"
                                )}
                                style={isActive ? {
                                    backgroundColor: service.primary_color,
                                    color: textColor
                                } : {}}
                            >
                                {service.name}
                            </Button>
                        </Link>
                    )
                })}
                <Link href="/configuracoes?tab=new">
                    <Button
                        variant="secondary"
                        className={cn(
                            "h-9 px-4 rounded-full gap-2 border shadow-sm",
                            "bg-white text-slate-900 hover:bg-slate-50 border-slate-200"
                        )}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Novo Serviço
                    </Button>
                </Link>
            </div>

            {/* 1. HEADER & ACTIONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm relative overflow-hidden">
                <div className="flex-1 z-10">
                    <div
                        className="flex items-center gap-2"
                        id="service-header-title"
                        data-tour-group="service"
                        data-tour-title="Aplicativo / Planilha"
                        data-tour-desc="Este é o nome do seu aplicativo atual."
                        data-tour-order="1"
                    >
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
                                <h1 className="text-2xl font-bold" style={{ color: getLegibleTextColor(activeService.primary_color) }}>
                                    {activeService.name}
                                </h1>
                                <button
                                    onClick={() => setIsEditingTitle(true)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400"
                                    title="Editar nome"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <ServiceAlertsButton serviceId={activeService.id} />
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
                <div className="flex gap-2 w-full sm:w-auto z-10">
                    {/* Render actions only on client */}
                    {isMounted && (
                        <>
                            {/* WIDGETS BUTTON REMOVED */}



                            <div id="service-info-btn">
                                <ServiceInfoDialog service={activeService} />
                            </div>

                            <div
                                id="service-share-btn"
                                data-tour-group="service"
                                data-tour-title="Compartilhar"
                                data-tour-desc="Convide outros usuários."
                                data-tour-order="5"
                                data-tour-align="end"
                            >
                                <ShareServiceDialog service={activeService} />
                            </div>

                            <div id="service-export-btn">
                                <ExportDropdown
                                    context="table"
                                    data={items}
                                    columns={activeService.columns_config}
                                    serviceName={activeService.name}
                                />
                            </div>

                            <div
                                id="service-add-item-btn"
                                data-tour-group="service"
                                data-tour-title="Novo Registro"
                                data-tour-desc="Adicionar nova linha."
                                data-tour-order="3"
                                data-tour-align="end"
                            >
                                <ItemForm
                                    columns={columnsConfig}
                                    onSave={handleCreateItem}
                                    serviceName={activeService.name}
                                    trigger={
                                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 hover:opacity-90" style={{ backgroundColor: activeService.primary_color, color: getContrastYIQ(activeService.primary_color) }}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Adicionar Item
                                        </button>
                                    }
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Background Decor - Optional */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5 pointer-events-none">
                    <ServiceIcon name={activeService.icon} className="h-64 w-64" />
                </div>
            </div>

            {/* 2. MAIN CONTENT (TABLE) */}
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
