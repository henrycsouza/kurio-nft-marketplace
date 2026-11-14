export type ResourceEvent = {
  id: string
  resourceId: string
  version: number
  userId?: string
}
export type MarketEvent = ResourceEvent & { price: string; stock?: number }
export type OrderEvent = ResourceEvent & { userId: string; status: 'confirmed' | 'declined' }
