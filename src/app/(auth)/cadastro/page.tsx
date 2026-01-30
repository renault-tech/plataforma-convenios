"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Eye, EyeOff, UserPlus } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [secretaria, setSecretaria] = useState("")
    const [setor, setSetor] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        secretaria,
                        setor
                    },
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (error) {
                if (error.message.includes("rate limit") || error.status === 429) {
                    toast.error("Muitas tentativas. Por favor, aguarde alguns instantes.")
                } else {
                    toast.error("Erro ao criar conta: " + error.message)
                }
            } else {
                toast.success("Conta criada! Verifique seu email para confirmar.")
                router.push("/login")
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
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Criar Conta</CardTitle>
                    <CardDescription className="text-slate-600">
                        Informe seus dados para solicitar acesso.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-700">Nome Completo</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Seu Nome"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="bg-white/80 border-slate-200 focus:bg-white"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="secretaria" className="text-slate-700">Secretaria</Label>
                            <Input
                                id="secretaria"
                                type="text"
                                placeholder="Ex: Saúde"
                                value={secretaria}
                                onChange={e => setSecretaria(e.target.value)}
                                className="bg-white/80 border-slate-200 focus:bg-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="setor" className="text-slate-700">Setor</Label>
                            <Input
                                id="setor"
                                type="text"
                                placeholder="Ex: Financeiro"
                                value={setor}
                                onChange={e => setSetor(e.target.value)}
                                className="bg-white/80 border-slate-200 focus:bg-white"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@exemplo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="bg-white/80 border-slate-200 focus:bg-white"
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
                                minLength={6}
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
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 mt-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Cadastrar"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center pb-8 border-t border-amber-200/50 pt-6 mt-2">
                <Link href="/login" className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Já tenho conta
                </Link>
            </CardFooter>
        </Card>
    )
}
