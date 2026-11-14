import { delay, http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'
import { readSession } from './auth'
import { readWalletActivity } from './wallet-activity-store'
import type { Order } from '../types/checkout'
import type { WalletActivity, WalletHistory } from '../types/wallet-activity'
export const walletActivityHandlers = [
  http.get('/api/wallets/activity', async ({ request }) => {
    const user = readSession(request)
    if (!user) return HttpResponse.json({ message: 'Entre novamente para consultar seu histórico.' }, { status: 401 })
    const orders: Order[] = []
    const prefix = `kurio.mock.order.${user.id}.`
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (!key?.startsWith(prefix)) continue
      try {
        const order = JSON.parse(localStorage.getItem(key)!) as Order
        if (order.userId === user.id && ['pending', 'confirmed', 'declined'].includes(order.status)) orders.push(order)
      } catch { /* An invalid saved entry does not prevent other history from loading. */ }
    }
    const purchases: WalletActivity[] = orders.map((order) => ({ id: `order:${order.id}`, kind: 'purchase', status: order.status, title: order.status === 'confirmed' ? 'Compra de NFTs confirmada' : order.status === 'declined' ? 'Pagamento recusado' : 'Compra em processamento', date: order.createdAt, walletId: order.wallet.id, walletLabel: order.wallet.label, network: order.wallet.network, amount: order.quote.total, itemCount: order.quote.items.reduce((sum, item) => sum + item.quantity, 0), orderId: order.id, transaction: order.status === 'confirmed' ? order.transaction : undefined }))
    const confirmed = purchases.filter((item) => item.status === 'confirmed')
    const response: WalletHistory = {
      activities: [...readWalletActivity(user.id), ...purchases].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
      summary: { purchases: confirmed.length, nfts: confirmed.reduce((sum, item) => sum + (item.itemCount ?? 0), 0), totalSpent: confirmed.reduce((sum, item) => sum.plus(item.amount ?? '0'), new Decimal(0)).toFixed(), pending: purchases.filter((item) => item.status === 'pending').length },
    }
    await delay(200)
    return HttpResponse.json(response)
  }),
]
