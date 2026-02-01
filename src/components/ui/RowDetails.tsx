import { FileText, Download, Paperclip, ExternalLink, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FilePreviewDialog } from "@/components/ui/FilePreviewDialog"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Attachment {
    name: string
    url: string
    type: string
    size?: number
}

interface RowDetailsProps {
    details?: string
    attachments?: Attachment[]
}

export function RowDetails({ details, attachments }: RowDetailsProps) {
    const hasAttachments = attachments && attachments.length > 0
    const hasDetails = !!details

    if (!hasDetails && !hasAttachments) {
        return (
            <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhum detalhe ou anexo disponível.
            </div>
        )
    }

    return (
        <div className="p-6 bg-slate-100 border-y border-slate-200 shadow-inner">
            <div className={cn(
                "grid gap-6",
                (hasDetails && hasAttachments) ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            )}>
                {hasDetails && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Detalhes
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
                                {details}
                            </p>
                        </div>
                    </div>
                )}

                {hasAttachments && attachments && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200 justify-between">
                            <span className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-emerald-500" />
                                Anexos ({attachments.length})
                            </span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {attachments.map((file, index) => (
                                <FilePreviewDialog
                                    key={index}
                                    file={file}
                                    trigger={
                                        <div
                                            className="flex items-center justify-between p-2 pl-3 bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn(
                                                    "h-8 w-8 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px] uppercase shadow-sm",
                                                    file.type.includes('pdf') ? "bg-red-500" :
                                                        file.type.includes('image') ? "bg-purple-500" :
                                                            file.type.includes('sheet') || file.type.includes('excel') ? "bg-green-600" :
                                                                "bg-slate-500"
                                                )}>
                                                    {file.type.split('/')[1]?.substring(0, 3) || 'DOC'}
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-700 transition-colors" title={file.name}>
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase">
                                                        {file.size ? `${(file.size / 1024).toFixed(1)} KB • ` : ''} {file.type.split('/')[1] || 'Arquivo'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
