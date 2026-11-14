import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowDownLeft, Check, Clock3, History, Link2, RefreshCw, Search, ShoppingBag, Wallet, X } from 'lucide-react'
import { getWalletHistory } from '../lib/wallet-activity'
import type { SavedWallet } from '../types/wallet'
import type { WalletActivity } from '../types/wallet-activity'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
const statusLabels = { confirmed: 'Confirmada', pending: 'Em processamento', declined: 'Recusada', completed: 'Concluída' }

export function WalletHistoryPanel({ userId, wallets }: { userId: string; wallets: SavedWallet[] }) {
  const [filter, setFilter] = useState<'all' | 'purchases' | 'wallets'>('all')
  const [selectedWallet, setSelectedWallet] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: ['wallet-activity', userId], queryFn: ({ signal }) => getWalletHistory(signal), staleTime: 0, refetchInterval: 15_000 })
  if (query.isPending) return <section className="wallet-history-loading" role="status" aria-label="Carregando atividades das carteiras"><div className="nft-skeleton h-24 rounded" /><div className="nft-skeleton mt-6 h-64 rounded" /></section>
  if (query.isError) return <section className="wallet-history-error" role="alert"><h2>Atividade das carteiras</h2><p>Não foi possível carregar o histórico.</p><button type="button" className="checkout-primary" onClick={() => query.refetch()}>Tentar novamente</button></section>
  const { summary, activities } = query.data
  const results = activities.filter((item) => (filter === 'all' || (filter === 'purchases' ? item.kind === 'purchase' : item.kind !== 'purchase')) && (selectedWallet === 'all' || item.walletId === selectedWallet) && `${item.title} ${item.walletLabel} ${item.transaction ?? ''} ${item.orderId ?? ''}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  const pages = Math.max(1, Math.ceil(results.length / 6))
  const currentPage = Math.min(page, pages)
  const visible = results.slice((currentPage - 1) * 6, currentPage * 6)
  return <section className="wallet-overview" aria-labelledby="wallet-overview-title">
    <header className="wallet-overview-heading"><div><span className="settings-eyebrow">MINHAS CARTEIRAS</span><h1 id="wallet-overview-title">Visão geral</h1><p>Acompanhe suas compras e movimentações na Kurio.</p></div><button type="button" className="wallet-refresh" disabled={query.isFetching} onClick={() => query.refetch()} aria-label="Atualizar histórico das carteiras"><RefreshCw size={15} />{query.isFetching ? 'Atualizando…' : 'Atualizar'}</button></header>
    <div className="wallet-stats">
      <div><span><Wallet size={16} />Carteiras</span><strong>{wallets.length}</strong><small>Cadastradas na conta</small></div>
      <div><span><ShoppingBag size={16} />NFTs comprados</span><strong>{summary.nfts}</strong><small>{summary.purchases} compras confirmadas</small></div>
      <div><span><ArrowDownLeft size={16} />Total em compras</span><strong>{summary.totalSpent}<small>ETH</small></strong><small>Inclui taxas · simulado</small></div>
      <div><span><Clock3 size={16} />Em processamento</span><strong>{summary.pending}</strong><small>Pedidos aguardando confirmação</small></div>
    </div>
    <div id="wallet-history" className="wallet-history">
      <div className="wallet-history-title"><h2><History size={18} />Histórico de atividades</h2><span role="status">{results.length} registros{query.isFetching ? ' · atualizando' : ''}</span></div>
      <div className="wallet-history-toolbar"><div className="wallet-history-tabs" aria-label="Tipo de atividade">{([['all', 'Todas'], ['purchases', 'Compras'], ['wallets', 'Carteiras']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1) }}>{label}</button>)}</div><label className="sr-only" htmlFor="history-wallet-filter">Filtrar por carteira</label><select id="history-wallet-filter" value={selectedWallet} onChange={(event) => { setSelectedWallet(event.target.value); setPage(1) }}><option value="all">Todas as carteiras</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.nickname}</option>)}</select></div>
      <label className="wallet-history-search"><Search size={16} /><span className="sr-only">Buscar no histórico</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar atividade, carteira ou transação" /></label>
      {visible.length ? <ul className="wallet-history-list">{visible.map((item) => <ActivityRow key={item.id} item={item} />)}</ul> : <div className="wallet-history-empty"><Activity size={28} /><h3>{activities.length ? 'Nenhuma atividade encontrada' : 'Seu histórico começa aqui'}</h3><p>{activities.length ? 'Tente outra busca ou ajuste os filtros.' : 'Cadastre uma carteira, conecte no pagamento ou faça sua primeira compra para acompanhar tudo por aqui.'}</p>{activities.length > 0 && <button type="button" className="text-brand" onClick={() => { setSearch(''); setFilter('all'); setSelectedWallet('all'); setPage(1) }}>Limpar filtros</button>}</div>}
      {pages > 1 && <nav aria-label="Páginas do histórico" className="wallet-history-pagination"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>{currentPage} de {pages}</span><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Próxima</button></nav>}
      <p className="wallet-history-footnote">Horários de Brasília. Histórico da simulação Kurio; não representa o saldo nem todas as transações da blockchain.</p>
    </div>
  </section>
}
function ActivityRow({ item }: { item: WalletActivity }) {
  const Icon = item.kind === 'purchase' ? ShoppingBag : item.kind === 'connected' || item.kind === 'disconnected' ? Link2 : Wallet
  const StatusIcon = item.status === 'declined' ? X : item.status === 'pending' ? Clock3 : Check
  return <li className="wallet-history-row"><span className="wallet-event-icon"><Icon size={18} /></span><div className="wallet-event-details"><h3>{item.title}</h3><p>{item.walletLabel} <span>· {item.network}</span></p><time dateTime={item.date}>{dateFormat.format(new Date(item.date))}</time>{item.transaction && <code title={item.transaction}>{item.transaction.slice(0, 12)}…{item.transaction.slice(-6)}</code>}</div><div className="wallet-event-result">{item.amount && <strong>{item.amount} ETH</strong>}<span className="wallet-event-status" data-status={item.status}><StatusIcon size={12} />{statusLabels[item.status]}</span>{item.orderId && <Link to="/orders/$orderId" params={{ orderId: item.orderId }}>{item.status === 'pending' ? 'Acompanhar pedido' : 'Ver pedido'} →</Link>}</div></li>
}
