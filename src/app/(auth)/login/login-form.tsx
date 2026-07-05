'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { ROLE_COOKIE, homeForRole } from '@/lib/constants/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
type Form = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Form) {
    if (!isSupabaseConfigured()) {
      toast.info('Conecte o Supabase para ativar o login', {
        description: 'Preencha NEXT_PUBLIC_SUPABASE_URL e ANON_KEY no .env.local.',
      })
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      toast.error('Não foi possível entrar', { description: 'Verifique e-mail e senha.' })
      return
    }

    // Lê papel + workspace para rotear (onboarding se ainda não tem agência).
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, workspace_id')
      .eq('id', user?.id)
      .single()

    const role = profile?.role ?? 'membro'
    document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    toast.success('Bem-vindo!')
    router.replace(profile?.workspace_id ? homeForRole(role) : '/onboarding')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@workspacea.com.br"
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-brand">
            Esqueci a senha
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full bg-brand-gradient text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Entrar'}
      </Button>
    </form>
  )
}
