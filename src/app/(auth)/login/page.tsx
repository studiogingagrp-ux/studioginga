import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="animate-rise">
      <div className="mb-8">
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-foreground">
          Acesse sua conta
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Use o e-mail e senha cadastrados pela sua empresa.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
