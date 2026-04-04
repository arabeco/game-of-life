# Data Safety e App Privacy - GLYPH

Atualizado em: 2026-04-03  
Base: leitura do codigo atual do app web/PWA e das funcoes Supabase.

Objetivo: servir como mapa inicial para preencher:

- Google Play `Data safety`
- Apple `App Privacy`

Importante:

- este documento e tecnico-operacional, nao juridico
- alguns pontos abaixo sao `inferencias` a partir do codigo e devem ser confirmados antes do preenchimento final nas lojas

---

## 1. Resumo executivo

Pelo codigo atual, o GLYPH trata dados nas seguintes frentes:

- conta e autenticacao
- perfil e identidade visual
- progresso e uso do produto
- social e mensagens
- uploads/imagens
- pagamentos
- notificacoes
- IA do Oraculo
- eventos tecnicos/runtime

Terceiros/infra identificados no codigo:

- Supabase
- Google OAuth
- OpenRouter
- Mercado Pago
- Web Push
- Resend

Meu veredito atual:

- **tracking publicitario cross-app:** nao encontrei evidencia clara
- **dados ligados ao usuario:** sim, em varias frentes
- **dados compartilhados com terceiros para operar o servico:** sim

---

## 2. Fontes principais no codigo

### Autenticacao e conta

- [LoginView.tsx](/C:/Users/Afonso/Downloads/GOL1.006/views/LoginView.tsx)
- [App.tsx](/C:/Users/Afonso/Downloads/GOL1.006/App.tsx)

### Perfil e dados persistidos

- [GameContext.tsx](/C:/Users/Afonso/Downloads/GOL1.006/contexts/GameContext.tsx)
- [SupabaseService.ts](/C:/Users/Afonso/Downloads/GOL1.006/services/SupabaseService.ts)
- [types.ts](/C:/Users/Afonso/Downloads/GOL1.006/types.ts)

### IA do Oraculo

- [oracle/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/oracle/index.ts)

### Pagamentos

- [mercadopago/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/mercadopago/index.ts)

### Notificacoes

- [web-push/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/web-push/index.ts)
- [resend/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/resend/index.ts)

### Texto de aceite atual

- [AppRuntimeOverlays.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/AppRuntimeOverlays.tsx)

---

## 3. Inventario de dados

## 3.1 Conta e autenticacao

Dados observados:

- email
- senha
- identificador de usuario
- provider de login
- estado de sessao

Origem:

- digitado pelo usuario
- Google OAuth

Ligado ao usuario:

- sim

Compartilhado:

- sim, com Supabase Auth
- sim, com Google quando o usuario escolhe login Google

Finalidade:

- criar conta
- autenticar
- recuperar acesso
- manter sessao

Loja:

- Google Data Safety:
  - `Personal info > Email address`
  - `Personal info > User IDs`
- Apple App Privacy:
  - `Contact Info > Email Address`
  - `Identifiers > User ID`

## 3.2 Perfil

Dados observados:

- nickname
- avatarUrl
- backgroundUrl
- bannerUrl
- title
- level
- role
- clanName
- clanIcon
- configuracao do soberano
- preferencia de tema/modo

Ligado ao usuario:

- sim

Compartilhado:

- sim, com Supabase
- parte pode ser exibida socialmente para outros usuarios

Finalidade:

- personalizacao
- identidade visual
- progressao
- recursos sociais

Loja:

- Google:
  - `Personal info > Name`
  - possivelmente `Photos and videos`, quando houver avatar/fundo enviado
- Apple:
  - `Contact Info > Name`
  - `User Content`

## 3.3 Progresso e uso do produto

Dados observados:

- arenas
- acoes
- tarefas agendadas
- ciclos
- relatorios
- campanhas/codexes
- inventario
- wallet
- patentes/rankings
- estados de temporada
- preferencias do Oraculo

Ligado ao usuario:

- sim

Compartilhado:

- sim, com Supabase
- parte desse conteudo pode ser refletida em social/mentoria/grupo

Finalidade:

- funcionamento central do produto
- progresso
- economia interna
- historico

Loja:

- Google:
  - `App activity`
  - `In-app search history` provavelmente nao
  - `Other user-generated content` em alguns trechos
- Apple:
  - `Usage Data`
  - `User Content`

Inferencia:

- aqui vale preencher com cuidado; boa parte e mais `conteudo do usuario` do que `telemetria comportamental`.

## 3.4 Recursos sociais

Dados observados:

- amizades
- pedidos de amizade
- grupos
- pedidos de entrada em grupo
- mentoria/relacionamentos
- mensagens diretas
- mensagens de cla
- denuncias e bloqueios

Ligado ao usuario:

- sim

Compartilhado:

- sim, com outros usuarios do proprio servico
- sim, persistido no Supabase

Finalidade:

- comunicacao
- social
- moderacao
- seguranca

Loja:

- Google:
  - `Messages`
  - `Photos and videos` se houver imagem compartilhada socialmente
  - `Other user-generated content`
- Apple:
  - `User Content`

## 3.5 Uploads e imagens

Dados observados:

- avatar
- imagens/fundos
- arquivos em storage

Observacao importante:

- o proprio texto atual do app ja admite que uploads e anexos podem ficar acessiveis por link

Ligado ao usuario:

- sim

Compartilhado:

- sim, com Supabase Storage
- potencialmente acessivel por URL dependendo do bucket/configuracao

Finalidade:

- personalizacao
- identidade
- apresentacao visual

Loja:

- Google:
  - `Photos and videos`
- Apple:
  - `Photos or Videos`
  - `User Content`

## 3.6 Pagamentos e compras

Dados observados:

- status de compra
- valor pago
- tier/produto
- email do pagador
- nome do pagador
- CPF do pagador
- metadados de pagamento

Ligado ao usuario:

- sim

Compartilhado:

- sim, com Mercado Pago
- sim, com Supabase

Finalidade:

- processar compra
- antifraude
- conciliacao
- entregar gold/assinatura

Loja:

- Google:
  - `Financial info`
  - `Purchase history`
- Apple:
  - `Purchases`
  - possivelmente `Financial Info` dependendo do recorte final

Observacao:

- quando o app for para mobile nativo, isso vai mudar parcialmente por causa de billing Apple/Google.

## 3.7 Notificacoes

Dados observados:

- preferencias de notificacao
- push subscription
- status de entrega
- conteudo resumido da notificacao
- email de notificacao quando aplicavel

Ligado ao usuario:

- sim

Compartilhado:

- sim, com Supabase
- sim, com web push provider/browser
- sim, com Resend para email

Finalidade:

- alertas
- notificacoes do Oraculo
- mensagens diretas
- comunicacao transacional

Loja:

- Google:
  - geralmente fica dentro de `App activity` / `Device or other IDs` dependendo do token final
- Apple:
  - `Identifiers` ou `User ID`, dependendo do mapeamento do token/assinatura

## 3.8 IA do Oraculo

Dados observados:

- contexto do usuario
- arenas
- acoes
- tarefas
- ciclo
- preferencias do Oraculo
- nickname
- nivel
- dados suficientes para gerar resposta contextual

Ligado ao usuario:

- sim

Compartilhado:

- sim, com OpenRouter

Finalidade:

- gerar resposta do Oraculo
- analise contextual
- cards/feed/push do Oraculo

Loja:

- Google:
  - entra como dado compartilhado para funcionalidade do app
- Apple:
  - precisa entrar no inventario como dado coletado/compartilhado se for associado ao usuario

Observacao:

- esse e um dos pontos mais importantes de transparência.

## 3.9 Runtime e diagnostico

Dados observados:

- eventos de runtime
- sinais tecnicos
- possiveis erros/telemetria minima

Ligado ao usuario:

- em parte sim

Compartilhado:

- sim, com Supabase

Finalidade:

- estabilidade
- diagnostico
- qualidade tecnica

Loja:

- Google:
  - `App info and performance > Crash logs`
  - `Diagnostics`
- Apple:
  - `Diagnostics`

Inferencia:

- precisa confirmar o nivel real de detalhe desses eventos antes do preenchimento final.

---

## 4. Terceiros identificados

## 4.1 Supabase

Uso:

- autenticacao
- banco
- storage
- realtime
- edge functions

## 4.2 Google

Uso:

- login OAuth

## 4.3 OpenRouter

Uso:

- processamento da IA do Oraculo

## 4.4 Mercado Pago

Uso:

- pagamentos web

## 4.5 Web Push

Uso:

- push web atual

## 4.6 Resend

Uso:

- emails transacionais

---

## 5. Respostas preliminares para as lojas

## 5.1 Google Play Data Safety

Resposta preliminar:

- o app **coleta dados**: sim
- o app **compartilha dados**: sim, com parceiros para operar o servico
- dados sao **criptografados em transito**: inferencia forte de que sim, via HTTPS
- usuario pode **solicitar exclusao de dados**: sim

Categorias com alta chance de marcar:

- Personal info
  - Email address
  - Name
  - User IDs
- Financial info
  - Purchase history
- Messages
- Photos and videos
- App activity
- App info and performance

Tracking publicitario:

- **nao encontrei evidencia clara de advertising tracking**

## 5.2 Apple App Privacy

Categorias com alta chance de marcar:

- Contact Info
  - Email Address
  - Name
- Identifiers
  - User ID
- Purchases
- User Content
- Diagnostics
- talvez Usage Data

Tracking:

- **nao encontrei evidencia clara de tracking cross-app / ads**

---

## 6. O que ainda precisa ser confirmado antes do preenchimento final

1. Se existe analytics/SDK adicional fora deste repo
2. Se uploads de imagem continuam publicos ou vao mudar
3. Se runtime events guardam algum dado sensivel adicional
4. Se o email transacional vai continuar com Resend na versao mobile
5. Como o billing mobile vai alterar a parte de `Purchases`

---

## 7. Proximo passo recomendado

Transformar este inventario em dois checklists objetivos:

1. `Google Play Data Safety - respostas prontas`
2. `Apple App Privacy - respostas prontas`

Esse deve ser o proximo documento, porque ai voce entra no console ja com o formulario quase preenchido.

---

## 8. Estrutura esperada - Google Play Data Safety

Sim, a estrutura geral das perguntas e conhecida e relativamente estavel, embora a interface e a ordem visual possam mudar um pouco.

Com base na ajuda oficial do Google Play, voce deve esperar algo assim em:

- `Play Console > App content > Data safety`

### Bloco A - Visao geral

Pergunta esperada:

- o app coleta ou compartilha algum dado?

Se a resposta for `sim`, o formulario segue.

### Bloco B - Seguranca e exclusao

Perguntas esperadas:

- todos os dados coletados sao criptografados em transito?
- o usuario pode solicitar exclusao dos dados?

No estado atual do GLYPH, a resposta preliminar e:

- criptografia em transito: `sim`, por inferencia forte via HTTPS
- exclusao de dados: `sim`

### Bloco C - Tipos de dados

O console pede para marcar quais tipos de dados o app coleta ou compartilha.

Voce deve esperar categorias como:

- personal info
- financial info
- messages
- photos and videos
- app activity
- app info and performance
- device or other IDs

### Bloco D - Uso e tratamento por tipo

Para cada tipo marcado, o Google costuma perguntar algo no formato:

- este dado e coletado, compartilhado ou ambos?
- este dado e processado de forma temporaria?
- este dado e obrigatorio para o app?
- por qual finalidade ele e usado?

Finalidades comuns no formulario:

- funcionalidade do app
- analytics
- comunicacao com desenvolvedor
- prevencao de fraude, seguranca e compliance
- personalizacao
- gerenciamento de conta

### Bloco E - Data deletion

O Google tambem conecta isso ao badge/area de exclusao.

Perguntas relacionadas:

- o usuario pode solicitar exclusao da conta?
- existe caminho in-app?
- existe suporte para exclusao de dados?

### Resposta pratica para o GLYPH

O GLYPH provavelmente vai marcar `sim` para:

- coleta de dados
- compartilhamento com terceiros para operar o servico
- criptografia em transito
- exclusao de dados sob solicitacao

E vai marcar categorias como:

- email
- user IDs
- name/nickname
- purchases / purchase history
- messages
- photos and videos
- app activity
- diagnostics

### Fonte oficial

- Google Play Data Safety:
  [support.google.com/googleplay/android-developer/answer/10787469](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- Google account deletion requirement:
  [support.google.com/googleplay/android-developer/answer/13327111](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)

---

## 9. Estrutura esperada - Apple App Privacy

Na Apple, a estrutura tambem e conhecida, mas voce so vai preencher de verdade depois que tiver o app em:

- `App Store Connect > My Apps > seu app > App Privacy`

Seu amigo pode te ajudar nisso melhor quando a conta Apple Developer estiver ativa, mas ja da para preparar tudo agora.

### Bloco A - O app coleta dados?

Pergunta base esperada:

- o app coleta algum dado?

Se sim, a Apple pede o detalhamento por categoria.

### Bloco B - Tipos de dados

A Apple trabalha com familias como:

- Contact Info
- Health and Fitness
- Financial Info
- Location
- Sensitive Info
- Contacts
- User Content
- Browsing History
- Search History
- Identifiers
- Purchases
- Usage Data
- Diagnostics

Para o GLYPH, as categorias mais provaveis sao:

- Contact Info
  - Email Address
  - Name
- Identifiers
  - User ID
- Purchases
- User Content
- Usage Data
- Diagnostics
- Photos or Videos

### Bloco C - Para cada tipo de dado

Para cada categoria/subcategoria, a Apple costuma perguntar:

- esse dado e coletado pelo app?
- ele e vinculado ao usuario?
- ele e usado para tracking?
- para qual finalidade ele e usado?

### Bloco D - Tracking

Pergunta critica:

- esse dado e usado para tracking?

No estado atual do GLYPH, a resposta preliminar e:

- `nao encontrei evidencia clara de tracking publicitario cross-app`

### Bloco E - Finalidades

As finalidades mais comuns na Apple incluem:

- funcionalidade do app
- analytics
- personalizacao do produto
- gerenciamento de conta
- seguranca / prevencao a fraude
- comunicacao com o desenvolvedor

### Resposta pratica para o GLYPH

A leitura preliminar do app hoje indica:

- coleta de dados: `sim`
- dados vinculados ao usuario: `sim`, em varias frentes
- tracking: `provavelmente nao`
- compartilhamento com parceiros operacionais: `sim`

### Fonte oficial

- Apple App Privacy details:
  [developer.apple.com/app-store/app-privacy-details](https://developer.apple.com/app-store/app-privacy-details/)
- Apple Manage app privacy:
  [developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)

---

## 10. Leitura honesta sobre o quanto ja sabemos

Eu ja sei bem o formato e os blocos de pergunta das duas lojas.

O que pode mudar:

- ordem exata da interface
- nomes visuais de alguns passos
- pequenos detalhes do formulario

O que nao muda muito:

- tipos de dados
- ideia de `coleta / compartilha`
- vinculacao ao usuario
- tracking
- exclusao
- seguranca em transito

Entao sim: ja da para preparar isso com bastante precisao agora, e depois seu amigo te ajuda a bater com a tela real da Apple quando a conta Apple Developer estiver ativa.
