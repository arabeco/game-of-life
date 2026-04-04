# Teste Android sem Play Store - GLYPH

Atualizado em: 2026-04-03

Objetivo: explicar como testar o GLYPH como app Android real antes de publicar na Play Store.

Base oficial:

- Capacitor: [capacitorjs.com/docs/next](https://capacitorjs.com/docs/next)
- Firebase Cloud Messaging Android: [firebase.google.com/docs/cloud-messaging/android/client](https://firebase.google.com/docs/cloud-messaging/android/client?hl=en)

---

## 1. Resposta curta

Sim, da para testar o app no celular sem loja.

Voce tem 2 caminhos:

- emulador Android
- celular Android fisico por USB

O mais util para o GLYPH vai ser:

- **celular fisico**

Porque voce sente:

- performance real
- notificacao real
- permissao real
- comportamento real de teclado, links e WebView

---

## 2. Como isso funciona de verdade

O fluxo mental certo e:

1. o app web continua existindo
2. o Capacitor cria um shell Android nativo
3. esse shell embala a build web dentro de uma WebView
4. o Android Studio instala esse app no seu celular
5. voce testa como se fosse um app normal, sem depender da Play Store

Importante:

- isso **nao** substitui a loja
- isso serve para desenvolvimento e teste local

---

## 3. Onde entra o Supabase

Supabase continua sendo o backend principal do GLYPH:

- auth
- banco
- storage
- edge functions

Ou seja:

- **nao estamos trocando Supabase por Firebase**

---

## 4. Onde entra o Firebase / FCM

FCM entra **so para push nativo Android**.

Leitura correta:

- Supabase = cerebro/backend
- FCM = entregador da notificacao no Android

Fluxo esperado depois:

1. app Android pega um token FCM
2. app envia esse token para o backend
3. backend decide quando mandar notificacao
4. backend dispara push via FCM
5. Android mostra a notificacao mesmo com o app fechado

Hoje o GLYPH usa:

- web push
- service worker

No Android nativo/hibrido, a trilha madura passa a ser:

- FCM

---

## 5. O que voce testa sem loja

## 5.1 Navegacao e shell

Testar:

- login
- abertura do app
- troca de telas
- performance basica
- teclado
- scroll
- links externos
- botao voltar do Android

## 5.2 Permissoes

Testar:

- notificacoes
- camera, se existir
- galeria/upload, se existir

## 5.3 Push

Testar:

- token do aparelho sendo gerado
- permissao de notificacao
- push chegando com app em foreground
- push chegando com app em background
- push chegando com app fechado

Observacao importante:

- no Android 13+, a permissao de notificacao precisa ser pedida em runtime
- isso esta na doc oficial do FCM/Android

## 5.4 O que nao precisa entrar cedo

Nao tratar como prioridade agora:

- widget de tela inicial
- iOS
- Play Console
- review flow

---

## 6. Ordem recomendada de implementacao

## Fase A - Shell Android

Objetivo:

- gerar o app Android local com Capacitor

Saida esperada:

- app instala no celular via USB

## Fase B - Fluxo basico do app

Objetivo:

- garantir que o GLYPH abre e navega direito dentro do shell

Saida esperada:

- login funciona
- telas principais funcionam
- storage e sessao nao quebram

## Fase C - Push nativo

Objetivo:

- trocar a dependencia de web push no Android nativo por FCM

Saida esperada:

- receber notificacao no Android com app fechado

## Fase D - Polimento Android

Objetivo:

- refinar links externos
- comportamento do botao voltar
- permissao de notificacao
- pequenos ajustes nativos

---

## 7. O que eu faco e o que voce faz

## Eu (Codex)

Posso fazer:

- preparar a integracao do Capacitor no projeto
- adaptar o codigo para ambiente web vs Android nativo
- mapear o que quebra no shell mobile
- ajustar links externos
- preparar a trilha de push nativo no codigo
- organizar a arquitetura `Supabase + FCM`

## Voce

Precisa fazer por fora:

- instalar Android Studio
- habilitar modo desenvolvedor no celular
- habilitar depuracao USB
- conectar o aparelho
- rodar/supervisionar testes locais no dispositivo
- depois cuidar da Play Console

---

## 8. Como testar push no comeco

No comeco, o teste pode ser simples:

1. instalar o app no celular
2. permitir notificacoes
3. obter token FCM
4. enviar push de teste

Durante desenvolvimento, o painel do Firebase pode servir como teste inicial.

Mas arquitetura real recomendada:

- token salvo no backend
- backend do GLYPH dispara o push

Ou seja:

- painel do Firebase = teste
- backend do GLYPH = producao

---

## 9. Widget

Widget e outro jogo.

Resumo honesto:

- widget nao e fase 1
- widget nao sai “automatico” do site/webview
- widget encosta em codigo nativo/plugin

Entao a ordem boa e:

1. app Android
2. login e navegacao
3. push
4. loja
5. so depois pensar em widget

---

## 10. Conclusao pratica

Frase certa para guardar:

- **celular no cabo = sua mini Play Store privada**

Mas isso so acontece depois de:

- preparar o shell Android com Capacitor

Entao o proximo passo tecnico real nao e loja nem widget.

E:

- **montar o shell Android do GLYPH**
