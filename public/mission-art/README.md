# Arte de fundo das missões

Coloque aqui as imagens referenciadas por `artUrl` em `SeasonMission` / `SeasonQuest`.

```ts
// constants/seasonContent.ts
{ id: 'gm-forja', title: 'Forjar o hábito', icon: '🔥', artUrl: '/mission-art/forja.webp' }
```

Sem `artUrl`, o card e o modal caem no emoji de `icon`. Nada quebra por falta de arte.

## Formato

- `.webp`, qualidade ~80
- **1200×675** (16:9) — o card usa uma faixa horizontal, o modal usa 144px de altura
- Alvo de **150 KB por imagem**. O app já carrega ~25 MB; arte de missão não pode inflar isso.
- Deixe o **lado esquerdo mais limpo**: é onde o texto do card fica, sobre um véu escuro.

## Licenciamento — leia antes de adicionar

Este app é distribuído na Play Store. Toda imagem aqui precisa permitir **uso comercial**,
e a origem de cada uma deve ser registrada na tabela abaixo.

**Não use Pinterest, Google Imagens ou ArtStation como fonte.** São vitrines de obras de
terceiros com direito autoral; quase nada ali é livre para uso comercial, e o risco é
remoção do app ou processo.

Fontes seguras:

| Fonte | Licença | Atribuição |
|---|---|---|
| [Unsplash](https://unsplash.com) | Unsplash License | Não exigida |
| [Pexels](https://pexels.com) | Pexels License | Não exigida |
| [Openverse](https://openverse.org) | filtre por CC0 | Varia — confira por imagem |
| Geradores de IA (o plano cobre uso comercial) | conforme o serviço | Não exigida |

## Registro

Preencha ao adicionar cada arquivo. Se estiver vazio, a imagem não deveria estar aqui.

| Arquivo | Missão | Fonte / URL | Licença | Autor |
|---|---|---|---|---|
| _(exemplo)_ `forja.webp` | Forjar o hábito | unsplash.com/photos/xxxx | Unsplash | Fulano |
