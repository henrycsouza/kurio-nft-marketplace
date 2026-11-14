import { Button } from '../components/ui/button'
import { useState } from 'react'
import { useSearch, useNavigate, useRouter } from '@tanstack/react-router'
import { AuthDialog } from '../components/LazyAuthDialog'
import { queryClient } from '../lib/query-client'
import { getSession, sessionKey } from '../lib/checkout'
import { safeReturnTo } from '../lib/auth-navigation'

export function LoginPage() {
  const { redirect } = useSearch({ from: '/login' })
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  async function closed() {
    setOpen(false)
    const session = await queryClient.fetchQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal), staleTime: 0 })
    if (session) await navigate({ href: safeReturnTo(redirect), replace: true })
  }
  return <main className="mx-auto py-16"><h1 className="text-2xl font-bold">Entre para continuar</h1><p className="mt-4 text-sm text-subtle">Após entrar, você volta à tela que estava acessando. Seus itens continuam no carrinho.</p><Button variant="default" size="plain" type="button" className="checkout-primary mt-6" onClick={() => setOpen(true)}>Entrar ou criar conta</Button>{open && <AuthDialog onClose={() => { void closed() }} />}</main>
}

export function SessionError() {
  const router = useRouter()
  return <main className="mx-auto py-16"><h1 className="text-2xl font-bold">Não foi possível verificar sua sessão</h1><p role="alert" className="mt-4 text-sm text-subtle">Confira a conexão e tente novamente. Seus itens continuam salvos.</p><Button variant="default" size="plain" type="button" className="checkout-primary mt-6" onClick={() => { void router.invalidate() }}>Tentar novamente</Button></main>
}

