import { api } from './api'
export type Preferences = { reduceMotion: boolean }
export async function getPreferences(signal?: AbortSignal) { return (await api.get<Preferences>('/preferences', { signal })).data }
export async function savePreferences(input: Preferences) { return (await api.patch<Preferences>('/preferences', input)).data }
