export type WalletActivity = {
  id: string
  kind: 'purchase' | 'wallet_created' | 'wallet_updated' | 'connected' | 'disconnected'
  status: 'confirmed' | 'pending' | 'declined' | 'completed'
  title: string
  date: string
  walletId: string
  walletLabel: string
  network: string
  amount?: string
  itemCount?: number
  orderId?: string
  transaction?: string
}
export type WalletHistory = { activities: WalletActivity[]; summary: { purchases: number; nfts: number; totalSpent: string; pending: number } }
