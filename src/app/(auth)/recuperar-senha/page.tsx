"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle2, Loader2, FileText } from "lucide-react"
import Link from "next/link"

export default function RecoverPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [sent, setSent] = useState(false)
    const supabase = createClient()

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/configuracoes/senha`,
            })

            if (error) {
                toast.error("Erro ao enviar email de recuperação.")
                console.error(error)
            } else {
                setSent(true)
                toast.success("Email enviado!")
            }
        } catch (error) {
            toast.error("Erro inesperado.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <Card className="w-full max-w-[380px] shadow-2xl bg-[#FFFDD0] border-amber-100 text-center">
                <CardHeader className="pt-10 pb-6">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Email Enviado</CardTitle>
                    <CardDescription className="text-slate-600">
                        Verifique sua caixa de entrada (e spam). Enviamos um link para redefinir sua senha.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center pb-8">
                    <Link href="/login">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-[380px] shadow-2xl bg-[#FFFDD0] border-amber-100">
            <CardHeader className="text-center space-y-4 pt-10 pb-6">
                <div className="flex justify-center mb-2">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                </div>
                <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Recuperar Senha</CardTitle>
                    <CardDescription className="text-slate-600">
                        Digite seu email para receber o link de redefinição.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRecover} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700">Email Cadastrado</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seunome@orgao.gov.br"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="bg-white/80 border-slate-200 focus:bg-white"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Enviar Link"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center pb-8 border-t border-amber-200/50 pt-6 mt-2">
                <Link href="/login" className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Login
                </Link>
            </CardFooter>
        </Card>
    )
}
