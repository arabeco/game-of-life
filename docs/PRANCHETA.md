# Prancheta do Glyph

Cópia da prancheta do Afonso (artefato no claude.ai: https://claude.ai/artifact/99dQUHcbX6dy4dcAuu2Dx6), regravada pelo Claude em **16/10/2026**, já com a consolidação do Codex de 13 e 14/10. **15 abertos de 93** (78 feitos).

**Uma lista só:** a fonte é a prancheta online, e este arquivo é regravado a partir dela. Não edite as listas abaixo; para avisar algo, escreva em "Recados da outra IA", no fim: o Claude lê e passa para a prancheta.

**Pronto no código não é distribuído:** o AAB 111 tem o checkpoint ce54428 (12/10). Tudo de 13/10 em diante, do Claude e do Codex, vai no 112.

Auditoria do Codex: [conciliação de 13/10](2026-10-13-auditoria-prancheta.md).

## Lançamento

- [ ] Teste do Glyph com um amigo (planilha no claude.ai) *(Afonso)* — 15/10: https://claude.ai/artifact/DG8g73vkemJE832jUg4bJc — 26 testes (por caminho, sem item bobo) em Fácil, Médio e Difícil, com deu certo / deu errado e nota; os testes no aparelho (push, tema claro, vibração, widget, compra, reembolso, recuperar senha, excluir conta) moram lá agora, e não mais na prancheta. Precisa do AAB 112. O amigo precisa do link compartilhado (Share) para abrir. Versão em texto: docs/SMOKETEST.md.
- [ ] Resend: resolver o 401 do teste e comprovar que o e-mail chega (recuperação de acesso) *(outra IA (Codex))* — 16/10 (Codex): o domínio glyph.life está verificado no Resend, mas o teste pelo painel oficial da função também voltou 401 antes de chegar no provedor. Envio e recebimento continuam sem prova; nenhuma credencial foi mudada. Para o Afonso: o recado do Codex no MD ainda diz 401, então este item não está fechado. Detalhes em docs/2026-10-16-validacao-mensageria.md.
- [ ] Subir o AAB 111 na Play (ou pular direto para o 112) *(Afonso)* — 13/10: o 111 está pronto (ce54428) e não há registro de upload. O 112 terá o trabalho de 13/10 do Claude e do Codex.

<details><summary>Feitos (9)</summary>

- [x] Idade mínima nos Termos *(outra IA (Codex))* — Publicado (Codex). Reconferido em 13/10 no HTML público: 13 anos, com autorização do responsável para menores de 18.
- [x] Reembolso nos Termos (7 dias) *(outra IA (Codex))* — Publicado (Codex). Texto de 7 dias e encaminhamento ao Google Play no HTML público em 13/10.
- [x] Conferir se o código VANGUARDA25 existe *(Afonso)* — 10/10: VANGUARDA10 apagado; VANGUARDA25 valendo, 25 vagas, 1 por pessoa, agora 25 de ouro e sem o programa de 14 dias (sql/vanguarda25-sem-programa.sql rodado).
- [x] Site: contador "guerreiros na fila" quebrado *(outra IA (Codex))* — Corrigido e publicado (Codex): chama get_waitlist_count(), rótulo “inscrições recebidas”. Reconferido em 13/10.
- [x] Exclusão: finalizar o pedido pelo site e a retomada da limpeza parcial *(outra IA (Codex))* — 16/10 (Codex): exclusão pelo site e retomada automática implementadas e publicadas. Teste real com conta descartável concluiu o protocolo 102 e confirmou a remoção do login, do perfil, dos dados e do arquivo. O e-mail de confirmação depende do item do Resend. Detalhes em docs/2026-10-16-fechamento-exclusao-widget-push.md.
- [x] Resend: e-mails da exclusão, plano e limites, e a cobrança de US$ 10 *(outra IA (Codex))* — Painel e SMTP conferidos em 12/10 (Codex); o adicional antigo o Afonso já removeu; resend v18 e account-delete v29 publicados.
- [x] Site: revisar contadores, Termos, prints e posts e publicar *(outra IA (Codex))* — Landing a294b4b publicada (Codex). Reconferido em 13/10: Home, Termos, script.js, Novidades e exclusao.html no ar. O pedido de exclusão pelo site segue à parte.
- [x] Rodar a migração 20261002140000_public_landing_stats_v2.sql (totais do site) *(Afonso)* — 12/10: já estava rodada (Afonso); o Codex reconferiu: get_landing_stats_v2 responde 200.
- [x] Rodar a migração 20261012160000_landing_stats_include_gm.sql (contadores do site contam os perfis gm) *(Afonso)* — 12/10 (Codex): o filtro role='user' deixava de fora 2 perfis gm, 32 arenas e 332 ações concluídas. Esperado depois: 5 perfis, 38 arenas, 336 ações. Não precisa de AAB.

</details>

## App

- [ ] AAB 112 (só quando o Afonso pedir) *(Afonso)* — Feito em 13/10, depois do 111: zoom 1x do planner com o dia inteiro; widget do dia novo (Resumo e Planner, sem concluir e sem login); sem pay-to-win (planos e loja sem EXP extra, Premium com 20 arenas); coroa no mini card e no perfil dos outros; mentoria sem trava de Premium; Platinum sem ficha (fica 20% em campanha); Buscar campanha no Oráculo, que abre a campanha na loja. 15/10: vibração nativa (@capacitor/haptics) no app inteiro e no arraste do planner (06a24f7) — plugin novo, o 112 precisa sair com ele. Do Codex (local, ainda sem commit): tags Top 1/5/10% e média de EXP, conquistas por evento, itens repetidos, gestos do planner, nickname, dicas do Oráculo e campanhas (pela metade em 15/10: o app não compila até ele terminar). Conferir o widget no celular.
- [ ] Modal de arena e de ação: conferir no aparelho (Codex integrou) *(outra IA (Codex))* — 16/10 (Codex): integrados no código ActionModal, ArenaDetailModal, ArenaCard e NewArenaModal, com quatro abas (Geral, Contexto, Checklist, Mídia), slider de duração por etapas com campo numérico, rolagem interna no texto e no checklist e botões dourados. A agenda nova respeita as repetições e o fim do ciclo. Falta conferir na tela: tamanhos, teclado e cortes (o navegador dele não abriu o arquivo). Está na planilha do Luigi como M13.

<details><summary>Feitos (41)</summary>

- [x] Onboarding novo: fechar e commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Campanhas: biblioteca, progresso entre ciclos e correções (Codex) *(outra IA (Codex))* — 16/10: o Codex terminou. O Claude conferiu: o build compila e 131 de 134 testes passam (falham a-mao-ganha-do-oraculo e luz-e-placa, que são antigos, e apagar-conta, que ainda lê o arquivo antigo depois que a exclusão foi para _shared/accountDeletion.ts; é com o Codex). Os textos da planilha e do SMOKETEST foram ajustados ao app: card "30 dias · 5 ações · 2 arenas" e "Arena liberada — Abrir". O trabalho ainda não foi commitado; precisa estar antes do AAB 112.
- [x] Planner sem tremer: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Campanhas no banco real: percorrer tudo com uma conta de teste *(outra IA (Codex))* — 16/10 (Codex): migração 20261016120000_campaign_run_task_id_compatibility aplicada; corrigidas comparações em finish_campaign_run. Teste com conta descartável passou: recusa conclusão incompleta, conclui entre ciclos, arquiva, guarda histórico e biblioteca, tira as pendências futuras e reinstala do zero. Conta removida. Evidência: output/campaign-library/live-report.json. Falta só compra real e instalar pela tela no Android: fica com o Luigi (M11, M12, D10–D12).
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

- [ ] Gerar de novo as 5 skins das temporadas (Zênite I, Eclipse I, Égide I, Aurora II, Zênite II) *(Afonso)* — 16/10: Afonso conferiu as 5 da leva de 12/10 e reprovou — manga e pedacinho de couro/pele aparecendo (vão entre manga e tronco, calcanhar de fora). Vão ser pedidas de novo. O pedido novo tem que: vestir em cima do body_masc_1 na mesma posição e escala; manga fechada até o pulso, colada no braço, manopla emendada; bota cobrindo o pé inteiro, calcanhar incluso; só depois tirar o corpo (fundo transparente, sem cabeça nem mão). A leva antiga fica em output/temporadas-skins-2026-10-12/ como referência; nada foi para o catálogo. Encaixe fino depois na tools/avatar-align.html.
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

<details><summary>Feitos (2)</summary>

- [x] Subir os commits para o GitHub *(Claude)* — 46 commits no GitHub em 09/10.
- [x] Limpeza restrita do banco (backups vazios, user_assets, handle_new_user) *(outra IA (Codex))* — 12/10: Afonso rodou 20261011180000. Pentágono e slots preservados. Não ampliar sem comprovar desuso.

</details>

## Opcionais e expansão

- [ ] Site: banner de cookie (opcional) *(outra IA (Codex))* — 13/10: o site não tem rastreador (nem Analytics, nem pixel); só guarda o que é do funcionamento. Pela LGPD isso não pede banner, só menção na Política de Privacidade. Volta se entrar analytics no site.
- [ ] Criar campanha para outra pessoa (como era o Codex) *(Afonso)* — 15/10: ideia do Afonso. Alguém monta uma campanha (arenas, ações, plano de dias) e manda para outro jogador, como os manuscritos do Codex por @nickname. O código do Codex está guardado (migração 20260313_add_codex_forge_library.sql); dá para reaproveitar.
- [ ] Jardim conquistado: expandir ou limite de peças atrelado ao progresso (depois) *(Afonso)* — 12/10: ideia do Afonso, para depois. O jardim iria sendo conquistado — área que expande, ou limite de coisas que se desbloqueia com o que você faz. Mesma direção do clã: integrado, não à parte.
- [ ] Tag ou link de perfil para adicionar amigo (depois) *(Afonso)* — 12/10: código/link do perfil para adicionar sem buscar o nome. 13/10: o Codex já fez Copiar nickname e o cartão compartilhado com “Me adicione no Glyph!”; o link direto segue como expansão.
- [ ] Feed: ordem do Reino (depois) *(Afonso)* — 12/10: o feed tem duas abas sem repetição (Aliados = você e amigos; Reino = o resto), commit 8ce20b6. Depois: quem é do seu clã e não é amigo ganha preferência no Reino, e um filtro para não floodar quando houver gente. Atenção: o app baixa só os 80 posts mais novos de todos; com muita gente pública, posts de amigos podem sumir do Aliados.

## Recados da outra IA

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
