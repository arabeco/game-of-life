# Play Console - Primeiros Passos do GLYPH

Atualizado em: 2026-04-03

Objetivo: tirar a névoa do começo da Play Store e separar o que já dá para fazer agora do que depende do app Android pronto.

---

## 1. Leitura curta

Você não precisa esperar o Capacitor para começar no Play Console.

Já dá para adiantar:

- criar o app
- escolher nome, idioma e categoria
- preencher partes de conteúdo
- preparar política de privacidade
- preparar exclusão de conta
- organizar testers

O que ainda depende do app Android pronto:

- subir `.aab`
- testar release
- fechar trilha de produção
- validar billing mobile

---

## 2. Onde entrar

Site:

- [Google Play Console](https://play.google.com/console)

Caminho mental:

1. criar o app
2. preencher `Store presence`
3. preencher `App content`
4. preparar `Testing`
5. só depois subir build

---

## 3. O que fazer agora

## 3.1 Criar o app

Caminho:

- `All apps`
- `Create app`

Campos:

- `App name`
- `Default language`
- `App or game`
- `Free or paid`

Sugestão para o GLYPH:

- nome: `GLYPH`
- idioma principal: `Português (Brasil)` ou o idioma principal real do produto
- tipo: `App`
- modelo: `Free`

Observação:

- mesmo que você venda coisas dentro do app depois, normalmente o app em si pode continuar como `Free`

---

## 3.2 Abrir o Dashboard e não se assustar

Depois que o app existir, o Play Console normalmente vai mostrar blocos em:

- `Dashboard`
- `Set up your app`
- `App content`
- `Testing`
- `Store presence`

Seu trabalho agora é ir limpando pendências, uma por uma.

---

## 4. Store Presence

## 4.1 Main store listing

Caminho:

- `Grow`
- `Store presence`
- `Main store listing`

O que costuma pedir:

- nome do app
- descrição curta
- descrição completa
- categoria
- email de contato
- website
- política de privacidade
- ícone
- feature graphic
- screenshots

O que já dá para fazer agora:

- nome
- categoria
- email
- site
- privacy policy URL

O que pode deixar para depois:

- screenshots finais
- feature graphic final
- descrição refinada

Dados públicos que você já tem:

- email: `glyph.life.app@gmail.com`
- termos: `https://www.glyph.life/termos.html`
- privacidade: `https://www.glyph.life/privacidade.html`

Faltando alinhar na landing:

- `suporte.html`
- `exclusao.html`

---

## 5. App Content

Essa área é a que mais importa agora.

## 5.1 Privacy policy

Você já consegue preencher assim que a página pública estiver revisada.

URL esperada:

- `https://www.glyph.life/privacidade.html`

Status do GLYPH:

- quase pronto
- depende só da revisão da landing

---

## 5.2 Account deletion

O Google pede duas coisas:

- exclusão de conta iniciada dentro do app
- e uma página web explicando o caminho alternativo

Status do GLYPH:

- dentro do app: já existe
- web: depende de `https://www.glyph.life/exclusao.html`

O que fazer quando a página estiver pronta:

- colar a URL no Play Console

---

## 5.3 Data safety

Essa é a seção em que você vai responder o questionário de dados do app.

Para isso, use estes arquivos do projeto:

- [DATA_SAFETY_APP_PRIVACY_GLYPH.md](C:\Users\Afonso\Downloads\GOL1.006\DATA_SAFETY_APP_PRIVACY_GLYPH.md)
- [GOOGLE_PLAY_DATA_SAFETY_RESPOSTAS_GLYPH.md](C:\Users\Afonso\Downloads\GOL1.006\GOOGLE_PLAY_DATA_SAFETY_RESPOSTAS_GLYPH.md)

Status do GLYPH:

- já dá para preparar quase tudo agora
- melhor preencher com calma, sem chute

---

## 5.4 Ads

Pergunta simples:

- o app mostra anúncios?

Se não mostra anúncios de terceiros, a resposta tende a ser:

- `No`

Só confirmar isso na implementação real antes de marcar.

---

## 5.5 App access

Se o app exige login para funcionar, o Google pode pedir instruções de acesso para review.

Status do GLYPH:

- provavelmente vai precisar

O que preparar depois:

- conta de teste
- instruções simples para reviewer

---

## 5.6 Content rating

Você responde um questionário e o Google calcula a classificação indicativa.

Status do GLYPH:

- dá para preencher mais para frente
- não precisa ser o primeiro passo

---

## 5.7 Target audience and content

Você informa para quem o app é destinado.

Ponto importante:

- se o produto não é infantil, marque com cuidado para não cair em requisitos de app para crianças

---

## 5.8 Sensitive categories

Dependendo do app, o Google pode perguntar sobre áreas como:

- saúde
- finanças
- notícias

O GLYPH pode encostar em desenvolvimento pessoal, rotina, planejamento e performance, então essa parte precisa ser respondida com honestidade, sem vender como app clínico se ele não for.

---

## 6. Testing

## 6.1 O que você pode adiantar agora

Caminho:

- `Testing`
- `Closed testing`

Você já pode:

- entender a tela
- preparar a lista de testers
- decidir se vai usar closed testing primeiro

Minha recomendação:

- começar por `Closed testing`

---

## 6.2 O que só entra depois

Só quando o app Android existir:

- criar release
- subir `.aab`
- instalar no aparelho
- testar login, navegação e notificações

---

## 7. App Signing

Caminho:

- `Release`
- `Setup`
- `App signing`

Regra prática:

- aceite `Play App Signing`

Você não precisa travar nisso agora, mas quando o Android estiver pronto, isso precisa ficar certo.

---

## 8. O que depende do app Android pronto

Essas partes ficam para a fase técnica:

- Android App Bundle (`.aab`)
- target API atual
- testes em aparelho real
- integração de billing mobile
- push nativo Android

Resumo:

- Play Console dá para adiantar
- build Android não

---

## 9. Ordem recomendada para você

## Agora

1. criar o app no Play Console
2. abrir `Main store listing`
3. abrir `App content`
4. olhar todas as pendências
5. deixar anotado o que já aceita URL e o que depende do app pronto

## Nesta semana

1. finalizar as páginas públicas da landing
2. preencher:
   - privacy policy
   - account deletion
3. usar o arquivo de `Data Safety` como gabarito

## Depois

1. entrar em Capacitor / Android shell
2. gerar build
3. subir closed testing

---

## 10. O que você me manda quando quiser ajuda prática

Quando você abrir o Play Console, o que mais ajuda é me mandar:

- print ou lista das seções que aparecem em `App content`
- print ou lista das seções que aparecem em `Store presence`
- qualquer campo que você ficar em dúvida

Com isso eu consigo te responder em modo bem direto:

- `marca isso`
- `deixa isso para depois`
- `esse aqui depende da página pública`
- `esse aqui depende do app Android`

---

## 11. Resumo final

O começo certo do Play Console para o GLYPH é:

- criar o app
- preencher o que é institucional
- preparar conteúdo e compliance
- deixar build e Android nativo para a fase seguinte

Você não está atrasado por ainda não ter o app Android pronto.
Na verdade, adiantar o console e as páginas públicas agora é o jeito inteligente de não embolar tudo depois.
