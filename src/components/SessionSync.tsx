import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import { getSession, sessionKey } from '../lib/checkout'
import { safeReturnTo } from '../lib/auth-navigation'

export function SessionSync() {
  const client = useQueryClient()
  const router = useRouter()
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal) })
  const previous = useRef<string | null | undefined>(undefined)
  const identity = session.data?.id ?? null
  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (error) => {
      if (error.response?.status === 401 && /^\/(profile|wallets|favorites|orders)(\/|$)/.test(error.config?.url ?? '')) client.setQueryData(sessionKey, null)
      return Promise.reject(error)
    })
    return () => api.interceptors.response.eject(interceptor)
  }, [client])
  useEffect(() => {
    if (!session.isSuccess) return
    const oldIdentity = previous.current
    const changed = previous.current !== undefined && previous.current !== identity
    previous.current = identity
    let active = true
    async function synchronize() {
      if (changed) {
        await client.cancelQueries({ predicate: (query) => !['session', 'nft', 'nfts'].includes(String(query.queryKey[0])) })
        if (!active) return
        client.removeQueries({ predicate: (query) => !['session', 'nft', 'nfts', 'cart', 'cart-quote'].includes(String(query.queryKey[0])) && query.queryKey.includes(oldIdentity) })
        await client.resetQueries({ predicate: (query) => ['cart', 'cart-quote'].includes(String(query.queryKey[0])) })
      }
      if (!active) return
      if (identity && router.state.location.pathname === '/login') {
        await router.navigate({ href: safeReturnTo(router.state.location.search.redirect), replace: true })
      } else if (changed) await router.invalidate()
    }
    void synchronize()
    return () => { active = false }
  }, [client, router, identity, session.isSuccess])
  return null
}
