import type { Session } from './checkout'
export type CollectorProfile = Session & {
  username: string
  ens: string
  walletNickname: string
  avatar: string | null
  provider: string | null
}
export type ProfileUpdate = {
  name: string
  email: string
  username: string
  ens: string
  walletNickname: string
  avatar: string | null
  currentPassword?: string
  newPassword?: string
  confirmation?: string
}
