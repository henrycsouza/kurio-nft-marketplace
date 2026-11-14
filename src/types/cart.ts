export type CartItem = {
    nftId: string
    editionId: string
    quantity: number
}

export type Cart = {
  version: number
  items: CartItem[]
  coupon?: string
}

export type CartQuoteItem = CartItem & {
  name: string
  image: string
  editionLabel: string
  stock: number
  unitPrice: string
  lineTotal: string
}

export type CartQuote = {
  items: CartQuoteItem[]
  coupon: string | null
  subtotal: string
  discount: string
  networkFee: string
  total: string
  canCheckout: boolean
}