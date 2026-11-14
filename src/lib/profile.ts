import { api } from './api'
import type { CollectorProfile, ProfileUpdate } from '../types/profile'
import { profileFrom } from './identity'
export async function getProfile(signal?: AbortSignal) { return profileFrom((await api.get<CollectorProfile>('/profile', { signal })).data) }
export async function updateProfile(input: ProfileUpdate) { return profileFrom((await api.patch<CollectorProfile>('/profile', input)).data) }
