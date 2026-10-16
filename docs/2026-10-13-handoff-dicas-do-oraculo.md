# Handoff — as dicas do Oráculo

Para a IA que já cuida das falas do Oráculo (motor v2, `docs/2026-10-08-oraculo-motor-v2.md`).
Decidido com o Afonso em 13/10/2026. **Implementado localmente em 14/10/2026**, no mesmo
motor v2 e canal de abertura. As regras de tom de `docs/2026-10-08-handoff-falas-do-oraculo.md` valem aqui.

## O que é

De vez em quando, o Oráculo aponta uma parte do Glyph que a pessoa não está usando, ou
um momento em que vale agir. **Não é vendedor.** É o amigo que conhece o app e lembra
de uma coisa útil na hora certa. Uma dica por vez, com um botão que leva ao lugar.

## As dicas (primeira leva)

| Dica | Quando aparece | Exemplo de fala | Botão leva para |
|---|---|---|---|
| **Maestria** | Sem avaliação registrada ou última avaliação há pelo menos 60 dias | "Na Maestria, você pode avaliar como está em cada área da vida." | Tela de Maestria |
| **Diário** | Consulta confirmou ausência de página com conteúdo | "O Diário guarda suas anotações e reflexões junto do registro de humor." | Modal de humor, diretamente na aba Diário |
| **Vínculos** | Consulta confirmou amigo existente e nenhum vínculo registrado | "Você pode criar um vínculo com um amigo e acompanhar uma arena juntos." | Modal de Vínculos |
| **Campanhas** | Pelo menos um ciclo fechado, nenhuma arena de campanha e nenhuma marca de primeira campanha | "Campanhas oferecem arenas prontas com um plano de dias. Você pode explorar as opções." | Oráculo → Missão → Buscar campanha |
| **Arsenal/Soberano** | Item disponível, nenhum equipado e nenhuma marca de primeiro equipamento | "Você tem itens no Arsenal. Pode usá-los para personalizar seu Soberano." | Mundo → Arsenal |
| **Jardim** | Recurso habilitado e consulta confirmou nenhum jardim 3D salvo | "Seu Jardim é um espaço que você pode montar e personalizar." | Jardim 3D |
| **Sabedoria** | Preferências carregadas, nenhum tema escolhido | "Na Sabedoria, você escolhe os temas dos cards de reflexão que quer receber." | Oráculo → Sabedoria |

Esta tabela substitui a primeira proposta: sem rastrear telas visitadas, sem dicas de clã
e sem dica adicional de missão da temporada. Há variantes para as quatro vozes.

## As regras de ritmo (o que impede de virar vendedor)

1. **No máximo 1 dica a cada 3 dias**, somando todas. Dica nunca sai no mesmo dia que um aviso de missão cumprida ou de ciclo fechado.
2. **Cada dica no máximo 1 vez a cada 14 dias.** Se a pessoa tocar no botão, aquela dica some por 30 dias. Se ignorar 3 vezes, ela some de vez.
3. **Iniciante não recebe dica de campanha nem de loja.** A régua é ter fechado o primeiro ciclo. Campanha é coisa avançada; o Afonso foi enfático: *nada de dar ou empurrar campanha para iniciante*.
4. **Nunca em push ou no feed.** Dica é uma candidata à mesma abertura temporária do app, com um botão no próprio balão. Nenhuma fila ou agendamento adicional.
5. **Frase curta, sem preço e sem "compre".** A dica leva até a porta; quem decide é a pessoa.

## O que já está pronto do lado do app

- **Buscar campanha** (commit `0e6049e`): botão na aba Missão do Oráculo (`components/OracleMissionPanel.tsx`) que abre as 7 perguntas (`components/Store/CampaignRecommendationQuizModal.tsx`) e recomenda uma campanha **paga**. O modo "gratuitas" saiu do quiz, e o quiz saiu da loja (lá ficam a busca e os filtros).
- A dica de campanha só precisa abrir o Oráculo na aba Missão. O chat já faz isso quando há missão cumprida (`section === 'mission'` em `components/OracleChat.tsx`).

## Integração e prioridade

- `selectSpeech` continua sendo o árbitro. Descoberta tem peso 30: abaixo de retomada (70), concluídas (55), planejadas (45) e estoque cheio (35); acima de estoque comum (25) e abertura vazia (20). Reações mantêm seus pesos e canal.
- Presença, intervalo de abertura, limite diário, gesto/650ms e uma abertura por sessão continuam valendo. Reação recente bloqueia descoberta; descoberta não substitui uma reação aguardando o gesto terminar.
- Sem dica durante onboarding/tutorial, prêmio, perfil/relatório ou outro bloqueio. Missão individual concluída aguardando resgate e ciclo fechado hoje também impedem a sugestão.
- Memória em `glyph:oracle-v2:<conta>`, no mesmo dispositivo. Conta como exibida somente ao chegar ao balão. Clique registra pausa de 30 dias; três exibições sem clique encerram o assunto. A atividade comum não apaga esses registros. Não sincroniza entre dispositivos; limpar o armazenamento reinicia essa memória.
- Diário, amigos, vínculos e jardim usam consultas HEAD de existência, com RLS da própria conta. Não baixam texto do diário nem documento do jardim. Falha de consulta significa desconhecido, nunca ausência. Consulta só quando uma abertura genérica pode ceder espaço; espera limitada a 1,5s. **Sem SQL novo.** Jardim considera primeiro salvamento, não se presume personalização a partir do antigo `garden_state`.
- Navegação usa componentes existentes e passa aba inicial por props, inclusive quando há carregamento tardio. Missão de clã já tem modal de recompensa: aviso extra retirado por decisão de Afonso; aviso de resgate da missão individual permanece.

## Validação e entrega

`tests/oracle-discovery.regression.mjs`: sete elegibilidades, quatro vozes, prioridade, presença, cadência, clique, isolamento de conta, retenção de memória e consultas sem conteúdo.
`tests/oracle-discovery.browser.mjs`: balão real em Edge, gesto, CTA, memória, troca de conta, bloqueio por modal e prioridade da reação pendente, com dados simulados.
Também passaram TypeScript (`npx tsc --noEmit`), build web (`npx vite build`), motor v2, presença, abas do Oráculo, fala temporária e proteção de egress do Diário. Código local; não incluído no AAB 111, sem publicação ou teste com conta/celular reais.
