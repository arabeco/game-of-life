# Passagem para a nuvem (29/10/2026)

Contexto para a sessão na nuvem continuar o lançamento do Glyph.

## Feito até aqui (main em 6720e42a, tudo enviado)
- Planos de outubro: anual, fichas de vínculo, Leitura Premium, loja nova e preços das campanhas. As 4 SQLs de 28/10 já rodaram no banco.
- Renovação da Play: cada cobrança entra uma vez (token:pedido). O app confere ao abrir: a cada 6h, ou em toda abertura quando o plano vence em menos de 1 dia.
- EXP = minutos, só a difícil ×1,1. Lazer saiu; só a ação Livre não dá EXP.
- Escada de patentes: 6k / 20k / 50k / 100k / 150k / 250k / 400k / 650k / 1M.
- Planilha do Luigi no 1.0.122 (23 testes): claude.ai/artifact/DG8g73vkemJE832jUg4bJc. SQL de apoio: `sql/teste-do-luigi-122.sql`.

## Falta
1. AAB 122: só no PC do Afonso (a chave .jks, o keystore.properties e o .env.local não estão no git). Fica com o Codex.
2. O Afonso coloca o Gmail do Luigi como testador de licença na Play.
3. Mandar para o Codex os 2 testes do Oráculo que falham: `tests/a-mao-ganha-do-oraculo`, `tests/oracle-engine-v2`.
4. Converter as campanhas Mente sem Armadilhas (c02), Círculo Forte (d08) e Faxina Total (nova) em modelo e SQL.

## Regras
- O Afonso roda as SQLs sozinho. Conferir com `npm run sql:checa` antes de entregar e nunca usar a service key.
- Não rodar `npm run test:launch`: cria conta em produção.
- Respostas curtas, em português. Os arquivos do Oráculo são do Codex: combinar antes de mexer.
- A prancheta (lista do que está aberto) fica em claude.ai/artifact/99dQUHcbX6dy4dcAuu2Dx6, coleção `itens`.
