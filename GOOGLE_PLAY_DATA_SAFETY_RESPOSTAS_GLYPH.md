# Google Play Data Safety - Respostas Sugeridas do GLYPH

Atualizado em: 2026-04-03

Objetivo: servir como gabarito inicial para preencher:

- `Play Console > App content > Data safety`

Base:

- leitura do codigo atual
- inventario em [DATA_SAFETY_APP_PRIVACY_GLYPH.md](/C:/Users/Afonso/Downloads/GOL1.006/DATA_SAFETY_APP_PRIVACY_GLYPH.md)

Importante:

- revisar antes de submeter
- se houver SDK externo fora deste repo, atualizar este documento
- quando o billing mobile entrar, revisar a parte de compras

---

## 1. Respostas gerais

### O app coleta ou compartilha algum dos tipos obrigatorios de dados do usuario?

Resposta sugerida:

- `Sim`

### Todos os dados coletados sao criptografados em transito?

Resposta sugerida:

- `Sim`

Justificativa:

- a arquitetura atual usa HTTPS/Supabase/functions externas seguras por padrao

### O usuario pode solicitar exclusao de dados?

Resposta sugerida:

- `Sim`

Justificativa:

- o app tem exclusao de conta in-app
- tambem esta sendo preparado um caminho web de suporte/exclusao

---

## 2. Tipos de dados - marcar no formulario

## 2.1 Personal info

### Email address

Resposta sugerida:

- `Coletado`
- `Compartilhado`: `Sim`, quando necessario para operar autenticacao e comunicacao transacional

Usos sugeridos:

- funcionalidade do app
- gerenciamento de conta
- comunicacao com o desenvolvedor
- seguranca / prevencao a fraude

Observacao:

- email aparece no login, autenticacao, recuperacao e comunicacoes

### Name

Resposta sugerida:

- `Coletado`

Usos sugeridos:

- funcionalidade do app
- personalizacao
- gerenciamento de conta

Observacao:

- aqui pode entrar o nickname e possivelmente nome do pagador dependendo do escopo escolhido

### User IDs

Resposta sugerida:

- `Coletado`

Usos sugeridos:

- funcionalidade do app
- gerenciamento de conta
- seguranca / prevencao a fraude

Observacao:

- o app usa IDs unicos de usuario e identificadores relacionais

---

## 2.2 Financial info

### Purchase history

Resposta sugerida:

- `Coletado`
- `Compartilhado`: `Sim`, com parceiro de pagamento quando aplicavel

Usos sugeridos:

- funcionalidade do app
- gerenciamento de conta
- seguranca / prevencao a fraude

Observacao:

- hoje existe fluxo web com Mercado Pago
- revisar esta secao quando entrar billing mobile nativo

### Outros dados financeiros

Resposta sugerida:

- `Somente se o console exigir detalhamento adicional`

Observacao:

- existe nome/email/CPF do pagador no fluxo Mercado Pago web
- no app mobile isso pode mudar depois

---

## 2.3 Messages

### Messages

Resposta sugerida:

- `Coletado`
- `Compartilhado`: `Sim`, dentro do proprio servico e com a infraestrutura necessaria

Usos sugeridos:

- funcionalidade do app
- seguranca / prevencao a fraude

Observacao:

- cobre DMs e chat de cla

---

## 2.4 Photos and videos

### Photos

Resposta sugerida:

- `Coletado`
- `Compartilhado`: `Sim`, com a infraestrutura de storage

Usos sugeridos:

- funcionalidade do app
- personalizacao

Observacao:

- cobre avatar, fundos e outros uploads de imagem

### Videos

Resposta sugerida:

- `Nao marcar por enquanto`, a menos que o console considere os videos do app como dado do usuario

Observacao:

- no codigo ha assets de video do proprio app, nao necessariamente upload do usuario

---

## 2.5 App activity

### App interactions / in-app activity

Resposta sugerida:

- `Coletado`

Usos sugeridos:

- funcionalidade do app
- analytics
- personalizacao

Observacao:

- progresso no app, ciclos, tarefas, acoes, arenas e estados de uso entram aqui com boa chance

### Outros conteudos gerados pelo usuario

Resposta sugerida:

- `Coletado`

Usos sugeridos:

- funcionalidade do app
- personalizacao

Observacao:

- campanhas, codexes, relatorios, conteudo social e configuracoes ricas podem cair aqui dependendo do recorte do formulario

---

## 2.6 App info and performance

### Crash logs

Resposta sugerida:

- `Coletado`, se o console exigir e se os eventos tecnicos forem tratados como diagnostico

Usos sugeridos:

- analytics
- funcionalidade do app

### Diagnostics

Resposta sugerida:

- `Coletado`

Usos sugeridos:

- analytics
- funcionalidade do app

Observacao:

- existe trilha de runtime/events tecnicos no app

---

## 2.7 Device or other IDs

Resposta sugerida:

- `Talvez`

Observacao:

- so marcar se o formulario/implementacao final realmente tratar push subscription, IDs tecnicos ou tokens como categoria necessaria
- revisar no momento do preenchimento final

---

## 3. O que NAO parece marcar hoje

Resposta sugerida:

- localizacao
- contatos do aparelho
- calendario do aparelho
- saude
- audio do usuario
- browsing history
- search history fora do app
- publicidade e tracking cross-app

Observacao:

- se surgir SDK novo, revisar

---

## 4. Compartilhamento com terceiros

Leitura sugerida:

- `Sim`, o app compartilha alguns dados com terceiros para operar o servico

Terceiros que justificam isso:

- Supabase
- Google OAuth
- OpenRouter
- Mercado Pago
- Resend
- Web Push/browser push stack

Importante:

- isso nao significa venda de dados
- significa compartilhamento operacional para viabilizar autenticacao, IA, pagamento, storage e notificacoes

---

## 5. Delecao de dados

Resposta sugerida:

- `Sim, o usuario pode solicitar exclusao de conta e dados`

Justificativa:

- existe caminho in-app
- esta sendo preparado suporte web complementar

Observacao:

- quando a pagina de exclusao estiver publicada, usar essa URL tambem no ecossistema da loja

---

## 6. Resumo do que provavelmente sera marcado

Marcar com alta chance:

- Email address
- Name
- User IDs
- Purchase history
- Messages
- Photos
- App interactions / app activity
- Diagnostics

Marcar com cautela / revisar na hora:

- device IDs / push identifiers
- financial info mais detalhada
- outras categorias de user-generated content conforme wording exato do console

Nao marcar por enquanto:

- location
- contacts
- health
- browsing history
- advertising data
- tracking cross-app

---

## 7. Observacao final

Quando o app migrar para:

- billing mobile nativo
- push nativo
- shell Capacitor

este documento deve ser revisado.

---

# Apple App Privacy - Respostas Sugeridas do GLYPH

Objetivo: usar este mesmo arquivo como base para:

- `App Store Connect > My Apps > seu app > App Privacy`

Observacao:

- a Apple costuma pedir esse preenchimento em outro formato visual
- mas a logica central e a mesma:
  - tipo de dado
  - se e coletado
  - se e vinculado ao usuario
  - se e usado para tracking
  - qual a finalidade

---

## 8. Respostas gerais da Apple

### O app coleta dados?

Resposta sugerida:

- `Sim`

### O app usa dados para tracking?

Resposta sugerida:

- `Nao`, com base no codigo atual

Justificativa:

- nao encontrei evidencia clara de tracking publicitario cross-app

### O app compartilha dados com terceiros para operar o servico?

Resposta sugerida:

- `Sim`

Justificativa:

- Supabase
- Google OAuth
- OpenRouter
- Mercado Pago
- Resend
- Web Push/browser push stack

---

## 9. Categorias provaveis para marcar na Apple

## 9.1 Contact Info

### Email Address

Resposta sugerida:

- `Coletado`: `Sim`
- `Vinculado ao usuario`: `Sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- funcionalidade do app
- gerenciamento de conta
- comunicacao com desenvolvedor
- seguranca / prevencao a fraude

### Name

Resposta sugerida:

- `Coletado`: `Sim`
- `Vinculado ao usuario`: `Sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- funcionalidade do app
- personalizacao
- gerenciamento de conta

Observacao:

- aqui entram nome/nickname e possivelmente dados de pagador em recortes especificos

---

## 9.2 Identifiers

### User ID

Resposta sugerida:

- `Coletado`: `Sim`
- `Vinculado ao usuario`: `Sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- funcionalidade do app
- gerenciamento de conta
- seguranca

---

## 9.3 Purchases

### Purchase History / Purchases

Resposta sugerida:

- `Coletado`: `Sim`
- `Vinculado ao usuario`: `Sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- funcionalidade do app
- gerenciamento de conta
- seguranca / prevencao a fraude

Observacao:

- hoje o fluxo forte ainda e web/Mercado Pago
- revisar quando entrar billing Apple/Google

---

## 9.4 User Content

### Messages

Resposta sugerida:

- `Coletado`: `Sim`
- `Vinculado ao usuario`: `Sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- funcionalidade do app
- seguranca / moderacao

### Photos or Videos

Resposta sugerida:

- `Coletado`: `Sim`, para fotos/imagens do usuario
- `Vinculado ao usuario`: `Sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- funcionalidade do app
- personalizacao

Observacao:

- focar em imagens/fotos do usuario
- nao confundir com videos internos do proprio app

### Other User Content

Resposta sugerida:

- `Coletado`: `Sim`
- `Vinculado ao usuario`: `Sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- funcionalidade do app
- personalizacao

Observacao:

- campanhas, codexes, relatorios, configuracoes, progresso e conteudo social podem cair aqui

---

## 9.5 Usage Data

Resposta sugerida:

- `Provavelmente Sim`

Observacao:

- usar com cuidado
- o app claramente processa progresso e interacoes
- mas boa parte disso talvez entre melhor como `User Content`

Leitura conservadora:

- marcar somente se a tela da Apple exigir esse enquadramento de forma clara

---

## 9.6 Diagnostics

Resposta sugerida:

- `Sim`
- `Vinculado ao usuario`: `Em parte / possivelmente sim`
- `Tracking`: `Nao`

Finalidades sugeridas:

- analytics
- funcionalidade do app

Observacao:

- existe trilha tecnica/runtime no app

---

## 10. O que provavelmente NAO marcar na Apple

No estado atual, nao encontrei base clara para marcar:

- Health & Fitness
- Precise Location
- Contacts do aparelho
- Browsing History
- Search History fora do app
- Sensitive Info em sentido classico de ads/tracking
- tracking cross-app

---

## 11. Regra pratica de preenchimento para Apple

Se a Apple perguntar:

### O dado e coletado?

Resposta:

- `Sim` para os dados realmente tratados pelo app

### O dado e vinculado ao usuario?

Resposta:

- `Sim` na maior parte dos casos do GLYPH

### O dado e usado para tracking?

Resposta:

- `Nao`, pelo estado atual do codigo

### Para qual finalidade?

Usar principalmente:

- funcionalidade do app
- personalizacao do produto
- gerenciamento de conta
- seguranca / prevencao a fraude
- comunicacao com desenvolvedor

---

## 12. Resumo rapido Apple

Categorias com alta chance de marcar:

- Email Address
- Name
- User ID
- Purchases
- Messages
- Photos
- Other User Content
- Diagnostics

Categorias para revisar na tela real:

- Usage Data
- detalhes mais finos de Financial Info

Nao marcar por enquanto:

- tracking
- localizacao
- contatos do aparelho
- browsing history
- advertising data

---

## 13. Observacao final conjunta

Este arquivo agora serve como base unica para:

- Google Play Data Safety
- Apple App Privacy

Quando entrarem:

- Apple billing
- Google billing
- push nativo
- shell mobile com Capacitor

vale revisar tudo mais uma vez.
