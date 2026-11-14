import { delay, http, HttpResponse } from 'msw'
import { readSession } from './auth'
import { nfts } from './fixtures'
import { readJson } from './storage'
function read(userId: string): string[] { const saved = readJson(`kurio.mock.favorites.${userId}`, []); return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [] }
export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => { const user = readSession(request); if (!user) return HttpResponse.json({ message: 'Entre para ver seus favoritos.' }, { status: 401 }); await delay(150); const ids = read(user.id); return HttpResponse.json(nfts.filter((nft) => ids.includes(nft.id))) }),
  http.all('/api/favorites/:id', async ({ request, params }) => {
    const user = readSession(request)
    if (!user) return HttpResponse.json({ message: 'Entre para favoritar.' }, { status: 401 })
    if (!['POST', 'DELETE'].includes(request.method)) return new HttpResponse(null, { status: 405 })
    const nft = nfts.find((item) => item.id === params.id)
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    await delay(150)
    const ids = read(user.id).filter((id) => id !== nft.id)
    if (request.method === 'POST') ids.push(nft.id)
    localStorage.setItem(`kurio.mock.favorites.${user.id}`, JSON.stringify(ids))
    return HttpResponse.json({ saved: request.method === 'POST' })
  }),
]
