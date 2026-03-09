# Plano Legacy Scene (09/03/2026)

## Objetivo
Transformar a abertura do legado em uma cena quase full-screen:
- clique na placa
- video ritual
- fade
- cena com header dinamico no topo
- placa fixa logo abaixo
- timeline horizontal no centro
- mini planner condensado sob cada ciclo

## O que ja existe
- Historico continua vertical
- Era continua sendo faixa/editavel
- Legado projetado horizontal existe
- Mini planner por ciclo ja existe via `weeklyAtlas`
- Gate premium para `Gravar legado`
- Placa do legado ja existe como artefato visual

## O que entrou agora
- `Report.identitySnapshot`
- fechamento do ciclo ja captura um snapshot de identidade dentro do `report_data`
- `LegacyProjectionScene` agora tem topo dinamico baseado no ciclo em foco
- a placa subiu para o topo da cena e projeta a timeline abaixo
- cards dos ciclos atualizam o header ao focar/hover

## V1 honesta
A V1 nao inventa historico antigo.

Ela funciona assim:
- relatorios novos carregam `identitySnapshot`
- relatorios antigos usam fallback do perfil atual
- o topo do legado reage ao ciclo focado
- so muda patente, nivel e cla de verdade quando o relatorio daquele ciclo tiver snapshot salvo

## O que ainda falta para a V2 historica completa
1. snapshots antigos nao existem
2. avatar, nickname, patente e cla antigos nao podem ser reconstruidos com confianca a partir do estado atual
3. autoplay/slideshow da timeline ainda nao existe
4. transicao cinematografica da placa para a timeline ainda pode ser refinada
5. export especifico da cena full-screen ainda pode crescer

## SQL / Banco
### V1
Nao precisa de tabela nova.

Base atual:
- `cycles.report_data` ja e `jsonb`
- o snapshot historico cabe dentro do proprio `report_data`

Estrutura esperada no `report_data`:
- `identity_snapshot.avatar_url`
- `identity_snapshot.nickname`
- `identity_snapshot.title`
- `identity_snapshot.level`
- `identity_snapshot.nobility_rank_id`
- `identity_snapshot.nobility_rank_name`
- `identity_snapshot.clan_name`
- `identity_snapshot.clan_icon`
- `identity_snapshot.clan_rank_name`
- `identity_snapshot.captured_at`

### V2 opcional
Se quisermos consultar historico de identidade direto por SQL, sem parsear `report_data`, o caminho certo depois e UM destes:
1. coluna auxiliar `identity_snapshot jsonb` em `cycles`
2. tabela propria `cycle_identity_snapshots`

Hoje eu NAO recomendo isso.
Motivo:
- duplica verdade
- aumenta sincronizacao
- nao agrega valor real antes do beta fechado

## Criterio de pronto deste corte
- fechar ciclo gera snapshot de identidade no relatorio
- legado consegue ler snapshot por ciclo
- topo dinamico nao inventa historico quando o dado nao existe
- build, type-check e test continuam passando
