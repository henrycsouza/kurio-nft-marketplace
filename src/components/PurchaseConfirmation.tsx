import { useEffect, useRef, useState } from 'react'
import { Check, ExternalLink, Gift, X } from 'lucide-react'
import type { Order } from '../types/checkout'

type PurchaseConfirmationProps = { order: Order }

export function PurchaseConfirmation({ order }: PurchaseConfirmationProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [showTransaction, setShowTransaction] = useState(false)

  useEffect(() => {
    if (order.status !== 'confirmed') return
    const modal = dialog.current
    if (modal && !modal.open) modal.showModal()
    return () => { if (modal?.open) modal.close() }
  }, [order.id, order.status])

  if (order.status !== 'confirmed') return null

  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(order.createdAt))
  return (
    <>
      <button type="button" className="mt-6 block text-sm text-brand underline" onClick={() => dialog.current?.showModal()}>
        Ver confirmação da compra
      </button>
      <dialog
        ref={dialog}
        className="purchase-confirmation"
        aria-labelledby="purchase-confirmation-title"
        aria-describedby="purchase-confirmation-message"
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}
      >
        <button type="button" autoFocus className="purchase-confirmation-close" aria-label="Fechar confirmação da compra" onClick={() => dialog.current?.close()}><X size={18} /></button>
        <header className="purchase-confirmation-heading">
          <div className="purchase-confirmation-mark" aria-hidden="true"><Gift size={36} strokeWidth={1.2} /><span><Check size={12} /></span></div>
          <p className="purchase-confirmation-eyebrow">OBRIGADO PELA COMPRA</p>
          <h2 id="purchase-confirmation-title">Seus NFTs agora estão na sua carteira</h2>
          <p className="purchase-confirmation-demo">Compra e transferência simuladas</p>
        </header>

        <dl className="purchase-confirmation-metadata">
          <div><dt>ID da transação</dt><dd title={order.transaction}>{order.transaction.slice(0, 9)}…{order.transaction.slice(-5)}</dd></div>
          <div><dt>Data</dt><dd>{date}</dd></div>
          <div><dt>Total</dt><dd>{order.quote.total} ETH</dd></div>
          <div><dt>Carteira</dt><dd>{order.wallet.label}</dd></div>
        </dl>

        <section className="purchase-confirmation-details" aria-labelledby="confirmation-details-title">
          <h3 id="confirmation-details-title">Detalhes da transação</h3>
          <div className="purchase-confirmation-columns" aria-hidden="true"><span>NFTs</span><span>Edições</span><span>Subtotal</span></div>
          <ul className="purchase-confirmation-items">
            {order.quote.items.map((item) => (
              <li key={`${item.nftId}:${item.editionId}`}>
                <img src={item.image} alt={item.name} width={44} height={44} />
                <div className="purchase-confirmation-item-name"><h4>{item.name}</h4><p>ID do token: #{item.nftId.split('-').at(-1)}</p></div>
                <span className="purchase-confirmation-edition" aria-label={`Edição ${item.editionLabel}, quantidade ${item.quantity}`}>{item.editionLabel}<small>× {item.quantity}</small></span>
                <strong>{item.lineTotal} ETH</strong>
              </li>
            ))}
          </ul>
          <dl className="purchase-confirmation-totals">
            <div><dt>Subtotal</dt><dd>{order.quote.subtotal} ETH</dd></div>
            <div><dt>Desconto do lançamento</dt><dd>− {order.quote.discount} ETH</dd></div>
            <div><dt>Taxa de rede</dt><dd>{order.quote.networkFee} ETH</dd></div>
            <div className="purchase-confirmation-total"><dt>Total</dt><dd>{order.quote.total} ETH</dd></div>
          </dl>
        </section>

        <p id="purchase-confirmation-message" className="purchase-confirmation-message">Obrigado por fazer parte da Kurio. Nesta demonstração, a propriedade foi registrada na simulação; nenhuma transação real foi enviada à rede.</p>
        <button type="button" className="checkout-primary purchase-confirmation-explorer" aria-expanded={showTransaction} aria-controls="simulated-transaction" onClick={() => setShowTransaction(!showTransaction)}>Ver no Etherscan (simulado)<ExternalLink size={13} /></button>
        {showTransaction && <section id="simulated-transaction" className="purchase-simulated-transaction" aria-label="Explorador de transação simulado"><h3>Transação confirmada na simulação</h3><p>{order.transaction}</p><p>Rede: {order.wallet.network}</p><p>Carteira: {order.wallet.address}</p><p>Esta referência não existe no Etherscan real.</p></section>}
      </dialog>
    </>
  )
}
