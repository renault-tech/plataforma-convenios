"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, FileText, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                if (error.message.includes("Email not confirmed")) {
                    toast.error("Email não confirmado. Verifique sua caixa de entrada.")
                } else {
                    toast.error("Erro ao fazer login. Verifique suas credenciais.")
                }
                console.error(error)
            } else {
                toast.success("Login realizado com sucesso!")
                router.push("/")
                router.refresh()
            }
        } catch (error) {
            toast.error("Erro inesperado.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-[380px] shadow-2xl bg-[#FFFDD0] border-amber-100">
            <CardHeader className="text-center space-y-4 pt-10 pb-6">
                <div className="flex justify-center mb-2">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                        <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">GovManager</CardTitle>
                    <CardDescription className="text-slate-600 font-medium mt-1">
                        Gestão de Convênios Públicos
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700">Email Corporativo</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seunome@orgao.gov.br"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="bg-white/80 border-slate-200 focus:bg-white transition-colors"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-slate-700">Senha</Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="bg-white/80 border-slate-200 focus:bg-white transition-colors pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <div className="flex justify-end pt-1">
                            <Link
                                href="/recuperar-senha"
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                                Esqueci minha senha
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 font-medium shadow-lg mt-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "Acessar Plataforma"
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 text-center pb-8 border-t border-amber-200/50 pt-6 mt-2">
                <div className="text-sm text-slate-600">
                    Não tem acesso?{" "}
                    <Link href="/cadastro" className="text-blue-600 font-semibold hover:underline">
                        Solicitar Conta
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
