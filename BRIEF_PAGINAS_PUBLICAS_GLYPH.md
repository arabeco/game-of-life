# Briefing - Paginas Publicas do GLYPH

Objetivo: preparar o `glyph.life` para publicacao em lojas mobile sem reinventar o que ja existe.

## Estado atual

Ja existem duas paginas publicas que o app referencia:

- `/termos.html`
- `/privacidade.html`

O app aponta para essas URLs em:

- [legal.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/legal.ts)

## O que precisa acontecer agora

Nao precisamos recriar `Termos` e `Privacidade` do zero.

Precisamos:

1. Revisar e atualizar `termos.html`
2. Revisar e atualizar `privacidade.html`
3. Criar `suporte.html`
4. Criar `exclusao.html`

## Dados que precisam ser atualizados em todas

Substituir pelos dados oficiais novos:

- email de suporte: `[NOVO_EMAIL_SUPORTE]`
- email de privacidade: `[NOVO_EMAIL_PRIVACIDADE]`
- instagram: `[URL_INSTAGRAM]`
- discord/comunidade: `[URL_DISCORD]`
- outra rede oficial: `[URL_REDE_3]`

## Regras importantes

- Manter o estilo visual atual da landing
- Garantir boa leitura em mobile
- Garantir links cruzados entre as 4 paginas
- Nao deixar placeholder antigo visivel
- Nao prometer coisas que o app nao faz

## O que revisar em Termos

- remover placeholders
- colocar contato real de suporte
- colocar contato real de privacidade
- mencionar recursos sociais:
  - amizades
  - mensagens diretas
  - grupos
  - mentoria
- mencionar compras digitais e assinaturas
- mencionar uso de IA do Oraculo quando aplicavel
- mencionar regras de moderacao:
  - abuso
  - assedio
  - spam
  - odio
  - impersonacao
  - conteudo sexual inadequado
- deixar claro que medidas de moderacao podem acontecer
- linkar `Privacidade`, `Suporte` e `Exclusao de Conta`

## O que revisar em Privacidade

- remover placeholders
- colocar contato real de privacidade
- identificar responsavel/controlador
- explicar dados tratados:
  - conta
  - perfil
  - progresso
  - recursos sociais
  - uploads/imagens
  - compras
  - notificacoes
- mencionar parceiros/infra:
  - Supabase
  - Google login, quando aplicavel
  - OpenRouter/IA, quando aplicavel
  - Mercado Pago na web, quando aplicavel
- explicar retencao e exclusao
- explicar direitos do usuario
- linkar `Termos`, `Suporte` e `Exclusao de Conta`

## Novas paginas

### `suporte.html`

Tem que servir como:

- support URL publica
- canal geral de atendimento
- porta de entrada para bugs, compras, privacidade e seguranca

### `exclusao.html`

Tem que servir como:

- URL publica de exclusao de conta
- explicacao do caminho in-app
- caminho alternativo para quem nao consegue entrar

## Resultado esperado

Ao final, o dominio deve ter:

- `/termos.html`
- `/privacidade.html`
- `/suporte.html`
- `/exclusao.html`

E as quatro paginas devem:

- se linkar entre si
- ter rodape consistente
- usar os contatos reais
- estar prontas para Play Console e App Store Connect
