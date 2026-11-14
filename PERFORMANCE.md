# Auditoria Lighthouse

Auditoria local da página inicial em 13/11/2026, usando o build de produção, Lighthouse 13.6.0 e Chrome headless no Windows. Os presets padrão de celular e desktop usam simulação de rede/CPU; não são medições em aparelhos físicos. O MSW continua habilitado, com seus atrasos e Socket.IO simulados. A interface visível, o carrossel e as categorias da auditoria foram preservados.

## Reproduzir

Atualização da revisão do enunciado: a configuração agora audita início e detalhe por padrão (12 execuções). Para escolher uma página, use `--page=home` ou `--page=detail`. As medianas são separadas por página e perfil. A auditoria do detalhe está em `artifacts/lighthouse/detail-review/`: desempenho 81 mobile / 97 desktop; acessibilidade 95 / 100; boas práticas e SEO 100 / 100. Foram três execuções por perfil. LCP mediano: 4,53 s / 1,05 s; CLS: 0 / 0,069; TBT: 51 ms / 0 ms. O detalhe mobile, assim como o início mobile, não atingiu a meta obrigatória de performance ≥ 90. A revisão completa está em REVIEW.md.

```sh
npm ci
npm run audit:lighthouse -- --label=minha-auditoria --runs=3
```

O comando faz o build, inicia `vite preview` em `127.0.0.1:4173`, executa três navegações de cada formato em perfis novos do Chrome e encerra o servidor. Precisa de Chrome/Chromium instalado; `CHROME_PATH` permite escolher o executável. Não execute os testes de navegador simultaneamente com a auditoria: a disputa por CPU afeta as métricas.

Os relatórios HTML/JSON, as execuções individuais (`summary.json`) e suas medianas (`medians.json`) ficam em `artifacts/lighthouse/<label>/`, ignorados no Git. Para medir apenas um formato, acrescente `--device=mobile` ou `--device=desktop`. Para repetir sem reconstruir, execute `node scripts/lighthouse.mjs --label=outra --runs=3` após o build.

## Inicialização — terceira etapa

Medição final em `artifacts/lighthouse/startup-final/`, com três execuções por formato. O desempenho móvel marcou 78/78/80; o desktop marcou 99 nas três. Acessibilidade, boas práticas e SEO marcaram 100 em todos os casos.

| Mediana | Celular anterior | Celular atual | Desktop anterior | Desktop atual |
| --- | ---: | ---: | ---: | ---: |
| Desempenho | 76 | 78 | 98 | 99 |
| FCP | 2,93 s | 2,16 s | 0,74 s | 0,51 s |
| LCP | 4,34 s | 4,79 s | 1,08 s | 1,02 s |
| TBT | 212 ms | 125 ms | 0 ms | 0 ms |
| CLS | 0 | 0 | 0,026 | 0,026 |

A abertura e o bloqueio de JavaScript melhoraram nessa comparação, mas o LCP móvel não melhorou. Portanto, a otimização de desempenho ainda não está encerrada. O próximo gargalo continua sendo o tempo até os primeiros cards, que dependem do backend simulado e da cadeia de execução no cliente. As notas locais variam e precisam ser conferidas novamente no endereço publicado.

A página pública agora pode renderizar enquanto o MSW inicia. Um interceptor do Axios aguarda a promessa de inicialização antes de enviar qualquer requisição; falhas continuam chegando ao tratamento de erro de cada tela. A proteção de rotas privadas continua aguardando a validação da sessão.

O Socket.IO é carregado separadamente e conecta somente após essa mesma promessa. Os efeitos mantêm cancelamento, reconexão, controle de versões e expiração. A inicialização também trata falhas de conexão sem bloquear a interface inteira. O CSS de layout foi movido para a entrada principal: o HTML agora solicita um único stylesheet, sem esperar pelo download do módulo de rotas para descobrir os estilos da página.

Os oito testes de produção passaram, incluindo um caso que segura o módulo do backend, confirma que o banner está visível e que nenhuma API foi chamada, e depois libera o backend e verifica os nove cards.

Passaram também as 16 comparações visuais, sem atualizar referências nesta etapa, e sete cenários de carrossel, atualização de preço, estoque esgotado, compra, reconexão e expiração da sessão: 31 verificações ao todo. O teste de movimento observa a animação dentro do navegador no evento `transitionrun`, evitando perder a janela de 750 ms em máquinas lentas. Build e lint passaram, com apenas o aviso preexistente no arquivo gerado do MSW.

## Imagens responsivas — segunda etapa

Resultado após a segunda etapa: mediana de três execuções por formato em `artifacts/lighthouse/responsive-final/`. O celular marcou 71/79/76; o desktop marcou 98 nas três execuções. As outras três categorias marcaram 100 em todos os casos.

| Mediana | Celular anterior | Celular atual | Desktop atual |
| --- | ---: | ---: | ---: |
| Desempenho | 70 | 76 | 98 |
| Acessibilidade | 100 | 100 | 100 |
| Boas práticas | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 |
| FCP | 0,83 s | 2,93 s | 0,74 s |
| LCP | 4,86 s | 4,34 s | 1,08 s |
| TBT | 453 ms | 212 ms | 0 ms |
| CLS | 0 | 0 | 0,026 |

O arquivo inicial menor e a ausência de um download duplicado foram confirmados pelos testes em produção. A nota e o LCP melhoraram nesta comparação, mas o FCP não melhorou. Como as notas variaram entre execuções e séries, isso não comprova aceleração geral de todas as etapas do carregamento. O LCP móvel continua elevado; a cadeia de inicialização de JavaScript/MSW e a primeira pintura ainda merecem investigação, seguida de nova medição no site publicado.

O preload e os cards agora compartilham `srcset`/`sizes`, com variantes de 96, 160, 240 e 320 pixels, limitadas à resolução original de cada arquivo. A versão de 320 px do Emerald Ape tem 112.830 bytes, contra 219.442 bytes da versão de 450 px (49% menos). A de 240 px tem 62.878 bytes. Os detalhes e o desktop continuam podendo usar o original.

As imagens das seções inferiores começam a carregar a 300 px da área visível. Essa observação aguarda o catálogo sair do estado inicial de carregamento: a posição temporária dos placeholders não deve provocar downloads de imagens que acabarão várias telas abaixo. As dimensões dos elementos são preservadas.

A consulta do catálogo é antecipada no `beforeLoad` da rota, após o MSW estar pronto, sem bloquear a renderização. `Catalog` e a rota compartilham a mesma configuração e chave do React Query. A seção inferior observa essa consulta sem iniciar outra. O atraso simulado da API foi mantido.

`npm run test:loading` testa o build de produção em quatro larguras, com DPR 1,75. Verifica a seleção de uma variante pequena no celular, a ausência do download original na abertura, a resolução original no desktop e uma única resposta bem-sucedida do catálogo. Os quatro casos passaram. As 16 comparações visuais também passaram após revisar as diferenças de reamostragem nas imagens; a geometria foi preservada. A captura percorre a página para revelar o conteúdo diferido, e a comparação permite até 10 pixels de variação de decodificação.

O código do cabeçalho de desktop agora é carregado apenas nesse formato, com espaço reservado durante o carregamento para manter a geometria. Login e erro de sessão também carregam sob demanda. Os resultados intermediários, antes dessa última separação, estão em `artifacts/lighthouse/responsive-images/`; incluem um aviso do Lighthouse sobre CPU lenta na máquina, mediana móvel 56 e faixa 55–73.

Após essa separação, passaram 24 verificações de login, carregamento e comparação visual, além de duas verificações específicas do carrossel e da expiração da sessão no celular. Build e lint passaram; o lint mantém apenas o aviso preexistente do arquivo gerado pelo MSW.

## Resultados da primeira etapa

A coluna inicial corresponde a uma execução de diagnóstico. A final é a mediana de três execuções por formato antes das imagens responsivas, em Chrome 157. Relatórios: `artifacts/lighthouse/before/` e `artifacts/lighthouse/validated/`.

| Categoria | Celular inicial | Celular final | Desktop inicial | Desktop final |
| --- | ---: | ---: | ---: | ---: |
| Desempenho | 57 | 70 | 98 | 98 |
| Acessibilidade | 98 | 100 | 100 | 100 |
| Boas práticas | 100 | 100 | 96 | 100 |
| SEO | 83 | 100 | 83 | 100 |

| Métrica | Celular inicial | Celular final | Desktop final |
| --- | ---: | ---: | ---: |
| Primeira pintura (FCP) | 0,96 s | 0,83 s | 0,76 s |
| Maior elemento visível (LCP) | 4,02 s | 4,86 s | 1,07 s |
| Bloqueio após a primeira pintura (TBT) | 2.810 ms | 453 ms | 0 ms |
| Instabilidade visual (CLS) | 0,0004 | 0 | 0,026 |

O resultado de desempenho no celular ainda precisa melhorar. A nota composta aumentou e houve menos bloqueio, mas o LCP ficou mais lento nesta comparação; a redução de TBT, medida depois do FCP, não significa que a página inteira passou a carregar mais rapidamente. A imagem principal ainda pesa 219 KB e a abertura depende da inicialização do backend simulado. As próximas prioridades são imagens responsivas menores e reduzir essa cadeia de inicialização, acompanhando as métricas além da nota.

O desempenho móvel variou de 53 a 77 na última série. Uma série intermediária (`final/`) havia dado mediana 78; ela foi mantida para comparação, mas não substitui os resultados do build entregue. Essa variação local impede atribuir com precisão toda a diferença de nota às alterações do código. O desktop marcou 98 nas três execuções finais; as outras categorias marcaram 100 em ambos os formatos.

Uma experiência de antecipar a imagem somente no desktop (`mobile-preload-check` / `mobile-preload-series`) não foi adotada: os resultados variaram e houve aviso de CPU lenta na máquina. Os relatórios experimentais não substituem a série validada acima. Refaça a auditoria no ambiente de publicação.

Validação funcional: 52 cenários E2E passaram (16 combinações não se aplicam ao respectivo dispositivo), incluindo as 16 comparações visuais, e 17 testes de integração passaram. Um teste do switch foi ajustado para aguardar seu estado assíncrono e reexecutado com sucesso.

## Alterações verificadas

- Páginas de detalhes, conta e compra carregam seu código ao navegar. Popups, menu da conta e filtros carregam quando necessários; filtros ocultos no celular não são montados na abertura.
- Router e MSW carregam em paralelo; a interface pública renderiza sem esperar o worker, enquanto HTTP e Socket.IO aguardam sua inicialização.
- Quatro imagens passaram de 687.881 para 432.338 bytes (37% menos), em WebP sem perda. Os PNGs originais foram preservados; `npm run images:optimize` reproduz a conversão.
- As primeiras imagens do catálogo recebem prioridade. Fontes locais são antecipadas.
- Idioma `pt-BR`, título, descrição, `robots.txt` válido e hierarquia dos títulos corrigidos.

As referências visuais foram revisadas na segunda etapa para a reamostragem das imagens responsivas. Alterações no código não atualizam essas referências automaticamente.

## Limites

A auditoria cobre a página inicial pública. As telas privadas são verificadas nos testes E2E; suas notas Lighthouse não foram medidas. As notas locais não substituem uma nova medição no endereço publicado, com HTTPS, compressão, cache e latência do servidor reais. O MSW atende requisições no navegador, o que também limita a interpretação da simulação de rede. Notas 100 em acessibilidade e boas práticas cobrem apenas as verificações automáticas dessas categorias.

Referência de execução: [documentação oficial do Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md).
