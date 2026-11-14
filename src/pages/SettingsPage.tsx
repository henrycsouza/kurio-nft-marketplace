import { Switch } from '../components/ui/switch'
import { Skeleton } from '../components/ui/skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Accessibility, Check, ShieldCheck } from 'lucide-react'
import { AccountLayout } from '../components/AccountLayout'
import { getPreferences, savePreferences } from '../lib/preferences'
import type { Session } from '../types/checkout'

export function SettingsPage() { return <AccountLayout active="settings" title="Configurações">{(user) => <SettingsContent key={user.id} user={user} />}</AccountLayout> }
function SettingsContent({ user }: { user: Session }) {
  const client = useQueryClient()
  const key = ['preferences', user.id] as const
  const preferences = useQuery({ queryKey: key, queryFn: ({ signal }) => getPreferences(signal) })
  const save = useMutation({ mutationFn: savePreferences, onMutate: (input) => { const previous = client.getQueryData(key); void client.cancelQueries({ queryKey: key }); client.setQueryData(key, input); return { previous } }, onSuccess: (updated) => client.setQueryData(key, updated), onError: (_error, _input, context) => { if (context?.previous) client.setQueryData(key, context.previous) }, onSettled: () => client.invalidateQueries({ queryKey: key }) })
  return <div className="settings-page">
    <header className="account-page-heading"><h1>Configurações</h1><p>Preferências de navegação e informações da sessão.</p></header>
    <section className="settings-card" aria-labelledby="experience-heading"><div className="settings-card-heading"><span className="settings-icon"><Accessibility size={20} /></span><div><h2 id="experience-heading">Acessibilidade</h2><p>Ajuste como a interface se comporta.</p></div></div>
      {preferences.isPending ? <Skeleton className="nft-skeleton h-20 rounded" role="status" aria-label="Carregando preferências" /> : preferences.isError ? <p role="alert">Não foi possível carregar as preferências. <button type="button" onClick={() => preferences.refetch()}>Tentar novamente</button></p> : <label className="settings-motion-toggle"><span><strong>Reduzir animações</strong><small>Suaviza a experiência ao desativar movimentos da interface.</small></span><Switch checked={preferences.data.reduceMotion} disabled={save.isPending} onCheckedChange={(checked) => save.mutate({ reduceMotion: checked })} /></label>}
      {save.isSuccess && <p role="status" className="wallet-save-message"><Check size={15} />Preferência salva.</p>}{save.isError && <p role="alert" className="auth-error">Não foi possível salvar. Tente novamente.</p>}
    </section>
    <section className="settings-card" aria-labelledby="settings-session-title"><div className="settings-card-heading"><span className="settings-icon"><ShieldCheck size={20} /></span><div><h2 id="settings-session-title">Sessão atual</h2><p>Conta conectada neste navegador.</p></div></div><p className="settings-session-email">{user.email}</p><p className="settings-session-expiry">Válida até {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(user.expiresAt)} (horário de Brasília).</p></section>
  </div>
}


