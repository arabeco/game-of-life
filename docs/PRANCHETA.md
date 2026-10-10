# Prancheta do Glyph

Cópia da prancheta do Afonso (artefato no claude.ai), regravada pelo Claude em 2026-10-10. 15 abertos de 61.

**Não edite as listas abaixo** — elas são regravadas a partir da prancheta. Para avisar algo, escreva em "Recados da outra IA", no fim: o Claude lê e passa para a prancheta.

## Lançamento

- [ ] Idade mínima nos Termos *(Afonso)*
- [ ] Reembolso nos Termos (7 dias) *(Afonso)*
- [ ] Recibo do Google Play: fazer uma compra real de teste *(Afonso)* — O código já valida na API do Google (google-play-purchase) e as credenciais estão no Supabase. Falta uma compra real para confirmar, e a conta de serviço ter acesso no Play Console.
- [ ] Site: banner de cookie *(outra IA)*
- [ ] Site: contador "guerreiros na fila" quebrado *(outra IA)*
- [ ] Teste final: excluir conta *(Afonso)*
- [ ] Teste final: pedir reembolso *(Afonso)*

<details><summary>Feitos (1)</summary>

- [x] Conferir se o código VANGUARDA25 existe *(Afonso)* — 10/10: VANGUARDA10 apagado; VANGUARDA25 valendo, 25 vagas, 1 por pessoa, agora 25 de ouro e sem o programa de 14 dias (sql/vanguarda25-sem-programa.sql rodado).

</details>

## App

- [ ] Planner treme para o lado ao abrir, como se quisesse mudar de página *(Afonso)* — Gravar a tela abrindo o planner e pôr o vídeo na pasta (output/). O Claude tira os quadros e acha o que mexe.
- [ ] Egress de abertura: baixar cada vez menos a cada vez que o app abre *(Claude)* — Medido em 10/10: ~0,4 MB por abertura, quase a conta inteira (388 KB), e cresce com a idade da conta. Carregar o histórico só quando a pessoa abre: relatórios de ciclos fechados, inventário, mensagens antigas do Oráculo. Depois do lançamento; meta é o Grátis aguentar bem mais que ~120 pessoas por dia.

<details><summary>Feitos (21)</summary>

- [x] Onboarding novo: fechar e commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Planner sem tremer: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Botão do ciclo no planner e na ArenaView: commitar *(Claude)* — Commitado em 09/10 (fb05e4e).
- [x] Widget (rótulo do dia): fechar a mudança e o teste *(Claude)* — Ok do Afonso em 10/10.
- [x] Editor do Soberano: fechar a mudança e o teste *(Claude)* — Ok do Afonso em 10/10. O teste luz-e-placa-do-soberano ainda acusa o slot do artefato fora do lugar.
- [x] AAB 109 com tudo isso *(Afonso)* — Gerado em 10/10: android/app/build/outputs/bundle/release/Glyph-1.0.109-109.aab (assinado). Falta subir no Play.
- [x] Amigos, clã, parceria e mensagens sem perfil (fantasma / desconhecido) *(Claude)* — Consertado no código (commit c52de66). Causa: a migração de 29/09 fechou a leitura do perfil dos outros.
- [x] Rodar a migração 20261009090000_cartoes_publicos_em_lote.sql *(Afonso)* — Rodado em 09/10. Chega no celular com o AAB 109 (ou no site publicado).
- [x] Toast do baú: só "+1 baú raro", sem "adicionado" *(Claude)* — Commit d9b1bc9. Vale para o modal de recompensa e o fim de ciclo.
- [x] Missão individual: conferir se completa sozinha ao cumprir e se fecha sozinha no fim do prazo *(Claude)* — Comportamento atual (desde b3f19de, 09/10 à noite): ao cumprir, a individual ESPERA na aba Missão, com aviso do Oráculo e bolinha, e a pessoa recebe lá. O recebimento sozinho (8763253, 09/10 de manhã) foi desfeito. Fecha sozinha no fim do prazo nos tipos que têm prazo (volume e primeira).
- [x] Missão individual: botão pequeno para sair *(Claude)* — Já existia: o botão pequeno "Encerrar" no balão da missão.
- [x] Missão mostra 12/10: travar a contagem ao concluir *(Claude)* — Commit 8763253. Trava no alvo; o que vem depois é da arena.
- [x] Mundo > Temporadas: faixa de quest bem fina, um estilo só, e o clique abre o modal com as recompensas *(Claude)* — Commit 38cb74b. Faixa de uma linha; imagem, descrição e recompensa no modal. Bancada: tools/as-faixas.html.
- [x] Modais de missão: tipo em cima e a descrição igual ao cartão (inicial, Oráculo e conquista secreta) *(Claude)* — Commitado em 10/10 (f418e4b). Chega no próximo AAB.
- [x] Missão inicial "Sete dias no Glyph": abrir o app em 7 dias (não precisam ser seguidos) paga 10 de ouro *(Claude)* — Commitado em 10/10 (4b37938). Chega no próximo AAB.
- [x] Rodar a migração 20261010120000_sete_dias_no_app.sql *(Afonso)* — Rodado pelo Afonso em 10/10.
- [x] Convide um amigo: código no modal de cupom, barrinha com baú Raro no 5 e 25 de ouro no 10 *(Claude)* — Commitado em 10/10 (6a5f3dc). Chega no próximo AAB (110).
- [x] Rodar a migração 20261010150000_convite_de_amigo.sql *(Afonso)* — Rodado pelo Afonso em 10/10.
- [x] Convite, etapa 2: o app aplica o código sozinho quando a pessoa instala pelo link *(Claude)* — Commitado em 10/10 (0ece185). Plugin provado no emulador com R8. O caminho com código só se prova instalando pela Play (versão de teste): está no SMOKETEST, seção 5. Chega no AAB 110.
- [x] Ciclo: a barra de tempo inclui o dia atual *(outra IA)* — Commit 993064d. Vai no AAB 109.
- [x] Ciclo e resumos alinhados à virada das 4h *(outra IA)* — Commit 5749288. Vai no AAB 109.

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

<details><summary>Feitos (1)</summary>

- [x] Subir os commits para o GitHub *(Claude)* — 46 commits no GitHub em 09/10.

</details>

## Recados da outra IA

<!-- Escreva aqui: data, o que foi feito ou o que precisa. Ex.: "10/10 — banner de cookie do site pronto, commit abc123". -->
