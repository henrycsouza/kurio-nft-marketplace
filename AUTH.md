# Autenticação e sessão simuladas

Os endpoints MSW usam credenciais fictícias e persistência local. Contas de demonstração: colecionador@kurio.test e ana@kurio.test, senha Kurio123!. Senhas são persistidas como hashes SHA-256 com salt no cadastro; não há armazenamento em claro. Google/Facebook são simulações com consentimento, sem integração externa.

## Contratos

- POST /api/accounts: cadastro, validação e conflito de e-mail/usuário.
- POST /api/session: login; GET /api/session: sessão atual; DELETE /api/session: logout.
- POST /api/password/forgot e /api/password/reset: recuperação simulada com código temporário.
- POST /api/session/social: provider e consentimento.
- GET/PATCH /api/profile: dados, avatar e alteração de senha.

## Proteção e retomada

O grupo `_authenticated` do TanStack Router verifica a sessão via REST em beforeLoad. Protege /profile, /wallets, /settings, /favorites, /checkout e /orders/:orderId. A autorização dos endpoints continua independente do guard.

Sem sessão, a navegação vai para /login?redirect=DESTINO. O destino preserva query e hash e é validado por uma lista de rotas locais; URLs externas e barras invertidas são rejeitadas. O login/cadastro usa o popup existente e retorna ao destino com replace, evitando uma entrada intermediária de login no histórico.

A sessão dura 30 minutos, sobrevive a refresh e é revalidada periodicamente e no foco. A expiração desconecta Socket.IO, atualiza a sessão e invalida o Router. Respostas 401 dos recursos privados também invalidam a sessão. Falhas de credenciais no próprio login não são tratadas como expiração.

Mudanças de identidade cancelam consultas privadas, removem dados da identidade anterior e renovam carrinho/cotação. A consulta de sessão permanece ativa para comunicar logout aos componentes e ao Router. Listeners Socket.IO são encerrados e recriados por identidade. O carrinho persistido de cada usuário é preservado; itens do visitante são migrados ao autenticar.

A tentativa idempotente de compra usa sessionStorage com guestId e userId. Expiração permite retomar a tentativa apenas na mesma conta; outra conta não recebe seus dados. Logout explícito remove rascunhos/tentativas locais, sem apagar carrinhos ou pedidos persistidos na API simulada.

## Perfil

/profile concentra nome, usuário, e-mail, ENS, apelido, avatar e senha. Avatar PNG/JPG/WebP de até 1 MB é validado e persistido no salvamento. A alteração de senha exige senha atual correta e confirmação; contas sociais não alteram senha local. Validações da API ocorrem antes de persistir campos.

Configurações e Carteiras são telas próprias; não repetem a edição pessoal. Consulte WALLETS_SETTINGS.md.

## Verificação

`tests/e2e/session.spec.ts` cobre acesso direto privado, preservação de query/hash, refresh autenticado, expiração no pagamento, retomada com carrinho, logout, troca de conta, favoritos isolados e rejeição de destino externo em Chromium mobile/desktop. Os testes HTTP/MSW cobrem autenticação, conflitos, recuperação e isolamento. A cobertura completa do desafio ainda está em andamento.
