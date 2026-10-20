# Prancheta do Glyph

Cópia da prancheta do Afonso (artefato no claude.ai: https://claude.ai/artifact/99dQUHcbX6dy4dcAuu2Dx6), regravada pelo Claude em **20/10/2026**, já com a consolidação do Codex de 13 e 14/10. **13 abertos de 102** (89 feitos).

**Uma lista só:** a fonte é a prancheta online, e este arquivo é regravado a partir dela. Não edite as listas abaixo; para avisar algo, escreva em "Recados da outra IA", no fim: o Claude lê e passa para a prancheta.

**Pronto no código não é distribuído:** o AAB 111 tem o checkpoint ce54428 (12/10). Tudo de 13/10 em diante, do Claude e do Codex, vai no 112.

Auditoria do Codex: [conciliação de 13/10](2026-10-13-auditoria-prancheta.md).

## Lançamento

- [ ] AAB 115: gerar e subir na Play *(Afonso)* — 20/10 (Codex): o 114 não tem as skins aprovadas, a campanha por mentoria, as vagas de vínculos nem os últimos ajustes de campanhas. O 115 sai depois do checkpoint (commit) desses trabalhos. A função oracle também precisa ser republicada (ver o item dos tokens).

<details><summary>Feitos (15)</summary>

- [x] Conta nova travava no cadastro (idade não salvava) e o Sair da conta não saía — achado do Luigi *(Afonso)* — 18/10: causa achada e corrigida pelo Claude (a5da99e). O upsert do perfil mandava ouro, fragmentos, carteira, baús e premium, que desde 23/09 não aceitam escrita do app; o banco recusava a linha inteira e a conta nova ficava sem perfil. O Sair da conta do primeiro acesso usava o logout cru, que o celular desfaz. SQL 20261018100000 no banco (o Codex conferiu em 18/10): o 112 já cadastra; o Luigi só precisa fechar e abrir o app. O app corrigido e o Sair da conta estão no 113.
- [x] Idade mínima nos Termos *(outra IA (Codex))* — Publicado (Codex). Reconferido em 13/10 no HTML público: 13 anos, com autorização do responsável para menores de 18.
- [x] AAB 113: subir na Play e passar o Luigi para ele *(Afonso)* — 18/10: o Afonso subiu na Play. Superado pelo 114.
- [x] AAB 114: subir na Play *(Afonso)* — 19/10: gerado e assinado (a1e17b3), sem skins, mentoria e vagas de vínculos. 20/10 (Codex): o próximo a subir é o 115, que junta tudo depois do checkpoint.
- [x] Reembolso nos Termos (7 dias) *(outra IA (Codex))* — Publicado (Codex). Texto de 7 dias e encaminhamento ao Google Play no HTML público em 13/10.
- [x] Teste do Glyph com um amigo (planilha no claude.ai) *(Afonso)* — Feito pelo Luigi no 112 (achados passados de boca, não pela planilha). Tudo corrigido e no 114: idade não salvava no cadastro (perfil da conta nova) e Sair da conta (a5da99e + SQL 20261018100000), diário sem internet apagando texto + fila (ae96664, 5d1ff65), vibração no arraste com a vibração desligada (1152cae). Opcional: uma passada rápida no 114 nos modais novos, no jardim (saquinho, guia, tamanhos) e no widget, que ele não viu.
- [x] Resend: resolver o 401 do teste e comprovar que o e-mail chega (recuperação de acesso) *(outra IA (Codex))* — 16/10: resolvido pelo Codex; o Afonso confirmou que o e-mail chegou. O Luigi confere de novo no D9 (recuperação e "Conta excluída").
- [x] Subir o AAB 111 na Play (ou pular direto para o 112) *(Afonso)* — Pulado: o Afonso subiu o 113 (18/10) e o 114 já está gerado.
- [x] Conferir se o código VANGUARDA25 existe *(Afonso)* — 10/10: VANGUARDA10 apagado; VANGUARDA25 valendo, 25 vagas, 1 por pessoa, agora 25 de ouro e sem o programa de 14 dias (sql/vanguarda25-sem-programa.sql rodado).
- [x] Site: contador "guerreiros na fila" quebrado *(outra IA (Codex))* — Corrigido e publicado (Codex): chama get_waitlist_count(), rótulo “inscrições recebidas”. Reconferido em 13/10.
- [x] Exclusão: finalizar o pedido pelo site e a retomada da limpeza parcial *(outra IA (Codex))* — 16/10 (Codex): exclusão pelo site e retomada automática implementadas e publicadas. Teste real com conta descartável concluiu o protocolo 102 e confirmou a remoção do login, do perfil, dos dados e do arquivo. O e-mail de confirmação depende do item do Resend. Detalhes em docs/2026-10-16-fechamento-exclusao-widget-push.md.
- [x] Resend: e-mails da exclusão, plano e limites, e a cobrança de US$ 10 *(outra IA (Codex))* — Painel e SMTP conferidos em 12/10 (Codex); o adicional antigo o Afonso já removeu; resend v18 e account-delete v29 publicados.
- [x] Site: revisar contadores, Termos, prints e posts e publicar *(outra IA (Codex))* — Landing a294b4b publicada (Codex). Reconferido em 13/10: Home, Termos, script.js, Novidades e exclusao.html no ar. O pedido de exclusão pelo site segue à parte.
- [x] Rodar a migração 20261002140000_public_landing_stats_v2.sql (totais do site) *(Afonso)* — 12/10: já estava rodada (Afonso); o Codex reconferiu: get_landing_stats_v2 responde 200.
- [x] Rodar a migração 20261012160000_landing_stats_include_gm.sql (contadores do site contam os perfis gm) *(Afonso)* — 12/10 (Codex): o filtro role='user' deixava de fora 2 perfis gm, 32 arenas e 332 ações concluídas. Esperado depois: 5 perfis, 38 arenas, 336 ações. Não precisa de AAB.

</details>

## App

- [ ] Campanha por mentoria e vagas de vínculos (Codex) *(outra IA (Codex))* — 20/10 (Codex), local e sem commit: mentor e orientado aceitam o vínculo; o mentor forja uma campanha em sandbox para a pessoa aceitar ou recusar, e a cópia recebida continua editável; lista de mentorados, status e visibilidade do planner. Vagas unificadas: grátis 0, Premium 2, Platinum 5, vaga extra 50 de ouro; quem oferece a mentoria usa a vaga; encerrado ou vencido libera. SQL 20261020140000 confirmado pelo Afonso. Falta commit, AAB 115 e conferir no aparelho.
- [ ] Refinar o widget do planner *(Afonso)* — 20/10: pedido do Afonso. É o widget do dia (GLYPH Hoje), com as abas Resumo e Planner (GlyphDayWidgetProvider e GlyphDayPaint). Definir com ele o que refinar.

<details><summary>Feitos (45)</summary>

- [x] AAB 112 (só quando o Afonso pedir) *(Afonso)* — Superado pelo 113 e pelo 114 (20/10).
- [x] Diário sem internet: texto sumia quando a rede voltava — achado do Luigi *(Claude)* — 18/10 (ae96664 + 5d1ff65, vão no 113): falha de leitura era tratada como página vazia, e com a rede oscilando a entrada nova era gravada sozinha por cima da página (o texto antigo sumia); o editor abria a página em branco sem rede e o Voltar saía sem esperar gravar; a bolinha do humor mudava antes de gravar e voltava. Agora: sem ler não grava; o editor avisa "Sem internet" e mantém o texto; e o Registrar sem internet manda a entrada para uma FILA no aparelho, que sai sozinha quando a rede volta (ao abrir o app, ao voltar do fundo, a cada minuto), na ordem e uma vez. Planilha do Luigi (M6) e SMOKETEST atualizados.
- [x] Onboarding novo: fechar e commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Campanhas: biblioteca, progresso entre ciclos e correções (Codex) *(outra IA (Codex))* — 16/10: o Codex terminou. O Claude conferiu: o build compila e 131 de 134 testes passam (falham a-mao-ganha-do-oraculo e luz-e-placa, que são antigos, e apagar-conta, que ainda lê o arquivo antigo depois que a exclusão foi para _shared/accountDeletion.ts; é com o Codex). Os textos da planilha e do SMOKETEST foram ajustados ao app: card "30 dias · 5 ações · 2 arenas" e "Arena liberada — Abrir". O trabalho ainda não foi commitado; precisa estar antes do AAB 112.
- [x] Planner sem tremer: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Campanhas no banco real: percorrer tudo com uma conta de teste *(outra IA (Codex))* — 16/10 (Codex): migração 20261016120000_campaign_run_task_id_compatibility aplicada; corrigidas comparações em finish_campaign_run. Teste com conta descartável passou: recusa conclusão incompleta, conclui entre ciclos, arquiva, guarda histórico e biblioteca, tira as pendências futuras e reinstala do zero. Conta removida. Evidência: output/campaign-library/live-report.json. Falta só compra real e instalar pela tela no Android: fica com o Luigi (M11, M12, D10–D12).
- [x] Botão do ciclo no planner e na ArenaView: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Missão de temporada, de clã e campanha contam só para o bem no ciclo *(Claude)* — 19/10 (1a5b3a8): entram como prometido = feito, só com o que caiu dentro do ciclo. O que faltou não pesa; o feito vale como ação, dia ativo e horas na nota. Não viram meta a selar. Quem faz só campanha deixa de ficar com 0%. Ciclos fechados não mudam. Antes, nem as missões ajudavam na nota de verdade (o bônus delas só alimentava a nota antiga). Vai no próximo AAB. A leitura do ciclo do Oráculo também foi ajustada: só vale depois de republicar a função oracle.
- [x] Modal de arena e de ação: conferir no aparelho (Codex integrou) *(outra IA (Codex))* — 16/10 (Codex): integrados no código ActionModal, ArenaDetailModal, ArenaCard e NewArenaModal, com quatro abas (Geral, Contexto, Checklist, Mídia), slider de duração por etapas com campo numérico, rolagem interna no texto e no checklist e botões dourados. A agenda nova respeita as repetições e o fim do ciclo. Falta conferir na tela: tamanhos, teclado e cortes (o navegador dele não abriu o arquivo). Está na planilha do Luigi como M13. 16/10 (Claude): botões − e + nas Repetições (prop comBotoes no StyledRangeInput, estilo .action-step em components/action-layout.css, teste acao-repeticoes-mais-menos). Ficou sem commit porque se apoia no ActionModal novo do Codex, que ainda não foi commitado: entra junto no commit dele.
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
- [x] Planner treme para o lado ao abrir, como se quisesse mudar de página *(Claude)* — 15/10: achado pelos prints do Afonso (cortado na esquerda num, na direita no outro). A grade inteira andava ~17 px de lado porque a área de rolagem ficava rolada na horizontal: o conteúdo passava da largura e o navegador rola ‘overflow-x: hidden’ por código. Correção: conteúdo cortado na largura (overflow-x-clip) e, se algo rolar de lado, volta a zero. Vai no AAB 112; conferir no celular (abrir o planner e arrastar do estoque).
- [x] Modais de missão: tipo em cima e a descrição igual ao cartão (inicial, Oráculo e conquista secreta) *(Claude)* — Commitado em 10/10 (f418e4b). Chega no próximo AAB.
- [x] Missão inicial "Cinco dias no Glyph": abrir o app em 5 dias (não precisam ser seguidos) paga 10 de ouro *(Claude)* — Era de 7 dias; caiu para 5 em 12/10, sem precisar ser seguidos. Precisa da migração 20261012150000 e do AAB 111.
- [x] Rodar a migração 20261010120000_sete_dias_no_app.sql *(Afonso)* — Rodado pelo Afonso em 10/10.
- [x] Convide um amigo: código no modal de cupom, barrinha com baú Raro no 5 e 25 de ouro no 10 *(Claude)* — 12/10 (4fb0571): o amigo conta assim que põe o código, e os prêmios ficaram baratos para conta falsa não render nada: 1 = 10 fragmentos, 5 = baú Comum, 10 = baú Incomum. Precisa da migração 20261012150000 e do AAB 111.
- [x] Rodar a migração 20261010150000_convite_de_amigo.sql *(Afonso)* — Rodado pelo Afonso em 10/10.
- [x] Convite, etapa 2: o app aplica o código sozinho quando a pessoa instala pelo link *(Claude)* — Commitado em 10/10 (0ece185). Plugin provado no emulador com R8. 12/10 (Codex): enquanto ANDROID_PUBLICO_DISPONIVEL = false, o Enviar compartilha só o código e a instrução, sem o link da Play; o link com o código volta quando a página pública na Play estiver confirmada. Muda no próximo AAB. O SMOKETEST (seção 5, Enviar e convite pelo link) precisa acompanhar.
- [x] Vibração nativa ao arrastar no planner *(Claude)* — 15/10 (Claude, 06a24f7): @capacitor/haptics 8.0.2; o motor de feedback usa toque nativo (leve, médio, sucesso, aviso, erro). No arraste: leve ao pegar (onArm do Codex), tique a cada horário novo (mínimo 55 ms entre tiques), médio ao soltar, leve ao cancelar. Respeita a vibração ligada/desligada em Config. Conferir no aparelho com o AAB 112.
- [x] Ciclo: a barra de tempo inclui o dia atual *(outra IA (Codex))* — Commit 993064d. Vai no AAB 109.
- [x] Ciclo e resumos alinhados à virada das 4h *(outra IA (Codex))* — Commit 5749288. Vai no AAB 109.
- [x] Egress de abertura: baixar cada vez menos a cada vez que o app abre *(Claude)* — Passo 0 FEITO em 11/10 (eb14cbf): o app mede quanto baixa em cada abertura (ler com supabase/CHECK-peso-das-aberturas.sql). Medido em 12/10 (CHECK-o-que-a-abertura-baixa.sql): 325 KB por abertura — relatórios fechados 131 (atlas semanal 111), tarefas 99, inventário 43, perfil 25 (garden_state 19). Passo 1 FEITO (35da095): relatórios fechados guardados no celular, só desce o novo ou mudado (−130 KB). Passo 2 FEITO (bb107b6): tarefas e inventário sem user_id, perfil sem garden_state (−46 KB). Os dois SQLs rodados pelo Afonso em 12/10, CHECK-egress-de-abertura.sql deu tudo true. O ganho chega no celular com o AAB 111. Próximo: janela de 3 meses de tarefas (99 KB) e cópia no celular com delta.
- [x] Planner: vibração e fluidez ao arrastar, segurar e concluir *(outra IA (Codex))* — 13/10 (Codex), local e sem commit: rolar antes de pegar, limiar menor depois de pegar, cancelamentos limpos, borda gradual; Oráculo espera 650 ms de pausa. A sensação tátil só se confere no aparelho (AAB 112).
- [x] Onboarding: nome já preenchido e faixa etária antes do propósito *(outra IA (Codex))* — Codex, 11/10. Vai no AAB 110. A faixa declarada não comprova idade.
- [x] Planos sem baús, e renovação com ouro sem pagar duas vezes *(outra IA (Codex))* — Codex. Afonso rodou 20261011010000 (dez verificações OK). Vai no AAB 110. O teste reward-routing ainda espera o baú antigo do plano e falha.
- [x] Rodar a migração 20261012150000_convite_e_missao_com_5_dias.sql *(Afonso)* — 12/10: rodada a versão final pelo Afonso (antes tinha rodado a anterior, de 5 dias no convite).
- [x] AAB 111 (só quando o Afonso pedir) *(Afonso)* — Gerado em 12/10 às 23:33 (ce54428): convites, Cinco dias, widget do ciclo, egress passos 1 e 2, missão de clã, cards dos Feitos, nickname, feed em duas abas e o Diário novo. O que foi feito em 13/10 vai no 112.
- [x] Clã: mexer antes do lançamento *(Afonso)* — 12/10: FEITO no código (af67b81..92c9f9d, com a revisão final aplicada): missão de clã da temporada com Entrar (na tela do clã e na Temporada), arena por participante com tag de clã, total do grupo contado no servidor (desmarcar baixa), baú Raro só para quem entrou, sair do clã ou abandonar = o que depositou fica no grupo, não leva nada para o clã novo e não recebe o baú (d16e5f3); humor de quem nunca registrou aparece vazio; meta vem do servidor; Aurora II ficou sem missão de clã, vencida sem meta some (arquiva). Teste: Socializar ×20 na Genesis. Na Sede: cartão da missão + barrinha de humor embaixo do nome de cada soberano (só o próprio clã vê). SQL rodado e conferido pelo Afonso em 12/10 (CHECK-missao-de-cla.sql tudo true). Chega no celular com o AAB 111. Próximo: aviso do Oráculo quando o grupo bate a meta. Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md.
- [x] Rankings e interatividade: mexer antes do lançamento *(Afonso)* — 13/10: a parte de ranking virou as tags Top 1/5/10% (Codex, com o Afonso). Ver ap-media-exp-diaria e docs/2026-10-13-ranking-e-media-exp.md.
- [x] Rodar o SQL do nickname único *(Afonso)* — 12/10: rodado pelo Afonso (check vazio + migração 20261012210000). Nome único sem diferenciar maiúsculas, até 20 caracteres; primeiro acesso com o primeiro nome e aviso vermelho; Configurações pergunta antes. Tela chega no próximo AAB. Commit 6db20b8.
- [x] Média de EXP diária da conta no relatório do ciclo e no Painel Diário (depois) *(Afonso)* — 13/10: feito pelo Codex com o Afonso, junto com as tags Top 1/5/10% (ciclo, maestria e clã). SQL 20261013200000_progress_recognition rodado. Código local, ainda sem commit; vai no AAB 112. Regras: docs/2026-10-13-ranking-e-media-exp.md. Tags só aparecem com 100+ jogadores elegíveis.
- [x] Quiz de campanha: saiu da loja, virou Buscar campanha no Oráculo *(Afonso)* — 13/10: decidido. Quiz fora da loja (lá ficam busca e filtros), botão Buscar campanha na aba Missão do Oráculo, só catálogo pago, nada de campanha grátis nem para iniciante (0e6049e). Fichas antigas ainda valem.
- [x] Perfil: compartilhar e copiar nickname *(outra IA (Codex))* — 13/10 (Codex), local e sem commit: cartão compartilhado com “Me adicione no Glyph!” e o nickname; botão Copiar nickname embaixo do nome. Vai no AAB 112.
- [x] Conquistas secretas na hora do evento *(outra IA (Codex))* — 13/10 (Codex), local e sem commit: Imperável e os outros grupos reagem ao evento confirmado, com fila e isolamento de conta. docs/2026-10-13-segredos-por-evento.md. Vai no AAB 112.
- [x] Itens repetidos: posse e conversão em fragmentos *(outra IA (Codex))* — 13/10 (Codex), local e sem commit: baú, missão e segredo mostram “Você já possui”, bônus separado da conversão, tier 6 com 3.000 fragmentos. Vai no AAB 112.
- [x] Zoom do dia inteiro e widget Resumo/Planner *(Claude)* — 13/10 (Claude, 185428e/0c157c0). O widget abre o planner e não conclui ações. Depois do AAB 111: vai no 112.
- [x] Sem pay-to-win, coroa, mentoria e Buscar campanha *(Claude)* — 13/10 (Claude, 19e714e..4e26d07): planos e loja sem EXP extra, Premium com 20 arenas, coroa no mini card e no perfil dos outros, mentoria sem trava, Platinum sem ficha, Buscar campanha no Oráculo levando à loja. SQLs rodados. Vai no 112.

</details>

## Oráculo

<details><summary>Feitos (18)</summary>

- [x] Motor V2 do servidor publicado (push da manhã sem cobrança) *(Claude)*
- [x] Leitura do ciclo não depende mais dos temas de Sabedoria *(Claude)*
- [x] Motor V2 no app: commitar a ligação nas telas e a prévia *(outra IA (Codex))* — Commit 815d2ba (08/10). Chega no celular no próximo AAB.
- [x] Arrumar o teste oracle-automation-cost (lê a ordem pelo texto) *(Claude)* — Commit caaa945.
- [x] Reescrever os cards de Sabedoria no estilo título + texto *(Claude)* — Os 146 reescritos em título + texto (commit 16133be). Vale após publicar a função oracle.
- [x] Card ganha campo de título, e o push usa esse título *(Claude)* — O push usa o título do card; a leitura chega como "Seu ciclo hoje" (16133be). Vale após publicar web-push.
- [x] Títulos do push com acento ("O Oraculo deixou um card") *(Claude)* — Títulos do push com acento (16133be).
- [x] Cor de destaque por push (tons: verde, azul, dourado) *(outra IA (Codex))* — Dourado: leitura geral e Sabedoria. Azul: orientação e retorno. Verde: progresso confirmado. Commit d46a109.
- [x] Imagens da marca do Oráculo, uma por cor *(outra IA (Codex))* — Cancelado em 09/10: sem imagem no push, só a cor.
- [x] Endereço público para as imagens (bucket, ou site publicado) *(Afonso)* — Não precisa mais: o push não vai ter imagem.
- [x] Publicar as funções oracle e web-push (cards com título + cores) *(Claude)* — Publicadas em 09/10: cards com título no push e cores da régua antiga.
- [x] Bolinha de não lido nas sub-abas (Dia e ciclo, Missão, Sabedoria) *(Claude)* — Commit 3dcf6ea. Chega no celular no próximo AAB.
- [x] Outra IA: consertar os acentos corrompidos ("OrÃ¡culo", "aÃ§Ã£o") antes de commitar *(outra IA (Codex))* — A outra IA corrigiu; conferido 0 linhas corrompidas antes do commit.
- [x] Padrão das missões: terminam sozinhas, menos a individual *(Claude)* — A individual espera na aba Missão, com aviso e bolinha, e puxa a próxima (commit b3f19de).
- [x] Aplicar a régua nova de cores: branco neutro, azul orientação, verde avanço, dourado conquista *(Claude)* — Commit c85b4c6, funções publicadas em 09/10. No app chega no próximo AAB.
- [x] Símbolo do Oráculo sem bolinha central, aceso na cor do tom *(Claude)* — Commit c85b4c6. Chega no celular no próximo AAB.
- [x] Aviso do Oráculo quando o clã bate a meta *(Claude)* — Retirado por decisão do Afonso (13/10): o modal de recompensa já cobre esse momento. Fica o aviso da missão individual, que é resgatada à mão.
- [x] Dicas do Oráculo (o “garoto-propaganda” dos recursos) *(outra IA (Codex))* — 14/10 (Codex), local e sem commit: Maestria, Diário, Vínculos, Campanhas, Arsenal/Soberano, Jardim e Sabedoria, no balão de abertura com botão; ritmo por conta e aparelho; sem push, sem clã. Sem SQL novo. docs/2026-10-13-handoff-dicas-do-oraculo.md. Vai no 112.

</details>

## Arte

- [ ] Skins das temporadas: checkpoint e AAB 115 *(outra IA (Codex))* — 20/10 (Codex): as 5 revisões aprovadas e integradas localmente (PNGs no catálogo, itens, cobre, ajuste feminino e mãos na frente; Aurora II no slot da coleção, preservando o Guardião Aurora original). SQL sql/2026-10-18-skins-temporadas-aprovadas.sql rodado pelo Afonso em 20/10. Falta o commit e entrar no 115.
- [ ] Completar o conteúdo das temporadas futuras antes de ativá-las *(Afonso)* — 13/10 (Codex): Zênite I, Eclipse I e Égide I ainda precisam de skin, tema e jornadas; Zênite II segue em proposta.

<details><summary>Feitos (8)</summary>

- [x] Borda Soberano no app e no banco (SQL rodado) *(Claude)*
- [x] Commitar a conversão para WEBP (borda e catálogo) *(Claude)* — Commitado em 09/10 (d1c53b3).
- [x] Commitar os 10 fundos de patente (WEBP) *(Claude)* — Commitado em 09/10 (d1c53b3).
- [x] Ajustar o enquadramento de cada fundo de patente *(Afonso)* — Conferido pelo Afonso em 10/10.
- [x] Conferir os 7 fundos de clã nas telas reais *(Afonso)* — Conferido pelo Afonso em 10/10.
- [x] Catálogo acima do teto de tamanho (14,8 MB de 12) *(Claude)* — 10/10: teto subiu de 12 para 18 MB de propósito (03f61f7); a pasta está com 14,8 MB. Teste egress-estatico passa.
- [x] Skin Chuva mudou de arquivo e o teste do catálogo acusa *(Claude)* — Fica. O teste acusava só a lista de tamanhos, desatualizada desde a arte das mãos de 23/09 (15 roupas). Lista atualizada em 10/10 (52d3592); encaixe conferido nos 4 corpos.
- [x] Gerar as artes das próximas temporadas *(outra IA (Codex))* — 12 peças de Zênite I, Eclipse I, Égide I e Aurora II integradas (Codex), no AAB 111. Falta o conteúdo das temporadas (skin, tema e jornadas) antes de ativá-las.

</details>

## Marketing

- [ ] Criar códigos de resgate novos *(Afonso)* — 10/10: cofre em sql/cofre-de-cupons.sql — PRIMEIRALUZ100, CANDEIA50, FAGULHA30, VIGILIA20 e ZERODAY0 (Genesis secreto, prêmio a decidir), todos desligados. Rever prêmios e soltar um por vez.
- [ ] Segredos no marketing *(Afonso)*
- [ ] Artes para Instagram e TikTok *(artista)*

## Git

- [ ] Republicar a função oracle (limpar os tokens do Supabase antes) *(Afonso)* — 19/10: o login do CLI falhou porque a conta chegou a 20 tokens pessoais (cada login das IAs cria um). Apagar os velhos em supabase.com/dashboard/account/tokens, depois npx supabase login e npx supabase functions deploy oracle --project-ref klmsdcncmhtgnlcejzdi. Serve para a leitura do ciclo do Oráculo seguir a regra nova de missão e campanha (1a5b3a8); o app já está certo no 114.

<details><summary>Feitos (2)</summary>

- [x] Subir os commits para o GitHub *(Claude)* — 46 commits no GitHub em 09/10.
- [x] Limpeza restrita do banco (backups vazios, user_assets, handle_new_user) *(outra IA (Codex))* — 12/10: Afonso rodou 20261011180000. Pentágono e slots preservados. Não ampliar sem comprovar desuso.

</details>

## Opcionais e expansão

- [ ] Site: banner de cookie (opcional) *(outra IA (Codex))* — 13/10: o site não tem rastreador (nem Analytics, nem pixel); só guarda o que é do funcionamento. Pela LGPD isso não pede banner, só menção na Política de Privacidade. Volta se entrar analytics no site.
- [ ] Criar campanha para outra pessoa (como era o Codex) *(Afonso)* — 15/10: ideia do Afonso. Alguém monta uma campanha (arenas, ações, plano de dias) e manda para outro jogador, como os manuscritos do Codex por @nickname. O código do Codex está guardado (migração 20260313_add_codex_forge_library.sql); dá para reaproveitar.
- [ ] Tag ou link de perfil para adicionar amigo (depois) *(Afonso)* — 12/10: código/link do perfil para adicionar sem buscar o nome. 13/10: o Codex já fez Copiar nickname e o cartão compartilhado com “Me adicione no Glyph!”; o link direto segue como expansão.
- [ ] Feed: ordem do Reino (depois) *(Afonso)* — 12/10: o feed tem duas abas sem repetição (Aliados = você e amigos; Reino = o resto), commit 8ce20b6. Depois: quem é do seu clã e não é amigo ganha preferência no Reino, e um filtro para não floodar quando houver gente. Atenção: o app baixa só os 80 posts mais novos de todos; com muita gente pública, posts de amigos podem sumir do Aliados.

<details><summary>Feitos (1)</summary>

- [x] Jardim: cesta, tamanhos, guia — e fragmentos no Painel Diário (Codex, numa rodada só) *(outra IA (Codex))* — 18/10: no AAB 113 (228ba7f, Codex): saquinho do jardim, 7 expansões por fragmento, guia ilustrado, fragmentos do Painel Diário (1 por 50 EXP crua, até 15), busca de emojis e tons por arena. Os SQLs estão no banco (o Claude conferiu as tabelas em 18/10). Falta só ver no aparelho.

</details>

## Recados da outra IA

### 19/10/2026 — Miniaturas compactas e campanha como pasta aprovadas (Codex)

Afonso aprovou a faixa horizontal de arenas dentro da campanha: todas disponíveis por rolagem, cada uma com emoji, nome e cor, sem rótulo ARENA acima. Miniatura de campanha com aba de pasta e mesma altura de 76 px da arena; ArenaCard recuperou o layout anterior preservando as cores novas. Clique na campanha abre CampaignFolderModal com as arenas normais, respeitando requisitos e oferecendo acesso aos detalhes. Rolagem interna não inicia reordenação nem abre a pasta. Prévia com quatro arenas conferida no navegador; TypeScript e regressão de ciclo de campanhas passaram durante esta rodada. Alterações no código local; sem novo AAB, commit ou push. Loja mantém seu card maior, sem aplicar a faixa compacta.

### 18/10/2026 — Cinco skins aprovadas e integradas no código (Codex)

Afonso aprovou explicitamente a revisão 3 e autorizou integrar. As cinco artes foram copiadas sem alteração para o catálogo; offsets, cobre braços/pernas/pés e mãos na frente são os da revisão aprovada. Catálogo e coleções vinculados; Aurora II ocupa o slot da coleção, preservando o item e a arte do Guardião Aurora original. Zênite II ganhou a chave de coleção no calendário, sem inventar missões. TypeScript, build e regressões de arte/recompensas passaram. SQL de cadastro validado em `sql/2026-10-18-skins-temporadas-aprovadas.sql`, ainda NÃO aplicado ao banco: cadastra as cinco desligadas para não antecipar as temporadas futuras. Sem novo AAB, commit ou push. Este registro substitui a pendência de aprovação/integração da revisão 3 abaixo; temas e demais conteúdos das temporadas continuam pendentes.

### 18/10 — Skins revisão 3: cobre e ajuste feminino autorizados

Afonso aprovou o visual da revisão 2, incluindo Aurora II, e dispensou redesenho feminino. Cinco entradas de revisão em avatarOffsets.ts com cobre braços/pernas/pés; base x0 y-2 scale1 e delta body_fem x-2 y0 scale0.98. PNGs idênticos aos aprovados, somente em output/temporadas-skins-2026-10-18/revisao-v3. Sem catálogo/loja/recompensas. avatarHands restaura mãos dessas cinco a partir de y246, limitando lateral para não restaurar coxa junto à saia. Bancada agora chama drawHandsInFront compartilhado e aceita candidatas via ?seasonReview=3. Folha HTML importa as funções reais de offset, recorte e mãos; PNG auxiliar simula a mesma composição. Controle de navegador desabilitado nesta sessão: não foi possível afinar interativamente na bancada nem capturar seu canvas; offsets avaliados nas composições PNG. Revisão do usuário e validação no navegador pendentes. Não houve AAB, commit ou push.


### 18/10 — Skins de temporada: segunda revisão, sem integração

Codex: cinco candidatas vestidas e extraídas em `output/temporadas-skins-2026-10-18/`. Revisão posterior em `revisao-v2/index.html`: limpeza de componentes soltos nas golas; Aurora II refeita com image_gen para corrigir a barra recortada, pernas e botas. PNGs RGBA 500×500, folha geral e cinco folhas com os oito corpos. `revisao-v2/validation.json` registra pixels expostos sobre o corpo inteiro, sem recortes `cobre` (não confundir com restos de pele na roupa). A meta zero ainda NÃO foi atingida; encaixe continua pendente, sobretudo no feminino. Não marcar a tarefa como concluída. Nenhum catálogo, offset, recompensa, versão ou AAB alterado. Guardião Aurora original preservado.


> Histórico preservado. As listas acima foram reconciliadas em 13/10; “pendente” em um recado antigo pode ter sido superado por outro posterior.


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

### 12/10 — Resend verificado no painel autenticado

Equipe exibida: misterxhermit. Transactional Free (0/3000 no mês, 0/100 no dia); Marketing Free (0/1000 contatos). Cobrança mostra dois planos de USD 0/mês, nenhum método de pagamento e nenhuma fatura. Extras de consumo aparecem desligados/desabilitados. glyph.life está Verified. Emails sem envios nos últimos 15 dias e Logs sem entradas nos últimos 30 dias. Não há evidência nesta equipe para atribuir cobrança de USD 10 ao Resend; origem permanece em aberto. Sem alteração de plano/configuração e sem envio de e-mail.

Recuperação de senha chama Supabase Auth resetPasswordForEmail; configuração SMTP remota ainda depende de login no painel Supabase (aba aberta). Ausência de logs no Resend não prova que toda integração está correta nem explica envios anteriores. Novidades continua possibilidade, sem campanha ativada.

- Esclarecimento de Afonso: existia um adicional cobrado no passado e ele já o removeu. Painel atual gratuito não identifica esse adicional histórico. SMTP remoto confirmado no Supabase: ativado, smtp.resend.com, porta 465, remetente Glyph App, intervalo por usuário 117 segundos. Nenhuma configuração alterada; credencial e entrega ainda não validadas por envio. Solicitado e-mail de conta própria e autorização para um único teste de recuperação, sem abrir link nem trocar senha.

### 12/10 — E-mails essenciais preparados (Codex)

Afonso aprovou recuperação de senha + confirmação de exclusão; novidades fica para depois. Código e testes em docs/2026-10-12-emails-essenciais.md. Novo SQL 20261012180000_email_dispatch_state.sql reutiliza notification_email_dispatches (três colunas); aguarda execução antes de publicar resend/account-delete. Envio só backend, retentativas limitadas e estado accepted distinto de entrega. Login orienta senha própria versus Google. Storage com falha não vira completed. Não houve envio real, exclusão, alteração de plano ou deploy; trabalhador de limpeza e pedido do site ainda pendentes.

- E-mails essenciais: SQL 20261012180000 confirmado por Afonso (três colunas). Publicados resend v18 e account-delete v29, ambos ACTIVE. Teste remoto com chave pública recusado em ambas (HTTP 401), sem envio/exclusão. Entrega real, conta de teste com senha e fluxo completo de exclusão continuam pendentes; interface ainda exige próximo build.

### 12/10 — Claude (egress de abertura e recados passados)

- Recados passados para a prancheta: Resend conferido (falta só um envio real), e-mails essenciais publicados (resend v18, account-delete v29), e um item novo para o Afonso rodar `20261012160000_landing_stats_include_gm.sql`. Item novo: AAB 111, só quando o Afonso pedir.
- Egress de abertura, passos 1 e 2 (`35da095`, `bb107b6`): relatórios fechados guardados no celular; tarefas e inventário sem `user_id`; perfil sem `garden_state`. Mexe em `GameContext.tsx` (consulta do perfil, das tarefas, do inventário e dos relatórios na abertura).
- Para o Codex: a minha migração do perfil também saiu como `20261012180000`, igual à `email_dispatch_state`. Renomeei a minha para `20261012190000_perfil_de_abertura.sql`; a sua ficou como está.

### 12/10 — Claude (pedidos novos do Afonso)

- Antes do lançamento o Afonso quer mexer em **Clã** e em **Rankings / interatividade**. Itens novos na prancheta (`ap-cla`, `ap-rankings`); escopo e quem faz ainda a combinar com ele — não começar sem isso.
- Item novo para o Afonso: teste de recuperação de senha numa conta com e-mail e senha (tirado do `docs/2026-10-12-emails-essenciais.md`).

### 12/10 — Codex: acessos públicos e convite antes do lançamento

- Landing local: Entrar na web e Android ficam como Em breve, sem links ativos para app.glyph.life ou Play; lista de interesse preservada. Posts também usam CTA desativado. Post de convites corrigido para 10 fragmentos / baú Comum / baú Incomum e instrução por código durante os testes.
- App: `utils/convites.ts` compartilha somente código e instruções enquanto `ANDROID_PUBLICO_DISPONIVEL = false`. Link com Install Referrer preservado para liberação após confirmar a página pública na Play. Mudança exige próximo build; não entrou no AAB 110.
- Entrar na web significa usar o aplicativo no navegador. Abrir o Android pelo site exigirá configurar um link próprio de abertura e fallback; não foi implementado nesta rodada.
- Verificado localmente: regressão de convites, mensagem sem URL, JavaScript do site e navegador a 390/1440px (sem overflow, CTA desativado e lista de interesse abre). Não publicado no site; nenhum AAB gerado.

### 12/10 — Codex: cinco skins das próximas temporadas

- Produzidas propostas de Zênite I, Eclipse I, Égide I, Aurora II e Zênite II, com as paletas aprovadas por Afonso. Relatório: docs/2026-10-12-skins-proximas-temporadas.md. Galeria: output/temporadas-skins-2026-10-12/galeria.html.
- PNGs 500×500 com alpha real, originais e prompts preservados. Ainda há ajustes geométricos nas mangas/calçados; NÃO marcar como arte integrada nem encaixe aprovado. Nenhum asset do catálogo foi substituído.
- Quatro dessas temporadas ainda têm jornadas vazias e não têm coleção própria cadastrada. Aurora II já tem coleção; a proposta nova preserva o Guardião atual. Não confundir com as cinco skins de regras secretas, já feitas.

### 12/10 — Codex: 12 artes das próximas quatro temporadas

- Afonso pediu apenas borda, banner e insígnia de Zênite I, Eclipse I, Égide I e Aurora II. As 12 peças foram geradas e salvas em art-delivery/temporadas-2027/. Galeria: galeria.html; instruções e limites: README.md; prompts: prompts.json.
- PNGs com alpha (500×500; banners 1020×170) e WEBP lossless, cerca de 2 MiB os 12. Alpha 0 no centro das quatro bordas, preview com avatar por baixo, nomes/acento e Aurora II conferidos. Galeria verificada em 390/1280 px e temas claro/escuro.
- Não integrado ao catálogo/servidor, nenhum arquivo antigo substituído. Não marcar temporadas como lançáveis: três coleções ainda precisam de cadastro/missões. Skins continuam com encaixe pendente; temas/fundos não foram gerados nesta rodada.

### 12/10 — Codex: artes leves integradas e auditoria da sessão

- Atualiza os recados anteriores: 12 bordas/banners/insígnias agora no catálogo local, 675 KiB juntas (menos 67%), alpha preservado; pasta catalog 15,5 MiB dentro de 18. Aurora mantém IDs e resolve URLs antigas.
- SQL manual pendente: sql/temporadas-2027-artes.sql. Nove peças futuras entram desligadas. Zênite/Eclipse/Égide ainda precisam skin/tema/missões; encaixe das cinco skins permanece com Claude.
- Passaram TypeScript, build web principal, item-art, egress, reward-routing e pagamento/renovação sem baús. Corrigido teste obsoleto dos planos. Galeria 390/1280, alpha e SQL local idempotente conferidos; nada aplicado ao Supabase nesta rodada.
- SMOKETEST corrigido: marco 1/5/10, código sem link público e build 111 pendente.
- Auditoria completa: docs/2026-10-12-temporadas-integracao-e-pontas-soltas.md. Exclusão pelo site ainda mailto; retentativas de exclusão/Storage, publicação do site e haptics seguem pendentes. Testes humanos separados.
- Afonso reforçou: no próximo commit/push/AAB incluir também as mudanças da outra IA. Não houve commit, push ou AAB nesta rodada; conferir alterações dos dois antes de fechar.

### 12/10 — AAB 111 autorizado (Codex)

Afonso confirmou a execução de sql/temporadas-2027-artes.sql e pediu commit, push e AAB 111, incluindo o trabalho de ambas as IAs. Preparação em andamento; resultado e hash serão registrados no checkpoint 111.

### 12/10 — AAB 111 gerado e verificado (Codex)

- Build do checkout completo, incluindo commits do Claude e alterações do Codex. TypeScript, build completo, 24 regressões, Capacitor sync, Gradle/R8 e assinatura passaram.
- Arquivo: android/app/build/outputs/bundle/release/Glyph-1.0.111-111.aab (49.714.788 bytes). Pacote life.glyph.app, versão 1.0.111/código 111, targetSdk 36 verificados dentro do AAB.
- SHA-256: 0D2288FB17C42F0A1BB3B8A8CC04D209370B96403AB8B2E4623767CE4DD406A2. Checkpoint: docs/2026-10-12-checkpoint-aab-111.md. Upload Play pendente; não publicar como já distribuído.
- SQL das artes confirmado executado por Afonso. Exclusão completa/site/haptics e skins continuam pendentes.

### 12/10 — Push dos dois projetos e site publicado (Codex)

- App: ce54428 enviado para arabeco/game-of-life/main com os 98 commits anteriores, incluindo o trabalho do Claude. AAB 111 permanece o artefato do checkpoint, sem upload no Play.
- Landing: a294b4b enviado para arabeco/glyph-landing/main. Publicação automática CONFIRMADA: Home, script.js, Novidades e Termos em https://www.glyph.life responderam 200 e conteúdo idêntico ao checkout enviado.
- Entram no site: prints atualizados, textos de uso livre/estoque, contadores por maestria, 13 anos/7 dias, posts e acessos Em breve. Publicação destes arquivos deixou de ser pendência; versões futuras de prints/conteúdo podem continuar evoluindo.
- Navegação 390/1440 passou sem erros de JS/imagens quebradas. Posts, contadores agregados (fixture), Termos, exclusão e placeholders também passaram. Confirmação do site publicado não significa execução real de recuperação/exclusão. Pedido de exclusão ainda prepara e-mail; fluxo automatizado e haptics continuam pendentes.

### 13/10 — Codex: conquistas secretas por evento

- Corrigido localmente o atraso do Imparável: antes só conferia no carregamento do perfil/fecho do ciclo. Agora cada grupo reage ao evento confirmado (ações no Planner/estoque/horário/marco, diário, humor, amizade, missão, competição, ciclo). Mentoria tem timer para o próximo prazo; abertura/retomada recupera pendências.
- Fila conserva eventos durante consultas, evita repetição na sessão e mantém o modal na fila de celebrações, sem esperar para entregar. Sem novo SQL; agregado do RPC existente preservado.
- TypeScript, build web, quatro regressões e teste React no navegador passaram, incluindo dia 30 sem reabrir, concorrência e gravações falhas/undo sem gatilho. Relatório: docs/2026-10-13-segredos-por-evento.md.
- NÃO está no AAB 111 já entregue. Precisa próximo build; sem commit/push ou prêmio real nesta rodada.

### 13/10 — Codex: apresentação de itens repetidos

- Baú: título Você já possui, arte preservada, fragmentos de conversão separados do bônus; corrigido identificador bau- para ativar o modo de revelação.
- Missão: somente itens efetivamente entregues na grade; conversões aparecem com nome/arte e fragmentos. Fragmentos próprios da missão também aparecem. Toast de fechamento acompanha o resultado, sem dizer que a cópia foi adicionada.
- Segredo: preservada a regra de não compensar item já possuído; modal identifica Já está na sua coleção, sem anunciá-lo como novo. Eventual conversão retornada pela entrega também é apresentada.
- Conversão genérica aceita tier 6 (3.000); soma sobre saldo vivo em entregas consecutivas; silent evita toast concorrente. Falha ao consultar inventário interrompe a entrega em vez de inserir às cegas.
- Validação: TypeScript, build Vite, duplicate-rewards, reward-modal, mission-reward-unification, medidor-de-segredos e segredos-por-evento.browser passaram. Testes usam dados controlados, não resgate real.
- Sem SQL novo, commit, push ou AAB nesta rodada. A persistência de concessões genéricas continua no fluxo existente do cliente; não foi criada transação atômica/idempotência entre dispositivos. AAB 111 não inclui estas mudanças.

### 13/10 — Codex: gestos do Planner e Oráculo sem interromper

- Cartões do dia/semana/lista permitem rolar antes de pegar; depois de pegar, movimento menor inicia arraste e bloqueia scroll nativo. Mantidos pegar 240ms e tempos de concluir/desfazer; feedback curto ao pegar respeita preferências existentes.
- useLongPress limpa touchcancel/blur, evita mouse sintético abrir a ação novamente e não interpreta como toque uma soltura tardia quando o timer atrasou.
- Arraste mantém a trava do Oráculo até soltar; cancelamento, blur, Escape e desmontagem liberam. Falas já visíveis saem ao começar outro gesto; novas falas aguardam 650ms de pausa e só a última fica pendente. Respostas assíncronas que chegam após soltar também respeitam a pausa. Reações aparecem inteiras, sem digitação por letra; tons e regras de frequência preservados.
- Rolagem automática só nas bordas visíveis, progressiva, proporcional ao tempo do quadro (60/120Hz); removida zona global de 200px que puxava a agenda cedo demais.
- Teste tests/planner-gestures.browser.mjs usa React/hooks reais, Edge e toque nativo CDP: toque único, arraste vertical após hold, limiar do mouse, cancelamento, scroll sobre cartão, espera do Oráculo entre gestos e velocidade de borda. Feedback físico não é verificável no desktop. Sem contas reais, SQL ou AAB nesta rodada.
- Validação final desta rodada: TypeScript, build Vite, planner-gestures.browser (toque nativo CDP), oracle-transient-speech, planner-simple-list, planner-chega-na-hora e planner-zoom passaram. Ainda sem commit/push e fora do AAB 111.

### 13/10 — Codex: prancheta reconciliada por pedido de Afonso

- Listas principais atualizadas diretamente com autorização de Afonso; não apenas recado adicional. Termos, contador, publicação do site, AAB 111, 12 artes e configuração Resend saíram da fila antiga. Planner/clã têm implementação concluída separada do restante específico.
- Reconferidos arquivos públicos por HTTP; correspondem ao checkout local, com normalização de quebras de linha. Exclusão continua mailto. Hash do AAB 111 corresponde ao checkpoint.
- Corrigido erro de escopo: zoom/widget de 13/10 são posteriores ao AAB 111, assim como demais mudanças recentes listadas para próximo pacote. AAB não foi reconstruído nesta revisão.
- Conquistas por evento e itens repetidos promovidos à lista principal. Incluídos o handoff de dicas do Oráculo e conteúdo restante das temporadas.
- Testes de conta/aparelho e situação de Play ficam separados, sem cobrança agora conforme resposta de Afonso. Nenhuma conta, envio, SQL, publicação ou fonte do app alterada.
- Evidências e limites: docs/2026-10-13-auditoria-prancheta.md. Ao sincronizar a cópia do Claude, preservar esta consolidação.

### 13/10 — Afonso: agrupamento das próximas mudanças e perfil

- Rankings/interatividade e média de EXP diária devem ser feitos **na mesma rodada de código**. Item único na lista principal.
- Feed atual confirmado pronto por Afonso; novas ideias ficam para o futuro, sem marcar o feed existente como incompleto.
- Perfil: conferidos views/ProfileView.tsx, components/Share.tsx, views/MundoView.tsx, searchPlayers e a migração de search_public_profiles. Já existe compartilhamento de imagem/nickname; busca é por nickname, não por ID. Não foi encontrada necessidade de criar outro identificador para o fluxo atual; link direto permanece possibilidade futura. Nenhuma mensagem enviada.
- Cookies e partes restantes da exclusão mantidos com o estado verificado; a citação desses itens não foi interpretada como confirmação de conclusão ou autorização para implementar o site nesta revisão.

### 13/10 — Codex: compartilhar perfil com nickname

- Pedido de Afonso implementado: mensagem junto do cartão com convite para adicionar e nickname; botão Copiar nickname abaixo do nome. Perfil alheio usa o nome da pessoa, sem se apresentar como perfil próprio.
- Reutilizado copiarTexto; fallback agora verifica sucesso e remove o campo temporário mesmo em erro, evitando confirmação falsa. Compartilhamento continua pelo menu nativo existente, sem inventar link de perfil.
- Fora do AAB 111; sem envio ao WhatsApp, commit ou push.

### 13/10 — Codex: tags Top e média de EXP na mesma rodada

- Implementados comparativo pessoal junto da EXP diária e no relatório/placa do ciclo, além de tags oficiais Top 1/5/10% para ciclo, Maestria e clã. Afonso escolheu EXP total para a tag do ciclo; média pessoal normaliza por dia. Atualiza ao abrir, voltar, mudar valor local e a cada cinco minutos visíveis. Imagens compartilhadas não mudam depois.
- Migração 20261013200000_progress_recognition.sql preparada, **não aplicada**. RPC retorna apenas dados próprios/agregados; sem posição inventada quando falta população ou histórico.
- Painel/Planner passam a usar a taxa de bônus vigente explicitamente, removendo os 10% padrão indevidos da exibição. Preservadas alterações de gestos e demais trabalhos pendentes.
- Documento: docs/2026-10-13-ranking-e-media-exp.md. Sem commit, push, AAB, SQL remoto ou envio de mensagem.
- Validação final: TypeScript, build Vite, 30 cenários core-loop, regressão SQL/PGlite e teste React/Edge passaram. Preview móvel com texturas reais conferido. Falta aplicação do SQL e distribuição; não houve teste em conta real.

### 13/10 — SQL das tags Top e média de EXP executado

- Afonso confirmou “rodei” para 20261013200000_progress_recognition.sql. Confirmação do usuário, sem consulta remota adicional nesta rodada. Supera os registros anteriores de migração não aplicada.
- Resta distribuir o código novo; AAB 111 existente não contém essa implementação.

### 15/10 — Claude: prancheta unificada

- A online virou a fonte de novo, e este MD foi regravado a partir dela, já com a consolidação do Codex de 13 e 14/10. Os recados acima ficaram como estavam.
- Entraram na online os feitos que só estavam aqui (nickname, segredos por evento, itens repetidos, zoom e widget, planos e campanhas, dicas do Oráculo, aviso do clã retirado). Os testes no aparelho foram para "Conferir no celular", e as ideias para depois para "Opcionais e expansão".
- Abertos do Codex desta manhã: terminar campanhas (o app não compila enquanto isso: import duplicado de buildCodexTemplateFromDraft no GameContext, e dois testes falham) e escolher a proposta do modal de arena e ação.
- Vibração nativa no app e no arraste do planner: commit 06a24f7, plugin @capacitor/haptics novo — o 112 precisa sair com ele.
- Os testes no aparelho saíram da prancheta e foram para a planilha "Teste do Glyph" (https://claude.ai/artifact/DG8g73vkemJE832jUg4bJc), feita para um amigo testar: Fácil, Médio e Difícil, com deu certo / deu errado. Nos opcionais entrou "Criar campanha para outra pessoa (como era o Codex)".


### 15/10 — Biblioteca e continuidade de campanhas (Codex)

- Implementação local: aquisição separada de instalação; abas Em andamento / Biblioteca / Histórico; concluir ou arquivar preserva tentativa e libera reutilização; ativos e fases preservados no template; instalação do rascunho usa agrupamento real.
- Progresso das campanhas instaladas atravessa ciclos, não cobra o saldo futuro na nota e limita cada ação à própria meta. Agenda respeita fases e saldo. Corrigida abertura da prévia pela biblioteca e cartões cortados no celular.
- Afonso confirmou execução de `supabase/migrations/20261015120000_campaign_library_runs.sql`. Não houve validação autenticada do RPC remoto nesta rodada.
- TypeScript, Vite, regressões de campanhas/denominador/agendamento e interface simulada em celular passaram. Sem publicação ou novo AAB; não está no AAB 111. Detalhes: `docs/2026-10-15-auditoria-campanhas.md`.

### 15/10 — Auditoria das Edge Functions (Codex)
- [x] Corrigir leitura pública do segredo interno: SQL 20261015200000 aplicado; segredo rotacionado e sincronizado. Leitura anônima agora 401; autenticação do webhook reconferida sem envio.
- [x] Mercado Pago: segredo `MERCADO_PAGO_WEBHOOK_SECRET` cadastrado pelo Afonso e presença confirmada em 16/10. Evento fictício sem assinatura retornou `Invalid signature`, antes de consultar pagamentos. Ainda falta confirmar uma notificação legítima assinada pelo Mercado Pago; este teste não comprova igualdade do segredo nem compra real.
- [ ] Limpeza de segredos: auditoria das nove funções publicadas em 16/10 não encontrou referências a `OPENROUTER_API_KEY` ou `OPENROUTER_MODEL`. Candidatos à remoção; nenhum segredo foi apagado. Demais configurações personalizadas têm referências no código publicado; manter os segredos padrão do Supabase.
- [x] Widget: arenas arquivadas e bloqueios de campanha — widget-action v4 publicado; teste real na conta descartável confirmou recusas e liberação após pré-requisito. Sem teste de gesto/layout no aparelho.
- Push: duas inscrições ativas sem erro; envio registrado em 15/10 às 14h40. Histórico enviado não comprova exibição no aparelho. Auditoria: docs/2026-10-15-auditoria-edge-functions.md.

### 16/10 — Fechamento das melhorias seguras
- [x] Push web-push v37: até três tentativas para 500/503, respeitando espera do provedor; sem repetição cega de timeout ou sucesso. Testes simulados passaram, sem envio real. Fila de retentativas longas/429 não implementada.
- [x] Contador de arena preserva 8/7 realizadas enquanto progresso elegível continua limitado por ação. Testes de apresentação e campanha passaram; apresentação local aguarda próximo AAB.
- Detalhes e limites: docs/2026-10-16-fechamento-exclusao-widget-push.md.

### 16/10 — Codex: revisão antes do AAB e do teste do Luigi

- Este recado supera os estados antigos das listas principais, sem regravar a cópia da prancheta online.
- Exclusão pelo site e retomada automática já implementadas/publicadas; teste real com conta descartável concluiu protocolo 102 e confirmou remoção de Auth, perfil, dados e arquivo. E-mail é uma pendência separada. Ver `2026-10-16-fechamento-exclusao-widget-push.md`.
- Campanhas já têm implementação e testes locais registrados em `2026-10-15-auditoria-campanhas.md`; a afirmação antiga de trabalho interrompido/compilação quebrada está superada. `npx tsc --noEmit --pretty false` reconferido nesta revisão: passou. Fluxo completo autenticado de biblioteca/arquivar/reinstalar no banco remoto ainda merece validação antes do aparelho.
- Mercado Pago: print do Afonso mostra simulação oficial payment.updated, data.id=0, chegando à consulta da API e retornando status 400 para o ID fictício. Com o segredo presente, confirma passagem pela assinatura. Teste sem assinatura havia sido rejeitado. Não é teste de compra/crédito real.
- Afonso confirmou remoção dos dois segredos OPENROUTER. Não há mais ação de remoção pendente por parte dele.
- FCM: push de teste autorizado para Mister X retornou sent=1, failed=0. Ainda falta confirmação de exibição no aparelho. Resend: teste remoto segue barrado com 401 antes do provedor; autenticação original preservada. Ver `2026-10-16-validacao-mensageria.md`.
- `reward-routing.regression.mjs` reconferido: passou. `luz-e-placa-do-soberano.regression.mjs` ainda falha ao procurar comentário/estrutura antiga do slot; não comprova defeito visual por si só, pois o editor atual usa três slots. Revisar teste contra o layout aprovado e conferir visualmente.
- Modais: os botões dourados já aparecem no código de ActionModal e ArenaDetailModal. A proposta HTML completa não deve ser tratada como integrada só por isso; conferir diferenças e fechar o escopo visual antes de incluir no AAB.
- Prioridade sugerida: autenticação/entrega Resend; biblioteca de campanhas em conta de teste; conciliação dos modais aprovados; regressões e revisão visual; checkpoint do código e roteiro do Luigi. Arte de temporadas futuras e expansões podem ficar fora se não forem ativadas.
- Nenhum novo AAB foi gerado nesta revisão.

### 16/10 — Integração dos modais e validação real de campanhas (Codex)

- Integrados no código real ActionModal, ArenaDetailModal, ArenaCard e NewArenaModal: quatro abas (Geral, Contexto, Checklist, Mídia), abas de leitura filtradas por conteúdo, lista de ações com quadrados arredondados e +, detalhes na cor do ativo, botões dourados. Miniaturas preservam PlasmaCanvas/gradiente existente e tags; arredondamento reduzido.
- Duração: slider por etapas e campo numérico independente; repetições inteiras. Texto e checklist têm rolagem interna. A validação visual de dimensões/teclado NÃO foi concluída: navegador bloqueou file://. Não afirmar ausência de cortes em todo aparelho antes dessa verificação.
- Agenda nova com início, dias e horário obrigatório respeita quantidade de repetições e horizonte do ciclo; regra alinhada também ao reagendamento de ciclo e caminho colaborativo. Agendas antigas sem limitToRepetitions mantêm seu comportamento anterior.
- Campanhas: migração 20261016120000_campaign_run_task_id_compatibility.sql aplicada remotamente. Corrigidas comparações UUID/texto e data/texto em finish_campaign_run. Teste autenticado com conta descartável passou: recusa de conclusão incompleta, conclusão entre ciclos, arquivamento, preservação de histórico/biblioteca, remoção de pendências futuras e reinstalação com IDs/progresso novos. Conta de teste removida. Evidência: output/campaign-library/live-report.json. Não testa compra real nem instalação pela UI Android.
- Resend: domínio glyph.life Verified; teste pelo painel oficial da função também retornou 401 unauthorized antes do provedor. Envio/recebimento continuam pendentes. Não houve alteração de credenciais ou ampliação de autenticação.
- TypeScript e regressões focadas de agenda, campanhas e e-mail passaram. Build web conferido. Ainda sem novo AAB, sem commit/push; revisão geral/checkpoint/roteiro Luigi ficam para a rodada seguinte conforme solicitado.

### 16/10 — Resend aceitou o envio real da exclusão (protocolo 103)

- Testado o caminho interno account-delete → resend com uma conta nova descartável no alias misterxhermit+glyph-teste@gmail.com, autorizado por Afonso. Conta Mister X preservada.
- Exclusão HTTP 200, protocolo completed, sem limpeza pendente; Auth e perfil removidos. E-mail accepted no retorno e no registro de despacho, com ID do provedor. Nenhuma mudança de autenticação ou credencial.
- Este resultado supera a suspeita de que o 401 do teste externo indicava defeito no envio interno. Falta somente confirmar o recebimento desse e-mail. Recuperação de senha usa outro caminho (Supabase Auth/SMTP) e ainda exige teste próprio.
- Evidência: output/deletion-email/live-report.json e docs/2026-10-16-validacao-mensageria.md.

### 17/10 — Cesta esporádica do jardim (Codex)

- Afonso delimitou esta rodada à cesta; fragmentos diários do Painel ficam para depois. Implementados 5–15 fragmentos por entrega e 5% de chance de o cálculo passar de 15, entregando um baú Comum em substituição.
- Uma entrega a cada 3–5 dias ativos, no máximo um avanço por dia; duas entregas guardadas, sem expiração. Estado e recompensa no servidor, coleta idempotente por ID. Nenhum preço da loja/forja mudou.
- Cesta fora da areia, aviso no perfil e atalho acessível. Visitantes não veem/coletam. Layout e desenhos existentes preservados. Tamanhos e guia permanecem pendentes como propostas.
- SQL para Afonso executar: supabase/migrations/20261017210000_garden_basket.sql. Compilado com sql:checa e executado em teste PGlite; NÃO aplicado remotamente e nenhuma service-role usada.
- TypeScript, build do jardim, build principal, regressão SQL da cesta, terreno e areia passaram. Navegador validou demonstração isolada (sem crédito real), visita e erro de coleta. Sem AAB nem subida de versão.
- Detalhes: docs/2026-10-17-jardim-cesta-implementacao.md. Prévia: output/garden-basket/index.html.

- Ajuste visual aprovado em 17/10: cesta substituída por saquinho clicável na entrada; sem abertura automática nem botão flutuante. Cordão/selo verde (5–9), azul (10–15) e dourado (baú). Recompensas e SQL não mudaram.


### 18/10 — Retomada: expansões, fragmentos do Painel e emojis

- Afonso aprovou sete expansões sequenciais por 80/140/220/320/450/650/900 fragmentos. Original/Amplo preservados; compra permanente, sem mover peças/desenhos. Implementação local e testes PostgreSQL passaram.
- Regra final do Painel: 1 fragmento por 50 EXP crua, piso inteiro, teto 15; ao abrir o dia encerrado. Sem média pessoal, 12 na média ou mínimo de 8 (proposta rejeitada). Comprovante único e linha quadrada no estilo de recompensa.
- Biblioteca: 315 emojis, busca em português e Todos; seletor nativo acima dos modais. Guia versão 2 com personalização atualizada.
- SQL combinado para Afonso aplicar: sql/2026-10-18-jardim-fragmentos.sql (cesta pendente + expansões + Painel). NÃO aplicado remotamente; sem AAB, subida de versão ou publicação.
- Evidências e decisões: docs/2026-10-17-retomada-jardim-painel-emojis.md. Prévia isolada: output/garden-retomada/index.html.

### 18/10 — Próxima revisão visual: Campanhas e miniaturas da loja

- [x] Rever a aba Campanhas: Afonso rejeitou o excesso de arredondamento da apresentação atual. Superado pela revisão aprovada: campanha em um card compacto, com faixa horizontal das arenas, fases e gradiente formado pelas cores das arenas.
- [x] Rever as miniaturas de campanhas na loja, incluindo enquadramento, proporções e legibilidade. Superado pela integração aprovada; a loja mantém card próprio, sem copiar a faixa compacta da ArenaView.
- Reunir essas propostas com a referência dos modais de arena e ação: `docs/2026-10-17-modais-referencia.md`, seção “Próxima revisão visual”. Apenas registrado; alteração visual ainda não implementada.


### 18/10 — Campanhas migradas para o estilo dos modais (local)

- Minhas Campanhas, detalhe e miniaturas da loja revisados com placa em grafite, arredondamento discreto, títulos legíveis e arenas em linhas coloridas. Supera a anotação anterior de “apenas registrado”.
- Prévia para avaliação: output/campaign-style/preview.html. TypeScript/build e revisão móvel local conferidos; dados simulados. Sem publicação/AAB; aguarda avaliação visual do Afonso.


### 18/10 — Integração final de Campanhas e arenas

- [x] Revisão incorporada ao código real: campanha em uma célula, duas placas internas com emoji, títulos de 13 px centralizados com emoji ao lado. Cards de 96 px.
- [x] Gradiente das campanhas combina as cores das arenas contidas na grade, biblioteca, loja e detalhe.
- [x] TypeScript, testes de campanhas/cores e build completo passaram; conferência local da ArenasView real com dados simulados.
- Distribuição Android/publicação não executadas nesta rodada. Detalhes em `docs/2026-10-17-modais-referencia.md`.


## Release Android 113 — 18/10/2026

AAB 1.0.113 gerado, manifesto e assinatura verificados; build completo, dois typechecks e oito regressões passaram. Detalhes e hash em `docs/2026-10-18-checkpoint-aab-113.md`. Sem upload ao Play ou teste em aparelho nesta rodada.

### 20/10 — Vagas unificadas de vínculos e mentoria (Codex)

- SQL `20261020140000_unified_relationship_slots.sql` confirmado pelo Afonso: coluna de vagas, responsável pelo vínculo, gatilho de limite e regra de planos retornaram `true`.
- Plano grátis tem 0 vagas, Premium tem 2 e Platinum tem 5; uma vaga extra custa 50 ouro. O dono da vaga é um único participante; em mentoria, quem oferece o acompanhamento. Vínculos encerrados ou vencidos liberam a vaga.
- Vínculos mostra `Vagas livres: X / Y` e botão `Comprar vaga · 50 ouro`. Convite de mentoria não cobra mais o orientado; no aceite ele usa uma vaga do mentor. Convites pendentes permanecem pendentes se a vaga estiver cheia.
- Benefício incluído no catálogo de Premium/Platinum do app e na landing `glyph-landing/descubra.html`. Código local, validado por TypeScript e `sql:checa`; falta checkpoint/commit e AAB 115.
