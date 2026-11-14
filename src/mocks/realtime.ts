import { http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { readSession } from './auth'
import { subscribe, publish } from './events'
import { nfts } from './fixtures'
import type { MarketEvent } from '../types/realtime'

const channel = ws.link(`${window.location.origin.replace(/^http/, 'ws')}/realtime/`)
const connections = new Set<() => void>()
export const realtimeHandlers = [
  http.get('/api/demo/realtime-status', () => HttpResponse.json({ connections: connections.size })),
  channel.addEventListener('connection', (connection) => {
    const request = new Request('http://mock/api/session', { headers: { 'X-Guest-Id': connection.client.url.searchParams.get('guestId') ?? '' } })
    const identity = readSession(request)?.id
    const io = toSocketIo(connection)
    const close = () => connection.client.close(1011, 'Interrupção simulada')
    connections.add(close)
    const unsubscribe = subscribe((name, event) => {
      if (event.userId && (event.userId !== identity || readSession(request)?.id !== identity)) return
      io.client.emit(name, event)
    })
    const heartbeat = setInterval(() => connection.client.send('2'), 10000)
    connection.client.addEventListener('close', () => { unsubscribe(); clearInterval(heartbeat); connections.delete(close) })
  }),
  http.post('/api/demo/disconnect', () => {
    for (const close of connections) close()
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('/api/demo/replay', async ({ request }) => {
    const body = await request.json() as { id: string; stale?: boolean }
    const saved = localStorage.getItem(`kurio.mock.nft.${body.id}`)
    if (!saved) return new HttpResponse(null, { status: 404 })
    const event = JSON.parse(saved) as MarketEvent
    publish('nft.updated', body.stale ? { ...event, version: event.version - 1 } : event)
    return new HttpResponse(null, { status: 204 })
  }),
  // Network-only controls for reproducible demonstrations and E2E; never called by product components.
  http.post('/api/demo/nft', async ({ request }) => {
    const body = await request.json() as { id: string; price?: string; stock?: number; replay?: boolean; stale?: boolean }
    const nft = nfts.find((item) => item.id === body.id)
    if (!nft) return HttpResponse.json({ message: 'NFT inexistente.' }, { status: 404 })
    if ((body.price !== undefined && !/^\d+(\.\d+)?$/.test(body.price)) || (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0))) return HttpResponse.json({ message: 'Valores inválidos.' }, { status: 422 })
    const key = `kurio.mock.nft.${nft.id}`
    const previous = JSON.parse(localStorage.getItem(key) ?? '{"version":0}') as MarketEvent
    const event: MarketEvent = { id: crypto.randomUUID(), resourceId: nft.id, version: (previous.version ?? 0) + 1, price: body.price ?? nft.price, stock: body.stock ?? previous.stock }
    nft.price = event.price
    if (body.stock !== undefined) nft.editions.forEach((edition) => { edition.stock = body.stock! })
    localStorage.setItem(key, JSON.stringify(event))
    publish('nft.updated', event)
    if (body.replay) publish('nft.updated', event)
    if (body.stale) publish('nft.updated', { ...event, id: 'old-event', version: event.version - 1 })
    return HttpResponse.json(event)
  }),
]

export function restoreMarket() {
  for (const nft of nfts) {
    const saved = localStorage.getItem(`kurio.mock.nft.${nft.id}`)
    if (!saved) continue
    try {
      const event = JSON.parse(saved) as MarketEvent
      nft.price = event.price
      if (event.stock !== undefined) nft.editions.forEach((edition) => { edition.stock = event.stock! })
    } catch { localStorage.removeItem(`kurio.mock.nft.${nft.id}`) }
  }
}
