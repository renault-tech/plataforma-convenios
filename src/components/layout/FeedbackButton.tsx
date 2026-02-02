"use client"

import { useState } from "react"
import { MessageSquarePlus, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function FeedbackButton({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [feedback, setFeedback] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!feedback.trim()) return

        setIsSubmitting(true)

        // Simulação de envio
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log("Feedback enviado:", feedback)
        toast.success("Obrigado pelo seu feedback! Vamos analisar sua sugestão.")

        setFeedback("")
        setIsSubmitting(false)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button
                        className="fixed bottom-6 right-6 h-12 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                        <MessageSquarePlus className="h-5 w-5 text-white" />
                        <span className="text-white font-medium">Feedback</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enviar Feedback</DialogTitle>
                    <DialogDescription>
                        Encontrou um erro ou tem uma sugestão? Conte para nós o que podemos melhorar.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="feedback">Sua mensagem</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Descreva sua sugestão ou problema..."
                            className="min-h-[100px]"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!feedback.trim() || isSubmitting}>
                        {isSubmitting ? (
                            "Enviando..."
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" /> Enviar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
