import { ServiceAlertsButton } from "@/components/notifications/ServiceAlertsButton"
import { ServiceIcon } from "@/components/services/ServiceIcon"
import { ServiceInfoDialog } from "@/components/services/ServiceInfoDialog"
import { ShareServiceDialog } from "@/components/services/ShareServiceDialog"
import { ExportDropdown } from "@/components/export/ExportDropdown"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getContrastYIQ, getLegibleTextColor } from "@/lib/utils"
import { Pencil, PlusCircle, FileText, Columns } from "lucide-react"

interface ServiceHeaderProps {
    service: any
    itemsCount: number
    isEditingTitle: boolean
    titleVal: string
    setTitleVal: (val: string) => void
    setIsEditingTitle: (val: boolean) => void
    handleSaveTitle: () => void
    isMounted: boolean
    onAddRow: () => void
    onAddColumn: () => void
    items: any[]
}

export function ServiceHeader({
    service,
    itemsCount,
    isEditingTitle,
    titleVal,
    setTitleVal,
    setIsEditingTitle,
    handleSaveTitle,
    isMounted,
    onAddRow,
    onAddColumn,
    items
}: ServiceHeaderProps) {
    if (!service) return null

    return (
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
                    <ServiceIcon name={service.icon} className="h-8 w-8 text-blue-500" />
                    <div className="flex flex-col">
                        {/* Display title if exists in metadata */}
                        {service.metadata?.title && service.metadata.title.length > 0 && (
                            <div className="text-sm font-medium text-muted-foreground mb-1">
                                {service.metadata.title.join(' ')}
                            </div>
                        )}
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
                                <h1 className="text-2xl font-bold" style={{ color: getLegibleTextColor(service.primary_color) }}>
                                    {service.name}
                                </h1>
                                <button
                                    onClick={() => setIsEditingTitle(true)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400"
                                    title="Editar nome"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <ServiceAlertsButton serviceId={service.id} />
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-10">
                    {itemsCount} registros
                    {service.shared_via && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Compartilhado via {service.shared_via.type === 'group' ? 'Grupo' : 'Usuário'}
                        </span>
                    )}
                </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto z-10">
                {/* Render actions only on client */}
                {isMounted && (
                    <>
                        <div id="service-info-btn">
                            <ServiceInfoDialog service={service} />
                        </div>

                        <div
                            id="service-share-btn"
                            data-tour-group="service"
                            data-tour-title="Compartilhar"
                            data-tour-desc="Convide outros usuários."
                            data-tour-order="5"
                            data-tour-align="end"
                        >
                            <ShareServiceDialog service={service} />
                        </div>

                        <div id="service-export-btn">
                            <ExportDropdown
                                context="table"
                                data={items}
                                columns={service.columns_config}
                                serviceName={service.name}
                            />
                        </div>

                        {/* Unified Add Menu */}
                        <div
                            id="service-add-btn"
                            data-tour-group="service"
                            data-tour-title="Adicionar"
                            data-tour-desc="Adicione novas linhas ou colunas."
                            data-tour-order="3"
                            data-tour-align="end"
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        className="h-10 px-4 py-2 gap-2"
                                        style={{ backgroundColor: service.primary_color, color: getContrastYIQ(service.primary_color) }}
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onAddRow}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Nova Linha
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onAddColumn}>
                                        <Columns className="mr-2 h-4 w-4" />
                                        Nova Coluna
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </>
                )}
            </div>

            {/* Background Decor - Optional */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5 pointer-events-none">
                <ServiceIcon name={service.icon} className="h-64 w-64" />
            </div>
        </div>
    )
}
