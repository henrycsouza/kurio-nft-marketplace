# Revisão do desafio — 13/11/2026

Revisão do enunciado fornecido pelo usuário e do código local. Esta é uma matriz de evidências, não uma declaração de que a entrega já atende 100% dos critérios.

| Requisito | Situação e evidência |
| --- | --- |
| Stack obrigatória | Presente: React/TS, Router/Query, Axios, Tailwind, shadcn, MSW, Socket.IO, Playwright e Lighthouse. Configurações no package.json e components.json. |
| Descoberta e URL | Implementada; busca, vazio, falha HTTP, ordenação, paginação, histórico e refresh têm testes. Expandir os cenários de filtros combinados e respostas fora de ordem. |
| Detalhe | Acesso direto e tratamento de 404 implementados; falta teste E2E específico do NFT inexistente e dos limites de edição/quantidade. |
| Carrinho | Quantidades, remoção, cupom, persistência e migração existem. Parte dos casos está em integração HTTP; completar E2E dedicado de cupons, remoção e quantidades. |
| Compra e recibo | Revisão, revalidação, snapshot, idempotência e recuperação implementados. Há E2E de compra e timeout/reconexão; ampliar cobertura de recusa e clique repetido no navegador. |
| Conta e sessão | Guardas, login, logout, troca de conta e expiração testados. Cadastro/conflito e validações têm integração HTTP; completar equivalentes E2E. |
| Perfil e carteiras | Implementados e persistentes; editar avatar/senha e erros de formulário precisam de E2E completo, além da integração HTTP existente. |
| Favoritos otimistas | Código tem rollback; persistência está testada. Falta cenário MSW configurável de falha da mutation com E2E de rollback/recuperação. |
| REST e isolamento | Tipos, Axios, Query, autorização e chaves por usuário presentes. Contratos e decisões em AUTH.md, CHECKOUT.md, WALLETS_SETTINGS.md e ARCHITECTURE.md. |
| Tempo real | Socket.IO real no cliente e binding MSW; preço/estoque, replay, versões e reconexão cobertos. |
| Cenários de rede/reset | Parcial: há HTTP 503 do catálogo, recusa, timeout e desconexão. Faltam seletor uniforme, latência variável determinística, respostas fora de ordem e reset integral automatizado. O reset manual está documentado. |
| Skeletons | Catálogo já tinha shimmer. Nesta revisão foram adicionados Skeleton ao detalhe e ao resumo do carrinho, usando a mesma regra de movimento reduzido. Build verificado; não foi feita nova bateria visual completa nesta janela de cinco minutos. |
| Responsividade e acessibilidade | Viewports 320/390/768/1440 e 16 baselines existentes. Auditoria automática não substitui revisão manual de teclado, zoom e todos os formulários. |
| Fidelidade Figma | Revisão final pendente. Há decisões de UX autorizadas e documentadas, especialmente dados pessoais editados no Perfil, pagamento simplificado e navegação mobile. Não declarar equivalência pixel a pixel. |
| Lighthouse | Início auditado três vezes por perfil. Configuração ampliada para início e detalhe; detalhe auditado nesta revisão. Performance mobile permanece abaixo da meta obrigatória de 90; demais metas devem ser lidas nos relatórios. |
| Publicação e repositório | Aplicação publicada em https://kurio-nft-marketplace-lake.vercel.app e validada por seis testes públicos em mobile/desktop. Repositório público: https://github.com/henrycsouza/kurio-nft-marketplace. A auditoria Lighthouse pública segue pendente. |

## O que foi corrigido nesta janela

- Skeletons faltantes no detalhe e carrinho.
- Auditoria configurável de início/detalhe em mobile/desktop, com três medições e medianas separadas por página.
- vercel.json para deep links/refresh, alternativa de fallback Netlify, .env.example e comando typecheck.
- Esta matriz deixa explícitas as pendências que impedem afirmar conclusão do desafio.

## Ordem para encerrar a entrega

1. Deploy concluído e rotas diretas, login, compra e Socket.IO validados publicamente; repetir o Lighthouse nesse domínio.
2. Repositório disponibilizado em https://github.com/henrycsouza/kurio-nft-marketplace; entregar essa URL junto da aplicação.
3. Completar cenários MSW/reset e os E2E destacados na tabela.
4. Atingir performance mobile ≥ 90 ou justificar tecnicamente a meta não atingida com os relatórios reais, conforme o enunciado.
5. Homologar visual e acessibilidade manualmente e repetir a suíte completa no código final.

Blockchain, extensões de carteira, pagamentos reais e páginas editoriais/suporte estão explicitamente fora do escopo. As simulações não são uma pendência de backend real.
