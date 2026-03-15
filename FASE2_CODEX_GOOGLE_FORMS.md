# FASE 2 - CODEX NO FORMATO GOOGLE FORMS

Use este documento como espelho direto da Fase 2 dentro do Google Forms.
A ideia aqui nao e ser um molde conceitual.
E ser o formulario como ele vai existir de verdade.

Observacao importante:
- Google Forms nao lida bem com estruturas muito dinamicas.
- Por isso, Fases, Arenas e Acoes foram pensadas com campos de texto longo guiados por formato.
- Isso deixa o preenchimento mais humano e muito menos sofrido.

---

## PAGINA 1 - INTRODUCAO

**Titulo da pagina**
- FASE 2 - FORJA COMPLETA DO CODEX

**Descricao da pagina**
```text
Seu Codex foi aprovado para a Fase 2 da curadoria no GLYPH.

Agora vamos aprofundar a estrutura completa do projeto:
- identidade do Codex
- posicionamento
- fases
- arenas
- acoes
- regras de desbloqueio
- materiais de apoio

Se voce ja tiver tudo estruturado em JSON, podera colar o payload completo no final.
```

**Campos**
- nenhum

---

## PAGINA 2 - IDENTIDADE DO CODEX

**Titulo da pagina**
- Identidade do Codex

**Descricao da pagina**
```text
Aqui queremos a base editorial e estrutural do Codex.
```

**Campos**

1. `Titulo do Codex`
- tipo: resposta curta
- obrigatorio: sim
- exemplo: Protocolo de Presenca Soberana

2. `Promessa principal`
- tipo: paragrafo curto
- obrigatorio: sim
- exemplo: Em 21 dias, recuperar foco, presenca e decisao sob pressao.

3. `Descricao curta de vitrine`
- tipo: paragrafo curto
- obrigatorio: sim
- exemplo: Uma travessia pratica para restaurar clareza, ritual e comando interno.

4. `Descricao expandida`
- tipo: paragrafo longo
- obrigatorio: nao

5. `Autor / Mentor`
- tipo: resposta curta
- obrigatorio: sim
- exemplo: Mentor Atlas

6. `Preco em ouro`
- tipo: resposta curta
- obrigatorio: sim
- exemplo: 240

7. `Duracao total em dias`
- tipo: resposta curta
- obrigatorio: sim
- exemplo: 21

8. `Tags`
- tipo: resposta curta
- obrigatorio: sim
- exemplo: foco, ritual, lideranca, clareza

9. `Publico ideal`
- tipo: paragrafo curto
- obrigatorio: nao

10. `Resultado final desejado`
- tipo: paragrafo curto
- obrigatorio: nao

11. `Capa do Codex`
- tipo: resposta curta
- obrigatorio: nao
- ajuda: URL de imagem, referencia visual ou emoji. Se ficar em branco, o app pode sugerir um fallback automatico.

12. `Icone fallback`
- tipo: resposta curta
- obrigatorio: nao
- exemplo: 👁️
- ajuda: opcional. Se ficar em branco, o app pode sugerir automaticamente com base no titulo do Codex.

13. `Patente minima / gate`
- tipo: resposta curta
- obrigatorio: nao
- exemplo: Ferro III

---

## PAGINA 3 - VITRINE E POSICIONAMENTO

**Titulo da pagina**
- Loja, Claim e Biblioteca

**Descricao da pagina**
```text
Aqui entram os textos curtos que ajudam o Codex a existir bem dentro do produto.
```

**Campos**

1. `Frase principal da loja`
- tipo: resposta curta
- obrigatorio: nao

2. `Subfrase da loja`
- tipo: paragrafo curto
- obrigatorio: nao

3. `Resumo para claim modal`
- tipo: paragrafo curto
- obrigatorio: nao

4. `Resumo para biblioteca`
- tipo: paragrafo curto
- obrigatorio: nao

5. `Tom estetico / fantasia`
- tipo: resposta curta
- obrigatorio: nao
- exemplo: pasta de campanha, manuscrito estrategico, grimorio tatico

6. `Beneficio 1`
- tipo: resposta curta
- obrigatorio: nao

7. `Beneficio 2`
- tipo: resposta curta
- obrigatorio: nao

8. `Beneficio 3`
- tipo: resposta curta
- obrigatorio: nao

---

## PAGINA 4 - CAMPANHA MESTRE

**Titulo da pagina**
- Arquitetura da Campanha

**Descricao da pagina**
```text
Aqui queremos a leitura macro da jornada.
```

**Campos**

1. `Nome interno da campanha`
- tipo: resposta curta
- obrigatorio: nao

2. `Objetivo macro da campanha`
- tipo: paragrafo curto
- obrigatorio: sim

3. `Modelo de progressao`
- tipo: multipla escolha
- obrigatorio: sim
- opcoes:
  - Linear por fases
  - Aberta
  - Mista

4. `Condicao para concluir o Codex`
- tipo: paragrafo curto
- obrigatorio: nao

5. `Mensagem de abertura do Codex`
- tipo: paragrafo longo
- obrigatorio: nao

6. `Mensagem de encerramento do Codex`
- tipo: paragrafo longo
- obrigatorio: nao

---

## PAGINA 5 - FASES DO CODEX

**Titulo da pagina**
- Fases

**Descricao da pagina**
```text
Descreva cada fase neste formato.
Repita para todas as fases do Codex.
```

**Campo unico**

1. `Fases do Codex`
- tipo: paragrafo longo
- obrigatorio: sim
- instrucoes para o campo:

```text
Use este formato:

FASE 1
- Nome:
- Objetivo:
- Duracao sugerida:
- O que desbloqueia esta fase:
- O que conclui esta fase:
- Regra de desbloqueio da proxima fase:
- Mensagem de abertura:
- Mensagem de fechamento:

FASE 2
- Nome:
- Objetivo:
- Duracao sugerida:
- O que desbloqueia esta fase:
- O que conclui esta fase:
- Regra de desbloqueio da proxima fase:
- Mensagem de abertura:
- Mensagem de fechamento:
```

---

## PAGINA 6 - ARENAS

**Titulo da pagina**
- Arenas por Fase

**Descricao da pagina**
```text
Agora descreva as arenas dentro de cada fase.
O icone da arena e opcional. Se ficar em branco, o app pode sugerir automaticamente com base no nome da arena.
```

**Campo unico**

1. `Arenas do Codex`
- tipo: paragrafo longo
- obrigatorio: sim
- instrucoes para o campo:

```text
Use este formato:

FASE 1 - Nome da fase
- Arena 1
  - Nome:
  - Descricao:
  - Ativo vinculado:
  - Icone (opcional):
  - Promessa da arena:
  - Regra de desbloqueio:
  - Regra de conclusao:
  - Destrava qual arena:
  - Texto de abertura:
  - Texto de fechamento:

- Arena 2
  - Nome:
  - Descricao:
  - Ativo vinculado:
  - Icone (opcional):
  - Promessa da arena:
  - Regra de desbloqueio:
  - Regra de conclusao:
  - Destrava qual arena:
  - Texto de abertura:
  - Texto de fechamento:
```

---

## PAGINA 7 - ACOES

**Titulo da pagina**
- Acoes

**Descricao da pagina**
```text
Esta e a parte mais detalhada da Fase 2.
Se ficar pesado demais, use o campo de JSON completo no final.
O icone da acao e opcional. Se ficar em branco, o app pode sugerir automaticamente com base no nome da acao.
```

**Campo unico**

1. `Acoes do Codex`
- tipo: paragrafo longo
- obrigatorio: sim
- instrucoes para o campo:

```text
Use este formato:

FASE 1 - Nome da fase
ARENA 1 - Nome da arena

ACAO 1
- Nome:
- Tipo: Acao Recorrente / Compromisso / Marco
- Icone (opcional):
- Duracao:
- Repeticoes:
- Dificuldade:
- Resumo pre-play:
- Briefing / por que fazer:
- Conteudo principal:
- Passo a passo:
- Checklist pre-voo:
- Criterio de sucesso:
- Midia / assets:
- Agendamento sugerido:
- Condicao de desbloqueio:
- Condicao de fechamento:
- Contexto ideal:
- Observacao do mentor:
```

---

## PAGINA 8 - DESBLOQUEIOS E FLUXO

**Titulo da pagina**
- Regras de Desbloqueio e Fluxo

**Descricao da pagina**
```text
Aqui mapeamos as travas e a inteligencia de progressao do Codex.
```

**Campos**

1. `Regras entre fases`
- tipo: paragrafo longo
- obrigatorio: sim

2. `Regras entre arenas`
- tipo: paragrafo longo
- obrigatorio: sim

3. `Regras entre acoes`
- tipo: paragrafo longo
- obrigatorio: nao

4. `Marcos-chave do Codex`
- tipo: paragrafo longo
- obrigatorio: nao

5. `Ritmo recomendado`
- tipo: resposta curta
- obrigatorio: nao

6. `Fallback / plano B`
- tipo: paragrafo curto
- obrigatorio: nao

---

## PAGINA 9 - CURADORIA E SEGURANCA

**Titulo da pagina**
- Curadoria Final

**Descricao da pagina**
```text
Esses campos ajudam a avaliar maturidade, responsabilidade e consistencia do Codex.
```

**Campos**

1. `Por que esse Codex merece existir`
- tipo: paragrafo longo
- obrigatorio: nao

2. `Prova / autoridade do mentor`
- tipo: paragrafo curto
- obrigatorio: nao

3. `Risco de uso indevido / aviso importante`
- tipo: paragrafo curto
- obrigatorio: nao

4. `Status`
- tipo: multipla escolha
- obrigatorio: nao
- opcoes:
  - Rascunho
  - Revisao
  - Pronto para loja
  - Interno

5. `Versao do Codex`
- tipo: resposta curta
- obrigatorio: nao

---

## PAGINA 10 - JSON E FECHAMENTO

**Titulo da pagina**
- JSON Completo e Envio Final

**Descricao da pagina**
```text
Se voce tiver o Codex pronto em JSON, cole abaixo.
Isso pode complementar ou substituir partes do detalhamento manual.
```

**Campos**

1. `JSON completo do Codex`
- tipo: paragrafo longo
- obrigatorio: nao

2. `Observacao final`
- tipo: paragrafo longo
- obrigatorio: nao

**Texto final da pagina**
```text
Apos o envio, nosso time vai revisar:
- consistencia editorial
- qualidade estrutural
- clareza das regras de progressao
- potencial de loja, biblioteca e claim

Se o material estiver redondo, seguimos para a etapa de implementacao e refinamento no GLYPH.
```

---

## RECOMENDACAO PRATICA

Se a Fase 2 ficar pesada demais no Google Forms, use esta simplificacao:
- PAGINA 2, 3 e 4 com campos normais
- PAGINA 5, 6 e 7 com campos de texto longo guiados por formato
- PAGINA 10 com JSON completo como atalho opcional

Esse e o melhor equilibrio entre:
- clareza
- velocidade de preenchimento
- e viabilidade real dentro do Google Forms
