---
name: Grid Slots Padrao
overview: Reorganizar os slots para um grid único 6x8 em todos os ativos, usando os 3 tipos de widget como tamanhos fixos e configuração por ativo em JSON, com Consciência recebendo Crença 1/2/3 (Tipo 1).
todos: []
isProject: false
---

# Plano: Grid 6x8 padronizado

## Decisões confirmadas

- Grid único 6 colunas x 8 linhas para todos os ativos.
- Tipos fixos: Tipo1=retângulo comprido, Tipo2=mini retângulo, Tipo3=quadrado com imagem.
- Consciência recebe Crença 1/2/3 (Tipo 1) além do Lema.

## Arquivos-chave

- Layout e ordenação: `C:\Users\Afonso\Desktop\GAMEOFLIFE\slot_layouts.json`
- Render e aplicação do grid: `C:\Users\Afonso\Desktop\GAMEOFLIFE\app.js`
- CSS base de slots (apenas visual, sem posicionamento por asset): `C:\Users\Afonso\Desktop\GAMEOFLIFE\styles.css`

## Passos

1. Atualizar `slot_layouts.json` com as Crenças em `conexao` (row sequencial, Tipo 1), e revisar cada ativo para garantir distribuição por linha/coluna dentro do grid 6x8.
2. Ajustar `renderTreeEditorSlots` em `app.js` para:

- Fixar grid 6x8 no container do `slot-list` (com `grid-template-columns` e `grid-auto-rows`).
- Usar `row` do layout como `grid-row` e mapear o tipo para `grid-column: span` (Tipo1=6, Tipo2=3, Tipo3=2).
- Desabilitar títulos de seção automáticos quando existir layout configurado, para não ocupar espaço do grid.

3. Limpar do `styles.css` regras específicas de posicionamento por asset que conflitam com o grid 6x8 (manter apenas estilos visuais de slots).
4. Validar visualmente Finanças, Físico e Propósito (prints do usuário) para garantir alinhamento central e distribuição esperada.

## Testes/validação

- Abrir o modal de cada ativo e confirmar:
- Slots Tipo 1 ocupam a linha inteira.
- Slots Tipo 2 ocupam metade (2 por linha).
- Slots Tipo 3 ocupam 1/3 (3 por linha).