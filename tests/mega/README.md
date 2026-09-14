# Jogador robô do GLYPH

## Executar uma jornada

1. Inicie a versão local (`npm run dev -- --port 4180`).
2. Execute `npm run smoke:journey`.

Para uma rodada de validação sem recarregamentos do servidor de desenvolvimento, use o build (`npm run build`), sirva com `npm run preview -- --port 4182` e defina `$env:SMOKE_URL='http://127.0.0.1:4182/'` no PowerShell antes do comando. O robô desbloqueia a tela de descanso pelo gesto normal; só repete navegação quando essa tela reaparece, nunca repete uma transação automaticamente.

O comando cria **duas contas temporárias reais no Supabase configurado em `.env.local`**. Prepara 600 de ouro e 2.000 fragmentos por conta exclusivamente para QA; isso não é uma compra com dinheiro. Os convites só são enviados entre essas contas. O navegador faz os cliques e as consultas independentes confirmam os resultados no banco.

O roteiro atravessa amizade, parceria, compra e equipamento de item, compra e abertura de baú, compra/instalação de campanha, reentrada, Premium ativo/expirado e missão inicial. Também tenta comprar um baú com duplo clique e comprar um item com as escritas de rede bloqueadas, conferindo saldo e inventário. Estados de assinatura são preparados na conta QA: essa etapa não comprova cobrança, renovação ou entrega pela Play Store.

## Evidência

Cada execução gera uma pasta em `docs/reports/mega-journey/` com:
- `README.md` e `results.json`: resultados e limites de cada etapa;
- PNG e texto da tela por etapa;
- `videos/`: gravação das duas contas;
- `rpc-A.json` / `rpc-B.json`: respostas resumidas, sem tokens ou credenciais.

Não há um PASS geral por simplesmente conseguir clicar. Cada etapa declara a evidência observada. Etapas dependentes ficam BLOCKED quando uma etapa anterior falha; casos ainda não implementados ficam PENDING.

**Achado de proteção de assinatura:** a preparação do Premium com a sessão comum da conta QA foi aceita pelo servidor e reconhecida na interface. O runner registra isso separadamente como `seguranca-premium-escrita-pelo-cliente: FAIL`. O funcionamento visual da assinatura não significa que seus campos estão protegidos. Depois de corrigir essa permissão no backend, a fixture Premium deverá ser preparada por um mecanismo administrativo de teste; uma recusa da escrita não deve ser contornada com credenciais privilegiadas dentro do navegador.

Saída do processo: **0** = todas as etapas aprovadas; **1** = falha; **2** = cobertura incompleta ou execução filtrada. Hoje ainda há pendências: Play Store no Android, missão individual com prazo, concorrência/permissões de vínculos e catálogo inteiro. O caso de rede bloqueia a solicitação antes da escrita; não cobre uma resposta perdida depois de uma compra já processada pelo servidor.

## Ambiente e recuperação

Requer Node 24, dependências do app, Playwright e Chromium. O runner tenta `playwright` instalado e depois o runtime do Codex neste computador. Para outro ambiente, defina `PLAYWRIGHT_MODULE` e `MEGA_BROWSER`. `SMOKE_URL` permite outra porta local.

As contas são excluídas no `finally`, inclusive depois de falhas. Credenciais de recuperação ficam apenas em `temp/mega-journey-accounts.json` (ignorado pelo Git), e o arquivo é removido após confirmar a exclusão das duas contas. Se o processo for interrompido à força, execute `npm run smoke:journey:cleanup`; uma nova rodada recusa sobrescrever contas pendentes.

Para diagnosticar etapas específicas, use `MEGA_ONLY=08,09` no ambiente. Etapas omitidas nunca contam como PASS.

`npm run test:mega:local` é uma bateria separada das regressões locais. Ela não substitui esta jornada e não prova transações remotas.
