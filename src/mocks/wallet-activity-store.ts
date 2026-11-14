import { readSession } from './auth'
import type { WalletActivity } from '../types/wallet-activity'
const key = (userId: string) => `kurio.mock.wallet.activity.${userId}`
export function recordWalletActivity(request: Request, activity: Omit<WalletActivity, 'id' | 'date' | 'status'>) {
  const user = readSession(request)
  if (!user) return
  const previous = JSON.parse(localStorage.getItem(key(user.id)) ?? '[]') as WalletActivity[]
  const next: WalletActivity = { ...activity, id: crypto.randomUUID(), date: new Date().toISOString(), status: 'completed' }
  localStorage.setItem(key(user.id), JSON.stringify([next, ...previous].slice(0, 200)))
}
export function readWalletActivity(userId: string): WalletActivity[] {
  return JSON.parse(localStorage.getItem(key(userId)) ?? '[]')
}
