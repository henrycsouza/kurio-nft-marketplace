import { api } from './api'
import type { Session } from '../types/checkout'
import { requireSession } from './identity'
export type AuthMode = 'login' | 'register' | 'forgot' | 'reset'
export async function register(input: { name: string; email: string; password: string }) { return requireSession((await api.post<Session>('/accounts', input)).data) }
export async function forgotPassword(email: string) { return (await api.post<{ message: string; demoToken: string }>('/password/forgot', { email })).data }
export async function resetPassword(input: { token: string; password: string }) { return (await api.post<{ message: string }>('/password/reset', input)).data }
export async function socialLogin(input: { provider: 'google' | 'facebook'; accepted: boolean }) { return requireSession((await api.post<Session>('/session/social', input)).data) }
