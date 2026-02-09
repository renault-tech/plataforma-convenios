import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthConfirmedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-6 rounded-lg border bg-card p-8 shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-10 w-10 text-green-600 dark:text-green-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                        />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Bem vindo à sua Plataforma de Gestão de Planilhas
                    </h1>
                    <p className="text-muted-foreground">
                        Seu cadastro foi realizado com sucesso
                    </p>
                </div>

                <Button asChild className="w-full" size="lg">
                    <Link href="/">
                        Ir para a Plataforma
                    </Link>
                </Button>
            </div>
        </div>
    )
}
