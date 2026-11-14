# Conta e carteiras

`/profile` é o único local para editar nome, usuário, e-mail, avatar, ENS e senha.

`/wallets` reúne carteiras e histórico de atividades. O formulário edita somente apelido, endereço, rede, tipo e endereços auxiliares; dados pessoais são obtidos da conta. Carteiras e atividades são persistidas por usuário pelos handlers MSW. O item Atividade leva ao histórico, com busca, filtros e paginação. O total apresentado corresponde a compras confirmadas, não a saldo on-chain.

`/settings` contém a preferência Reduzir animações e informações de leitura da sessão. A preferência usa GET/PATCH `/api/preferences`, persiste por usuário e é aplicada em toda a interface. Não repete formulários do perfil.

No celular, uma seta no centro da borda esquerda abre o menu lateral com as seções da conta e um botão Sair separado no rodapé. No desktop, usa menu lateral.

Carteiras, conexões e transações são simuladas. O histórico administrativo usa polling REST. Pedidos e mudanças no catálogo usam Socket.IO; consulte ARCHITECTURE.md.


