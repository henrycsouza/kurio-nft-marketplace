# Layout mobile e verificação responsiva

A partir de larguras menores que 1024 px, a navegação desktop dá lugar à busca no topo e à barra inferior fixa. Os atalhos são Início, Favoritos, Mercado, Carrinho e Minha conta. A área útil reserva espaço para a barra e para safe areas de dispositivos móveis.

A home usa um banner compacto com três destaques selecionáveis, catálogo em duas colunas com deslocamento visual da coluna direita e cards com ação de favoritar. Busca, filtros e ordenação continuam passando pela URL, TanStack Query e Axios. O botão de filtros abre um dialog lateral com categorias, rede, preço e ordenação; a navegação por teclado, fechamento com Esc e restauração de foco usam o dialog nativo. O painel fecha ao mudar para uma largura desktop.

Entre 600 e 1023 px, o catálogo utiliza três colunas, banner adaptado e navegação compacta. Abaixo de 600 px, utiliza duas colunas. A sidebar e a navegação desktop ficam disponíveis a partir de 1024 px. Carrinho, checkout, detalhes, perfil, carteiras e Settings possuem ajustes para telas menores, sem esconder overflow para mascarar conteúdo cortado.

## Favoritos

O coração dos cards e dos detalhes usa os mesmos favoritos da conta. `GET /api/favorites` lista as obras; `POST/DELETE /api/favorites/:id` inclui/remove. Os handlers MSW exigem sessão e persistem por identidade da conta. A interação possui atualização otimista e rollback em caso de falha, seguida de reconciliação. A página `/favorites` recupera os favoritos após refresh. Os favoritos antigos salvos globalmente no navegador não são atribuídos automaticamente a uma conta.

## Testes

- `npm run test:checkout`: 16 testes de integração HTTP/MSW, incluindo isolamento e persistência de favoritos.
- `npm run test:e2e`: Playwright/Chromium em 320x740, 390x844, 768x1024 e 1440x1000.
- `npx playwright install chromium`: instala o navegador de testes em um ambiente limpo.

Os E2E verificam catálogo lado a lado, ausência de overflow horizontal, filtros e restauração da URL no celular, login em StrictMode, persistência de favorito e adaptação de detalhes/carrinho/checkout/carteiras/Settings. São quatro casos por projeto; o caso de drawer é específico do celular e é ignorado em tablet/desktop.

Capturas são gravadas em `test-results`, relatório HTML em `playwright-report` e traces ficam disponíveis em falhas. Esses diretórios são gerados e ignorados no Git. As capturas permitem inspeção visual, mas ainda não são baselines versionadas de regressão visual. Os testes não representam toda a cobertura E2E do desafio e as auditorias Lighthouse/Socket.IO continuam pendentes.

## Redimensionamento sem recarregar

Um teste adicional redimensiona a mesma sessão por 14 larguras entre 1440 e 320 pixels, verificando troca de navegação, colunas e ausência de overflow. Também abre os filtros no telefone e verifica o fechamento ao voltar ao desktop. A última execução teve 16 testes aprovados e quatro exclusões intencionais por escopo de viewport.


## Telas mobile com contexto próprio

A busca e o botão de filtros são exclusivos da home/catálogo. Configurações, perfil, detalhe, carrinho, pagamento e pedido têm cabeçalho com título contextual e botão de voltar. A barra inferior não é exibida no detalhe, carrinho, pagamento, pedidos e formulários de perfil/configurações. O rodapé institucional é omitido nas telas mobile de conta e compra.

No telefone (até 599 px), o detalhe usa galeria compacta, seleção por pontos/swipe, favorito no cabeçalho e faixa de quantidade/total/compra. O carrinho usa linhas com imagem, edição, total e controles de quantidade. O pagamento apresenta carteiras cadastradas, rede, conexão e total; os dados do colecionador podem ser conferidos em uma seção expansível, preenchida com os dados da conta e ainda submetida à validação. Campos inválidos reabrem a seção antes de focar o campo. A revisão e a confirmação pela API continuam obrigatórias.

O acesso mobile usa diálogo em tela cheia com marca Kurio, login/cadastro, recuperação de senha e acesso social simulado. O desktop mantém os diálogos e composições anteriores. A navegação das telas de conta usa um seletor de páginas identificado como **Navegar na conta**, sem filtros de catálogo.

Os E2E incluem ausência do botão de filtros fora do catálogo, capturas de login/cadastro e Settings após carregar a segurança e uma compra compacta completa até a confirmação real do mock.

## Carrossel do destaque mobile

O destaque desliza o banner completo (texto, imagem e miniatura) a cada dez segundos com deslize horizontal de 750 ms e ciclo contínuo. Há navegação por três barras de progresso, gesto horizontal e troca automática sem botão de reprodução. A reprodução pausa em abas ocultas e fora do layout mobile. Focar, tocar ou passar o mouse no banner não interrompe a troca. Por solicitação de UX, este banner inicia automaticamente inclusive com movimento reduzido; a exceção é restrita ao carrossel, sem exigir uma ativação manual. Os timers e observadores são liberados ao desmontar. Para futuras baselines visuais estáveis, controle o relógio do teste; testes específicos da animação usam relógio controlado em tests/e2e/mobile-hero.spec.ts.

As barras compartilham o mesmo relógio da troca de imagem: a ativa preenche em dez segundos, as anteriores ficam preenchidas e o ciclo recomeça ao chegar ao primeiro destaque. Ao ocultar a aba, o preenchimento e a contagem são preservados.



## Navegação lateral da conta no celular

Perfil, carteiras, favoritos e configurações usam uma seta fixa no centro da borda esquerda. O botão abre um dialog lateral com ícones e seção atual destacada; o logout fica separado no rodapé. Navegar, tocar fora, usar Fechar ou Escape fecha o menu. O dialog contém o foco e bloqueia a rolagem de fundo. Ao voltar ao desktop, fecha automaticamente e a sidebar permanece visível.

O carrossel automático acompanha o layout mobile (até 1023 px); o hero desktop permanece estático. A presença do mouse no emulador e o toque nas barras não interrompem mais a reprodução. A aba oculta continua respeitada; as demais animações do site seguem as preferências de acessibilidade.

A troca após dez segundos usa um temporizador independente dos frames da barrinha. Não há etapa de ativação: o banner começa sozinho; não há botão de play ou pausa. As demais preferências da interface permanecem aplicadas fora do banner. A gravação em artifacts/mobile-banner.webm demonstra a troca com relógio real.



