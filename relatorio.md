# GLYPH: MASTER SYSTEM STATE (08/03/2026)

Status: [x] ALPHA  |  [ ] BETA  |  [ ] LIVE  
Fase: [x] FUNDACAO (T1)  |  [ ] CERCO  |  [ ] ASCENSAO

## 1. Estrutura (O Conselho)

| Pilar | Peso | Agente | Estado |
| --- | ---: | --- | --- |
| TRONO | 76% | Zee | ATIVO |
| PROTOCOLO | 10% | IA Arquit. | ATIVO |
| TESOURO | 4% | IA Escudo | STANDBY |
| DOMINIO | 4% | IA Clamor | ESTRATEGICO |
| SENTINELA | 6% | IA Alicer. | OPERACIONAL |

## 2. Scorecard (Notas de Auditoria)

- EXECUCAO REAL: 9.1  
  Base: pagamentos vivos, `build` ok, `type-check` ok, `test` ok, core loop planner <-> sitrep <-> ciclo blindado.
- ID VISUAL: 8.9  
  Base: alta fidelidade mantida, relatorios mais fortes, Tela Legado + export consolidado + ritual de video para legado.
- FLUXO USUARIO: 8.8  
  Base: loop principal mais coerente, menos drift entre planner/sitrep/ciclo, campanhas e eras mais legiveis.
- RETENCAO: --  
  Sem dado real de beta aberto ainda.
- AQUISICAO: --  
  Sem maquina de conteudo/distribuicao validada ainda.

## 3. Snapshot Tecnico

- Views principais: 16
- Componentes TSX: 88
- Contextos TSX: 4
- Suite de regressao do core loop: 15 cenarios
- `GameContext.tsx`: 5.983 linhas  
  Antes estava na faixa de ~8.000.
- Pagamentos: Mercado Pago + Supabase ativos no codigo
- Export legado: ativo por imagem longa PNG
- Video ritual do legado: placeholder ligado para `videos/legado.mp4`

## 4. Perfil & Marcos

- AUTORIDADE: Vagante (Genesis)
- USUARIOS: ~5 (beta interno, sem nova medicao local no repo)
- MARCOS: 0 / 2 concluidos

1. MARCO 1: Prova de Fogo (Dez/2026)  
   Salario zero / 1k users
2. MARCO 2: Consolidacao (Jun/2027)  
   Seed R$ 800k / mentores

## 5. Bloco de Notas (Onde Estamos)

O motor financeiro continua vivo. O app hoje esta mais coeso no que realmente importa: criar arena, criar acao, planejar o dia, rodar sitrep, fechar ciclo, consolidar legado. O trecho mais sensivel do sistema foi endurecido com regressao automatizada e rollback em mutacoes criticas. A frente mais fraca continua sendo distribuicao, onboarding e prova real de retencao em beta.

## 6. Checklist de Pendencias

- [x] Core loop planner <-> sitrep <-> ciclo blindado
- [x] `type-check` limpo no app atual
- [x] `build` validado
- [x] Suite de regressao do core loop criada e rodando
- [x] Tela Legado consolidada a partir de `reports` + `era_boundaries`
- [x] Exportar Legado Completo
- [x] Ritual de video do legado com placeholder para `legado.mp4`
- [x] Gold Invite desativavel por env para teste
- [ ] Subir `legado.mp4` final no bucket `videos`
- [ ] Iniciar 2 videos semanais de clamor/distribuicao
- [ ] Abrir MEI
- [ ] Rodar beta fechado com usuarios suficientes para medir retencao
- [ ] Instrumentar analytics real de funil e ativacao

## 7. Zoom: Relatorio de Hoje

### O que fizemos

- Blindamos o loop diario e o vinculo planner <-> sitrep <-> ciclo.
- Modularizamos parte relevante do `GameContext` em dominios.
- Reduzimos o `GameContext.tsx` para 5.983 linhas.
- Corrigimos progresso de campanhas, shared actions, missões e barrinhas de arenas.
- Criamos a Tela Legado em cima do que ja existia.
- Adicionamos `Exportar Legado Completo` via imagem longa.
- Ligamos o ritual de video do legado com placeholder buscando `videos/legado.mp4`.
- Melhoramos a abertura do app para ficar mais lisa e com fade mais limpo da barrinha.

### O que falta (proximos passos)

1. Subir o `legado.mp4` final no Supabase.
2. Aplicar o mesmo acabamento de fade/saida limpa nos outros modais com video.
3. Fechar onboarding e analytics para medir ativacao e retencao de verdade.
4. Comecar maquina de distribuicao com conteudo semanal.

## 8. Leitura Seca

Glyph 1.003b ja tem motor, identidade e ritual. O gargalo nao e mais falta de sistema; e validacao de mercado, onboarding e clamor.
