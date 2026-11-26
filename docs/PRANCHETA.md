# Prancheta do Glyph

Cópia da prancheta do Afonso (artefato no claude.ai), regravada pelo Claude em 2026-11-26. 24 abertos de 136.

**Não edite as listas abaixo** — elas são regravadas a partir da prancheta. Para avisar algo, escreva em "Recados da outra IA", no fim: o Claude lê e passa para a prancheta.

## Lançamento

- [ ] URGENTE: rodar supabase/migrations/20261126130000_fecha_funcoes_internas.sql (fecha 17 funções que qualquer um chamava sem login) *(Afonso)* — 26/11, checagem de prontidão: 15 funções internas security definer, executáveis por anon via /rest/v1/rpc e sem conferir quem chama, deixavam qualquer pessoa com a chave pública: definir o ouro de qualquer conta (_codex_set_wallet_gold), dar ouro/itens/marcar compra (_starter_reward_*), zerar qualquer coluna uuid de qualquer tabela (_nullify_public_uuid_column), apagar clãs de alguém, emitir convites dourados. Exposição confirmada só com funções de leitura (nada gravado). Quem as usa são outras funções definer do mesmo dono, que seguem funcionando; nenhuma política RLS depende delas; o app não chama nenhuma. Duas que o app chama logado (increment_clan_mission_progress, expire_stale_relationship_link_invites) perdem só o acesso sem login. O arquivo termina com a conferência (tudo false em anon).
- [ ] Subir o AAB 123 na Play *(Afonso)* — 02/11: push feito (6e7c1f7d) e AAB em android/app/build/outputs/bundle/release/Glyph-1.0.123-123.aab, versionCode 123, assinatura conferida. Leva: a escolha de experiência cobrindo o app (portal), o merge da nuvem de 31/10 (barra do ciclo só com dias completos, marco tracejado, miniatura só com o emoji, cores por cartão na escolha) e o feito do ciclo com a cor da nota mesmo de relatório antigo (904d696a). É a versão do teste do Luigi.
- [ ] Subir o AAB 125 na Play (Oráculo com IA) *(Afonso)* — 02/11: push feito (65227fc6) e AAB em android/app/build/outputs/bundle/release/Glyph-1.0.125-125.aab, assinatura conferida. É o 124 mais o microfone opcional no Manifest (uses-feature android.hardware.microphone required=false), para a Play não tirar os 21 aparelhos sem microfone. Leva o Oráculo com IA (pergunta, microfone, Ler meu ciclo com IA). Revisar o formulário de Segurança dos Dados (microfone).
- [ ] E-mail de 'conta excluída' parado: webhook notif ainda usa a chave antiga *(Afonso)* — 26/11: o Database Webhook 'notif' (notifications → função resend) manda a chave service_role JWT de 07/02; o projeto já usa as chaves novas (sb_secret_). Desde 22/11 as chamadas voltam 401; último e-mail aceito em 16/10 (12 falharam em 23/10). Corrigir no painel: Database → Webhooks → notif → trocar o Authorization pelo valor que a função resend confere (SUPABASE_SERVICE_ROLE_KEY dela). Envolve chave secreta, então é com você. Depois, um envio de teste (delivery_test).
- [ ] Play Console: preços novos e o plano anual *(Afonso)* — 28/10: premium_30d mensal R$ 14,99 e um plano base com ID exatamente 'anual' (12 meses) a R$ 119,90. platinum_30d mensal R$ 29,99 e plano base 'anual' a R$ 239,90. O anual só funciona a partir do AAB 121 (o código nativo escolhe o plano base).
- [ ] Teste do Luigi no 1.0.123: compras, renovação, fichas e EXP *(Afonso)* — 02/11: a planilha voltou para o 1.0.122, com 29 testes. A base é a versão da nuvem de 29/10 (diário sem internet a7/b6/b7, ação com texto b8–b10, vínculos com outras contas suas), e voltaram a renovação (c4, c5, c6 e a renovação do c7) e a regra do testador de licença. O a1 confere que a tela de escolha cobre o app. SQL de apoio: sql/teste-do-luigi-122.sql (trocar 'luigi' pelo apelido).
- [ ] Testar mentoria e dar campanha com duas contas (10 min) *(Afonso)* — 27/10: os testes de lógica passam (mentoria, vínculos, ciclo de vida no SQL, campanha). Os smokes ao vivo criam contas em produção com a chave service-role, então ficam de fora. Falta o teste à mão com duas contas (a sua e uma segunda): convidar para mentoria, aceitar, o mentor montar e dar uma campanha, o orientado aceitar e ver no planner; depois encerrar o vínculo.
- [ ] Conferir a experiência Essencial no AAB 120 (5 min) *(Afonso)* — 27/10: código pronto e com testes de lógica. A escolha aparece no onboarding e nas Configurações, onde pede confirmação e roda a abertura do Glyph. No Essencial saem: modais de recompensa (viram aviso, inclusive o prêmio do ciclo), Arsenal, loja de itens, jardim, missões (clã, Oráculo e onboarding), soberano, borda, banner e a bolinha de nível. A patente aparece como 'Patente 3 de 10'. Falta ver com conta logada: trocar nas Configurações e passear por perfil, clã, feed e fechar um ciclo.
- [ ] AAB 119: gerado; enviar para a Play, conferir no celular e promover (o 118 não vai para Produção) *(Afonso)* — 27/10: AAB 119 gerado de 8342c29 (SHA-256 0383c688…), assinado, versionCode 119. Sobre o 118: EXP das missões secretas nos valores novos (300/500/1000/3000/6000; a conta do Afonso foi acertada por SQL), modal de recompensa que cresce com o conteúdo (item não fica mais por baixo do Prosseguir), jardim com setas ← → que voltam e avançam areia e peças, etiqueta do que o toque faz e ✓ Concluir (salva e volta para a vista geral). O 118 não deve ir para Produção: paga o EXP antigo. Falta: enviar, conferir no celular (modal de missão, jardim, meta final da arena, campanha por mentoria) e promover.
- [ ] Catálogo: só 2 campanhas grátis e os preços das 16 *(Claude)* — 28/10: preços no banco (2 grátis; 40 a 550 ouro em degraus) e a vitrine só com as 15 escolhidas no app (AAB 121). Falta converter o conteúdo das MDs: Mente sem Armadilhas, Círculo Forte e a Faxina Total nova.
- [ ] Ligar o código de lançamento PRIMEIRALUZ100 no dia do lançamento *(Afonso)* — 25/10: prêmio trocado para 1 baú Raro (sem ouro), 100 vagas, 1 por pessoa; SQL 20261025140000 rodado (a função vagas_do_codigo responde e não mostra código desligado). O site tem a página recompensas.html com o contador ao vivo, que só aparece com o código ligado. No dia: update public.reward_codes set is_active = true, starts_at = now(), updated_at = now() where code = 'PRIMEIRALUZ100';
- [ ] Campanhas: 11 ainda prometem uma aula que está vazia (preços já corrigidos) *(Claude)* — 26/11, conferido no banco: os preços foram corrigidos (não há mais R$ 350), mas as 11 seguem com ação que manda ler uma aula com briefing vazio: Foco Blindado (550 ouro), Corpo de Elite (480), Liderança sem Cargo (380), Finanças com Intenção, Despertar de Ferro, Construção de Clã, Expressão Criativa, Criatividade em Sprint, Voz e Presença, Detox Digital, Presença Real. O quiz da loja recomenda Foco Blindado e Detox Digital. Antes do lançamento: escrever as aulas ou esconder essas da loja. 27/10 original: conteúdo em docs/campanhas/2026-10-27-catalogo-de-campanhas.md.
- [ ] Conta do Luigi: 5 pedidos de exclusão parados (ago/set), conta segue de pé *(Afonso)* — 26/11: 2 'started' de 18/08 e 3 'failed' de 24/09 (COMPETITION_SNAPSHOT_LOCKED, corrigido no mesmo dia; hoje 102 exclusões concluídas e todos os bloqueios respeitam a exclusão). Ele usou o app até 18/10, então eram testes. Decidir: deixar a conta ou pedir de novo pelo app.

<details><summary>Feitos (23)</summary>

- [x] Subir o AAB 122 na Play *(Afonso)* — 02/11: subido na Play pelo Afonso. Falta-lhe a escolha de experiência corrigida e o merge da nuvem de 31/10: vão no 123.
- [x] Subir o AAB 124 na Play (Oráculo com IA) *(Afonso)* — 02/11: descartado. A Play avisou que tirava 21 aparelhos sem microfone; substituído pelo 125, com o microfone opcional.
- [x] Conta nova travava no cadastro (idade não salvava) e o Sair da conta não saía — achado do Luigi *(Afonso)* — 18/10: causa achada e corrigida pelo Claude (a5da99e). O upsert do perfil mandava ouro, fragmentos, carteira, baús e premium, que desde 23/09 não aceitam escrita do app; o banco recusava a linha inteira e a conta nova ficava sem perfil. O Sair da conta do primeiro acesso usava o logout cru, que o celular desfaz. SQL 20261018100000 no banco (o Codex conferiu em 18/10): o 112 já cadastra; o Luigi só precisa fechar e abrir o app. O app corrigido e o Sair da conta estão no 113.
- [x] Idade mínima nos Termos *(outra IA)* — Publicado (Codex). Reconferido em 13/10 no HTML público: 13 anos, com autorização do responsável para menores de 18.
- [x] Publicar as funções google-play-purchase e mercadopago *(Claude)* — 28/10: publicadas. google-play-purchase versão 8 e mercadopago versão 40, com os preços novos e o anual reconhecido pela resposta da Google.
- [x] Rodar o SQL dos planos e das fichas *(Afonso)* — 28/10: rodados os dois (planos de outubro e fichas de vínculo). Conferido com a chave pública: as funções das fichas respondem 'permission denied' (existem), e uma inexistente responde 404.
- [x] Renovação automática da Play não estende o plano *(Claude)* — 28/10: corrigido. Cada cobrança da Play é um pagamento (token:pedido), a validade vem da Google, a carência conta como ativo e o app confere as assinaturas ao abrir (a cada 6h). SQL rodado e função publicada. A conferência no app entra no AAB 121; renovação real só se vê com assinatura de verdade.
- [x] AAB 113: subir na Play e passar o Luigi para ele *(Afonso)* — 18/10: o Afonso subiu na Play. Superado pelo 114.
- [x] AAB 114: subir na Play *(Afonso)* — 19/10: gerado e assinado (a1e17b3), sem skins, mentoria e vagas de vínculos. 20/10 (Codex): o próximo a subir é o 115, que junta tudo depois do checkpoint.
- [x] Push e AAB 120 com o que ficou depois do 119 *(Claude)* — 27/10: push feito (6da1dc4b) e AAB gerado em Downloads/Glyph-1.0.120-120.aab, versionCode 120, assinatura conferida. Leva a experiência Essencial inteira, PWA, agenda de campanha, leitor do diário, capas e filtro da loja. Falta subir no Play Console e conferir o Essencial com conta logada (ap-experiencia-essencial).
- [x] Push e AAB 121 (planos de outubro, renovação, EXP, escada nova) *(Claude)* — 28/10: push feito (ca522f0d) e AAB em android/app/build/outputs/bundle/release/Glyph-1.0.121-121.aab, versionCode 121, assinatura conferida. Leva: plano anual, renovação automática da Play conferida ao abrir, fichas de vínculo, Leitura Premium, loja e ícones novos, preços das campanhas, EXP = minutos (só a difícil ×1,1), Lazer fora da régua (só Livre não dá EXP), escada 6k/20k/50k/100k/150k/250k/400k/650k/1M. Planos-base 'anual' ativados pelo Afonso (28/10). Subido no Play Console. Falta testar uma compra com conta logada (c1 e c3 da planilha).
- [x] Reembolso nos Termos (7 dias) *(outra IA)* — Publicado (Codex). Texto de 7 dias e encaminhamento ao Google Play no HTML público em 13/10.
- [x] Teste do Glyph com um amigo (planilha no claude.ai) *(Afonso)* — Feito pelo Luigi no 112 (achados passados de boca, não pela planilha). Tudo corrigido e no 114: idade não salvava no cadastro (perfil da conta nova) e Sair da conta (a5da99e + SQL 20261018100000), diário sem internet apagando texto + fila (ae96664, 5d1ff65), vibração no arraste com a vibração desligada (1152cae). Opcional: uma passada rápida no 114 nos modais novos, no jardim (saquinho, guia, tamanhos) e no widget, que ele não viu.
- [x] Resend: resolver o 401 do teste e comprovar que o e-mail chega (recuperação de acesso) *(outra IA)* — 16/10: resolvido pelo Codex; o Afonso confirmou que o e-mail chegou. O Luigi confere de novo no D9 (recuperação e "Conta excluída").
- [x] Subir o AAB 111 na Play (ou pular direto para o 112) *(Afonso)* — Pulado: o Afonso subiu o 113 (18/10) e o 114 já está gerado.
- [x] Conferir se o código VANGUARDA25 existe *(Afonso)* — 10/10: VANGUARDA10 apagado; VANGUARDA25 valendo, 25 vagas, 1 por pessoa, agora 25 de ouro e sem o programa de 14 dias (sql/vanguarda25-sem-programa.sql rodado).
- [x] Site: contador "guerreiros na fila" quebrado *(outra IA)* — Corrigido e publicado (Codex): chama get_waitlist_count(), rótulo “inscrições recebidas”. Reconferido em 13/10.
- [x] Exclusão: finalizar o pedido pelo site e a retomada da limpeza parcial *(outra IA)* — 16/10 (Codex): exclusão pelo site e retomada automática implementadas e publicadas. Teste real com conta descartável concluiu o protocolo 102 e confirmou a remoção do login, do perfil, dos dados e do arquivo. O e-mail de confirmação depende do item do Resend. Detalhes em docs/2026-10-16-fechamento-exclusao-widget-push.md.
- [x] Resend: e-mails da exclusão, plano e limites, e a cobrança de US$ 10 *(outra IA)* — Painel e SMTP conferidos em 12/10 (Codex); o adicional antigo o Afonso já removeu; resend v18 e account-delete v29 publicados.
- [x] Site: revisar contadores, Termos, prints e posts e publicar *(outra IA)* — Landing a294b4b publicada (Codex). Reconferido em 13/10: Home, Termos, script.js, Novidades e exclusao.html no ar. O pedido de exclusão pelo site segue à parte.
- [x] Rodar a migração 20261002140000_public_landing_stats_v2.sql (totais do site) *(Afonso)* — 12/10: já estava rodada (Afonso); o Codex reconferiu: get_landing_stats_v2 responde 200.
- [x] Rodar a migração 20261012160000_landing_stats_include_gm.sql (contadores do site contam os perfis gm) *(Afonso)* — 12/10 (Codex): o filtro role='user' deixava de fora 2 perfis gm, 32 arenas e 332 ações concluídas. Esperado depois: 5 perfis, 38 arenas, 336 ações. Não precisa de AAB.
- [x] Site novo no roteiro do Afonso, com as peças reais do app *(Claude)* — 23–25/10, publicado no glyph-landing (b7ea772 e 83517cc). Home em 3 telas com ímã (topo, as 5 áreas interativas, novidades e comentários) e cada aba em 2 telas com destaques reais do app; Funcionalidades em grade com filtro; página Premium com os planos oficiais; Waitlist fora de todas as páginas; fundo na cor da aba; Home na barra de baixo. Comentários: formulário grava em testimonials_feedback e só aparece com is_approved = true (testado de ponta a ponta; o de teste já foi apagado). Selos oficiais do Google Play e da App Store prontos e desligados: no lançamento, GLYPH_NA_LOJA = true em mvp.js (e conferir o link play.google.com/store/apps/details?id=life.glyph.app); GLYPH_NA_APP_STORE só quando houver app na App Store. Faltam prints: por dentro de um ativo, cadastro de ação, Vínculos e modal de conquista secreta.

</details>

## App

- [ ] Arena com muitas ações fica lenta em celular mais fraco *(Claude)* — 31/10: suspeita de re-render. Cada ação da miniatura chamava useGame() e refazia buscas (getArenas, getClanQuestForActionName) por conta própria, então tudo redesenhava a cada mudança do app. A ActionIcon da miniatura deixou de fazer essas buscas (commit a enviar; ainda usa useGame para a cor). Falta medir no celular fraco antes de mexer no resto (ArenaCard, PlannerView). Sem medição não dá para afirmar que é isso.
- [ ] Arena com meta final: concluir, parabéns, estrela e Finalizadas *(Claude)* — 26/10 (8d7da34 e 22557e5, sem push): meta final opcional ao criar e editar; Concluir arena (e Concluir e criar cópia) com toasts; parabéns 'Meta concluída!' no modal de feitos com o tempo até concluir e compartilhar só se quiser; concluída opaca com estrela na grade até Guardar nas Finalizadas; painel Finalizadas e Arquivadas; Reabrir precisa de vaga. Regras: concluída libera vaga, ações param, no ciclo conta só o feito. Campanha concluída ganha estrela no histórico e refaz pela biblioteca. SQL 20261026120000 rodado pelo Afonso (conferido). Teste arena-finalizada passa. Falta: ver na tela (no próximo AAB) e push.
- [ ] Talvez: algoritmo de recomendação de amigos e de posts do Reino *(Claude)* — 02/11: hoje o Reino são os 80 posts mais recentes de quem não é amigo, nem do clã, nem você, em ordem de data, sem peso nenhum (HallOfFameView + fetch em GameContext). Ideias para quando for: peso por curtidas e pela nota do ciclo, variar os tipos de post e sugerir amigos por área da vida parecida ou por clã. Nada decidido.
- [ ] Jornada de temporada perde conclusões com mais de 3 meses *(Claude)* — 26/10: o progresso da jornada (ex.: O Andarilho, 20 caminhadas) é contado das tarefas carregadas no app, que são só os últimos 3 meses. Se a jornada passar disso, as primeiras conclusões somem da conta. Resolver contando no servidor ou carregando todas as tarefas da ação da jornada. Baixa urgência se a temporada for menor que 3 meses.

<details><summary>Feitos (53)</summary>

- [x] AAB 112 (só quando o Afonso pedir) *(Afonso)* — Superado pelo 113 e pelo 114 (20/10).
- [x] Diário sem internet: texto sumia quando a rede voltava — achado do Luigi *(Claude)* — 18/10 (ae96664 + 5d1ff65, vão no 113): falha de leitura era tratada como página vazia, e com a rede oscilando a entrada nova era gravada sozinha por cima da página (o texto antigo sumia); o editor abria a página em branco sem rede e o Voltar saía sem esperar gravar; a bolinha do humor mudava antes de gravar e voltava. Agora: sem ler não grava; o editor avisa "Sem internet" e mantém o texto; e o Registrar sem internet manda a entrada para uma FILA no aparelho, que sai sozinha quando a rede volta (ao abrir o app, ao voltar do fundo, a cada minuto), na ordem e uma vez. Planilha do Luigi (M6) e SMOKETEST atualizados.
- [x] Onboarding novo: fechar e commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Campanhas: biblioteca, progresso entre ciclos e correções (Codex) *(outra IA)* — 16/10: o Codex terminou. O Claude conferiu: o build compila e 131 de 134 testes passam (falham a-mao-ganha-do-oraculo e luz-e-placa, que são antigos, e apagar-conta, que ainda lê o arquivo antigo depois que a exclusão foi para _shared/accountDeletion.ts; é com o Codex). Os textos da planilha e do SMOKETEST foram ajustados ao app: card "30 dias · 5 ações · 2 arenas" e "Arena liberada — Abrir". O trabalho ainda não foi commitado; precisa estar antes do AAB 112.
- [x] Planner tremia com o celular (sensor de movimento) *(Claude)* — 21/10 (57de1f4): achado do Afonso. O App escutava o sensor de movimento o tempo todo e reescrevia --tilt-x/--tilt-y no <html> a cada leitura; a página inteira recalculava o estilo a cada mexida do celular. Ninguém usava essas variáveis (a inclinação já estava desligada); a escuta saiu. Não está no 115: vai no próximo AAB.
- [x] Planner sem tremer: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Campanhas no banco real: percorrer tudo com uma conta de teste *(outra IA)* — 16/10 (Codex): migração 20261016120000_campaign_run_task_id_compatibility aplicada; corrigidas comparações em finish_campaign_run. Teste com conta descartável passou: recusa conclusão incompleta, conclui entre ciclos, arquiva, guarda histórico e biblioteca, tira as pendências futuras e reinstala do zero. Conta removida. Evidência: output/campaign-library/live-report.json. Falta só compra real e instalar pela tela no Android: fica com o Luigi (M11, M12, D10–D12).
- [x] Botão do ciclo no planner e na ArenaView: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Missão de temporada, de clã e campanha contam só para o bem no ciclo *(Claude)* — 19/10 (1a5b3a8): entram como prometido = feito, só com o que caiu dentro do ciclo. O que faltou não pesa; o feito vale como ação, dia ativo e horas na nota. Não viram meta a selar. Quem faz só campanha deixa de ficar com 0%. Ciclos fechados não mudam. Antes, nem as missões ajudavam na nota de verdade (o bônus delas só alimentava a nota antiga). Vai no próximo AAB. A leitura do ciclo do Oráculo também foi ajustada: só vale depois de republicar a função oracle.
- [x] Modal de arena e de ação: conferir no aparelho (Codex integrou) *(outra IA)* — 16/10 (Codex): integrados no código ActionModal, ArenaDetailModal, ArenaCard e NewArenaModal, com quatro abas (Geral, Contexto, Checklist, Mídia), slider de duração por etapas com campo numérico, rolagem interna no texto e no checklist e botões dourados. A agenda nova respeita as repetições e o fim do ciclo. Falta conferir na tela: tamanhos, teclado e cortes (o navegador dele não abriu o arquivo). Está na planilha do Luigi como M13. 16/10 (Claude): botões − e + nas Repetições (prop comBotoes no StyledRangeInput, estilo .action-step em components/action-layout.css, teste acao-repeticoes-mais-menos). Ficou sem commit porque se apoia no ActionModal novo do Codex, que ainda não foi commitado: entra junto no commit dele.
- [x] Refinar o widget do planner *(outra IA)* — 21/10: feito pelo Codex (GlyphDayPaint, GlyphDayWidgetProvider, utils/widgetPlanner.ts), aprovado pelo Afonso e commitado em afa4317. O teste widget-planner-do-dia passa. Entra no AAB 116.
- [x] Widget (rótulo do dia): fechar a mudança e o teste *(Claude)* — Ok do Afonso em 10/10.
- [x] Lote de 22/10: campanhas e arenas, ordem do planner, Jardim Zen e Maestria *(outra IA)* — Codex, commit 703a84e: cartão de campanha compacto alinhado à miniatura de arena (percentual no rodapé, arenas internas na faixa, gradiente das arenas); ordem de execução do planner com emoji, nome, arena, duração e horário, e ação futura arrastável sem erro de conclusão; Jardim Zen entra sem abrir o editor (Editar e Expandir separados; loja separa ver de comprar); Maestria com índice dentro do pentágono e o Avaliar na tela interna. Falta conferir no aparelho, no 116.
- [x] Editor do Soberano: fechar a mudança e o teste *(Claude)* — Ok do Afonso em 10/10. O teste luz-e-placa-do-soberano ainda acusa o slot do artefato fora do lugar.
- [x] AAB 110 *(Afonso)* — 12/10: AAB 110 gerado pelo Codex (6b33f9a) em android/app/build/outputs/bundle/release/Glyph-1.0.110-110.aab, com tudo até o cartão do ciclo mais baixo (329d540). Falta subir no Play.
- [x] Planner de 25/10: lembrete e nota por ocorrência, Marco hexágono, Livre pílula *(outra IA)* — Codex, commit 9b745db. Cada ocorrência pode ter nota própria (até 140 caracteres) e lembrete próprio; Marco vira hexágono na cor da arena, ação Livre vira pílula tracejada enquanto agendada, sininho em quem tem lembrete. SQL 20261025120000 e 20261025130000 no banco (conferido pela chave pública em 25/10: as colunas instance_note, reminder_enabled e reminder_minutes existem). Falta conferir no aparelho, no 116.
- [x] Amigos, clã, parceria e mensagens sem perfil (fantasma / desconhecido) *(Claude)* — Consertado no código (commit c52de66). Causa: a migração de 29/09 fechou a leitura do perfil dos outros.
- [x] Widget do dia imita o planner de 25/10 *(Claude)* — 25/10 (c6eb60e): o widget passou a desenhar Marco como hexágono na cor da arena, ação Livre como pílula e o sininho de lembrete, com a mesma regra do planner; cantos iguais aos do planner. Teste widget-planner-do-dia cobre e passa; Java compila. Não visto na tela: entra no 116.
- [x] Rodar a migração 20261009090000_cartoes_publicos_em_lote.sql *(Afonso)* — Rodado em 09/10. Chega no celular com o AAB 109 (ou no site publicado).
- [x] Catálogo de emojis com ~90 opções por área *(outra IA)* — 25/10: troca começada pelo Codex (que acabou os tokens no meio), conferida e commitada pelo Claude (8f36e79). Sem repetidos nem emoji quebrado; teste da busca passa. Os emojis novos aparecem na grade; só os que já tinham palavras cadastradas são achados pela busca.
- [x] Relatório do ciclo: seção Hábitos consolidados *(Claude)* — 26/10 (72f856d): entrou na página Marcas do ciclo do relatório (sem página nova): ações feitas 6+ dias por semana com 90%+ do agendado; treino e trabalho de 5 dias ficam de fora sem contar como falha; ciclo de menos de 7 dias não tem base. Teste habitos-consolidados passa, TypeScript sem erro. Vale para ciclos fechados a partir do 116 (os já fechados não têm o dado). Não visto na tela ainda.
- [x] Toast do baú: só "+1 baú raro", sem "adicionado" *(Claude)* — Commit d9b1bc9. Vale para o modal de recompensa e o fim de ciclo.
- [x] Missão individual: conferir se completa sozinha ao cumprir e se fecha sozinha no fim do prazo *(Claude)* — Comportamento atual (desde b3f19de, 09/10 à noite): ao cumprir, a individual ESPERA na aba Missão, com aviso do Oráculo e bolinha, e a pessoa recebe lá. O recebimento sozinho (8763253, 09/10 de manhã) foi desfeito. Fecha sozinha no fim do prazo nos tipos que têm prazo (volume e primeira).
- [x] Conferir: missão de quest (ex.: Caminhada do Andarilho) não zera ao fechar o ciclo *(Claude)* — 26/10, conferido no código: fechar o ciclo não zera a jornada. O progresso conta todas as conclusões da ação da jornada em tasks, sem recorte de ciclo, e o endCycle não apaga tarefa nem ação. RISCO à parte: o app carrega só os últimos 3 meses de tarefas; uma jornada que se arraste por mais de 3 meses perde as conclusões mais antigas na contagem.
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
- [x] Ciclo: a barra de tempo inclui o dia atual *(outra IA)* — Commit 993064d. Vai no AAB 109.
- [x] Ciclo e resumos alinhados à virada das 4h *(outra IA)* — Commit 5749288. Vai no AAB 109.
- [x] Egress de abertura: baixar cada vez menos a cada vez que o app abre *(Claude)* — Passo 0 FEITO em 11/10 (eb14cbf): o app mede quanto baixa em cada abertura (ler com supabase/CHECK-peso-das-aberturas.sql). Medido em 12/10 (CHECK-o-que-a-abertura-baixa.sql): 325 KB por abertura — relatórios fechados 131 (atlas semanal 111), tarefas 99, inventário 43, perfil 25 (garden_state 19). Passo 1 FEITO (35da095): relatórios fechados guardados no celular, só desce o novo ou mudado (−130 KB). Passo 2 FEITO (bb107b6): tarefas e inventário sem user_id, perfil sem garden_state (−46 KB). Os dois SQLs rodados pelo Afonso em 12/10, CHECK-egress-de-abertura.sql deu tudo true. O ganho chega no celular com o AAB 111. Próximo: janela de 3 meses de tarefas (99 KB) e cópia no celular com delta.
- [x] Planner: vibração e fluidez ao arrastar, segurar e concluir *(outra IA)* — 13/10 (Codex), local e sem commit: rolar antes de pegar, limiar menor depois de pegar, cancelamentos limpos, borda gradual; Oráculo espera 650 ms de pausa. A sensação tátil só se confere no aparelho (AAB 112).
- [x] Onboarding: nome já preenchido e faixa etária antes do propósito *(outra IA)* — Codex, 11/10. Vai no AAB 110. A faixa declarada não comprova idade.
- [x] Planos sem baús, e renovação com ouro sem pagar duas vezes *(outra IA)* — Codex. Afonso rodou 20261011010000 (dez verificações OK). Vai no AAB 110. O teste reward-routing ainda espera o baú antigo do plano e falha.
- [x] Rodar a migração 20261012150000_convite_e_missao_com_5_dias.sql *(Afonso)* — 12/10: rodada a versão final pelo Afonso (antes tinha rodado a anterior, de 5 dias no convite).
- [x] AAB 111 (só quando o Afonso pedir) *(Afonso)* — Gerado em 12/10 às 23:33 (ce54428): convites, Cinco dias, widget do ciclo, egress passos 1 e 2, missão de clã, cards dos Feitos, nickname, feed em duas abas e o Diário novo. O que foi feito em 13/10 vai no 112.
- [x] Clã: mexer antes do lançamento *(Afonso)* — 12/10: FEITO no código (af67b81..92c9f9d, com a revisão final aplicada): missão de clã da temporada com Entrar (na tela do clã e na Temporada), arena por participante com tag de clã, total do grupo contado no servidor (desmarcar baixa), baú Raro só para quem entrou, sair do clã ou abandonar = o que depositou fica no grupo, não leva nada para o clã novo e não recebe o baú (d16e5f3); humor de quem nunca registrou aparece vazio; meta vem do servidor; Aurora II ficou sem missão de clã, vencida sem meta some (arquiva). Teste: Socializar ×20 na Genesis. Na Sede: cartão da missão + barrinha de humor embaixo do nome de cada soberano (só o próprio clã vê). SQL rodado e conferido pelo Afonso em 12/10 (CHECK-missao-de-cla.sql tudo true). Chega no celular com o AAB 111. Próximo: aviso do Oráculo quando o grupo bate a meta. Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md.
- [x] Rankings e interatividade: mexer antes do lançamento *(Afonso)* — 13/10: a parte de ranking virou as tags Top 1/5/10% (Codex, com o Afonso). Ver ap-media-exp-diaria e docs/2026-10-13-ranking-e-media-exp.md.
- [x] Rodar o SQL do nickname único *(Afonso)* — 12/10: rodado pelo Afonso (check vazio + migração 20261012210000). Nome único sem diferenciar maiúsculas, até 20 caracteres; primeiro acesso com o primeiro nome e aviso vermelho; Configurações pergunta antes. Tela chega no próximo AAB. Commit 6db20b8.
- [x] Média de EXP diária da conta no relatório do ciclo e no Painel Diário (depois) *(Afonso)* — 13/10: feito pelo Codex com o Afonso, junto com as tags Top 1/5/10% (ciclo, maestria e clã). SQL 20261013200000_progress_recognition rodado. Código local, ainda sem commit; vai no AAB 112. Regras: docs/2026-10-13-ranking-e-media-exp.md. Tags só aparecem com 100+ jogadores elegíveis.
- [x] Quiz de campanha: saiu da loja, virou Buscar campanha no Oráculo *(Afonso)* — 13/10: decidido. Quiz fora da loja (lá ficam busca e filtros), botão Buscar campanha na aba Missão do Oráculo, só catálogo pago, nada de campanha grátis nem para iniciante (0e6049e). Fichas antigas ainda valem.
- [x] Perfil: compartilhar e copiar nickname *(outra IA)* — 13/10 (Codex), local e sem commit: cartão compartilhado com “Me adicione no Glyph!” e o nickname; botão Copiar nickname embaixo do nome. Vai no AAB 112.
- [x] Conquistas secretas na hora do evento *(outra IA)* — 13/10 (Codex), local e sem commit: Imperável e os outros grupos reagem ao evento confirmado, com fila e isolamento de conta. docs/2026-10-13-segredos-por-evento.md. Vai no AAB 112.
- [x] Itens repetidos: posse e conversão em fragmentos *(outra IA)* — 13/10 (Codex), local e sem commit: baú, missão e segredo mostram “Você já possui”, bônus separado da conversão, tier 6 com 3.000 fragmentos. Vai no AAB 112.
- [x] Zoom do dia inteiro e widget Resumo/Planner *(Claude)* — 13/10 (Claude, 185428e/0c157c0). O widget abre o planner e não conclui ações. Depois do AAB 111: vai no 112.
- [x] Sem pay-to-win, coroa, mentoria e Buscar campanha *(Claude)* — 13/10 (Claude, 19e714e..4e26d07): planos e loja sem EXP extra, Premium com 20 arenas, coroa no mini card e no perfil dos outros, mentoria sem trava, Platinum sem ficha, Buscar campanha no Oráculo levando à loja. SQLs rodados. Vai no 112.

</details>

## Oráculo

- [ ] Oráculo da manhã: projeção das ações em risco no ciclo *(Claude)* — 25/10, do raio-x dos dados do Afonso: comparar o feito com o prometido de cada ação e projetar até o fim do ciclo (ex.: 'Leitura: 4 de 12, faltam 7 dias; no ritmo atual, fecha com 6'), com sugestão de horário pela janela em que a pessoa mais conclui. Com FOLGA: só avisar quando a projeção fica bem abaixo do prometido (ex.: abaixo de 85% e faltando 2 ou mais); se falta pouco, a pessoa ainda compensa ou só não marcou, e não merece dica. Mexe no Oráculo: combinar com o Codex antes.
- [ ] Fala do Oráculo ao abrir o app: trocar por algo que todo mundo queira ver *(Claude)* — 25/10: o Afonso não lê a fala de abertura ('sou apressado'). Não basta tirar: pensar algo rápido e legal para todos (uma linha com o dado útil do dia, ou algo visual de 1 segundo). Ideia a desenhar; combinar com o Codex (Oráculo).

<details><summary>Feitos (18)</summary>

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
- [x] Aviso do Oráculo quando o clã bate a meta *(Claude)* — Retirado por decisão do Afonso (13/10): o modal de recompensa já cobre esse momento. Fica o aviso da missão individual, que é resgatada à mão.
- [x] Dicas do Oráculo (o “garoto-propaganda” dos recursos) *(outra IA)* — 14/10 (Codex), local e sem commit: Maestria, Diário, Vínculos, Campanhas, Arsenal/Soberano, Jardim e Sabedoria, no balão de abertura com botão; ritmo por conta e aparelho; sem push, sem clã. Sem SQL novo. docs/2026-10-13-handoff-dicas-do-oraculo.md. Vai no 112.

</details>

## Arte

<details><summary>Feitos (10)</summary>

- [x] Borda Soberano no app e no banco (SQL rodado) *(Claude)*
- [x] Commitar a conversão para WEBP (borda e catálogo) *(Claude)* — Commitado em 09/10 (d1c53b3).
- [x] Commitar os 10 fundos de patente (WEBP) *(Claude)* — Commitado em 09/10 (d1c53b3).
- [x] Ajustar o enquadramento de cada fundo de patente *(Afonso)* — Conferido pelo Afonso em 10/10.
- [x] Conferir os 7 fundos de clã nas telas reais *(Afonso)* — Conferido pelo Afonso em 10/10.
- [x] Catálogo acima do teto de tamanho (14,8 MB de 12) *(Claude)* — 10/10: teto subiu de 12 para 18 MB de propósito (03f61f7); a pasta está com 14,8 MB. Teste egress-estatico passa.
- [x] Skin Chuva mudou de arquivo e o teste do catálogo acusa *(Claude)* — Fica. O teste acusava só a lista de tamanhos, desatualizada desde a arte das mãos de 23/09 (15 roupas). Lista atualizada em 10/10 (52d3592); encaixe conferido nos 4 corpos.
- [x] Gerar as artes das próximas temporadas *(outra IA)* — 12 peças de Zênite I, Eclipse I, Égide I e Aurora II integradas (Codex), no AAB 111. Falta o conteúdo das temporadas (skin, tema e jornadas) antes de ativá-las.
- [x] Skins das temporadas integradas *(outra IA)* — Commit aa22424 (Codex), SQL rodado pelo Afonso em 20/10, no AAB 115.
- [x] Temporadas futuras: coleções completas *(outra IA)* — 21/10 (Codex): Zênite I, Eclipse I, Égide I e Zênite II com a coleção completa (skin, borda, banner, insígnia e tema), três jornadas cada (Baús Míticos) e um selo final. Zênite II ganhou moldura, banner e insígnia. Tudo desligado para jogadores. SQL 20261021110000 executado pelo Afonso; commit afa4317.

</details>

## Marketing

- [ ] Artes para Instagram e TikTok *(artista)*

<details><summary>Feitos (2)</summary>

- [x] Criar códigos de resgate novos *(Afonso)* — 22/10: não vão sair códigos novos. Os do cofre (sql/cofre-de-cupons.sql) ficam desligados por enquanto.
- [x] Segredos no marketing *(Afonso)* — 22/10: não precisa; as missões secretas já cumprem esse papel.

</details>

## Git

- [ ] Commitar egress: feed só com tela à vista + tarefas antigas da cópia do celular (vão no próximo AAB) *(Afonso)* — 26/11: abertura medida em ~495 KB (era 48 em set/09) e crescendo; 247 KB eram 3 meses de tarefas. Agora os últimos 14 dias descem sempre e o resto vem da cópia no celular por impressão de cada dia (~4 KB). Migração 20261126120000_impressao_das_tarefas rodada e conferida. Feed social parou de recarregar em segundo plano. 190/190 testes, tipos e build ok. Sem commit; também sobe @capacitor/android para 8.3.6+ (alerta crítico GHSA-rvm3-566m-v7fv) no próximo AAB.

<details><summary>Feitos (4)</summary>

- [x] Republicar a função oracle *(outra IA)* — 22/10 (Codex): publicada no projeto klmsdcncmhtgnlcejzdi. A leitura do ciclo do Oráculo agora segue a regra nova de missão e campanha (1a5b3a8). Token temporário de deploy removido do ambiente local.
- [x] Subir os commits para o GitHub *(Claude)* — 46 commits no GitHub em 09/10.
- [x] Limpeza restrita do banco (backups vazios, user_assets, handle_new_user) *(outra IA)* — 12/10: Afonso rodou 20261011180000. Pentágono e slots preservados. Não ampliar sem comprovar desuso.
- [x] Lembretes: tirar da chave pública a função que enfileira avisos *(Claude)* — 25/10: resolvido. SQL 20261025150000_lembretes_so_pelo_agendador.sql escrito pelo Claude e rodado pelo Afonso (anon false, authenticated false, service_role true). Conferido com a chave pública: agora responde 401 permission denied. Os lembretes continuam saindo pelo agendador do banco (glyph-enqueue-action-reminders), que não depende desse grant.

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
- [x] Limpeza de segredos: auditoria das nove funções publicadas em 16/10 não encontrou referências a `OPENROUTER_API_KEY` ou `OPENROUTER_MODEL`. Afonso confirmou a remoção dos dois segredos; as demais configurações personalizadas têm referências no código publicado e foram mantidas.
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
- SQL 20261017210000_garden_basket.sql confirmado executado pelo Afonso. Compilado com sql:checa e executado em teste PGlite; a confirmação remota registrada aqui vem do Afonso.
- TypeScript, build do jardim, build principal, regressão SQL da cesta, terreno e areia passaram. Navegador validou demonstração isolada (sem crédito real), visita e erro de coleta. Sem AAB nem subida de versão.
- Detalhes: docs/2026-10-17-jardim-cesta-implementacao.md. Prévia: output/garden-basket/index.html.

- Ajuste visual aprovado em 17/10: cesta substituída por saquinho clicável na entrada; sem abertura automática nem botão flutuante. Cordão/selo verde (5–9), azul (10–15) e dourado (baú). Recompensas e SQL não mudaram.


### 18/10 — Retomada: expansões, fragmentos do Painel e emojis

- Afonso aprovou sete expansões sequenciais por 80/140/220/320/450/650/900 fragmentos. Original/Amplo preservados; compra permanente, sem mover peças/desenhos. Implementação local e testes PostgreSQL passaram.
- Regra final do Painel: 1 fragmento por 50 EXP crua, piso inteiro, teto 15; ao abrir o dia encerrado. Sem média pessoal, 12 na média ou mínimo de 8 (proposta rejeitada). Comprovante único e linha quadrada no estilo de recompensa.
- Biblioteca: 315 emojis, busca em português e Todos; seletor nativo acima dos modais. Guia versão 2 com personalização atualizada.
- SQL de jardim/fragmentos confirmado executado pelo Afonso: 20261017210000_garden_basket, 20261017220000_garden_expansions e 20261017230000_daily_fragments. Sem AAB, subida de versão ou publicação nesta rodada.
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

### 21/10 — Recado do Codex: coleções das temporadas futuras concluídas

- Zênite I, Eclipse I, Égide I e Zênite II agora têm, no código local, a regra completa de coleção: skin, borda, banner, insígnia e tema; cada temporada recebeu três jornadas que entregam Baús Míticos e um selo final que entrega insígnia + tema.
- Zênite II ganhou suas três artes faltantes (moldura, banner e insígnia) em `public/assets/catalog/interface/`. As coleções permanecem futuras e desligadas; nada foi antecipado para jogadores.
- Migração `supabase/migrations/20261021110000_future_season_collections.sql` executada pelo Afonso. Ela cadastra os quatro temas e as três peças de Zênite II com `is_live_in_game = false`.
- Revisão visual local aberta em `output/temporadas-2027-completa/revisao.html`. TypeScript, `test:item-art` e `sql:checa` passaram. Commit afa4317; sem AAB ou publicação nesta rodada.

### 22/10 — Feito localmente; falta checkpoint para o AAB 116

- [x] Campanhas e arenas: cartão de campanha compacto alinhado à miniatura de arena; percentual no mesmo rodapé, arenas internas na faixa de ações e gradiente formado pelas arenas. Prévia local atualizada.
- [x] Planner: ordem de execução ganhou a leitura por emoji, nome, arena, duração e horário; ação futura pode ser arrastada sem disparar erro de conclusão.
- [x] Jardim Zen: entrar não abre mais o editor; Editar abre o modo de manipular itens, e Expandir abre a aba. Loja separa Ver peças/Ver composição dos botões de compra com ouro ou fragmentos.
- [x] Maestria: cartão externo visual com índice dentro do pentágono e textura; tela interna concentra o botão Luxe Avaliar. O desenho mostra o limite máximo em traço discreto.
- [x] Social e Legado: criar/entrar em clã não cobra ouro; primeira cena do Legado é grátis para cada conta, sem exigir Premium. Cenas extras preservam 50% off no Premium e 70% off no Platinum. Afonso confirmou a migration `20261022120000_cla_e_primeira_cena_gratis.sql` executada.
- [ ] Fazer checkpoint/commit do lote de 22/10 e então incluir tudo no AAB 116. As prévias e testes locais não substituem a conferência Android.
