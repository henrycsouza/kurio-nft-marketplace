# Pagamento simulado

Adicione um NFT ao carrinho e continue para `/checkout`. Conta de demonstração: `colecionador@kurio.test` / `Kurio123!`.

O pagamento apresenta as carteiras salvas, as conexões WalletConnect/MetaMask/Coinbase Wallet, os itens, o total e o detalhamento dos valores e um botão Confirmar compra. O botão conecta a carteira simulada, revalida os valores e abre a revisão final. Nome e e-mail são exibidos para conferência, com link para editar no Perfil. No desktop, carteiras e conexão ficam à esquerda e o resumo à direita; em celulares, os itens e taxas podem ser expandidos. Nenhuma edição pessoal é feita nesta tela. Cupom KURIO10 é aplicado no carrinho.

Após confirmar a revisão, `/orders/:orderId` acompanha o pedido e exibe o recibo confirmado. A API exige sessão e carteira conectada, revalida a cotação e usa Idempotency-Key. A tentativa fica no sessionStorage para recuperação. Uma confirmação remove apenas as quantidades compradas; uma recusa preserva o carrinho. O recibo usa o snapshot imutável do pedido.

Para testar falhas, use `/checkout?scenario=declined`, `/checkout?scenario=timeout` ou `/checkout?connection=declined`. Os controles de simulação não ocupam o formulário de compra.

Axios e MSW implementam os endpoints de sessão, perfil, carteiras, cotação e pedidos. Não há pagamento real nem acesso a extensões. O acompanhamento usa Socket.IO com reconciliação REST. Consulte ARCHITECTURE.md.

`npm run test:checkout` verifica os contratos HTTP/MSW. `npm run test:e2e` verifica navegação e responsividade em 320, 390, 768 e 1440 pixels, com capturas para inspeção. As capturas ainda não são baselines automáticas de regressão visual. `npm run build` verifica os tipos e gera o build.


