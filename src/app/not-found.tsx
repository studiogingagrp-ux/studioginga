import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 text-center">
      <p className="font-heading text-8xl font-semibold text-brand/20">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Página não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">O endereço que você tentou acessar não existe.</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
      >
        <Home className="size-4" /> Voltar ao início
      </Link>
    </div>
  )
}
