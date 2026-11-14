import { lazy, Suspense, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogIn } from 'lucide-react'
import { Button } from './ui/button'
import { getSession, logout, sessionKey } from '../lib/checkout'
import { clearCheckoutDrafts } from '../lib/auth-navigation'
import type { AuthMode } from '../lib/auth'
import { AuthDialog } from './LazyAuthDialog'
const ProfileMenu = lazy(() => import('./ProfileMenu').then((module) => ({ default: module.ProfileMenu })))

export function AuthControls() {
  const client = useQueryClient()
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal), refetchInterval: 60_000, retry: 1 })
  const [mode, setMode] = useState<AuthMode | null>(null)
  const [error, setError] = useState('')
  const exit = useMutation({ mutationFn: logout, onSuccess: async () => {
    await client.cancelQueries()
    client.setQueryData(sessionKey, null)
    clearCheckoutDrafts()
  }, onError: () => setError('Não foi possível sair. Tente novamente.') })
  return (
    <>
      {session.data ? <Suspense fallback={<span role="status">Carregando conta...</span>}><ProfileMenu user={session.data} loggingOut={exit.isPending} onLogout={() => { setError(''); exit.mutate() }} /></Suspense> : <>
        <Button variant="ghost" size="plain" type="button" className="auth-navbar-secondary" onClick={() => setMode('register')}>Criar conta</Button>
        <Button variant="default" size="plain" type="button" className="auth-navbar-login" onClick={() => setMode('login')}><LogIn size={16} />Entrar</Button>
      </>}
      {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
      {mode && <AuthDialog initialMode={mode} onClose={() => setMode(null)} />}
    </>
  )
}

