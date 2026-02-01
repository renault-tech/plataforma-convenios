"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, X, FileText, File as FileIcon } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

interface FilePreviewDialogProps {
    file: {
        name: string
        url: string
        type: string
    }
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function FilePreviewDialog({ file, trigger, open, onOpenChange }: FilePreviewDialogProps) {
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-4xl w-full h-[85vh] p-0 flex flex-col bg-slate-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {isImage ? <FileIcon className="h-4 w-4 text-purple-500" /> : <FileText className="h-4 w-4 text-red-500" />}
                        <DialogTitle className="font-semibold text-sm truncate max-w-[300px] m-0" title={file.name}>
                            {file.name}
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2 mr-8">
                        <Button variant="outline" size="sm" asChild className="gap-2">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Baixar</span>
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Abrir em nova aba">
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                    {isImage ? (
                        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                            {/* Using standard img for simplicity in preview without needing known dimensions, 
                                but Next/Image is better if we want optimization. 
                                Given dynamic user uploads, a standard img with object-contain is safer layout-wise here */}
                            <img
                                src={file.url}
                                alt={file.name}
                                className="max-w-full max-h-full object-contain rounded-md shadow-sm"
                            />
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={`${file.url}#toolbar=0`}
                            className="w-full h-full rounded-md border bg-white shadow-sm"
                            title={file.name}
                        />
                    ) : (
                        <div className="text-center p-8 space-y-4">
                            <div className="h-20 w-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <FileText className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-slate-900">Pré-visualização não disponível</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Este tipo de arquivo ({file.type}) não pode ser exibido diretamente.
                                </p>
                            </div>
                            <Button asChild>
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    Baixar para visualizar
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
