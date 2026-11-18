# Descoberta social e visitas ao jardim

Guia para implementar, acertado com o Afonso em 15/11/2026. São três frentes:

1. Pessoas recomendadas
2. O feed do Reino
3. Interações pagas na visita ao jardim

Leia "Como está hoje" antes de mexer. As decisões em **negrito** já foram tomadas: não reabra sem falar com ele.

## Regras da casa (valem para as três frentes)

- SQL nunca roda sozinho. Escreva a migração em `supabase/migrations/`, compile com `npm run sql:checa -- <arquivo>` e entregue o bloco para o Afonso rodar.
- Nunca use a chave service-role do `.env.local`. Nunca rode `npm run test:launch`: ele cria conta de verdade em produção.
- Toda mudança de comportamento ganha um teste em `tests/*.regression.mjs`, escrito antes do código. Veja os testes vizinhos: eles importam `.ts` direto, porque o Node 24 entende tipos.
- Fragmento não se escreve à mão no saldo. Use o caminho de gasto que já existe (ver `supabase/migrations/20260923190000_o_saldo_nao_se_escreve_a_mao.sql`). Nunca faça `update` direto no saldo.
- Textos em português do Brasil, curtos e com acento.
- O modo Essencial (`modoEssencial`) esconde enfeite. Confira cada tela nova nele.
- Não gere AAB e não mude a versão: isso só acontece quando o Afonso pede.

## Como está hoje

- **Conhecer pessoas.** Há três caminhos:
  - a busca por nickname no Social (`views/MundoView.tsx`, campo "Buscar Soberano ou Grupo…", que manda pedido para o resultado mais parecido);
  - o link de convite;
  - tocar em alguém no feed, o que abre o perfil, onde há "Adicionar amigo" (`views/ProfileView.tsx`).

  **Não existe lista de recomendados.**
- **Feed.** Fica em `views/HallOfFameView.tsx` e `utils/feedAbas.ts`. São duas abas: **Aliados** (você e amigos) e **Reino** (todo o resto), ordenadas só por data. Os cards são de feitos: patente, ciclo, maestria, arena e missão (`components/FeedEventCard.tsx`). Cada card tem a estrela de curtir. Quem publica muito enche o Reino, e o card não oferece jeito de se aproximar de quem publicou.
- **Jardim.**
  - É 3D, roda em iframe e o código fica em `zen3d-test/`. O modal é `components/Garden3DModal.tsx` e o carregamento é `load_garden_3d` (`20260909210000_garden3d_visit_and_ladder.sql`).
  - Na visita, um cartão pequeno pede "Entrar", e lá dentro só dá para olhar.
  - Quem pode ver é definido por `gardenVisibility`, no perfil.
  - O jardim próprio tem a **cesta de presentes** (`garden_basket_*`, `components/GardenBasketPanel.tsx`): uma recompensa em fragmentos por dias ativos, entregue um presente por vez.
  - Lago existe: é a base `garden_base_pond` ("Espelho do bosque").
- **Fragmentos que entram hoje:** a cesta dá entre 5 e 16 a cada 3 a 5 dias ativos, e as missões iniciais dão 5 cada. Na prática são uns 10 a 20 por semana para quem usa. Os preços abaixo seguem essa escala.

---

## 1. Pessoas recomendadas

**Onde:** no Social, acima da lista de aliados, num bloco "Pessoas para conhecer".

**O que mostra:** de 3 a 5 pessoas por vez. Cada card traz:
- foto com a borda da pessoa;
- nome e patente;
- **uma linha com o motivo**, por exemplo:
  - "também treina força";
  - "fechou um ciclo SS esta semana";
  - "amigo do Kael";
  - "curtiu 3 feitos seus".

Cada card tem dois botões: **Adicionar** e **Ver perfil**. Puxar para baixo ou voltar outro dia traz outras pessoas.

**Quem entra:**
- só quem está com **"Aparecer em Pessoas para conhecer"** ligado. É um ajuste novo em Configurações, privacidade. O padrão é ligado para quem já tem o perfil público e desligado para quem não tem;
- nunca quem já é amigo, quem tem pedido pendente com você, quem você recusou nos últimos 30 dias, nem você mesmo;
- só quem esteve ativo nos últimos 7 dias.

**Ordem (pontuação simples, maior primeiro):**

| Sinal | Pontos |
|---|---|
| Curtiu feitos seus nos últimos 14 dias | +3 por curtida, até 9 |
| Amigo de um amigo seu | +4 por amigo em comum, até 12 |
| Tem arena na mesma área que você e com nome parecido (mesma palavra-chave) | +5 |
| Patente a até 1 degrau da sua | +2 |
| Ativo hoje | +2 |

O motivo do card é o sinal que mais pontuou. **Use só o que já é público no perfil da pessoa.** Arena privada não entra nem na conta.

**Servidor:** uma função `pessoas_para_conhecer(p_limite int default 5)`, `security definer`, que devolve `id`, `nickname`, `avatar`, `borda`, `patente` e `motivo`. Ela respeita o ajuste de privacidade e o bloqueio de recusados. Não devolve e-mail nem dado privado.

**Teste mínimo:**
- quem desligou o ajuste não aparece;
- amigo não aparece;
- o motivo é o sinal maior;
- arena privada não pontua.

## 2. O feed do Reino

Aliados fica como está. **O Reino deixa de ser uma lista por data e vira descoberta:**

1. **Destaques no topo:** até 3 cards dos maiores feitos dos últimos 7 dias. Contam como maiores, nesta ordem: patente nova, ciclo SS ou SSS, maestria com Nível 80 ou mais.
2. **No máximo 2 posts por pessoa por dia** no Reino. Os demais ficam no perfil dela.
3. **Ordem:** primeiro quem pontuaria nos Recomendados (mesma pontuação da seção 1), depois o resto por data.
4. **Botão "Adicionar"** discreto no card de quem não é amigo nem tem pedido pendente. Depois de tocar, vira "Pedido enviado".

O filtro que já existe (`filtrarFeed`) continua decidindo Aliados contra Reino. O que muda é só a montagem do Reino depois do filtro. Faça isso numa função pura e teste nela:
- o limite por pessoa;
- os destaques;
- que ninguém aparece duas vezes.

---

## 3. Interações na visita ao jardim

### A ideia

Quem visita pode **fazer algo** no jardim: soltar uma borboleta, alimentar os peixes, deixar um recado.

- **Cada interação custa fragmentos.**
- **O dono vê depois o que foi feito e por quem.**

É carinho entre amigos, e é também onde o fragmento é gasto. O dono **não ganha fragmentos** com isso. Se ganhasse, uma conta falsa poderia "visitar" a principal para farmar.

### Como a pessoa usa

1. Entra no jardim de alguém (o "Entrar" que já existe).
2. **No canto da tela aparece um botãozinho redondo de ação**, com ícone e sem texto (rótulo acessível "Interagir"). Ele só existe na visita, nunca no jardim próprio. Fica num canto que não tapa o jardim nem os botões que já existem, e com toque de pelo menos 44 px.
3. **Tocar no botãozinho abre uma listinha ali mesmo, sem modal.** Ela desliza a partir do botão, por cima do jardim, que continua visível atrás, e abre em menos de 200 ms. Tocar fora ou de novo no botão fecha.
4. **Cada linha da lista tem, da esquerda para a direita:**
   - o ícone da interação;
   - o nome;
   - **o custo com o PNG do fragmento** ao lado do número (use o símbolo de fragmento que o app já tem, `components/ValorIcon.tsx` com `valor="fragmento"`, e não um emoji);
   - **um botão de ação** na ponta ("Soltar", "Alimentar", "Deixar").

   No topo da lista fica o saldo do visitante, com o mesmo PNG. Linhas indisponíveis ficam em cinza, com o botão desligado e o motivo em letra pequena na própria linha ("Sem lago neste jardim", "Fragmentos insuficientes", "Já feito hoje aqui").
5. **O botão da linha já confirma:** um toque troca o texto para "Confirmar · 3" por 2 segundos, e o segundo toque faz. Assim não abre janela nenhuma e não há gasto sem querer. O servidor debita os fragmentos e grava a marca. O efeito aparece na hora no 3D, a lista fecha sozinha e o saldo do topo já mostra o valor novo na próxima vez.
6. **O recado** é a única linha que abre mais uma camada: tocar "Deixar" troca a lista pelas 10 frases prontas, no mesmo lugar e ainda sem modal. Tocar uma frase confirma do mesmo jeito do item 5.

### O catálogo inicial

Os preços ficam numa constante só, para ajustar sem caçar no código.

| Interação | Custo | Requisito | O que aparece no 3D | Dura |
|---|---|---|---|---|
| Deixar um recado | 1 | — | Uma pedrinha com o recado no chão. Tocar abre o texto e o nome de quem deixou | 7 dias |
| Alimentar os peixes | 2 | Base com lago (`garden_base_pond`) | Os peixes juntam onde caiu a ração por alguns segundos | 24 h (fica o registro) |
| Espalhar pétalas | 2 | — | Pétalas no caminho | 24 h |
| Soltar uma borboleta | 3 | — | Uma borboleta voando pelo jardim. Tocar mostra quem soltou | 24 h |
| Acender uma lanterna | 3 | Ter lanterna (`JARDIM_LANTERNA_PEDRA`) | A lanterna acesa, com brilho | 24 h |

Para começar, basta: recado, peixes e borboleta. Pétalas e lanterna podem vir depois. Deixe o catálogo pronto para crescer: cada item é `{ id, nome, custo, requisito, duracao }`.

### Recados: só frases prontas

**Decidido: não existe texto livre.** O visitante escolhe uma das frases abaixo, e o servidor guarda o `id` da frase, não o texto:

1. Passei por aqui.
2. Que jardim bonito.
3. Que paz aqui.
4. Força no ciclo!
5. Parabéns pela patente!
6. Bora juntos amanhã.
7. Seu jardim me inspirou.
8. Bom descanso.
9. Cuide-se.
10. Volto logo.

### Limites (contra spam)

- Até **3 interações por visitante, por jardim, por dia** (o dia do Glyph vira às 4h).
- **No máximo 1 recado** por visitante, por jardim, por dia.
- O jardim mostra no máximo **20 marcas ativas**. Passando disso, as mais antigas somem do 3D, mas continuam na lista do dono.

### O que o dono vê

- **Ao entrar no próprio jardim:** um painel "Visitas desde a última vez", com quem, o que fez e quando. Depois de visto, fecha e não volta.
- **No Oráculo, aba Alertas:** "Luna soltou uma borboleta no seu jardim". Um alerta por visitante por dia, juntando as interações dele.
- **As marcas aparecem no 3D** enquanto duram. Os recados podem ser **removidos** pelo dono.
- **Ajuste novo do jardim:** "Permitir interações de visitantes", ligado por padrão. Desligado, quem visita só olha, e o botão "Interagir" não aparece.

### Servidor

- **Tabela `garden_visit_marks`:**
  - `id`, `owner_id`, `visitor_id`, `kind` (texto do catálogo);
  - `phrase_id` (só para recado);
  - `cost`, `created_at`, `expires_at`, `removed_at`.
  - RLS: o dono lê as marcas do jardim dele; o visitante lê as que ele mesmo deixou; ninguém escreve direto.
- **`deixar_marca_no_jardim(p_owner uuid, p_kind text, p_phrase_id int default null)`**, `security definer`, numa transação só:
  1. confere que o visitante pode ver o jardim (`gardenVisibility`) e que o dono não desligou as interações;
  2. confere o requisito do item (lago, lanterna) no jardim salvo do dono;
  3. confere os limites do dia;
  4. **debita os fragmentos pelo caminho que já existe** e falha sem gravar nada se o saldo não der;
  5. grava a marca e devolve o saldo novo.
- **`marcas_do_jardim(p_owner uuid)`:** marcas ativas, para desenhar a visita e o jardim próprio. Recado sai com o `phrase_id`, e o texto vem do app.
- **`remover_recado(p_mark uuid)`:** só o dono, e só recado.
- O alerta do dono usa o sistema de notificações que já existe.

### 3D (`zen3d-test/`)

- O iframe recebe as marcas por `postMessage`, como já recebe o resto do jardim.
- A borboleta, os peixes, as pétalas, a lanterna e a pedrinha do recado são objetos novos, leves.
- **Na visita, nada do jardim do dono pode ser salvo ou alterado.** As marcas são uma camada por cima, e não um item do jardim dele.

### Testes mínimos

- Saldo insuficiente não grava marca e não debita.
- "Alimentar os peixes" sem lago é recusado.
- O 4º no mesmo dia e o 2º recado são recusados.
- Dono com interações desligadas recusa tudo.
- Jardim invisível para o visitante recusa tudo.
- O dono não ganha fragmentos.
- O recado só aceita `phrase_id` de 1 a 10.
- Só o dono remove recado.

---

## Fora do escopo agora

- Chat ou mensagem livre entre visitantes.
- Recado com texto livre.
- O dono ganhar algo com as visitas.
- Mexer na cesta de presentes: ela é recompensa por uso e continua igual.
- Qualquer mudança na home do site glyph.life.

---

## Ao terminar: o relatório de entrega

Não feche nada sozinho. Commit, push, publicar o site, deploy de função e AAB ficam com o Claude, que fecha as pontas finais com o Afonso. Ao terminar, entregue ao Afonso um relatório com:

1. **Arquivos mudados e criados**, um por linha, com uma frase do que mudou.
2. **Migrações SQL**: o nome de cada arquivo, em que ordem rodar, e se `sql:checa` passou.
3. **Funções do Supabase** que precisam de deploy (se alguma mudou).
4. **Testes**: os novos, e o resultado de todos os `tests/*.regression.mjs`. Falhas que já existiam ficam listadas à parte, pelo nome.
5. **O que muda no app** (precisa de AAB) e **o que muda no site** (se algo do site precisar acompanhar, como a página Premium ou uma novidade).
6. **Decisões que você tomou** e não estavam aqui, cada uma com o motivo.
7. **O que ficou pendente** ou não foi testado de verdade.

O Afonso passa esse relatório para o Claude, que confere, roda o que for preciso e fecha commit, push, site e AAB.
