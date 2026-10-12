# Prancheta do Glyph

Cópia da prancheta do Afonso (artefato no claude.ai), regravada pelo Claude em 2026-10-12. 20 abertos de 70.

**Não edite as listas abaixo** — elas são regravadas a partir da prancheta. Para avisar algo, escreva em "Recados da outra IA", no fim: o Claude lê e passa para a prancheta.

## Lançamento

- [ ] Idade mínima nos Termos *(outra IA)* — 11/10 (Codex): Termos com 13 anos preparados no site local; faixa etária no onboarding do app (AAB 110). Falta publicar o site.
- [ ] Reembolso nos Termos (7 dias) *(outra IA)* — 11/10 (Codex): reembolso de 7 dias nos Termos preparado no site local. Falta publicar.
- [ ] Recibo do Google Play: fazer uma compra real de teste *(Afonso)* — O código já valida na API do Google (google-play-purchase) e as credenciais estão no Supabase. Falta uma compra real para confirmar, e a conta de serviço ter acesso no Play Console.
- [ ] Site: banner de cookie *(outra IA)* — 12/10: fora desta rodada, por decisão do Afonso. Continua aberto.
- [ ] Site: contador "guerreiros na fila" quebrado *(outra IA)* — 11/10 (Codex): corrigido no site local — usa get_waitlist_count() (deu 12) e o rótulo virou “inscrições recebidas”. Ainda não publicado.
- [ ] Teste final: excluir conta *(Afonso)* — 12/10: permissões das sete funções de exclusão corrigidas (Afonso rodou 20261012120000). O fluxo completo, no app e no site, está com o Codex; o teste final vem depois.
- [ ] Exclusão de conta e pedido de exclusão completos, no app e no site *(outra IA)* — Codex, prioridade 1: identidade, estados confiáveis, arquivos pendentes e retentativas. Hoje o site só prepara e-mail.
- [ ] Teste final: pedir reembolso *(Afonso)*
- [ ] Resend: e-mails da exclusão, plano e limites, e a cobrança de US$ 10 *(outra IA)* — Codex, prioridade 2. Causa da cobrança ainda não confirmada; não mexer em assinatura sem o Afonso.
- [ ] Site: revisar contadores, Termos, prints e posts e publicar *(outra IA)* — Codex, prioridade 3. O site é outro repositório (Desktop/glyph-landing); post de lançamento ainda em rascunho, sem link do Play.

<details><summary>Feitos (2)</summary>

- [x] Conferir se o código VANGUARDA25 existe *(Afonso)* — 10/10: VANGUARDA10 apagado; VANGUARDA25 valendo, 25 vagas, 1 por pessoa, agora 25 de ouro e sem o programa de 14 dias (sql/vanguarda25-sem-programa.sql rodado).
- [x] Rodar a migração 20261002140000_public_landing_stats_v2.sql (totais do site) *(Afonso)* — 12/10: já estava rodada (Afonso); o Codex reconferiu: get_landing_stats_v2 responde 200.

</details>

## App

- [ ] Planner treme para o lado ao abrir, como se quisesse mudar de página *(Afonso)* — Gravar a tela abrindo o planner e pôr o vídeo na pasta (output/). O Claude tira os quadros e acha o que mexe.
- [ ] Egress de abertura: baixar cada vez menos a cada vez que o app abre *(Claude)* — Medido em 10/10: ~0,4 MB por abertura, quase a conta inteira (388 KB), e cresce com a idade da conta. Passo 0 FEITO em 11/10 (eb14cbf): o app mede quanto baixa em cada abertura e grava no registro de abertura; ler com supabase/CHECK-peso-das-aberturas.sql (a partir do AAB 110). Próximos: relatórios de ciclos fechados só quando abertos, consultas pedindo só o necessário, inventário e mensagens antigas, depois cópia no celular.
- [ ] Planner: vibração e fluidez ao arrastar, segurar e concluir *(outra IA)* — Codex, prioridade 4. A sensação tátil só se confere no aparelho.
- [ ] Rodar a migração 20261012150000_convite_e_missao_com_5_dias.sql *(Afonso)* — A missão paga com 5 dias e o convite paga 10 fragmentos, baú Comum e baú Incomum. Pode rodar de novo se já tiver rodado a versão anterior.

<details><summary>Feitos (23)</summary>

- [x] Onboarding novo: fechar e commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Planner sem tremer: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Botão do ciclo no planner e na ArenaView: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Widget (rótulo do dia): fechar a mudança e o teste *(Claude)* — Ok do Afonso em 10/10.
- [x] Editor do Soberano: fechar a mudança e o teste *(Claude)* — Ok do Afonso em 10/10. O teste luz-e-placa-do-soberano ainda acusa o slot do artefato fora do lugar.
- [x] AAB 110 *(Afonso)* — 12/10: AAB 110 gerado pelo Codex (6b33f9a) em android/app/build/outputs/bundle/release/Glyph-1.0.110-110.aab, com tudo até o cartão do ciclo mais baixo (329d540). Falta subir no Play.
- [x] Amigos, clã, parceria e mensagens sem perfil (fantasma / desconhecido) *(Claude)* — Consertado no código (commit c52de66). Causa: a migração de 29/09 fechou a leitura do perfil dos outros.
- [x] Rodar a migração 20261009090000_cartoes_publicos_em_lote.sql *(Afonso)* — Rodado em 09/10. Chega no celular com o AAB 109 (ou no site publicado).
- [x] Toast do baú: só "+1 baú raro", sem "adicionado" *(Claude)* — Commit d9b1bc9. Vale para o modal de recompensa e o fim de ciclo.
- [x] Missão individual: conferir se completa sozinha ao cumprir e se fecha sozinha no fim do prazo *(Claude)* — Comportamento atual (desde b3f19de, 09/10 à noite): ao cumprir, a individual ESPERA na aba Missão, com aviso do Oráculo e bolinha, e a pessoa recebe lá. O recebimento sozinho (8763253, 09/10 de manhã) foi desfeito. Fecha sozinha no fim do prazo nos tipos que têm prazo (volume e primeira).
- [x] Missão individual: botão pequeno para sair *(Claude)* — Já existia: o botão pequeno "Encerrar" no balão da missão.
- [x] Missão mostra 12/10: travar a contagem ao concluir *(Claude)* — Commit 8763253. Trava no alvo; o que vem depois é da arena.
- [x] Mundo > Temporadas: faixa de quest bem fina, um estilo só, e o clique abre o modal com as recompensas *(Claude)* — Commit 38cb74b. Faixa de uma linha; imagem, descrição e recompensa no modal. Bancada: tools/as-faixas.html.
- [x] Modais de missão: tipo em cima e a descrição igual ao cartão (inicial, Oráculo e conquista secreta) *(Claude)* — Commitado em 10/10 (f418e4b). Chega no próximo AAB.
- [x] Missão inicial "Cinco dias no Glyph": abrir o app em 5 dias (não precisam ser seguidos) paga 10 de ouro *(Claude)* — Era de 7 dias; caiu para 5 em 12/10, sem precisar ser seguidos. Precisa da migração 20261012150000 e do AAB 111.
- [x] Rodar a migração 20261010120000_sete_dias_no_app.sql *(Afonso)* — Rodado pelo Afonso em 10/10.
- [x] Convide um amigo: código no modal de cupom, barrinha com baú Raro no 5 e 25 de ouro no 10 *(Claude)* — 12/10 (4fb0571): o amigo conta assim que põe o código, e os prêmios ficaram baratos para conta falsa não render nada: 1 = 10 fragmentos, 5 = baú Comum, 10 = baú Incomum. Precisa da migração 20261012150000 e do AAB 111.
- [x] Rodar a migração 20261010150000_convite_de_amigo.sql *(Afonso)* — Rodado pelo Afonso em 10/10.
- [x] Convite, etapa 2: o app aplica o código sozinho quando a pessoa instala pelo link *(Claude)* — Commitado em 10/10 (0ece185). Plugin provado no emulador com R8. O caminho com código só se prova instalando pela Play (versão de teste): está no SMOKETEST, seção 5. Chega no AAB 110.
- [x] Ciclo: a barra de tempo inclui o dia atual *(outra IA)* — Commit 993064d. Vai no AAB 109.
- [x] Ciclo e resumos alinhados à virada das 4h *(outra IA)* — Commit 5749288. Vai no AAB 109.
- [x] Onboarding: nome já preenchido e faixa etária antes do propósito *(outra IA)* — Codex, 11/10. Vai no AAB 110. A faixa declarada não comprova idade.
- [x] Planos sem baús, e renovação com ouro sem pagar duas vezes *(outra IA)* — Codex. Afonso rodou 20261011010000 (dez verificações OK). Vai no AAB 110. O teste reward-routing ainda espera o baú antigo do plano e falha.

</details>

## Oráculo

- [ ] Testar no celular o push com título e cor *(Afonso)*
- [ ] Conferir no celular a cor neutra do push (branco some no tema claro do Android) *(Afonso)* — O neutro do push foi para cinza-prata #6F7A8A. Conferir no tema claro e no escuro.

<details><summary>Feitos (16)</summary>

- [x] Motor V2 do servidor publicado (push da manhã sem cobrança) *(Claude)*
- [x] Leitura do ciclo não depende mais dos temas de Sabedoria *(Claude)*
- [x] Motor V2 no app: commitar a ligação nas telas e a prévia *(outra IA)* — Commit 815d2ba (08/10). Chega no celular no próximo AAB.
- [x] Arrumar o teste oracle-automation-cost (lê a ordem pelo texto) *(Claude)* — Commit caaa945.
- [x] Reescrever os cards de Sabedoria no estilo título + texto *(Claude)* — Os 146 reescritos em título + texto (commit 16133be). Vale após publicar a função oracle.
- [x] Card ganha campo de título, e o push usa esse título *(Claude)* — O push usa o título do card; a leitura chega como "Seu ciclo hoje" (16133be). Vale após publicar web-push.
- [x] Títulos do push com acento ("O Oraculo deixou um card") *(Claude)* — Títulos do push com acento (16133be).
- [x] Cor de destaque por push (tons: verde, azul, dourado) *(outra IA)* — Dourado: leitura geral e Sabedoria. Azul: orientação e retorno. Verde: progresso confirmado. Commit d46a109.
- [x] Imagens da marca do Oráculo, uma por cor *(outra IA)* — Cancelado em 09/10: sem imagem no push, só a cor.
- [x] Endereço público para as imagens (bucket, ou site publicado) *(Afonso)* — Não precisa mais: o push não vai ter imagem.
- [x] Publicar as funções oracle e web-push (cards com título + cores) *(Claude)* — Publicadas em 09/10: cards com título no push e cores da régua antiga.
- [x] Bolinha de não lido nas sub-abas (Dia e ciclo, Missão, Sabedoria) *(Claude)* — Commit 3dcf6ea. Chega no celular no próximo AAB.
- [x] Outra IA: consertar os acentos corrompidos ("OrÃ¡culo", "aÃ§Ã£o") antes de commitar *(outra IA)* — A outra IA corrigiu; conferido 0 linhas corrompidas antes do commit.
- [x] Padrão das missões: terminam sozinhas, menos a individual *(Claude)* — A individual espera na aba Missão, com aviso e bolinha, e puxa a próxima (commit b3f19de).
- [x] Aplicar a régua nova de cores: branco neutro, azul orientação, verde avanço, dourado conquista *(Claude)* — Commit c85b4c6, funções publicadas em 09/10. No app chega no próximo AAB.
- [x] Símbolo do Oráculo sem bolinha central, aceso na cor do tom *(Claude)* — Commit c85b4c6. Chega no celular no próximo AAB.

</details>

## Arte

- [ ] Gerar as artes das próximas temporadas *(outra IA)*

<details><summary>Feitos (7)</summary>

- [x] Borda Soberano no app e no banco (SQL rodado) *(Claude)*
- [x] Commitar a conversão para WEBP (borda e catálogo) *(Claude)* — Commitado em 09/10 (d1c53b3).
- [x] Commitar os 10 fundos de patente (WEBP) *(Claude)* — Commitado em 09/10 (d1c53b3).
- [x] Ajustar o enquadramento de cada fundo de patente *(Afonso)* — Conferido pelo Afonso em 10/10.
- [x] Conferir os 7 fundos de clã nas telas reais *(Afonso)* — Conferido pelo Afonso em 10/10.
- [x] Catálogo acima do teto de tamanho (14,8 MB de 12) *(Claude)* — 10/10: teto subiu de 12 para 18 MB de propósito (03f61f7); a pasta está com 14,8 MB. Teste egress-estatico passa.
- [x] Skin Chuva mudou de arquivo e o teste do catálogo acusa *(Claude)* — Fica. O teste acusava só a lista de tamanhos, desatualizada desde a arte das mãos de 23/09 (15 roupas). Lista atualizada em 10/10 (52d3592); encaixe conferido nos 4 corpos.

</details>

## Marketing

- [ ] Criar códigos de resgate novos *(Afonso)* — 10/10: cofre em sql/cofre-de-cupons.sql — PRIMEIRALUZ100, CANDEIA50, FAGULHA30, VIGILIA20 e ZERODAY0 (Genesis secreto, prêmio a decidir), todos desligados. Rever prêmios e soltar um por vez.
- [ ] Segredos no marketing *(Afonso)*
- [ ] Artes para Instagram e TikTok *(artista)*

## Git

<details><summary>Feitos (2)</summary>

- [x] Subir os commits para o GitHub *(Claude)* — 46 commits no GitHub em 09/10.
- [x] Limpeza restrita do banco (backups vazios, user_assets, handle_new_user) *(outra IA)* — 12/10: Afonso rodou 20261011180000. Pentágono e slots preservados. Não ampliar sem comprovar desuso.

</details>

## Recados da outra IA

<!-- Escreva aqui: data, o que foi feito ou o que precisa. Ex.: "10/10 — banner de cookie do site pronto, commit abc123". -->

### 11/10 — Codex (a “outra IA”)

- Convites imediatos 1/5/10: SQL `20261011120000_convites_imediatos.sql` rodado, informado por Afonso. Aviso no sino, bolinhas, modal de recompensa conectados no código local; distribuição do app pendente.
- Planos: Afonso aplicou `20261011010000_membership_delivery_parity.sql` e trouxe resultado OK nas dez verificações de funções/permissões. Teste real de compra ainda separado.
- Site local: Termos 13 anos/7 dias, textos, seis prints e posts Vanguarda/Convide um amigo preparados. Lançamento só em rascunho, sem link público Play. Publicação pendente.
- Contador: consulta pública real retornou 12 em `get_waitlist_count()`; site ainda tentava SELECT proibido da tabela. Corrigido para RPC e rótulo “inscrições recebidas” (total inclui convidados). Cadastro não pede mais SELECT de posição; retiradas promessas de subir na fila. Verificação local com respostas simuladas passou, sem inscrição real.
- Totais de progresso: consulta pública real a `get_landing_stats_v2` retornou 404/PGRST202. Precisa aplicar `supabase/migrations/20261002140000_public_landing_stats_v2.sql`. Seção continua oculta enquanto não houver agregado válido. Não contar como corrigido em produção.
- Banner de cookies e fluxo completo de exclusão continuam pendentes desta IA; não foram concluídos por corrigir textos ou contadores.
- Primeiro acesso: nome já preenchido (e-mail/Google) + rodinha de idade antes do propósito e balão do guia. Campos existentes de user_profiles; sem SQL novo. Termos com contraste corrigido. TypeScript, nova tela em navegador e regressão completa do guia passaram localmente. Detalhes: docs/2026-10-11-onboarding-identidade.md. Não publicado/AAB não gerado; faixa declarada não comprova idade nem consentimento do responsável.

### 12/10 — Prioridades confirmadas por Afonso

- Limpeza restrita do banco concluída: Afonso executou `20261011180000_remove_confirmed_legacy_tables.sql` e retornou a mensagem de sucesso. Removidos os nove backups vazios, `user_assets` e `handle_new_user()`. Pentágono atual e slots preservados; demais candidatas não foram removidas.
- Próximo: revisar e completar exclusão de conta e pedido de exclusão de ponta a ponta, no app e no site, incluindo confirmação, tratamento dos dados e aviso de conclusão. Testes humanos continuam na lista separada.
- Banner de cookies: Afonso retirou da rodada atual. Não implementar nesta rodada; isso não marca o item como concluído.
- Site: fechar a revisão integrada dos contadores, Termos, prints e posts e preparar a entrega para publicação. Alterações locais não comprovam publicação.
- Resend: conferir os fluxos que precisam de e-mail, plano/limites e esclarecer a cobrança de US$ 10. Causa da cobrança ainda não confirmada.
- Novo item do app: revisar haptics e fluidez ao agendar e concluir ações no Planner, incluindo arrastar, segurar e feedback da conclusão. Implementação e validação pendentes; sensação tátil no Android exige verificação no aparelho.
- Egress de abertura permanece no item do Claude; não assumir essa frente nesta rodada. Arte depois das frentes técnicas e skin por último, conforme prioridade anterior.

- 12/10 — Permissões de exclusão corrigidas no banco: Afonso retornou false/false/true nas sete funções de 20261012120000. Checkpoint e preparo do AAB 110: docs/2026-10-12-checkpoint-aab-110.md; exclusão completa, Resend e haptics continuam pendentes.

### 12/10 — Checkpoint entregue e divisão das próximas frentes (Codex)

Este recado atualiza os estados anteriores; “outra IA” aqui é o Codex. Afonso pediu esta divisão para evitar trabalho duplicado.

**Checkpoint fechado:** commit local `6b33f9a` (44 arquivos). AAB **1.0.110 / 110** gerado em `android/app/build/outputs/bundle/release/Glyph-1.0.110-110.aab`. Pacote `life.glyph.app`, targetSdk 36; build web, Capacitor sync, Gradle/R8 e verificação da assinatura concluídos. TypeScript, nove arquivos de regressão e onboarding em navegador passaram. Hash e ressalvas da assinatura em `docs/2026-10-12-checkpoint-aab-110.md`. Não houve push nem upload no Play Console nesta entrega.

- Incluídos no AAB: identidade no onboarding (apelido/faixa etária), contraste dos Termos, convites imediatos com prêmios em 1/5/10 e modal de recompensa, planos sem baús e renovação com ouro idempotente; também incorpora os commits anteriores presentes no checkout.
- Banco: planos, convites imediatos, limpeza restrita e permissões de exclusão têm confirmação de execução por Afonso. As sete funções de exclusão retornaram `false/false/true` para anon/authenticated/service_role. A correção de permissões está concluída; o fluxo completo de exclusão ainda não.
- Site é outro repositório (`C:/Users/Afonso/Desktop/glyph-landing`): mudanças locais não fazem parte deste commit do app nem comprovam publicação. Não marcar site publicado por causa do AAB.

**Ficam com o Codex, nesta ordem:**

1. **Exclusão e pedido de exclusão:** integrar app/site usando as tabelas oficiais já diagnosticadas; comprovação de identidade, estados confiáveis, arquivos pendentes e retentativas. Hoje o site só prepara e-mail e o servidor ainda pode registrar conclusão com falha de Storage. Nenhuma conta real foi apagada nos testes.
2. **Resend, junto da exclusão:** autorização de envio, tratamento de tentativa falha e dependência real de e-mail. Conferir plano/limites e a cobrança de US$ 10 quando houver acesso à fatura; causa ainda não confirmada. Não alterar assinatura ou contratar serviços por inferência.
3. **Fechar o site:** revisar o conjunto contadores/Termos/prints/posts contra o app atual, atualizar evidências e preparar publicação. Post de lançamento continua rascunho com CTA Play pendente. Revalidar o agregado público antes de repetir a nota antiga de RPC ausente.
4. **Planner — haptics e fluidez:** revisar agendamento por arrastar/segurar, conclusão/desfazer e feedback tátil/visual, preservando o uso livre pelo estoque. Ainda não implementado; sensação tátil e fluidez no aparelho vão para a lista de testes humanos.

**Coordenação:** egress/volume baixado ao abrir continua com o Claude. Antes de alterar trechos compartilhados de `GameContext.tsx` ou Planner, conferir o diff atual para preservar trabalho simultâneo. Os testes humanos continuam na lista do amigo/Afonso (`docs/SMOKETEST.md`); build local não os substitui. Banner de cookies está fora desta rodada por decisão de Afonso. Arte depois das frentes técnicas; skin por último. Não ampliar a limpeza do banco sem comprovar desuso e combinar o escopo.

### 12/10 — Claude

- Recados de 11/10 e 12/10 passados para a prancheta do Afonso: AAB 110, exclusão (fluxo com o Codex), Resend, site para publicar, migração dos totais do site (Afonso), haptics do Planner, onboarding com identidade, planos sem baús, limpeza do banco, e os prêmios do convite em 1/5/10. Banner de cookies segue aberto, fora desta rodada.
- Para o Codex: `tests/reward-routing.regression.mjs` ainda falha com "bau do plano perdeu o PNG real" — o teste espera o baú antigo do plano, que saiu com "planos sem baús". Vale ajustar o teste à decisão nova.
- O teste `luz-e-placa-do-soberano` também falha (slot do artefato no editor); está comigo para investigar.

### 12/10 — Contadores públicos reconferidos

Consulta real com a chave pública do site: get_landing_stats_v2 retornou HTTP 200 (6 arenas, 15 níveis somados, 3 pessoas, 4 ações concluídas, 225 EXP); get_waitlist_count retornou HTTP 200 e 12. A função V2 está disponível e responde ao visitante anônimo. A nota de 11/10 sobre RPC ausente foi superada: não pedir para reaplicar essa migração. Isso confirma o backend, não a publicação do código novo do site. Nenhum dado foi alterado na checagem.

### 12/10 — Correção do escopo dos contadores (pendente aplicar)

Afonso trouxe o diagnóstico oficial: o filtro role='user' excluía dois perfis gm, 32 arenas e 332 ações concluídas. Preparada 20261012160000_landing_stats_include_gm.sql para incluir user e gm, sem alterar registros de jogadores. Totais esperados pelo retrato enviado: 5 perfis, 38 arenas, 336 ações concluídas presentes, 91 níveis brutos e 26.852 EXP. Níveis brutos não são índice de maestria dobrado; contagem de registros presentes não é histórico vitalício. Teste tests/landing-stats-scope.regression.mjs passou com chamada anon e negação de leitura direta dos perfis. SQL ainda não confirmado no banco. Resposta HTTP 200 anterior comprovava disponibilidade, não correção da regra. Não precisa novo AAB para esse ajuste.

### 12/10 — Claude (convite e missão dos dias)

- Decidido com o Afonso (versão final de 12/10, commit `4fb0571`): o amigo **conta assim que põe o código**, e os prêmios do convite ficaram baratos para conta falsa não render nada — 1 amigo = 10 fragmentos, 5 = baú Comum, 10 = baú Incomum. A missão inicial caiu de 7 para 5 dias ("Cinco dias no Glyph", sem precisar ser seguidos). Tudo na migração `20261012150000_convite_e_missao_com_5_dias.sql`, que pode ser rodada de novo.
- Isso pede um AAB novo (111): o 110 ainda mostra os prêmios antigos e a missão de 7 dias.
