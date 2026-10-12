# Prompt — o apelo do social no Glyph (12/10/2026)

Cole o bloco abaixo numa IA que já conhece o Glyph.

---

Quero ideias para dar apelo às telas sociais do Glyph — **Clã**, **Feitos** (o feed) e **rankings/interatividade** — antes do lançamento. Você já conhece o app; aqui vai o que você não sabe: como eu uso, o que eu quero e o que está desligado.

**Como eu uso de verdade.** Abro o app umas 5 vezes por dia, marco as ações no planner e saio. Nunca entro no clã nem nos Feitos, e não tenho vontade de entrar. Não mexo no Soberano. Jardim e humor eu acho legais, mas não uso todo dia. O planner é o centro, e o social hoje não me dá nada que o planner já não dê.

**O que eu quero que o social entregue, nesta ordem:**
1. **Dopamina** — um momento bom, curto, que dá vontade de repetir.
2. **Reconhecimento** — alguém vê e comemora o que eu fiz.
3. **Cooperação** — uma meta em grupo em que eu faço a minha parte.

Competição e cobrança ("alguém percebe quando eu falho") não são o foco. Ranking pode entrar, mas a serviço disso — por exemplo, ranking de grupo, não pessoa contra pessoa.

**O que existe hoje:**
- **MUNDO › Social** tem três abas: *Pessoas* (amigos, solicitações e Conexões — parceria, mentoria e competição entre duas pessoas), *Mensagens* (conversa direta) e *Clã*.
- **Clã:** nome, emblema, patente do clã com barra de EXP, uma sede que muda com a patente, as pessoas do grupo (silhuetas dos Soberanos), pontos da temporada e o legado do grupo. O clã ganha pontos quando os membros fecham ciclos. Na prática, entrar lá não muda nada.
- **Feitos:** lista de conquistas (ciclo fechado, patente, nível, arena concluída, missão), com filtros Reino / Grupo / Aliados. Dá para curtir.
- **Convite de amigo:** cada um tem um código; o amigo ganha 10 de ouro e os dois viram amigos.
- **Ranking de verdade não existe.**

**O que está desligado de propósito** (`constants/featureFlags.ts`):
- `clanMissions` (missões do clã), `clanSharedActions` (ações compartilhadas), `clanChat` (chat do clã) — desligados.
- `clanSanctuary` — a **Aldeia**: mapa de seis pontos, presença e saúde que decai, cuidar de um ambiente em grupo. Eu gosto da mecânica, mas achei a ideia "muito adolescente" para o momento do app. **Está guardada, não morta**: não proponha apagar; religar é virar a flag. Pode propor reaproveitar a mecânica com outra cara.
- `relationshipLegacyHub` — desligado. `relationshipCompetition` e `personalGarden` estão ligados.

**Regras que não mudam:**
- **Prêmio não pode ser farmável.** Conta falsa é barata; o convite paga só 10 fragmentos, baú Comum e baú Incomum por isso. Nada de ouro ou item valioso por ação social fácil.
- **A nota do ciclo tem teto de propósito** (placa A pede 90%, 7 dias e 35 h). Não proponha afrouxar.
- **Banco e rede leves.** Estou reduzindo o que o app baixa ao abrir; nada de tempo real pesado ou de baixar a lista inteira dos outros em cada abertura.
- **O lançamento está perto.** Prefira religar e recombinar o que já existe a construir sistema novo grande.

**Uma pista, não uma ordem:** eu já abro o app 5 vezes por dia para marcar. Talvez o social não precise que eu vá até ele — talvez ele precise aparecer onde eu já estou (o momento de marcar, o fim do dia, o fechamento do ciclo). Discorde se achar melhor.

**O que eu quero de volta:**
- De 3 a 5 ideias, da melhor para a pior.
- Para cada uma: o que a pessoa vê; qual é o momento de dopamina; como entra o reconhecimento ou a cooperação; quais peças existentes ela usa (e qual flag liga, se ligar); o tamanho (pequeno, médio, grande); e o risco de farm.
- A sua recomendação de por onde começar, e o que deixar para depois do lançamento.
- Sem código. Se faltar informação, pergunte antes de chutar.
