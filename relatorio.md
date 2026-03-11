# GLYPH: MASTER SYSTEM STATE (10/03/2026)

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

- EXECUCAO REAL: 9.3  
  Base: `build` ok, `type-check` ok, `test` ok, core loop segue blindado e o backend de baus respeita o catalogo vivo.
- ID VISUAL: 9.1  
  Base: legado full-screen, kit vertical PNG, placa de legado em iteracao e cards de ciclo metalicos. Ainda falta polish fino da cena e das miniaturas.
- FLUXO USUARIO: 9.0  
  Base: AssetsView ficou mais util no modo basico e o Historico/Legado estao mais separados. Ainda falta limpar mais ruido visual em alguns modais.
- RETENCAO: --  
  Sem dado real de beta aberto ainda.
- AQUISICAO: --  
  Sem maquina de conteudo/distribuicao validada ainda.

## 3. Snapshot Tecnico

- Views principais: 17
- Arquivos TSX: 177
- Contextos TSX: 4
- Suite de regressao do core loop: 17 cenarios
- `GameContext.tsx`: 6.034 linhas
- Pagamentos: Mercado Pago + Supabase ativos no codigo
- Export legado: kit vertical PNG + registro completo PNG
- `open_chest`: alinhado ao catalogo vivo via `is_live_in_game`
- Shell inicial do app: `index.js` ~ `7 KB`
- `vendor.js`: ~ `10 KB`
- `recharts`: removido; radars agora usam SVG proprio

## 4. Perfil & Marcos

- AUTORIDADE: Vagante (Genesis)
- USUARIOS: ~5 (beta interno, sem nova medicao local no repo)
- MARCOS: 0 / 2 concluidos

1. MARCO 1: Prova de Fogo (Dez/2026)  
   Salario zero / 1k users
2. MARCO 2: Consolidacao (Jun/2027)  
   Seed R$ 800k / mentores

## 5. Bloco de Notas (Onde Estamos)

O produto esta mais coerente em tres camadas: uso diario, fechamento de ciclo e memoria historica. A frente tecnica esta mais limpa. O gargalo agora e acabamento visual, onboarding e prova real de retencao.

## 6. Checklist de Pendencias

- [ ] Polir a placa do legado para ficar no nivel do conceito aprovado
- [ ] Dar polish final no slideshow do legado
- [ ] Polir miniaturas de arena: emoji, marco, acao e barra de progresso
- [ ] Polir o card metalico compacto do Historico
- [ ] Fechar a nova AssetsView no modo basico/game sem ruido visual
- [ ] Rodar smoke visual do fluxo `Ver Legado` com as skins finais
- [ ] Abrir MEI
- [ ] Rodar beta fechado com usuarios suficientes para medir retencao
- [ ] Instrumentar analytics real de funil e ativacao
- [ ] Iniciar 2 videos semanais de clamor/distribuicao

## 7. Zoom: Relatorio de Hoje

### O que fizemos

- Ajustamos a cena do legado com `Layout Lab` simples para calibrar placa, ciclos e card inferior.
- Fixamos o JSON oficial de layout da cena do legado.
- Reestruturamos a placa do legado para ficar mais curta e mais proxima de artefato, sem cara de dashboard.
- Ligamos o preview de `Ver Legado` ao fundo real `10.jpg`.
- Mantivemos o kit de export do legado em PNG, sem depender de MP4.
- Reformulamos a `AssetsView` para ficar mais util:
  - sem balao explicativo no mapa
  - titulo mais central
  - toggle `Arenas / Widgets` discreto no canto
  - modal unico com dois conteudos
- O modo `Widgets` deixou de mostrar miniaturas de arenas.
- A visao de arenas virou duas fileiras horizontais:
  - concluidas/arquivadas
  - ativas
- Centralizamos melhor as metricas da placa do legado e aumentamos a legibilidade com dourado + cinza escuro.

## 8. Leitura Seca

Glyph 1.003b esta mais solido e mais claro. O que falta agora nao e sistema novo; e acabamento fino nas telas mais visuais e validacao real com usuarios.
