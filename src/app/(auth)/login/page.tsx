"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, FileText, Loader2 } from "lucide-react"
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
                } else if (error.message.includes("Invalid login credentials")) {
                    toast.error("Email ou senha incorretos.")
                } else {
                    toast.error("Erro ao fazer login. Verifique suas credenciais.")
                    console.error("Login Error:", error.message)
                }
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
        <div className="w-full max-w-[400px] p-8 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
            {/* Subtle internal gradient for reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                {/* Logo Area */}
                <div className="relative group">
                    <div className="h-20 w-20 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg relative border border-white/20">
                        <FileText className="h-9 w-9 text-white drop-shadow-md z-10" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">GovManager</h1>
                    <p className="text-slate-300 font-medium text-sm">Gestão de Convênios Públicos</p>
                </div>

                <form onSubmit={handleLogin} className="w-full space-y-5 text-left">
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-slate-200 text-xs font-semibold pl-1">Email Corporativo</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder=""
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            // Solid White Input clean
                            className="bg-white border-0 text-slate-900 placeholder:text-slate-400 h-11 rounded-lg shadow-inner focus-visible:ring-2 focus-visible:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-slate-200 text-xs font-semibold pl-1">Senha</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="bg-white border-0 text-slate-900 placeholder:text-slate-400 h-11 rounded-lg shadow-inner pr-10 focus-visible:ring-2 focus-visible:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <Link
                                href="/recuperar-senha"
                                className="text-[11px] text-blue-200 hover:text-white transition-colors pt-1 font-medium"
                            >
                                Esqueci minha senha
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white h-12 font-bold rounded-lg shadow-lg border-t border-blue-400/50 mt-2 active:scale-[0.98] transition-all"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            "Acessar Plataforma"
                        )}
                    </Button>
                </form>

                <div className="pt-4 text-center text-sm text-slate-400 w-full mt-2 border-t border-white/10">
                    Não tem acesso?{" "}
                    <Link href="/cadastro" className="text-white font-bold hover:underline transition-colors ml-1">
                        Solicitar Conta
                    </Link>
                </div>
            </div>
        </div>
    )
}
