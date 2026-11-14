import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { io, WebSocket as SocketWebSocket } from 'socket.io-client'
import { guestId } from '../lib/api'
import { getSession, sessionKey } from '../lib/checkout'
import { cartQueryKey, cartQuoteQueryKey } from '../lib/cart'
import type { ResourceEvent } from '../types/realtime'
import { whenBackendReady } from '../lib/backend-ready'

// Resolve the constructor at connection time, after MSW has installed its interceptor.
class RuntimeWebSocket extends SocketWebSocket {
  override createSocket(uri: string, protocols?: string | string[]) {
    return new globalThis.WebSocket(uri, protocols)
  }
}

export function RealtimeSync() {
  const client = useQueryClient()
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal) })
  const [message, setMessage] = useState('')
  const userId = session.data?.id
  const expiresAt = session.data?.expiresAt

  useEffect(() => {
    let active = true
    let dispose = () => {}
    void whenBackendReady().then(() => {
      if (!active) return
      const versions = new Map<string, number>()
      const socket = io(window.location.origin, { path: '/realtime/', transports: [RuntimeWebSocket], query: { guestId }, reconnectionDelay: 500, reconnectionDelayMax: 2000, forceNew: true })
      function reconcile() {
        if (!active) return
        for (const key of [['nfts'], ['nft'], ['recommendations'], cartQueryKey, cartQuoteQueryKey, ['order'], ['wallet-activity'], sessionKey]) {
          void client.invalidateQueries({ queryKey: key })
        }
      }
      function accept(name: string, event: ResourceEvent) {
        if (!active || !event || typeof event.resourceId !== 'string' || !Number.isInteger(event.version) || event.version < 1 || (event.userId && event.userId !== userId)) return false
        const key = `${name}:${event.resourceId}`
        if (event.version <= (versions.get(key) ?? 0)) return false
        versions.set(key, event.version)
        return true
      }
      socket.on('connect', () => { reconcile(); setMessage('') })
      socket.on('disconnect', () => { if (active) setMessage('Conexão interrompida. Reconectando para atualizar os dados…') })
      socket.on('connect_error', () => { if (active) setMessage('Sem conexão de atualização. Tentando reconectar…') })
      socket.on('nft.updated', (event: ResourceEvent) => {
        if (!accept('nft', event)) return
        reconcile()
        setMessage('Preço ou disponibilidade atualizado. Confira os valores antes de comprar.')
      })
      socket.on('order.updated', (event: ResourceEvent) => {
        if (!event.userId || !accept('order', event)) return
        void client.invalidateQueries({ queryKey: ['order', userId, event.resourceId] })
        void client.invalidateQueries({ queryKey: cartQueryKey })
        void client.invalidateQueries({ queryKey: cartQuoteQueryKey })
        setMessage('O estado da sua compra foi atualizado.')
      })
      const expiry = expiresAt ? setTimeout(() => { socket.disconnect(); void client.invalidateQueries({ queryKey: sessionKey }) }, Math.max(0, expiresAt - Date.now())) : undefined
      dispose = () => { clearTimeout(expiry); socket.removeAllListeners(); socket.disconnect() }
    }).catch(() => { if (active) setMessage('Não foi possível iniciar as atualizações. Recarregue a página.') })
    return () => { active = false; dispose() }
  }, [client, userId, expiresAt])

  return message ? <p role="status" className="realtime-notice">{message}</p> : null
}
