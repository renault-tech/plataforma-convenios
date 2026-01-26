import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plataforma de Gestão de Convênios",
  description: "Sistema profissional para gestão de parcerias e convênios públicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Navbar />
            <main className="flex-1 overflow-auto bg-slate-50/50 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
