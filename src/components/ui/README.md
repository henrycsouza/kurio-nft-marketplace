# Componentes de interface

Button, Input, DropdownMenu, Sheet, Switch e Skeleton foram obtidos pelo CLI oficial shadcn/ui, estilo base-nova (Base UI). Referência: https://ui.shadcn.com/docs/installation/vite . Código de origem e licença MIT: https://github.com/shadcn-ui/ui .

Adaptações locais:

- Todos reutilizam cn de src/lib/utils.ts e os tokens semânticos de src/index.css, ligados à paleta Kurio.
- Button inclui tamanho plain para conservar as dimensões das classes existentes. Ações primárias usam default; controles auxiliares usam ghost. Botões de envio declaram type=submit explicitamente.
- Inputs mantêm name, ref, autocomplete, constraints e associações de erro dos formulários. O seletor de arquivo de avatar continua nativo.
- Sheet sustenta o menu lateral mobile; Base UI gerencia foco, Escape, clique fora e bloqueio da rolagem. O menu fecha ao navegar ou entrar no desktop.
- DropdownMenu sustenta o menu do perfil e sua operação por teclado. O posicionamento usa portal, sem depender do contêiner do header.
- Switch salva a preferência existente e Skeleton reutiliza o shimmer do projeto.

Uso efetivo: autenticação, perfil, carteiras, botões do pagamento, menu do perfil, menu lateral da conta, configurações e carregamento do catálogo. Os diálogos nativos de autenticação/revisão/recibo continuam com seu comportamento existente; não foi feita uma troca indiscriminada de todos os elementos HTML do projeto.

Os arquivos pertencem ao projeto e podem ser personalizados. components.json configura futuras inclusões pelo CLI. Não sobrescreva os componentes ou o tema sem revisar as adaptações e executar os fluxos Playwright.
