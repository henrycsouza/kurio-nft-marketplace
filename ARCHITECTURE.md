# Arquitetura e tempo real

## Transporte

O cliente usa `socket.io-client` com transporte WebSocket, namespace padrão e path `/realtime/`. MSW intercepta a conexão e `@mswjs/socket.io-binding` codifica o protocolo Engine.IO/Socket.IO. Não há servidor externo. A integração segue a [biblioteca do MSW](https://github.com/mswjs/socket.io-binding). O path próprio evita a normalização especial de `/socket.io/` na versão instalada do MSW.

MSW 2.10.5 e binding 0.2.0 foram usados nos testes; o lockfile fixa as versões da execução. O worker público deve corresponder à versão instalada (`npx msw init public --save`). O construtor WebSocket é resolvido ao conectar, depois de iniciar MSW.

Limitações: simulação dentro da aba, eventos de texto no namespace padrão, sem servidor blockchain, rooms ou transporte polling. A persistência local sustenta refresh; não representa sincronização entre dispositivos. Com `VITE_ENABLE_MOCKS=false`, é necessário um backend REST e Socket.IO compatível no mesmo domínio.

## Eventos

| Evento | Dados | Efeito |
| --- | --- | --- |
| `nft.updated` | `id`, `resourceId`, `version`, preço decimal em `price`, estoque opcional em `stock` | Revalida catálogo, detalhe, recomendações, carrinho e cotação REST; apresenta aviso acessível |
| `order.updated` | `id`, `resourceId`, `version`, `userId`, `status` | Revalida o pedido da conta e o carrinho; a confirmação depende da resposta REST |

O cliente mantém a maior versão por tipo/recurso na conexão da sessão, descartando versões repetidas ou antigas. Eventos privados exigem a identidade atual tanto no mock quanto no cliente. A reconexão revalida recursos ativos por REST para recuperar eventos perdidos. Respostas de negócio nunca são criadas pelo componente de sincronização.

O mock publica somente após persistir a alteração. Preços/estoques são compartilhados com os handlers REST e restaurados no início. O pedido transita de pendente para confirmado/recusado por timer da simulação. Consultar um pedido após refresh reconcilia o prazo e agenda a transição pendente. Estados terminais não são reaplicados. O carrinho alterado pertence à identidade do comprador, mesmo se houver troca de sessão enquanto o pedido está pendente.

Listeners, heartbeat e conexão são liberados no teardown. Login/troca de conta recriam a conexão; expiração desconecta e reconsulta a sessão. Logout já cancela e limpa o cache. Realtime não substitui as validações de autorização dos endpoints.

## Cache e envio

TanStack Query tem staleTime padrão de 30 segundos e uma nova tentativa em consultas; consultas críticas usam staleTime zero. Axios recebe AbortSignal nas leituras. As chaves de catálogo incluem filtros; perfil, carteira, favoritos e pedidos incluem usuário. Invalidações após eventos recuperam o estado autoritativo por REST. Favoritos e preferências têm atualização otimista e rollback.

A criação de pedido não tem retry automático. A tentativa e sua Idempotency-Key são preservadas na aba. A API compara a cotação atual, impede conteúdo diferente na mesma tentativa e remove apenas as quantidades compradas. O recibo usa o snapshot persistido. A página de pedido não usa polling periódico; o histórico de carteiras ainda usa polling para seu resumo administrativo.

## Cenários reproduzíveis

São endpoints exclusivos dos mocks. Use `fetch` no console da própria aplicação; chamadas passam pelo MSW, e a alteração chega à interface pelo cliente Socket.IO.

```js
await fetch('/api/demo/nft', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'emerald-ape-042', price: '2.75' })
})
```

Troque `price` por `stock: 0` para esgotar as edições. `POST /api/demo/replay` aceita `{id, stale?: boolean}` e reenvia a última versão ou uma antiga sem alterar REST. `POST /api/demo/disconnect` interrompe conexões; o cliente reconecta automaticamente e reconcilia os dados. `GET /api/demo/realtime-status` informa o número de conexões para a sincronização dos testes.

Os testes Playwright partem de contextos isolados. Não há ainda seletor completo de cenários nem reset integral na interface. Para reset manual, feche as outras abas da aplicação, remova as chaves localStorage/sessionStorage com prefixo `kurio.` e recarregue. Isso remove também contas fictícias e pedidos locais.

## Limites da entrega atual

Consulte REVIEW.md para a matriz atual de requisitos. As 16 baselines e auditorias locais de início/detalhe já existem. O deploy em https://kurio-nft-marketplace-lake.vercel.app foi validado com seis testes públicos em mobile/desktop, incluindo compra e Socket.IO. O repositório público está em https://github.com/henrycsouza/kurio-nft-marketplace. Permanecem pendências de cobertura E2E completa, cenários/reset automatizados, performance mobile e Lighthouse público.

O visual ainda precisa de comparação final com todos os frames Figma. Perfil concentra a edição pessoal; pagamento usa os dados salvos para evitar repetir formulários, uma decisão de UX documentada em relação ao layout exigido.


## Proteção das rotas e retomada de sessão

O grupo pathless `_authenticated` verifica a sessão REST em `beforeLoad` e protege os fluxos privados. O login guarda um destino local validado com query/hash. `SessionSync` coordena a limpeza do cache anterior, a renovação do carrinho e a invalidação do Router na mudança de identidade. A consulta de sessão não é removida no logout para que os observadores recebam a mudança. Tentativas idempotentes são separadas por usuário e sobrevivem à expiração; logout explícito as remove. Consulte AUTH.md e tests/e2e/session.spec.ts.

## Ajustes de UX no pagamento

O desktop usa duas colunas: dados salvos/carteiras/conexão à esquerda e NFTs/quantidades/subtotal/desconto/taxa/total à direita. A versão mobile mantém uma coluna e permite expandir os itens e os valores. Nome e e-mail são somente leitura, com link para Perfil, evitando duplicar formulários. As conexões usam símbolos distintos da biblioteca Lucide; não são logotipos oficiais dos provedores. A rede é informada pela carteira escolhida. A revisão final e as validações da API permanecem obrigatórias. O catálogo restringe o selo NOVO ao primeiro card elegível na listagem geral para reduzir repetição visual, sem alterar os dados ou filtros de lançamento.

## Componentes shadcn/ui

Button e Input participam dos formulários de autenticação, perfil e carteiras; Button também das ações do pagamento. DropdownMenu e Sheet substituem os controles manuais de foco/abertura dos menus do perfil e da conta. Switch usa a mesma API de preferências e Skeleton participa do carregamento do catálogo. A configuração base-nova e os tokens preservam a identidade Kurio. Consulte src/components/ui/README.md e tests/e2e/ui-components.spec.ts. A migração não altera contratos REST, cache ou regras de compra.


## Compatibilidade dos dados persistidos

Foi reproduzida uma falha global em ProfileMenu ao recuperar uma sessão antiga sem name. A API simulada agora reconstrói a sessão a partir da conta correspondente ao id, conserva a expiração e migra os dados de apresentação. Identidades desconhecidas ou sessões inválidas não são autenticadas. O cliente normaliza sessão/perfil antes de gravar no cache e os componentes de avatar não chamam trim em campos sem validação.

Contas antigas recebem padrões seguros para campos de apresentação; carrinhos sem versão conservam os itens válidos; carteiras antigas são normalizadas; listas de favoritos e preferências inválidas não provocam exceções de leitura. Não há limpeza global do localStorage. Os contratos atuais de autenticação, idempotência, perfil e carteiras continuam cobertos pelos testes de integração. tests/e2e/legacy-data.spec.ts reproduz dados de versões anteriores e verifica home, perfil, carteiras, pagamento, configurações, favoritos, refresh, preservação do carrinho e isolamento de identidades.
