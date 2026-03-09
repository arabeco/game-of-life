# GLYPH: MASTER SYSTEM STATE (09/03/2026)

Status: [x] ALPHA  |  [ ] BETA  |  [ ] LIVE  
Fase: [x] FUNDACAO (T1)  |  [ ] CERCO  |  [ ] ASCENSAO

## 1. Estrutura (O Conselho)

| Pilar | Peso | Agente | Estado |
| --- | ---: | --- | --- |
| TRONO | 80% | Zee | ATIVO |
| PROTOCOLO | 05% | IA Arquit. | ATIVO |
| TESOURO | 05% | IA Escudo | STANDBY |
| DOMINIO | 05% | IA Clamor | ESTRATEGICO |
| SENTINELA | 05% | IA Alicer. | OPERACIONAL |

## 2. Scorecard (Notas de Auditoria)

- EXECUCAO REAL: 9.2  
  Base: `build` ok, `type-check` ok, `test` ok, core loop blindado e separacao mais clara entre Historico e Legado.
- ID VISUAL: 9.2  
  Base: placa de pedra, projecao horizontal, mini planner por ciclo e leitura mais coerente das Eras.
- FLUXO USUARIO: 8.9  
  Base: historico vertical ficou mais claro; legado agora tem gate premium e narrativa propria. Ainda falta smoke visual completo desse fluxo novo.
- RETENCAO: --  
  Sem dado real de beta aberto ainda.
- AQUISICAO: --  
  Sem maquina de conteudo/distribuicao validada ainda.

## 3. Snapshot Tecnico

- Views principais: 16
- Componentes TSX: 109
- Contextos TSX: 4
- Suite de regressao do core loop: 17 cenarios
- `GameContext.tsx`: 5.992 linhas  
  Antes estava na faixa de ~8.000.
- Pagamentos: Mercado Pago + Supabase ativos no codigo
- Registro completo: exportado por imagem longa PNG
- Legado projetado: exportado por imagem PNG horizontal
- Video ritual do legado: placeholder ligado para `videos/legado.mp4`
- Gate do legado completo: premium

## 4. Perfil & Marcos

- AUTORIDADE: Vagante (Genesis)
- USUARIOS: ~5 (beta interno, sem nova medicao local no repo)
- MARCOS: 0 / 2 concluidos

1. MARCO 1: Prova de Fogo (Dez/2026)  
   Salario zero / 1k users
2. MARCO 2: Consolidacao (Jun/2027)  
   Seed R$ 800k / mentores

## 5. Bloco de Notas (Onde Estamos)

O motor financeiro continua vivo. O app esta mais claro no loop real de uma pessoa: planejar, executar, fechar ciclo, revisar historico e consolidar legado. A confusao entre `Historico`, `Era` e `Legado` foi reduzida: historico voltou a ser vertical, Era ficou como faixa/editavel, e o legado virou uma experiencia horizontal separada, com gate premium para a gravacao completa.

## 6. Checklist de Pendencias

- [x] Core loop planner <-> sitrep <-> ciclo blindado
- [x] `type-check` limpo no app atual
- [x] `build` validado
- [x] Suite de regressao do core loop criada e rodando
- [x] Tela de historico mantida vertical com Eras laterais
- [x] Legado projetado horizontal separado do historico
- [x] Mini planner por ciclo dentro do legado projetado
- [x] Placa do Legado como artefato visual proprio
- [x] Gate premium para `Gravar Legado`
- [x] Exportar Legado Completo
- [x] Exportar Legado Projetado
- [x] Gold Invite desativavel por env para teste
- [ ] Subir `legado.mp4` final no bucket `videos`
- [ ] Fazer smoke visual premium e nao premium do fluxo `Ver Legado`
- [ ] Iniciar 2 videos semanais de clamor/distribuicao
- [ ] Abrir MEI
- [ ] Rodar beta fechado com usuarios suficientes para medir retencao
- [ ] Instrumentar analytics real de funil e ativacao

## 7. Zoom: Relatorio de Hoje

### O que fizemos

- Separamos o `Historico` vertical da experiencia de `Legado`.
- Mantivemos `Era` como faixa, nome, skin e ciclos incluidos.
- Criamos a projecao horizontal do legado a partir da placa.
- Embutimos a mini visao do planner em cada ciclo do legado, usando `weeklyAtlas`, sem screenshotar a UI.
- Colocamos gate premium: nao premium ve o resumo condensado; premium pode `Gravar Legado` e abrir a cena completa apos o video.
- Mantivemos o `Registro de Soberania` longo separado como export proprio.

### O que falta (proximos passos)

1. Subir o `legado.mp4` final no Supabase.
2. Rodar smoke visual completo do fluxo `Historico -> Ver Legado -> Gravar Legado -> Projecao`.
3. Refinar a transicao cinematografica da placa para a timeline.
4. Fechar onboarding e analytics para medir ativacao e retencao de verdade.

## 8. Leitura Seca

Glyph 1.003b ja nao e so um planner gamificado: comecou a ganhar memoria visual. O gargalo agora nao e falta de conceito; e polir a experiencia final, validar mercado e provar retencao real.
