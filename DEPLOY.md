# Publicação

O projeto contém vercel.json com build Vite, saída dist e fallback SPA para index.html, conforme a [documentação da Vercel para Vite](https://vercel.com/docs/frameworks/frontend/vite). Isso permite que o cliente resolva rotas como /nft/emerald-ape-042 e /checkout após acesso direto/refresh. public/_redirects oferece o fallback equivalente para Netlify.

```sh
npm ci
npm run typecheck
npm run build
vercel login
vercel --prod
```

Mantenha os mocks habilitados (VITE_ENABLE_MOCKS=true ou variável ausente). Não há credenciais de blockchain ou pagamento para configurar. O projeto usa apenas dados fictícios; os estados simulados ficam no navegador de cada visitante.

Depois de publicar, valide na URL pública: abertura direta do detalhe, refresh nas rotas privadas, login de demonstração, carrinho, revisão/compra, confirmação e mudanças por Socket.IO. Confirme também que /mockServiceWorker.js e os arquivos em /assets/ retornam seus arquivos, e não o HTML de fallback. Repita a auditoria no endereço publicado antes de declarar o deploy validado.

## Deploy realizado

Aplicação pública: https://kurio-nft-marketplace-lake.vercel.app

Projeto Vercel: kurio-nft-marketplace. Publicado por CLI após o proprietário concluir o login; o build remoto passou. A pasta agora está vinculada pelo arquivo local .vercel/project.json, ignorado no Git. .vercelignore exclui dependências, relatórios, artefatos locais e arquivos de ambiente privados do envio.

Validação pública em 13/11/2026: seis testes passaram em Chromium (390 e 1440 px), sem autenticação Vercel no navegador. Foram verificados worker/arquivos de imagem com MIME correto, catálogo, acesso direto e refresh do detalhe, proteção do checkout, persistência do carrinho, login, revisão e confirmação de uma única compra simulada, atualização de preço via Socket.IO e persistência após refresh.

```sh
npx playwright test --config=playwright.deployed.config.ts --grep "publicação|compra publicada|Socket.IO atualiza detalhe"
```

A auditoria Lighthouse ainda precisa ser repetida no domínio publicado. Repositório público: https://github.com/henrycsouza/kurio-nft-marketplace. A publicação atual usa Vercel CLI; um push no GitHub executa o CI, mas não configura automaticamente uma integração de deploy com a Vercel. As demais limitações do desafio permanecem em REVIEW.md.
