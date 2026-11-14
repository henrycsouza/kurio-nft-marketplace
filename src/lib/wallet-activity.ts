import { api } from './api'
import type { WalletHistory } from '../types/wallet-activity'
export async function getWalletHistory(signal?: AbortSignal) { return (await api.get<WalletHistory>('/wallets/activity', { signal })).data }
