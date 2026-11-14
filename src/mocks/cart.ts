import { delay, http, HttpResponse } from 'msw'
import type { Cart, CartItem } from '../types/cart'
import { nfts } from './fixtures'
import { readSession } from './auth'
import { cartFrom } from '../lib/cart-contract'
import { readJson } from './storage'

function storageKey(request: Request) {
  const user = readSession(request)
  if (user) return `kurio.mock.cart.user.${user.id}`
  const guestId = request.headers.get('X-Guest-Id') ?? 'guest'
  return `kurio.mock.cart.${guestId}`
}



export function readCart(request: Request): Cart {
  return cartFrom(readJson(storageKey(request)))
}



export function saveCart(request: Request, cart: Cart) {
  localStorage.setItem(storageKey(request), JSON.stringify(cart))
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    await delay(250)

    return HttpResponse.json(readCart(request))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await delay(350)

    let body: Partial<CartItem>

    try {
      body = (await request.json()) as Partial<CartItem>
    } catch {
      return HttpResponse.json(
        { message: 'Dados inválidos para adicionar ao carrinho.' },
        { status: 422 },
      )
    }

    if (
      !body ||
      typeof body.nftId !== 'string' ||
      typeof body.editionId !== 'string' ||
      typeof body.quantity !== 'number' ||
      !Number.isInteger(body.quantity) ||
      body.quantity < 1
    ) {
      return HttpResponse.json(
        { message: 'Informe um NFT, uma edição e uma quantidade válida.' },
        { status: 422 },
      )
    }

    const nft = nfts.find((item) => item.id === body.nftId)
    const edition = nft?.editions.find(
      (item) => item.id === body.editionId,
    )

    if (!nft || !edition) {
      return HttpResponse.json(
        { message: 'NFT ou edição não encontrados.' },
        { status: 404 },
      )
    }

    const cart = readCart(request)

    const existing = cart.items.find(
      (item) =>
        item.nftId === body.nftId &&
        item.editionId === body.editionId,
    )

    const newQuantity = (existing?.quantity ?? 0) + body.quantity

    if (newQuantity > edition.stock) {
      return HttpResponse.json(
        {
          message:
            `Esta edição tem ${edition.stock} unidades disponíveis. ` +
            `${existing?.quantity ?? 0} já estão no carrinho.`,
        },
        { status: 409 },
      )
    }

    if (existing) {
      existing.quantity = newQuantity
    } else {
      cart.items.push({
        nftId: body.nftId,
        editionId: body.editionId,
        quantity: body.quantity,
      })
    }

    cart.version += 1
    saveCart(request, cart)

    return HttpResponse.json(cart)
  }),
]
