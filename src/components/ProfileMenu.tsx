import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu'
import type { Session } from '../types/checkout'
import { displayName } from '../lib/identity'

type ProfileMenuProps = { user: Session; onLogout: () => void; loggingOut: boolean }

export function ProfileMenu({ user, onLogout, loggingOut }: ProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const name = displayName(user)
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'K'
  return <div className="profile-menu"><DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger render={<Button variant="ghost" size="plain" className="profile-trigger" aria-label={`Abrir menu de ${name}`} />}>
      <span className="profile-avatar" aria-hidden="true">{user.avatar ? <img src={user.avatar} alt="" /> : initials}<span className="profile-online" /></span>
      <span className="profile-trigger-copy"><small>Minha conta</small><strong>{name}</strong></span>
      <ChevronDown size={15} className={open ? 'profile-chevron is-open' : 'profile-chevron'} />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={12} aria-label="Menu da conta" className="profile-dropdown">
      <DropdownMenuGroup><DropdownMenuLabel className="profile-menu-identity"><strong>{user.name}</strong><span>{user.email}</span><small><ShieldCheck size={12} />Conta conectada</small></DropdownMenuLabel>
        <DropdownMenuItem onClick={() => { void navigate({ to: '/profile' }) }}><UserRound size={18} /><span>Ver perfil<small>Seus dados de colecionador</small></span></DropdownMenuItem>
        <DropdownMenuItem onClick={() => { void navigate({ to: '/settings' }) }}><Settings size={18} /><span>Settings<small>Configurações da conta</small></span></DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator className="profile-menu-divider" />
      <DropdownMenuItem className="profile-logout" disabled={loggingOut} onClick={onLogout}><LogOut size={18} /><span>{loggingOut ? 'Saindo…' : 'Sair'}</span></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu></div>
}
