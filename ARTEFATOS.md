# Artefatos publicados

Índice dos artefatos (páginas hospedadas) que servem de referência para o Glyph.
Eles vivem fora do repositório, então o link é a única forma de reencontrá-los —
por isso ficam registrados aqui.

Também dá para listá-los em `/artifacts` no Claude Code, mas só aparecem os que
pertencem à conta logada. O índice abaixo não tem esse limite.

---

## Catálogo de itens

Folha de contato com todos os itens, em abas por categoria e com a aba Míticos
separada por temporada e slot. Slot vazio aparece tracejado, então dá para ver
de relance o que cada coleção ainda pede.

<https://claude.ai/code/artifact/5b198da3-a14f-43bc-b9df-270dccd654ca>

> **Conta antiga.** Este artefato foi publicado por uma conta que não existe
> mais. O link continua abrindo, mas ele **não pode ser atualizado** — se o
> catálogo mudar, tem de ser republicado do zero e o link novo vem para cá.

Fonte no repositório: `CATALOGO_DE_ITENS.md`, `CATALOGO_OURO.md` e
`constants/goldCatalog.ts`. Também referenciado em `TEMPORADAS.md`.

---

## Sinais do Glyph

Inventário de tudo que o app é capaz de dizer ao jogador: os 23 tipos de
notificação com faixa e prioridade, o que precisa ser verdade para virar push,
as 80 falas do Oráculo, o banco de cards, os retornos sensoriais (vibração e
confete) e os modais de conquista. Organizado por quanto cada canal interrompe.

<https://claude.ai/code/artifact/07ea3b15-86aa-4c43-85c5-84194afc13eb>

Levantado do código em 23/08/2026, versão 1.0.64, depois da remoção da IA do
Oráculo. Fontes: `constants/oracleNotificationPolicy.ts`,
`constants/oracleSpeechLibrary.ts`, `constants/oracleCardLibrary.ts`,
`components/AchievementModal.tsx` e `supabase/functions/web-push/index.ts`.

---

## Galeria de artes — Controle Real

Galeria das artes do projeto.

<https://claude.ai/code/artifact/756e0ed6-b248-4634-abb0-8fe21e8d4a38>

---

## Ao publicar um artefato novo

Registre aqui com três coisas: o que ele mostra, o link, e de onde os dados
saíram. Sem a terceira, daqui a seis meses ninguém sabe se a página ainda
corresponde ao código.
