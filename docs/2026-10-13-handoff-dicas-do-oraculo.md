# Handoff — as dicas do Oráculo

Para a IA que já cuida das falas do Oráculo (motor v2, `docs/2026-10-08-oraculo-motor-v2.md`).
Decidido com o Afonso em 13/10/2026. **O código das dicas ainda não existe**: esta é a
especificação. As regras de tom de `docs/2026-10-08-handoff-falas-do-oraculo.md` valem aqui.

## O que é

De vez em quando, o Oráculo aponta uma parte do Glyph que a pessoa não está usando, ou
um momento em que vale agir. **Não é vendedor.** É o amigo que conhece o app e lembra
de uma coisa útil na hora certa. Uma dica por vez, com um botão que leva ao lugar.

## As dicas (primeira leva)

| Dica | Quando aparece | Exemplo de fala | Botão leva para |
|---|---|---|---|
| **Campanha** | 3 dias seguidos com o planner quase vazio (≤ 1 ação) **e** a pessoa já fechou pelo menos 1 ciclo **e** não tem campanha instalada em andamento | "Seus dias andam leves. Quer que eu procure uma campanha pronta para você?" | Oráculo → aba Missão → **Buscar campanha** (já existe, ver abaixo) |
| **Maestria parada** | O nível de maestria não muda há 60 dias | "Sua maestria não muda há 60 dias. Quer revisar onde você está?" | Recalibrar a maestria |
| **Maestria nunca avaliada** | A pessoa nunca fez a avaliação de maestria | "Você ainda não avaliou seu nível de maestria. Leva poucos minutos." | Avaliação de maestria |
| **Campanhas na loja** | Já fechou 1 ciclo e nunca abriu a loja de campanhas | "Na loja tem campanhas: arenas prontas, com plano de dias." | Loja → Campanhas |
| **Vínculos** | Tem pelo menos 1 amigo e nenhum vínculo ativo | "Vínculos ligam você a um amigo numa arena: os dois veem o progresso. Experimenta?" | Mundo → conexões/vínculos |
| **Missões da temporada** | Há missões de temporada disponíveis que a pessoa não pegou | "A temporada tem 3 missões disponíveis. É só tocar em pegar, na aba Temporada." | Mundo → Temporada |

## As regras de ritmo (o que impede de virar vendedor)

1. **No máximo 1 dica a cada 3 dias**, somando todas. Dica nunca sai no mesmo dia que um aviso de missão cumprida ou de ciclo fechado.
2. **Cada dica no máximo 1 vez a cada 14 dias.** Se a pessoa tocar no botão, aquela dica some por 30 dias. Se ignorar 3 vezes, ela some de vez.
3. **Iniciante não recebe dica de campanha nem de loja.** A régua é ter fechado o primeiro ciclo. Campanha é coisa avançada; o Afonso foi enfático: *nada de dar ou empurrar campanha para iniciante*.
4. **Nunca em push.** Dica aparece só dentro do app: no feed do Oráculo ("Dia e ciclo") ou na abertura do dia. Notificação fica para a leitura do ciclo, que já existe.
5. **Frase curta, sem preço e sem "compre".** A dica leva até a porta; quem decide é a pessoa.

## O que já está pronto do lado do app

- **Buscar campanha** (commit `0e6049e`): botão na aba Missão do Oráculo (`components/OracleMissionPanel.tsx`) que abre as 7 perguntas (`components/Store/CampaignRecommendationQuizModal.tsx`) e recomenda uma campanha **paga**. O modo "gratuitas" saiu do quiz, e o quiz saiu da loja (lá ficam a busca e os filtros).
- A dica de campanha só precisa abrir o Oráculo na aba Missão. O chat já faz isso quando há missão cumprida (`section === 'mission'` em `components/OracleChat.tsx`).

## O que fica com você

- Onde cada condição é lida (planner, ciclos fechados, maestria, amigos, vínculos, temporada). Tudo isso já está no `GameContext`.
- Guardar o ritmo (última dica, contagem de ignoradas) por conta. Se precisar de coluna nova, escreva o SQL e passe para o Afonso rodar, como sempre.
- As falas finais, no tom do Oráculo. As da tabela são rascunho.
- Avisar o Afonso (ou o Claude) antes de mexer fora dos arquivos do Oráculo.
