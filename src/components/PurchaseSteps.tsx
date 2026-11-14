import { Check } from 'lucide-react'

type PurchaseStepsProps = {
  step: 'cart' | 'payment' | 'complete'
  status?: 'pending' | 'confirmed' | 'declined'
}

export function PurchaseSteps({ step, status }: PurchaseStepsProps) {
  const active = step === 'cart' ? 0 : step === 'payment' ? 1 : 2
  const steps = ['Carrinho', 'Pagamento', 'Compra finalizada']
  return (
    <nav aria-label="Etapas da compra" className="purchase-steps">
      <ol>
        {steps.map((label, index) => {
          const completed = index < active || (index === 2 && status === 'confirmed')
          const current = index === active
          const detail = completed ? 'Concluído' : current ? (status === 'declined' ? 'Pagamento recusado' : status === 'pending' ? 'Aguardando confirmação' : 'Etapa atual') : 'Próxima etapa'
          return (
            <li key={label} data-completed={completed} data-current={current} data-error={current && status === 'declined'} aria-current={current ? 'step' : undefined}>
              <span className="purchase-step-marker" aria-hidden="true">{completed ? <Check size={18} /> : index + 1}</span>
              <span className="purchase-step-label">{label}<small>{detail}</small></span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
