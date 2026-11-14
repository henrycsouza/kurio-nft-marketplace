import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { AccountSidebar } from '../components/AccountLayout'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, ImagePlus, Settings } from 'lucide-react'
import axios from 'axios'
import { AuthDialog } from '../components/LazyAuthDialog'
import { getSession, sessionKey } from '../lib/checkout'
import { getProfile, updateProfile } from '../lib/profile'
import type { CollectorProfile } from '../types/profile'
import type { Session } from '../types/checkout'
import { displayName } from '../lib/identity'

export function ProfilePage() {
  const [authOpen, setAuthOpen] = useState(false)
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal), staleTime: 0 })
  const profile = useQuery({ queryKey: ['profile', session.data?.id], queryFn: ({ signal }) => getProfile(signal), enabled: !!session.data, retry: (count, error) => count < 1 && !(axios.isAxiosError(error) && error.response?.status === 401) })
  if (session.isPending) return <main className="mx-auto py-10"><div className="nft-skeleton h-96 rounded" role="status" aria-label="Carregando perfil" /></main>
  if (!session.data) return <main className="mx-auto py-16"><h1 className="text-2xl font-bold">Meu perfil</h1><p className="mt-4 text-sm text-subtle">Entre na sua conta para acessar seus dados de colecionador.</p><Button variant="default" size="plain" type="button" className="checkout-primary mt-6" onClick={() => setAuthOpen(true)}>Entrar ou criar conta</Button>{authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}</main>
  return <main className="collector-page mx-auto py-10">
    <AccountSidebar active="profile" />
    <section className="collector-content" aria-labelledby="collector-profile-title">
      <h1 id="collector-profile-title">Perfil do colecionador</h1>
      {profile.isPending ? <div role="status" aria-label="Carregando dados do colecionador" className="nft-skeleton mt-8 h-96 rounded" /> : profile.isError ? <div role="alert" className="mt-6"><p>Não foi possível carregar seu perfil.</p><Button variant="ghost" size="plain" type="button" className="mt-4 text-brand underline" onClick={async () => { await session.refetch(); await profile.refetch() }}>Tentar novamente</Button></div> : <ProfileForm key={profile.data.id} profile={profile.data} />}
    </section>
  </main>
}

function ProfileForm({ profile }: { profile: CollectorProfile }) {
  const client = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [uploadError, setUploadError] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [passwordVersion, setPasswordVersion] = useState(0)
  const save = useMutation({ mutationFn: updateProfile, retry: false, onSuccess: (updated) => {
    if (client.getQueryData<Session | null>(sessionKey)?.id !== updated.id) return
    client.setQueryData(['profile', updated.id], updated)
    client.setQueryData(sessionKey, updated)
    setPasswordVersion((value) => value + 1)
  }, onError: async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) await client.invalidateQueries({ queryKey: sessionKey })
    const field = axios.isAxiosError<{ field?: string }>(error) ? error.response?.data.field : undefined
    if (field) {
      const input = form.current?.elements.namedItem(field)
      if (input instanceof HTMLElement) input.focus()
    }
  } })
  const error = axios.isAxiosError<{ message: string; field?: string }>(save.error) ? save.error.response?.data : undefined
  const describedBy = (field: string) => error?.field === field ? 'collector-save-error' : undefined
  async function upload(file?: File) {
    if (!file) return
    setUploadError('')
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) { setUploadError('Escolha uma imagem PNG, JPG ou WebP de até 1 MB.'); return }
    setFileLoading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Falha ao ler imagem')); reader.readAsDataURL(file) })
      await new Promise<void>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(); image.onerror = () => reject(new Error('Imagem inválida')); image.src = dataUrl })
      setAvatar(dataUrl)
    } catch { setUploadError('Não foi possível abrir essa imagem. Escolha outro arquivo.') } finally { setFileLoading(false); if (fileInput.current) fileInput.current.value = '' }
  }
  const initials = displayName(profile).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <form ref={form} className="collector-form" onSubmit={(event) => {
    event.preventDefault()
    if (fileLoading || save.isPending) return
    const data = new FormData(event.currentTarget)
    save.mutate({ name: String(data.get('name')), email: String(data.get('email')), username: String(data.get('username')), ens: String(data.get('ens')), walletNickname: String(data.get('walletNickname')), avatar, currentPassword: String(data.get('currentPassword') ?? ''), newPassword: String(data.get('newPassword') ?? ''), confirmation: String(data.get('confirmation') ?? '') })
  }}>
    <fieldset disabled={save.isPending} className="collector-field-grid">
      <legend className="sr-only">Dados do perfil</legend>
      <label htmlFor="collector-name">Nome de exibição <span>*</span><Input id="collector-name" name="name" required minLength={2} maxLength={80} defaultValue={profile.name} autoComplete="name" aria-invalid={error?.field === 'name'} aria-describedby={describedBy('name')} /></label>
      <label htmlFor="collector-username">Nome de usuário <span>*</span><Input id="collector-username" name="username" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]{3,30}" title="De 3 a 30 letras, números ou sublinhados" defaultValue={profile.username} autoComplete="username" aria-invalid={error?.field === 'username'} aria-describedby={describedBy('username')} /></label>
      <label htmlFor="collector-email">E-mail <span>*</span><Input id="collector-email" name="email" type="email" required defaultValue={profile.email} autoComplete="email" aria-invalid={error?.field === 'email'} aria-describedby={describedBy('email')} /></label>
      <label htmlFor="collector-ens">Nome ENS <span className="collector-optional">(opcional)</span><span className="collector-ens-field"><span aria-hidden="true">.eth</span><Input id="collector-ens" name="ens" placeholder="seunome" maxLength={63} pattern="[a-zA-Z0-9-]{3,63}" defaultValue={profile.ens} aria-invalid={error?.field === 'ens'} aria-describedby={describedBy('ens')} /></span></label>
      <label htmlFor="collector-wallet-name">Apelido da carteira <span className="collector-optional">(opcional)</span><Input id="collector-wallet-name" name="walletNickname" maxLength={60} defaultValue={profile.walletNickname} aria-invalid={error?.field === 'walletNickname'} aria-describedby={describedBy('walletNickname')} /></label>
      <div className="collector-avatar-field"><span>Avatar</span><div className="collector-avatar-controls"><span className="collector-avatar-preview">{avatar ? <img src={avatar} alt="Prévia do seu avatar" width={48} height={48} /> : <span aria-label="Avatar com suas iniciais">{initials || <ImagePlus size={20} />}</span>}</span><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Selecionar novo avatar" tabIndex={-1} onChange={(event) => void upload(event.target.files?.[0])} /><Button variant="default" size="plain" type="button" className="checkout-primary" disabled={fileLoading} onClick={() => fileInput.current?.click()}>{fileLoading ? 'Carregando…' : 'Alterar'}</Button><Button variant="ghost" size="plain" type="button" disabled={!avatar || fileLoading} className="collector-remove-avatar" onClick={() => { setAvatar(null); setUploadError('') }}>Remover</Button></div><p className="collector-field-help">PNG, JPG ou WebP · até 1 MB. Salve para aplicar.</p>{uploadError && <p role="alert" className="auth-error">{uploadError}</p>}</div>
    </fieldset>
    <fieldset key={passwordVersion} className="collector-password-fields" disabled={save.isPending || !!profile.provider}>
      <legend id="collector-password">Alterar senha</legend>
      {profile.provider ? <p className="collector-field-help">Sua senha é gerenciada pelo acesso com {profile.provider}.</p> : <>
        <PasswordInput name="currentPassword" label="Senha atual" error={error?.field === 'currentPassword'} describedBy={describedBy('currentPassword')} />
        <PasswordInput name="newPassword" label="Nova senha" error={error?.field === 'newPassword'} describedBy={describedBy('newPassword')} />
        <PasswordInput name="confirmation" label="Confirmar nova senha" error={error?.field === 'confirmation'} describedBy={describedBy('confirmation')} />
        <p className="collector-field-help">Para trocar a senha, preencha os três campos. Use ao menos 8 caracteres, com maiúscula, minúscula e número.</p>
      </>}
    </fieldset>
    {save.isError && <p id="collector-save-error" role="alert" className="auth-error">{error?.message ?? 'Não foi possível salvar. Verifique a conexão e tente novamente.'}</p>}
    {save.isSuccess && !save.isPending && <p role="status" className="collector-save-notice"><Settings size={15} />Perfil atualizado com sucesso.</p>}
    <Button variant="default" size="plain" type="submit" className="checkout-primary collector-save-button" disabled={save.isPending || fileLoading}>{save.isPending ? 'Salvando…' : 'Salvar'}</Button>
  </form>
}

function PasswordInput({ name, label, error, describedBy }: { name: string; label: string; error: boolean; describedBy?: string }) {
  const [visible, setVisible] = useState(false)
  return <label htmlFor={`collector-${name}`}>{label}<span className="collector-password-input"><Input id={`collector-${name}`} name={name} type={visible ? 'text' : 'password'} maxLength={128} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} aria-invalid={error} aria-describedby={describedBy} /><Button variant="ghost" size="plain" type="button" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</Button></span></label>
}



