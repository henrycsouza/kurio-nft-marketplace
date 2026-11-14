import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSession, sessionKey } from '../lib/checkout'
import { getPreferences } from '../lib/preferences'
export function InterfacePreferences() {
  const session = useQuery({ queryKey: sessionKey, queryFn: ({ signal }) => getSession(signal) })
  const preferences = useQuery({ queryKey: ['preferences', session.data?.id], queryFn: ({ signal }) => getPreferences(signal), enabled: !!session.data })
  const reduced = !!session.data && !!preferences.data?.reduceMotion
  useEffect(() => { document.documentElement.dataset.motion = reduced ? 'reduce' : 'system'; return () => { delete document.documentElement.dataset.motion } }, [reduced])
  return null
}
