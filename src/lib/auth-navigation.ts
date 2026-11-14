import { guestId } from './api'

export function safeReturnTo(value: unknown) {
  if (typeof value !== 'string' || !/^(?:\/(?:checkout|profile|wallets|settings|favorites)(?:[?#]|$)|\/orders\/[^/?#]+(?:[?#]|$))/.test(value) || value.includes('\\')) return '/profile'
  return value
}

export function clearCheckoutDrafts() {
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith(`kurio.checkout.attempt.${guestId}`) || key === `kurio.checkout.draft.${guestId}`) sessionStorage.removeItem(key)
  }
}
