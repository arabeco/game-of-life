# Blueprint pré-launch

**Auditoria:** 30/09/2026 · **Atualizado:** 02/10/2026
**Base:** código, `AndroidManifest.xml` e o site no ar em `glyph.life`
**Objetivo:** lançar sem medo.

Tudo marcado como feito foi **conferido**, não deduzido. O que não deu pra
conferir está marcado como tal em vez de ser chutado.

---

## Índice — o que falta resolver

### Bloqueia o lançamento

- [ ] **17 · Idade mínima nos Termos** — nada hoje, e a Play Console pergunta de frente
- [ ] **3 · Reembolso** — um parágrafo nos Termos; com Mercado Pago o CDC manda 7 dias
- [ ] **Validar recibo do Google Play no servidor** — se falhar, a pessoa paga e não recebe
- [ ] **Rodar a query 1 do `vanguarda25_esta_de_pe.sql`** — descobrir se o código existe

### Teu, no site

- [ ] **5 · Banner de cookie** — ou corrigir a Privacidade, que promete preferência que não existe
- [ ] **4 · Política de cookie** — hoje é uma linha dentro da Privacidade
- [ ] **12 · "embasamento real"** na landing — alegação que pede prova
- [ ] **12 · contador `-- guerreiros na fila`** — quebrado em produção

### Produto

- [ ] **Criar o código escondido** — decidir payload, teto e validade
- [ ] **Criar o código secreto "fodão"** — mesmo, com atenção no `max_redemptions`
- [ ] **Conferir convidar/compartilhar de ponta a ponta**
- [ ] **Varredura de acento** nas strings de interface
- [ ] **8 · Formulário de Segurança dos Dados** na Play Console
- [ ] **19 · Procedência da arte do jogo** — só tu sabe

### Depois, sem pressa

- [ ] **9 · Dark patterns** — ler fluxo de compra e cancelamento
- [ ] **10 · Hidden fees** — idem
- [ ] **15 · Navegação por teclado** — parcial; pesa pouco em Android

### Já resolvido

- [x] **1 · Política de privacidade** — `glyph.life/privacidade`, v1.0, linkada no login e nas configurações
- [x] **2 · Termos de uso** — `glyph.life/termos`, mesma versão
- [x] **6 · Consentimento no cadastro** — aceite explícito + colunas com versão gravadas no perfil
- [x] **7 · Dado desnecessário** — `RECORD_AUDIO` removida do manifesto (`8d26ec9`)
- [x] **11 · Avaliação falsa** — não existe depoimento no site nem no app
- [x] **13 · Texto alternativo** — os dois últimos `<img>` sem `alt` corrigidos (`8d26ec9`)
- [x] **14 · Contraste** — painel diário e placa: 106 textos medidos, 0 abaixo de AA
- [x] **16 · Dados do responsável** — nome e e-mail nos dois documentos
- [x] **18 · Descadastro de e-mail** — não é necessário: só sai transacional
- [x] **19 · Fontes** — Cinzel, Cinzel Decorative e Inter, todas sob SIL OFL
- [x] **20 · Exclusão de dados** — botão no app + edge function + página pública
- [x] **Moderação de UGC** — denunciar, bloquear e conteúdo realmente oculto
- [x] **Trilho de pagamento** — Android vai pro Play Billing, sem escapatória web

---

## 1. Os quatro bloqueadores

### 1.1 Idade mínima — ponto 17

Não há idade no cadastro, nos Termos nem na Privacidade. A busca por
`\d{1,2}\s*anos|menor|idade mínima` volta vazia nos três.

A Play Console pergunta isso no formulário de público-alvo. Sem idade declarada,
o app cai na trilha de "pode ter criança", que puxa a Families Policy inteira.

**13+ está liberado.** A dúvida era a moderação de conteúdo — as lojas exigem
denunciar e bloquear quando há UGC e menor de idade. Auditado em 02/10:

| exigência | onde |
|---|---|
| denunciar usuário | `DirectMessages.tsx:353` |
| denunciar mensagem | `DirectMessages.tsx:458`, `ClanChat.tsx:296` |
| bloquear / desbloquear | ambos os canais |
| conteúdo some de fato | `ClanChat.tsx:238` → "Mensagem oculta de usuário bloqueado", na carga inicial e em tempo real |
| não dá pra escrever pra quem bloqueou | `DirectMessages.tsx:505` |
| registro das denúncias | `moderation_reports` |

Tabelas em `supabase/migrations/20260403143000_add_social_moderation_tables.sql`.

O bloqueio é aplicado no cliente: a mensagem desce do banco e o app esconde. É o
que a maioria dos apps faz e o Play aceita — só não é segredo criptográfico.

**Falta:** escrever a idade mínima nos Termos.

### 1.2 Reembolso — ponto 3

A palavra "reembolsáveis" aparece **uma vez** nos Termos. Não dá pra simplesmente
tirar, porque depende do trilho:

- **Google Play Billing** → o Google reembolsa. Tu só precisa dizer onde se pede.
- **Mercado Pago** → é venda direta tua, e o **CDC art. 49** dá 7 dias de
  arrependimento sem justificativa. Isso vale escrito ou não.

**Falta:** um parágrafo nos Termos cobrindo os dois casos.

### 1.3 Validar o recibo do Play no servidor

Este é o risco que o site não é.

A compra pelo Google Play precisa ter o recibo validado no backend antes de
liberar o premium. O `LAUNCH_READINESS_REPORT.md` lista isso como teste manual
pendente: *"Compra real pela Google Play (recibo validado na edge function)"*.

Se falhar, a pessoa paga e não recebe — e aí vem reembolso, nota 1 e review da
loja.

### 1.4 O `VANGUARDA25` pode não existir

Grafia com "u": **`VANGUARDA25`**.

`sql/checks/vanguarda25_esta_de_pe.sql` existe só pra responder isso. O
comentário dele explica o risco:

> O repositório semeia `VANGUARDA10`, e o patch faz
> `update public.reward_codes ... where upper(code) = 'VANGUARDA25'`.
> Se o `VANGUARDA25` nunca foi inserido, esse update rodou sem erro nenhum e
> atualizou **zero linhas**. Update que não acha nada não reclama.

São três queries. **A que importa é a 1**, que lista os códigos existentes.

A query 3 (modal da Vanguarda) já foi rodada em 02/10: `com_modal_pendente 0`,
`ja_viram 2`, `com_pacote_gravado 1`. Dois viram a boas-vindas e só um tem pacote
gravado — **vale entender essa diferença** antes de distribuir código novo.

---

## 2. Códigos de resgate

**O sistema já existe inteiro.** Código novo é um `insert`, não código novo.

- `supabase/migrations/20260420190000_reward_codes_como_o_banco_tem.sql`
  - `reward_codes`: `code`, `title`, `is_active`, `starts_at`, `ends_at`,
    `max_redemptions`, `per_user_limit`, `reward_payload` (ouro, fragmentos,
    dias de premium)
  - `reward_code_redemptions` com histórico por usuário
  - RLS negando acesso direto a `anon` e `authenticated` — só pela função
  - RPC `redeem_reward_code(p_code, p_user_id)`
- `supabase/migrations/20260922160000_resgate_entrega_item_programa_e_modal.sql`
- `components/VanguardWelcomeModal.tsx`

**"Escondido" já funciona por construção:** nada na interface lista códigos.

A decidir para cada código novo:

| campo | pergunta |
|---|---|
| `code` | qual string |
| `reward_payload` | ouro, fragmento, dias de premium, item |
| `max_redemptions` | quantas pessoas no total |
| `per_user_limit` | normalmente 1 |
| `ends_at` | vence quando, ou nunca |

O "fodão secreto" pede atenção no `max_redemptions`: código generoso sem teto é
o tipo de coisa que vaza em grupo e esvazia a economia num fim de semana.

---

## 3. O web app continua no ar

**Sim, e a arquitetura já suporta isso com segurança.**

```
canShowWebFallback = runtimePlatform === 'web' || import.meta.env.DEV
```

Num build Android de produção os dois lados são falsos, então o botão "Abrir
checkout web" **não existe** no app publicado. O `BillingCheckoutGate` manda
Android pro Play Billing e web pro Mercado Pago.

Isso importa porque é aqui que app morre: oferecer pagamento alternativo para bem
digital dentro do app Android viola a política de pagamentos do Google.

**Por que manter o site:** cobre desktop, deixa experimentar sem instalar, é onde
os beta testers já estão, e a margem é melhor (Mercado Pago contra os 15% do
Google).

**A disciplina única:** nunca mencionar o checkout web *dentro* do app Android.
Nem texto, nem link, nem "economize comprando no site". Isso é *steering* e o
Google pune. Fora do app — e-mail, site, redes — hoje é permitido.

---

## 4. Os 20 pontos, detalhe

### Parciais

| # | Item | O que falta |
|---|---|---|
| 4 | Cookie policy | existe como uma linha dentro da Privacidade, sem documento próprio |
| 8 | SDKs de terceiro | **dependências limpas** — zero analytics, anúncio ou rastreio. Só Capacitor, Supabase, React, three, recharts, lucide, html-to-image. Mas `android/app/google-services.json` existe: o Firebase do push entra no Data Safety como ID de dispositivo |
| 12 | Alegações | landing diz "analisa quem você é, com **embasamento real**" — pede prova. E o contador mostra `--` em produção |
| 15 | Teclado | 7 modais tratam `Escape`; pesa pouco em Android, mas `app.glyph.life` roda a mesma build no navegador |

### Não auditados

**9 dark patterns** e **10 hidden fees** precisam de leitura dos fluxos de compra
e cancelamento, não de busca no código. A favor do 10: `buy_store_item` passou a
cobrar o preço do servidor, então cliente e banco não divergem mais.

**19 imagens:** fontes resolvidas; a procedência da arte do jogo é item teu.

---

## 5. Varredura de acento

Já apareceram vários nesta sessão, todos em texto que o usuário lê:

- `concluidas`, `distribuidas`, `areas` na leitura do dia — **corrigidos**
- `seu dia ativo medio e` → `médio é` — **corrigido**
- `Esta na média` → `Está na média` — **corrigido**
- `AppRuntimeOverlays.tsx:24`: "o uso do GLYPH também **e** regido", "**Politica**
  de Privacidade" — **em aberto**

Tendem a vir em bolo, porque foram escritos na mesma sessão.

---

## 6. Ordem sugerida

1. **Rodar a query 1 do `vanguarda25_esta_de_pe.sql`** — só lê, e decide o item 2
2. **Idade + reembolso nos Termos** — mesmo documento, mesma sessão de escrita
3. **Testar compra real pelo Play** com validação de recibo
4. **Decidir o cookie** — provavelmente corrigir a Privacidade, não criar banner
5. **Códigos novos**, depois de decidido payload e teto
6. **Landing** — "embasamento real" e o contador quebrado
7. **Varredura de acento**
8. **Formulário de Segurança dos Dados** na Play Console
9. **9, 10 e 15**, que são os únicos que pedem leitura de fluxo

---

## 7. Verificado, não precisa re-olhar

- `tsc` limpo
- 44 testes de lógica, 0 falhas
- contraste do painel diário e da placa: 106 textos, nenhum abaixo de AA
- zero `<img>` sem `alt` no app
- permissões Android: `INTERNET`, `MODIFY_AUDIO_SETTINGS`, `POST_NOTIFICATIONS`
- nenhum SDK de rastreio nas dependências
- fontes licenciadas
- exclusão de conta dentro do app e com página pública
- moderação de UGC completa
- Android não oferece pagamento fora do Play Billing

---

## 8. Mapa do produto

Para a lista de funcionalidades, o documento é
[`docs/FUNCIONALIDADES-GLYPH.md`](docs/FUNCIONALIDADES-GLYPH.md) — 17 tópicos,
de Ativos a Premium. É de **09/09/2026**, então não inclui o que veio depois:
vitrine do soberano, funil de missão e o painel diário refeito.
