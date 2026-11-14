import type { ResourceEvent } from '../types/realtime'

type Listener = (name: string, event: ResourceEvent) => void
const listeners = new Set<Listener>()
export function publish(name: string, event: ResourceEvent) {
  for (const listener of listeners) listener(name, event)
}
export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
