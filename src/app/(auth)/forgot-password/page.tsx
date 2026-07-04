import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Recuperar senha' }

export default function ForgotPasswordPage() {
  return (
    <div className="animate-rise">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Recuperar acesso
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Informe seu e-mail e enviaremos um link para redefinir a senha.
      </p>
      <form className="mt-8 space-y-4">
        <input
          type="email"
          placeholder="voce@workspacea.com.br"
          className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="button"
          className="h-11 w-full rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95"
        >
          Enviar link
        </button>
      </form>
      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand"
      >
        <ArrowLeft className="size-4" /> Voltar para o login
      </Link>
    </div>
  )
}
