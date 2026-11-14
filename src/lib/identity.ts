import type { Session } from '../types/checkout'
import type { CollectorProfile } from '../types/profile'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
export function displayName(value: unknown): string {
  if (!isRecord(value)) return 'Colecionador'
  return text(value.name) || text(value.displayName) || text(value.username) || text(value.email).split('@')[0] || 'Colecionador'
}
export function sessionFrom(value: unknown): Session | null {
  if (!isRecord(value) || !text(value.id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value.email)) || typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) return null
  return { id: text(value.id), name: displayName(value), email: text(value.email), expiresAt: value.expiresAt, avatar: typeof value.avatar === 'string' ? value.avatar : null }
}
export function requireSession(value: unknown): Session {
  const session = sessionFrom(value)
  if (!session) throw new Error('Não foi possível validar a sessão recebida. Entre novamente.')
  return session
}
export function profileFrom(value: unknown): CollectorProfile {
  const session = requireSession(value)
  const data = value as Record<string, unknown>
  return { ...session, username: text(data.username) || session.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'), ens: text(data.ens), walletNickname: text(data.walletNickname), avatar: session.avatar ?? null, provider: text(data.provider) || null }
}
