import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-6 rounded-lg border bg-card p-8 shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-10 w-10 text-red-600 dark:text-red-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Falha na confirmação
                    </h1>
                    <p className="text-muted-foreground">
                        Ocorreu um erro ao confirmar seu cadastro. O link pode ter expirado ou é inválido.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2">
                    <Button asChild variant="default" className="w-full">
                        <Link href="/login">
                            Voltar para Login
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
