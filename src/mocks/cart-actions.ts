import { delay, http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'
import { readCart, saveCart } from './cart'
import { nfts } from './fixtures'
import type { Cart, CartQuote, CartQuoteItem } from '../types/cart'

Decimal.set({ precision: 40 })

function error(message: string, status = 422) {
  return HttpResponse.json({ message }, { status })
}

function commit(request: Request, cart: Cart) {
  cart.version += 1
  saveCart(request, cart)
  return HttpResponse.json(cart)
}

export const cartActionHandler = http.all(
  '/api/cart/:action',
  async ({ request, params }) => {
    await delay(300)

    const parsed: unknown = await request.json().catch(() => ({}))
    const body =
      parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {}

    const cart = readCart(request)
    const method = request.method
    const action = params.action

    if (method === 'GET' && action === 'quote') {
      try { return HttpResponse.json(buildCartQuote(request)) }
      catch { return error('Um item do carrinho ficou indisponível.', 409) }
    }

    if (method === 'PATCH' && action === 'items') {
      const { nftId, editionId, quantity } = body

      if (
        typeof nftId !== 'string' ||
        typeof editionId !== 'string' ||
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return error('Informe uma quantidade inteira maior que zero.')
      }

      const item = cart.items.find(
        (item) => item.nftId === nftId && item.editionId === editionId,
      )

      const edition = nfts
        .find((nft) => nft.id === nftId)
        ?.editions.find((edition) => edition.id === editionId)

      if (!item || !edition) {
        return error('Item não encontrado.', 404)
      }

      if (quantity > edition.stock) {
        return error(`Disponíveis nesta edição: ${edition.stock}.`, 409)
      }

      item.quantity = quantity
      return commit(request, cart)
    }

    if (method === 'DELETE' && action === 'items') {
      if (
        typeof body.nftId !== 'string' ||
        typeof body.editionId !== 'string'
      ) {
        return error('Informe o NFT e a edição.')
      }

      cart.items = cart.items.filter(
        (item) =>
          item.nftId !== body.nftId || item.editionId !== body.editionId,
      )

      if (cart.items.length === 0) delete cart.coupon

      return commit(request, cart)
    }

    if (method === 'POST' && action === 'coupon') {
      const code = String(body.code ?? '').trim().toUpperCase()

      if (code === 'EXPIRED') return error('Este cupom expirou.')
      if (code !== 'KURIO10') return error('Cupom inválido.')

      cart.coupon = code
      return commit(request, cart)
    }

    if (method === 'DELETE' && action === 'coupon') {
      delete cart.coupon
      return commit(request, cart)
    }

    return error('Operação não encontrada.', 404)
  },
)
export function buildCartQuote(request: Request): CartQuote {
  const cart = readCart(request)
      const items: CartQuoteItem[] = []

      for (const item of cart.items) {
        const nft = nfts.find((nft) => nft.id === item.nftId)
        const edition = nft?.editions.find(
          (edition) => edition.id === item.editionId,
        )

        if (!nft || !edition) {
          throw new Error('Um item do carrinho ficou indisponível.')
        }

        items.push({
          ...item,
          name: nft.name,
          image: nft.image,
          editionLabel: edition.label,
          stock: edition.stock,
          unitPrice: nft.price,
          lineTotal: new Decimal(nft.price).times(item.quantity).toFixed(),
        })
      }

      const subtotal = items.reduce(
        (sum, item) => sum.plus(item.lineTotal),
        new Decimal(0),
      )

      const discount =
        cart.coupon === 'KURIO10'
          ? subtotal.times('0.1')
          : new Decimal(0)

      const networkFee = items.length > 0 ? '0.016' : '0'

      return {
        items,
        coupon: cart.coupon ?? null,
        subtotal: subtotal.toFixed(),
        discount: discount.toFixed(),
        networkFee,
        total: subtotal.minus(discount).plus(networkFee).toFixed(),
        canCheckout:
          items.length > 0 &&
          items.every((item) => item.quantity <= item.stock),
      }
}
