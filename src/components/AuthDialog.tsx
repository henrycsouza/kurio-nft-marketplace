import { Input } from './ui/input'
import { Button } from './ui/button'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, X } from 'lucide-react'
import { forgotPassword, register, resetPassword, socialLogin } from '../lib/auth'
import type { AuthMode } from '../lib/auth'
import { login, sessionKey } from '../lib/checkout'
import type { Session } from '../types/checkout'

export function AuthDialog({ initialMode = 'login', onClose }: { initialMode?: AuthMode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const client = useQueryClient()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<{ message: string; field?: string } | null>(null)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [provider, setProvider] = useState<'google' | 'facebook' | null>(null)
  const pendingRef = useRef(false)
  useEffect(() => {
    const modal = dialog.current
    if (modal && !modal.open) modal.showModal()
    return () => { if (modal?.open) modal.close() }
  }, [])
  async function authenticated(user: Session) {
    await client.cancelQueries()
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' && !['nfts', 'nft', 'cart', 'cart-quote'].includes(String(query.queryKey[0])) })
    client.setQueryData(sessionKey, user)
    await client.invalidateQueries({ predicate: (query) => ['cart', 'cart-quote'].includes(String(query.queryKey[0])) })
    dialog.current?.close()
  }
  const mutation = useMutation({
    mutationFn: async (input: { mode: AuthMode; name: string; email: string; password: string; token: string; provider: 'google' | 'facebook' | null }) => {
      if (input.provider) return { user: await socialLogin({ provider: input.provider, accepted: true }) }
      if (input.mode === 'register') return { user: await register(input) }
      if (input.mode === 'login') return { user: await login(input) }
      if (input.mode === 'forgot') return { recovery: await forgotPassword(input.email) }
      return { reset: await resetPassword(input) }
    },
    retry: false,
    onSuccess: async (result) => {
      if (result.user) await authenticated(result.user)
      if (result.recovery) { setToken(result.recovery.demoToken); setNotice(`${result.recovery.message} Neste ambiente simulado, defina a nova senha abaixo; nenhum e-mail será enviado.`); setMode('reset') }
      if (result.reset) { setNotice(result.reset.message); setMode('login'); setToken('') }
    },
    onError: (cause) => {
      const data = axios.isAxiosError<{ message: string; field?: string }>(cause) ? cause.response?.data : undefined
      setError(data ?? { message: 'Não foi possível conectar. Tente novamente.' })
    },
    onSettled: () => { pendingRef.current = false },
  })
  function changeMode(next: AuthMode) { if (mutation.isPending) return; setMode(next); setNotice(''); setError(null); setProvider(null); setShowPassword(false) }
  function close() { if (!mutation.isPending) dialog.current?.close() }
  return (
    <dialog ref={dialog} className="auth-dialog" aria-labelledby="auth-dialog-title" onClose={() => {
      // StrictMode closes and reopens effects on mount. Ignore that queued
      // close event if the dialog is already open again.
      if (dialog.current && !dialog.current.open) onClose()
    }} onCancel={(event) => { if (mutation.isPending) event.preventDefault() }} onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <Button variant="ghost" size="plain" type="button" className="auth-close" aria-label="Fechar autenticação" disabled={mutation.isPending} onClick={close}><X size={18} /></Button>
      <div className="auth-mobile-brand">KURIO</div>
      <div className="auth-switch" aria-label="Opções de acesso">
        <Button variant="ghost" size="plain" type="button" aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>Entrar</Button><span aria-hidden="true">|</span><Button variant="ghost" size="plain" type="button" aria-pressed={mode === 'register'} onClick={() => changeMode('register')}>Criar conta</Button>
      </div>
      <h2 id="auth-dialog-title" className="auth-title"><span className="auth-mobile-heading">{mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar perfil de colecionador' : mode === 'forgot' ? 'Recuperar senha' : 'Nova senha'}</span><span className="auth-desktop-intro">{mode === 'forgot' ? 'Esqueceu a senha?' : mode === 'reset' ? 'Defina sua nova senha' : mode === 'register' ? 'Crie sua conta de colecionador' : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}</span></h2>
      {notice && <p role="status" className="auth-notice">{notice}</p>}
      {provider ? <div className="auth-social-consent">
        <h3>Continuar com {provider === 'google' ? 'Google' : 'Facebook'}</h3>
        <p>Esta é uma simulação. Vamos usar uma conta fictícia de demonstração, sem acessar seus dados ou sua conta real.</p>
        <Button variant="default" size="plain" type="button" disabled={mutation.isPending} className="auth-submit" onClick={() => { if (pendingRef.current) return; pendingRef.current = true; setError(null); mutation.mutate({ mode, name: '', email: '', password: '', token: '', provider }) }}>{mutation.isPending ? 'Conectando…' : 'Continuar na simulação'}</Button>
        <Button variant="ghost" size="plain" type="button" disabled={mutation.isPending} className="auth-text-button" onClick={() => { setProvider(null); setError(null) }}>Cancelar</Button>
      </div> : <form key={mode} className="auth-form" onSubmit={(event) => {
        event.preventDefault()
        if (pendingRef.current) return
        const data = new FormData(event.currentTarget)
        const password = String(data.get('password') ?? '')
        if ((mode === 'register' || mode === 'reset') && password !== data.get('confirmation')) { setError({ message: 'As senhas não coincidem.', field: 'confirmation' }); event.currentTarget.querySelector<HTMLInputElement>('[name="confirmation"]')?.focus(); return }
        pendingRef.current = true; setError(null)
        mutation.mutate({ mode, name: String(data.get('name') ?? ''), email, password, token, provider: null })
      }}>
        {mode === 'register' && <label htmlFor="auth-name">Nome<Input id="auth-name" name="name" placeholder="Nome do colecionador" required minLength={2} maxLength={80} autoComplete="name" aria-invalid={error?.field === 'name'} aria-describedby={error?.field === 'name' ? 'auth-error' : undefined} /></label>}
        {mode !== 'reset' && <label htmlFor="auth-email">E-mail<Input id="auth-email" name="email" type="email" autoComplete="username" placeholder="contato@email.com" required value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error?.field === 'email'} aria-describedby={error?.field === 'email' ? 'auth-error' : undefined} /></label>}
        {mode !== 'forgot' && <>
          <label htmlFor="auth-password">{mode === 'reset' ? 'Nova senha' : 'Senha'}<span className="auth-password-field"><Input id="auth-password" name="password" placeholder="Senha" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 8} maxLength={128} pattern={mode === 'login' ? undefined : '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,128}'} title="Use pelo menos 8 caracteres, com maiúscula, minúscula e número" aria-invalid={error?.field === 'password'} aria-describedby={mode === 'login' ? undefined : 'auth-password-help'} /><Button variant="ghost" size="plain" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</Button></span></label>
          {mode !== 'login' && <><p id="auth-password-help" className="auth-help">8 a 128 caracteres, com maiúscula, minúscula e número.</p><label htmlFor="auth-confirmation">Confirmar senha<Input id="auth-confirmation" name="confirmation" placeholder="Confirmar senha" type="password" autoComplete="new-password" required minLength={8} aria-invalid={error?.field === 'confirmation'} aria-describedby={error?.field === 'confirmation' ? 'auth-error' : undefined} /></label></>}
        </>}
        {mode === 'login' && <Button variant="ghost" size="plain" type="button" className="auth-forgot" onClick={() => changeMode('forgot')}>Esqueceu a senha?</Button>}
        <Button variant="default" size="plain" type="submit" className="auth-submit" disabled={mutation.isPending}>{mutation.isPending ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'forgot' ? 'Recuperar senha' : 'Salvar nova senha'}</Button>
        {(mode === 'forgot' || mode === 'reset') && <Button variant="ghost" size="plain" type="button" className="auth-text-button" onClick={() => changeMode(mode === 'reset' ? 'forgot' : 'login')}>{mode === 'reset' ? 'Solicitar outro código' : 'Voltar para entrar'}</Button>}
      </form>}
      {error && <p id="auth-error" role="alert" className="auth-error">{error.message}</p>}
      {!provider && (mode === 'login' || mode === 'register') && <>
        <div className="auth-divider"><span>Ou continue com</span></div>
        <Button variant="ghost" size="plain" type="button" className="auth-social" disabled={mutation.isPending} onClick={() => { setProvider('google'); setError(null) }}><span className="auth-google" aria-hidden="true">G</span>Continuar com Google</Button>
        <Button variant="ghost" size="plain" type="button" className="auth-social" disabled={mutation.isPending} onClick={() => { setProvider('facebook'); setError(null) }}><span className="auth-facebook" aria-hidden="true">f</span>Continuar com Facebook</Button>
        <p className="auth-help auth-demo-note">Conexões sociais simuladas para demonstração.</p>
      </>}
      {!provider && (mode === 'login' || mode === 'register') && <p className="auth-mode-footer">{mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}<Button variant="ghost" size="plain" type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Crie uma conta' : 'Entre'}</Button></p>}
    </dialog>
  )
}





