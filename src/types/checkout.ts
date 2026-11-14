import type { CartQuote } from './cart'
export type Wallet = { id: string; label: string; address: string; network: string; provider?: string }
export type Session = { id: string; email: string; name: string; expiresAt: number; avatar?: string | null }
export type Collector = { displayName: string; username: string; profileName: string; email: string; referral: string; ens: string; note: string; secondaryAddress: string }
export type CheckoutRequest = { collector: Collector; walletId: string; quote: CartQuote; scenario: 'confirmed' | 'declined' | 'timeout' }
export type Order = { id: string; userId: string; status: 'pending' | 'confirmed' | 'declined'; createdAt: string; settlesAt: number; transaction: string; quote: CartQuote; collector: Collector; wallet: Wallet; outcome: 'confirmed' | 'declined' }


