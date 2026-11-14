import { api, guestId } from './api'
import type { Cart, CartItem, CartQuote } from '../types/cart'

export const cartQueryKey = ['cart', guestId] as const

export async function getCart(signal?: AbortSignal) {
  const response = await api.get<Cart>('/cart', { signal })
  if (!response.data || !Array.isArray(response.data.items)) throw new Error('Não foi possível ler o carrinho. Tente novamente.')
  return response.data
}

export async function addCartItem(item: CartItem) {
  const response = await api.post<Cart>('/cart/items', item)
  return response.data
}

export const cartQuoteQueryKey = ['cart-quote', guestId] as const

export async function getCartQuote(signal?: AbortSignal) {
  const response = await api.get<CartQuote>('/cart/quote', { signal })
  if (!response.data || !Array.isArray(response.data.items)) throw new Error('Não foi possível ler os valores do carrinho. Tente novamente.')
  return response.data
}

export type CartAction =
  | { type: 'quantity'; nftId: string; editionId: string; quantity: number }
  | { type: 'remove'; nftId: string; editionId: string }
  | { type: 'coupon'; code: string }
  | { type: 'remove-coupon' }

export async function mutateCart(action: CartAction) {
  const configs = {
    quantity: { method: 'patch', url: '/cart/items' },
    remove: { method: 'delete', url: '/cart/items' },
    coupon: { method: 'post', url: '/cart/coupon' },
    'remove-coupon': { method: 'delete', url: '/cart/coupon' },
  }

  const response = await api.request<Cart>({
    ...configs[action.type],
    data: action,
  })

  return response.data
}
