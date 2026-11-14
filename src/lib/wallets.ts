import { api } from './api'
import type { SavedWallet, WalletInput } from '../types/wallet'
export async function listWallets(signal?: AbortSignal) { return (await api.get<SavedWallet[]>('/wallets', { signal })).data }
export async function saveWallet(input: { id?: string; data: WalletInput }) { return (await api.request<SavedWallet>({ method: input.id ? 'patch' : 'post', url: input.id ? `/wallets/${encodeURIComponent(input.id)}` : '/wallets', data: input.data })).data }
