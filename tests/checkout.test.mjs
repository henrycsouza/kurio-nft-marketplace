import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { setupServer } from 'msw/node'

const storage = new Map()
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key), get length() { return storage.size }, key: (index) => Array.from(storage.keys())[index] ?? null }
const output = path.resolve('node_modules/.cache/kurio-checkout-tests')
for (const source of ['lib/cart-contract', 'mocks/storage', 'lib/identity', 'mocks/events', 'mocks/favorites', 'mocks/wallet-activity-store', 'mocks/wallet-activity', 'mocks/wallets', 'mocks/auth', 'mocks/checkout', 'mocks/cart', 'mocks/cart-actions', 'mocks/fixtures', 'lib/catalog-options']) {
  let text = await readFile(`src/${source}.ts`, 'utf8')
  text = text.replaceAll("'/api/", "'http://localhost/api/")
  text = text.replace(/import (\w+) from '[^']+\.(?:png|webp)'/g, (_, name) => `const ${name} = '${name}.webp'`)
  const result = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/from '(\.\.?\/[^']+)'/g, "from '$1.mjs'")
  await mkdir(path.dirname(path.join(output, `${source}.mjs`)), { recursive: true })
  await writeFile(path.join(output, `${source}.mjs`), result)
}
const { favoriteHandlers } = await import(pathToFileURL(path.join(output, 'mocks/favorites.mjs')))
const { walletActivityHandlers } = await import(pathToFileURL(path.join(output, 'mocks/wallet-activity.mjs')))
const { walletHandlers } = await import(pathToFileURL(path.join(output, 'mocks/wallets.mjs')))
const { authHandlers } = await import(pathToFileURL(path.join(output, 'mocks/auth.mjs')))
const { checkoutHandlers } = await import(pathToFileURL(path.join(output, 'mocks/checkout.mjs')))
const { cartHandlers } = await import(pathToFileURL(path.join(output, 'mocks/cart.mjs')))
const { cartActionHandler } = await import(pathToFileURL(path.join(output, 'mocks/cart-actions.mjs')))
const server = setupServer(...authHandlers, ...favoriteHandlers, ...walletActivityHandlers, ...walletHandlers, ...checkoutHandlers, ...cartHandlers, cartActionHandler)
before(() => server.listen({ onUnhandledRequest: 'error' }))
after(() => server.close())
beforeEach(() => storage.clear())
async function call(route, method = 'GET', body, extra = {}) {
  const response = await fetch(`http://localhost/api${route}`, { method, headers: { 'Content-Type': 'application/json', 'X-Guest-Id': 'test-guest', ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) })
  return { status: response.status, body: response.status === 204 ? null : await response.json() }
}
async function prepare(scenario = 'confirmed') {
  assert.equal((await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })).status, 200)
  assert.equal((await call('/wallets/connect', 'POST', { walletId: 'metamask', refuse: false })).status, 200)
  assert.equal((await call('/cart/items', 'POST', { nftId: 'emerald-ape-042', editionId: 'limited', quantity: 2 })).status, 200)
  const quote = (await call('/cart/quote')).body
  return { collector: { displayName: 'Teste', username: 'teste', profileName: 'Teste', email: 'teste@example.com', referral: '', ens: '', note: '', secondaryAddress: '' }, walletId: 'metamask', quote, scenario }
}
function settle(id) {
  const key = `kurio.mock.order.collector-demo.${id}`
  const order = JSON.parse(storage.get(key))
  order.settlesAt = 0
  storage.set(key, JSON.stringify(order))
}
test('pagamento exige sessão e credenciais válidas', async () => {
  assert.equal((await call('/orders', 'POST', {})).status, 401)
  assert.equal((await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'incorreta' })).status, 401)
})
test('idempotência, snapshot e remoção exata das quantidades compradas', async () => {
  const payload = await prepare()
  const first = await call('/orders', 'POST', payload, { 'Idempotency-Key': 'same' })
  assert.equal(first.status, 201)
  assert.equal(first.body.status, 'pending')
  const repeat = await call('/orders', 'POST', payload, { 'Idempotency-Key': 'same' })
  assert.equal(repeat.body.id, first.body.id)
  assert.equal((await call('/orders', 'POST', { ...payload, walletId: 'coinbase' }, { 'Idempotency-Key': 'same' })).status, 409)
  await call('/cart/items', 'POST', { nftId: 'emerald-ape-042', editionId: 'limited', quantity: 1 })
  settle(first.body.id)
  const receipt = await call(`/orders/${first.body.id}`)
  assert.equal(receipt.body.status, 'confirmed')
  assert.deepEqual(receipt.body.quote, payload.quote)
  assert.equal((await call('/cart')).body.items[0].quantity, 1)
  await call(`/orders/${first.body.id}`)
  assert.equal((await call('/cart')).body.items[0].quantity, 1)
})
test('pagamento recusado preserva carrinho', async () => {
  const payload = await prepare('declined')
  const order = (await call('/orders', 'POST', payload, { 'Idempotency-Key': 'declined' })).body
  settle(order.id)
  assert.equal((await call(`/orders/${order.id}`)).body.status, 'declined')
  assert.equal((await call('/cart')).body.items[0].quantity, 2)
})
test('falha após criação recupera o mesmo pedido pela chave', async () => {
  const payload = await prepare('timeout')
  await assert.rejects(() => call('/orders', 'POST', payload, { 'Idempotency-Key': 'timeout' }))
  const recovered = await call('/orders', 'POST', payload, { 'Idempotency-Key': 'timeout' })
  assert.equal(recovered.status, 200)
  const again = await call('/orders', 'POST', payload, { 'Idempotency-Key': 'timeout' })
  assert.equal(recovered.body.id, again.body.id)
})
test('cotação alterada exige nova confirmação e carteira pode recusar conexão', async () => {
  const payload = await prepare()
  assert.equal((await call('/wallets/connect', 'POST', { walletId: 'metamask', refuse: true })).status, 409)
  await call('/cart/items', 'POST', { nftId: 'emerald-ape-042', editionId: 'limited', quantity: 1 })
  assert.equal((await call('/orders', 'POST', payload, { 'Idempotency-Key': 'stale' })).status, 409)
  assert.equal((await call('/cart')).body.items[0].quantity, 3)
})


test('cadastro, conflito, sessão recuperável e logout', async () => {
  const account = { name: 'Nova Pessoa', email: 'nova@example.com', password: 'MinhaSenha123' }
  const created = await call('/accounts', 'POST', account)
  assert.equal(created.status, 200)
  assert.equal((await call('/session')).body.id, created.body.id)
  assert.equal((await call('/accounts', 'POST', account)).status, 409)
  assert.equal((await call('/session', 'DELETE')).status, 204)
  assert.equal((await call('/session')).body, null)
  assert.equal((await call('/session', 'POST', { email: account.email, password: account.password })).status, 200)
  const saved = storage.get('kurio.mock.accounts.v1')
  assert.equal(saved.includes(account.password), false)
})
test('recuperação troca a senha e invalida o código usado', async () => {
  const recovery = await call('/password/forgot', 'POST', { email: 'colecionador@kurio.test' })
  const input = { token: recovery.body.demoToken, password: 'NovaSenha123' }
  assert.equal((await call('/password/reset', 'POST', input)).status, 200)
  assert.equal((await call('/password/reset', 'POST', input)).status, 422)
  assert.equal((await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })).status, 401)
  assert.equal((await call('/session', 'POST', { email: 'colecionador@kurio.test', password: input.password })).status, 200)
})
test('carrinho do visitante migra e contas ficam isoladas', async () => {
  await call('/cart/items', 'POST', { nftId: 'emerald-ape-042', editionId: 'limited', quantity: 2 })
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/cart')).body.items[0].quantity, 2)
  await call('/session', 'DELETE')
  assert.equal((await call('/cart')).body.items.length, 0)
  await call('/session', 'POST', { email: 'ana@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/cart')).body.items.length, 0)
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/cart')).body.items[0].quantity, 2)
})
test('conexão social exige consentimento e sessão expira', async () => {
  assert.equal((await call('/session/social', 'POST', { provider: 'google', accepted: false })).status, 409)
  const response = await call('/session/social', 'POST', { provider: 'google', accepted: true })
  assert.equal(response.status, 200)
  assert.equal(response.body.email, 'google@kurio.test')
  const key = 'kurio.mock.session.test-guest'
  const user = JSON.parse(storage.get(key)); user.expiresAt = 0; storage.set(key, JSON.stringify(user))
  assert.equal((await call('/session')).body, null)
  assert.equal((await call('/wallets')).status, 401)
})

test('configurações do perfil exigem sessão e persistem após novo login', async () => {
  assert.equal((await call('/profile', 'PATCH', { name: 'Novo nome' })).status, 401)
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/profile', 'PATCH', { name: 'A' })).status, 422)
  assert.equal((await call('/profile', 'PATCH', { name: 'Novo Colecionador' })).body.name, 'Novo Colecionador')
  await call('/session', 'DELETE')
  const session = await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal(session.body.name, 'Novo Colecionador')
  await call('/session', 'DELETE')
  const other = await call('/session', 'POST', { email: 'ana@kurio.test', password: 'Kurio123!' })
  assert.equal(other.body.name, 'Ana Colecionadora')
})

test('perfil completo, avatar e nova senha persistem; validações não salvam parcialmente', async () => {
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  const before = (await call('/profile')).body
  const input = { name: 'Colecionador Atualizado', email: 'atualizado@kurio.test', username: 'novo_colecionador', ens: 'minhacolecao', walletNickname: 'Principal', avatar: 'data:image/png;base64,aGVsbG8=', currentPassword: 'errada', newPassword: 'SenhaNova123', confirmation: 'SenhaNova123' }
  assert.equal((await call('/profile', 'PATCH', input)).status, 422)
  assert.equal((await call('/profile')).body.name, before.name)
  const saved = await call('/profile', 'PATCH', { ...input, currentPassword: 'Kurio123!' })
  assert.equal(saved.status, 200)
  assert.equal(saved.body.username, input.username)
  assert.equal(saved.body.ens, input.ens)
  assert.equal(saved.body.avatar, input.avatar)
  await call('/session', 'DELETE')
  assert.equal((await call('/session', 'POST', { email: input.email, password: 'Kurio123!' })).status, 401)
  assert.equal((await call('/session', 'POST', { email: input.email, password: input.newPassword })).status, 200)
  assert.equal((await call('/profile')).body.walletNickname, 'Principal')
  assert.equal((await call('/profile', 'PATCH', { name: input.name, email: 'ana@kurio.test' })).status, 409)
  assert.equal((await call('/profile', 'PATCH', { name: input.name, avatar: 'data:image/svg+xml;base64,bad' })).status, 422)
  await call('/session', 'DELETE')
  assert.equal((await call('/profile')).status, 401)
  await call('/session', 'POST', { email: 'ana@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/profile')).body.avatar, null)
})


test('carteiras: cadastro, validação, edição e isolamento entre contas', async () => {
  assert.equal((await call('/wallets')).status, 401)
  await call('/accounts', 'POST', { name: 'Nova Colecionadora', email: 'carteiras@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/wallets')).body.length, 0)
  const input = { slot: 'primary', displayName: 'Nova Colecionadora', nickname: 'Principal', profileName: 'Perfil novo', email: 'carteiras@kurio.test', address: '0x3333333333333333333333333333333333333333', network: 'Ethereum', type: 'MetaMask', ens: 'colecionadora', referral: '', secondaryAddress: '' }
  assert.equal((await call('/wallets', 'POST', { ...input, address: 'invalido' })).status, 422)
  const primary = await call('/wallets', 'POST', input)
  assert.equal(primary.status, 201)
  assert.equal((await call('/wallets', 'POST', input)).status, 409)
  assert.equal((await call('/wallets', 'POST', { ...input, slot: 'secondary' })).status, 409)
  const secondary = await call('/wallets', 'POST', { ...input, nickname: 'Secundária', slot: 'secondary', address: '0x4444444444444444444444444444444444444444' })
  assert.equal(secondary.status, 201)
  const edited = await call(`/wallets/${primary.body.id}`, 'PATCH', { ...input, nickname: 'Minha coleção', network: 'Polygon' })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.label, 'Minha coleção')
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: input.email, password: 'Kurio123!' })
  const saved = (await call('/wallets')).body
  assert.equal(saved.length, 2)
  assert.equal(saved.find((item) => item.slot === 'primary').network, 'Polygon')
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: 'ana@kurio.test', password: 'Kurio123!' })
  assert.equal((await call(`/wallets/${primary.body.id}`, 'PATCH', input)).status, 404)
  assert.equal((await call('/wallets')).body.some((item) => item.id === primary.body.id), false)
})
test('pagamento usa a carteira editada e exige reconexão após edição', async () => {
  const payload = await prepare()
  const wallet = (await call('/wallets')).body.find((item) => item.id === 'metamask')
  const updated = { ...wallet, address: '0x5555555555555555555555555555555555555555' }
  assert.equal((await call('/wallets/metamask', 'PATCH', updated)).status, 200)
  assert.equal((await call('/orders', 'POST', payload, { 'Idempotency-Key': 'reconnect' })).status, 409)
  await call('/wallets/connect', 'POST', { walletId: 'metamask', refuse: false })
  const order = await call('/orders', 'POST', payload, { 'Idempotency-Key': 'reconnect' })
  assert.equal(order.status, 201)
  assert.equal(order.body.wallet.address, updated.address)
})


test('histórico só mostra registros reais da conta e consolida compras confirmadas uma vez', async () => {
  assert.equal((await call('/wallets/activity')).status, 401)
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/wallets/activity')).body.activities.length, 0)
  const payload = await prepare()
  const order = (await call('/orders', 'POST', payload, { 'Idempotency-Key': 'history-order' })).body
  let history = (await call('/wallets/activity')).body
  assert.equal(history.summary.pending, 1)
  assert.equal(history.summary.totalSpent, '0')
  assert.equal(history.activities.filter((item) => item.kind === 'connected').length, 1)
  settle(order.id)
  await call(`/orders/${order.id}`)
  await call(`/orders/${order.id}`)
  history = (await call('/wallets/activity')).body
  assert.equal(history.summary.purchases, 1)
  assert.equal(history.summary.nfts, 2)
  assert.equal(history.summary.totalSpent, payload.quote.total)
  assert.equal(history.activities.filter((item) => item.kind === 'purchase').length, 1)
  assert.equal(history.activities.find((item) => item.orderId === order.id).transaction, order.transaction)
  await call('/wallets/connect', 'DELETE')
  assert.equal((await call('/wallets/activity')).body.activities.some((item) => item.kind === 'disconnected'), true)
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: 'ana@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/wallets/activity')).body.activities.length, 0)
})
test('edições de carteiras entram no histórico; pagamentos recusados não aumentam totais', async () => {
  const payload = await prepare('declined')
  const wallet = (await call('/wallets')).body[0]
  await call(`/wallets/${wallet.id}`, 'PATCH', { ...wallet, nickname: 'Carteira editada' })
  await call('/wallets/connect', 'POST', { walletId: wallet.id, refuse: false })
  const order = (await call('/orders', 'POST', payload, { 'Idempotency-Key': 'history-declined' })).body
  settle(order.id)
  await call(`/orders/${order.id}`)
  const history = (await call('/wallets/activity')).body
  assert.equal(history.summary.purchases, 0)
  assert.equal(history.summary.nfts, 0)
  assert.equal(history.summary.totalSpent, '0')
  assert.equal(history.activities.some((item) => item.kind === 'wallet_updated' && item.walletLabel === 'Carteira editada'), true)
  assert.equal(history.activities.find((item) => item.orderId === order.id).status, 'declined')
})


test('favoritos persistem por conta e recusam recursos inválidos', async () => {
  assert.equal((await call('/favorites')).status, 401)
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/favorites')).body.length, 0)
  assert.equal((await call('/favorites/emerald-ape-042', 'POST')).status, 200)
  await call('/favorites/emerald-ape-042', 'POST')
  assert.equal((await call('/favorites')).body.length, 1)
  assert.equal((await call('/favorites/inexistente', 'POST')).status, 404)
  assert.equal((await call('/favorites')).body.length, 1)
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: 'ana@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/favorites')).body.length, 0)
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/favorites')).body[0].id, 'emerald-ape-042')
  await call('/favorites/emerald-ape-042', 'DELETE')
  assert.equal((await call('/favorites')).body.length, 0)
})

test('preferências são persistidas e isoladas por conta', async () => {
  assert.equal((await call('/preferences')).status, 401)
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/preferences')).body.reduceMotion, false)
  assert.equal((await call('/preferences', 'PATCH', { reduceMotion: true })).status, 200)
  assert.equal((await call('/preferences', 'PATCH', { reduceMotion: 'true' })).status, 422)
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: 'ana@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/preferences')).body.reduceMotion, false)
  await call('/session', 'DELETE')
  await call('/session', 'POST', { email: 'colecionador@kurio.test', password: 'Kurio123!' })
  assert.equal((await call('/preferences')).body.reduceMotion, true)
})



