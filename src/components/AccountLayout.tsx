import { Button } from './ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from './ui/sheet'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, X, Activity, Download, Heart, LogOut, Settings, Tag, TriangleAlert, UserRound, Wallet } from 'lucide-react'
import { AuthDialog } from './LazyAuthDialog'
import { clearCheckoutDrafts } from '../lib/auth-navigation'
import { getSession, logout, sessionKey } from '../lib/checkout'
import type { Session } from '../types/checkout'
export type AccountSection = 'profile' | 'wallets' | 'settings' | 'favorites'
export function AccountSidebar({ active }: { active: AccountSection }) {
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const exit = useMutation({ mutationFn: logout, onSuccess: async () => { setOpen(false); await client.cancelQueries(); client.setQueryData(sessionKey, null); clearCheckoutDrafts() } })
  const close = () => setOpen(false)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const changed = () => { if (desktop.matches) setOpen(false) }
    desktop.addEventListener('change', changed)
    return () => desktop.removeEventListener('change', changed)
  }, [])
  const links = <>
    <Link to="/profile" aria-current={active === 'profile' ? 'page' : undefined} onClick={close}><UserRound size={18} />Dados do perfil</Link>
    <Link to="/wallets" aria-current={active === 'wallets' ? 'page' : undefined} onClick={close}><Wallet size={18} />Carteiras</Link>
    <Link to="/wallets" hash="wallet-history" onClick={close}><Activity size={18} />Atividade</Link>
    <Link to="/favorites" aria-current={active === 'favorites' ? 'page' : undefined} onClick={close}><Heart size={18} />Lista de interesse</Link>
    <Link to="/settings" aria-current={active === 'settings' ? 'page' : undefined} onClick={close}><Settings size={18} />Configurações</Link>
  </>
  return <>
    <aside className="collector-sidebar"><h2>Meu perfil</h2><nav aria-label="Navegação da conta">{links}
      {[{ label: 'Ofertas', icon: Tag }, { label: 'Arquivos baixados', icon: Download }, { label: 'Suporte', icon: TriangleAlert }].map(({ label, icon: Icon }) => <button type="button" disabled title="Esta seção ainda não está disponível" key={label}><Icon size={17} />{label}</button>)}
      <button type="button" className="collector-signout" disabled={exit.isPending} onClick={() => exit.mutate()}><LogOut size={17} />{exit.isPending ? 'Saindo…' : 'Sair'}</button>
    </nav>{exit.isError && <p role="alert" className="auth-error px-4 pb-4">Não foi possível sair. Tente novamente.</p>}</aside>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="plain" className="account-drawer-trigger" aria-label="Abrir navegação da conta" />}><ChevronRight size={22} aria-hidden="true" /></SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="account-drawer">
        <header><div><SheetTitle id="account-drawer-title">Minha conta</SheetTitle><SheetDescription>Escolha o que deseja acessar.</SheetDescription></div><SheetClose render={<Button variant="ghost" size="plain" aria-label="Fechar navegação da conta" />}><X size={21} /></SheetClose></header>
      <nav aria-label="Seções da conta">{links}</nav>
      <footer><button type="button" className="account-mobile-logout" disabled={exit.isPending} onClick={() => exit.mutate()}><LogOut size={18} />{exit.isPending ? 'Saindo…' : 'Sair da conta'}</button>{exit.isError && <p role="alert">Não foi possível sair. Tente novamente.</p>}</footer>
      </SheetContent>
    </Sheet>
  </>
}
export function AccountLayout({ active, title, children }: { active: AccountSection; title: string; children: (user: Session) => ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false)
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal), staleTime: 0 })
  if (session.isPending) return <main className="mx-auto py-10"><div role="status" aria-label="Carregando conta" className="nft-skeleton h-96 rounded" /></main>
  if (session.isError) return <main className="mx-auto py-10"><p role="alert">Não foi possível carregar a sessão.</p><button type="button" onClick={() => session.refetch()} className="checkout-primary mt-4">Tentar novamente</button></main>
  if (!session.data) return <main className="mx-auto py-16"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-4 text-sm text-subtle">Entre na sua conta para continuar.</p><button type="button" className="checkout-primary mt-6" onClick={() => setAuthOpen(true)}>Entrar ou criar conta</button>{authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}</main>
  return <main className="collector-page mx-auto py-10"><AccountSidebar active={active} /><section className="collector-content">{children(session.data)}</section></main>
}






