import type { Cart, CartItem } from '../types/cart'
import { isRecord, text } from './identity'

export function cartFrom(value: unknown): Cart {
  if (!isRecord(value)) return { version: 0, items: [] }
  const items: CartItem[] = Array.isArray(value.items) ? value.items.filter((item) => isRecord(item) && !!text(item.nftId) && !!text(item.editionId) && Number.isInteger(item.quantity) && Number(item.quantity) > 0).map((item) => ({ nftId: text(item.nftId), editionId: text(item.editionId), quantity: item.quantity as number })) : []
  return { version: Number.isInteger(value.version) && Number(value.version) >= 0 ? Number(value.version) : 0, items, ...(typeof value.coupon === 'string' ? { coupon: value.coupon } : {}) }
}
