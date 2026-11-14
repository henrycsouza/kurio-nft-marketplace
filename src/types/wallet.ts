import type { Wallet } from './checkout'
export type WalletSlot = 'primary' | 'secondary'
export type SavedWallet = Wallet & { slot: WalletSlot; displayName: string; nickname: string; profileName: string; email: string; ens: string; referral: string; type: 'MetaMask' | 'Coinbase Wallet' | 'WalletConnect'; secondaryAddress: string }
export type WalletInput = Omit<SavedWallet, 'id' | 'label'>
