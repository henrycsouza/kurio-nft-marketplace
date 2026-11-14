import type { SavedWallet } from '../types/wallet'
import { api } from './api'
import type { CheckoutRequest, Order, Session, Wallet } from '../types/checkout'
import { sessionFrom, requireSession } from './identity'
export const sessionKey = ['session'] as const
export async function getSession(signal?: AbortSignal) { return sessionFrom((await api.get<unknown>('/session', { signal })).data) }
export async function login(credentials: { email: string; password: string }) { return requireSession((await api.post<Session>('/session', credentials)).data) }
export async function logout() { await api.delete('/session') }
export async function getWallets(signal?: AbortSignal) { return (await api.get<SavedWallet[]>('/wallets', { signal })).data }
export async function connectWallet(input: { walletId: string; refuse: boolean; provider?: 'WalletConnect' | 'MetaMask' | 'Coinbase Wallet' }) { return (await api.post<Wallet>('/wallets/connect', input)).data }
export async function disconnectWallet() { await api.delete('/wallets/connect') }
export async function createOrder(input: { payload: CheckoutRequest; key: string }) { return (await api.post<Order>('/orders', input.payload, { headers: { 'Idempotency-Key': input.key } })).data }
export async function getOrder(id: string, signal?: AbortSignal) { return (await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })).data }


