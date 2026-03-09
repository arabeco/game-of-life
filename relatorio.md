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

- EXECUCAO REAL: 9.4  
  Base: `build` ok, `type-check` ok, `test` ok, core loop blindado, inventario/baus/arsenal coerentes com o soberano e backend de chest alinhado ao catalogo vivo.
- ID VISUAL: 9.4  
  Base: legado com pedra/projecao, relatorio final com card metalico, eras mais legiveis e linguagem mais consistente entre memoria, historico e recompensa.
- FLUXO USUARIO: 9.1  
  Base: Historico vertical separado do Legado, resumo final do ciclo mais forte, PWA menos estranho no celular e menos drift entre planner/sitrep/ciclo.
- RETENCAO: --  
  Sem dado real de beta aberto ainda.
- AQUISICAO: --  
  Sem maquina de conteudo/distribuicao validada ainda.

## 3. Snapshot Tecnico

- Views principais: 17
- Componentes TSX: 115
- Contextos TSX: 4
- Suite de regressao do core loop: 17 cenarios
- `GameContext.tsx`: 6.029 linhas
- Pagamentos: Mercado Pago + Supabase ativos no codigo
- Registro completo: exportado por imagem longa PNG
- Legado projetado: exportado por imagem PNG horizontal
- Video ritual do legado: placeholder ligado para `videos/legado.mp4`
- Gate do legado completo: premium
- Shell inicial do app: `index.js` em ~`6 KB`
- `vendor.js`: ~`10 KB`
- `recharts`: removido do app; radars agora sao SVG proprio

## 4. Perfil & Marcos

- AUTORIDADE: Vagante (Genesis)
- USUARIOS: ~5 (beta interno, sem nova medicao local no repo)
- MARCOS: 0 / 2 concluidos

1. MARCO 1: Prova de Fogo (Dez/2026)  
   Salario zero / 1k users
2. MARCO 2: Consolidacao (Jun/2027)  
   Seed R$ 800k / mentores

## 5. Bloco de Notas (Onde Estamos)

O motor financeiro continua vivo. O produto agora esta mais coeso em tres camadas: execucao diaria, memoria de ciclo e memoria historica. O Historico virou leitura vertical objetiva; o Legado virou experiencia separada; o fechamento do ciclo ganhou um artefato de resumo mais forte. O risco principal deixou de ser quebra tecnica simples e passou a ser validacao real de onboarding, retencao e distribuicao.

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
- [x] Inventario espelhando melhor os slots do soberano
- [x] Artefato entrou no fluxo real de equipar/desequipar
- [x] Baus do inventario usando o resultado real do `openChest`
- [x] `open_chest` do Supabase respeitando `is_live_in_game`
- [x] Catalogo vivo filtrando itens com arte pendente em soberano/forja/cosmeticos
- [x] Cores de raridade e `quest` centralizadas no app
- [x] PWA marcado como `pt-BR` e `notranslate`
- [x] Bundle base drasticamente reduzido com lazy load e split seguro
- [x] Radars migrados de `recharts` para SVG proprio
- [x] Card metalico final do relatorio plugado no fluxo real
- [ ] Subir `legado.mp4` final no bucket `videos`
- [ ] Rodar smoke visual premium e nao premium do fluxo `Ver Legado`
- [ ] Fechar export premium do card metalico do relatorio
- [ ] Refinar a transicao final do relatorio com fade/flash metalico
- [ ] Iniciar 2 videos semanais de clamor/distribuicao
- [ ] Abrir MEI
- [ ] Rodar beta fechado com usuarios suficientes para medir retencao
- [ ] Instrumentar analytics real de funil e ativacao

## 7. Zoom: Relatorio de Hoje

### O que fizemos

- Mantivemos `Historico` vertical e `Legado` como experiencia separada.
- Consolidamos a placa de pedra do legado como portal e memoria historica.
- Reforcamos a projecao horizontal com mini planner por ciclo e leitura por Era.
- Criamos um `MetalReportCard` em SVG para o fechamento do relatorio do ciclo.
- Reaproveitamos esse card metalico dentro do Legado, acima do planner mini de cada ciclo.
- Adicionamos galeria de ranks no GM board para testar metais e notas sem precisar fabricar ciclos reais.
- Alinhamos o backend de baus: `open_chest` agora respeita o catalogo vivo e nao sorteia itens pendentes de arte.
- Centralizamos as cores de raridade e `quest` no app inteiro.
- Corrigimos o PWA para parar de se comportar como pagina em ingles e reduzimos bastante o peso do shell inicial.
- Removemos `recharts` e substituimos os radars por SVG proprio, mantendo o visual e cortando dependencia pesada.

### O que falta (proximos passos)

1. Transformar o `MetalReportCard` em export premium isolado de share.
2. Dar um fechamento mais cinematografico ao relatorio: fade curto e flash metalico antes do CTA final.
3. Subir o `legado.mp4` final no Supabase e validar o fluxo visual premium e nao premium.
4. Fechar onboarding e analytics para medir ativacao e retencao de verdade.

## 8. Leitura Seca

Glyph 1.003b ja nao e so um planner gamificado: ele comecou a virar memoria visual de execucao. O app esta mais leve, mais coerente e mais serio no core loop. O gargalo agora e menos tecnico do que de produto: onboarding, distribuicao, medicao de retencao e prova de valor real em beta.

## 9. Pendencias Reais de PNG

Regra atual do catalogo:

- `themes` podem continuar com emoji e nao entram como pendencia
- `hair` usa pipeline proprio do soberano e nao entra como pendencia do catalogo
- fora isso, so fica fora do jogo o item que realmente ainda nao tem `imageUrl` no catalogo local

Itens que ainda estao sem PNG no catalogo atual:

- Skins: `item_skin_exclusive_001` Empreendedor
- Auras: `item_aura_3_001` Ouro, `item_aura_exclusive_001` Fenix Dourada
- Bordas: `item_border_1_001` Pupilo (Beta), `item_border_1_003` Vanguardista, `item_border_1_004` Rustico, `item_border_2_002` Protetor, `item_border_3_002` Arquetipo, `item_border_4_002` Soberano, `item_border_exclusive_001` Fundador

Observacao:

- `skins` e `artefatos` que ja existem no Supabase deixaram de ser tratados como pendencia generica de arte
- ainda pode haver divergencia pontual de nome/URL entre o catalogo local e o Storage, mas isso ja e outro trabalho de reconciliacao, nao falta real de PNG
