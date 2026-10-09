# Handoff — as cores e as imagens do push do Oráculo

Para quem vai desenhar. **Só imagens e cores: não mexa no código.** O Claude
liga tudo nas funções do servidor (`supabase/functions/web-push` e
`supabase/functions/oracle`) depois que as imagens existirem. Duas IAs no
mesmo arquivo se atropelam.

---

## 1. O que é

O Glyph manda até dois pushes por dia:

- **Leitura do ciclo**, por volta das 7h. Exemplo: *"Seu ciclo está indo bem:
  45%, dia 6 de 14. Hoje tem 5 ações no seu planner."*
- **Card de Sabedoria**, umas 7h30 depois. É uma frase do tema que a pessoa
  escolheu.

Hoje os dois chegam iguais: só texto, sem cor e sem imagem. A ideia é que cada
push tenha:

1. **Uma cor de destaque.** O Android pinta com ela o ícone pequeno e o nome
   "Glyph" na notificação. O fundo da notificação não pode ser colorido, porque
   o sistema não deixa.
2. **Uma imagem grande**, que aparece quando a pessoa expande a notificação. Em
   muitos Android ela também vira uma miniatura do lado, com a notificação
   fechada.

A imagem é **a marca do Oráculo acesa na cor do tom**, como ela já aparece
dentro do app.

---

## 2. A marca do Oráculo no app

- Componente: `components/OracleSpeakerMark.tsx`.
- Desenho do losango: `GameLogoIcon` em `components/Icons.tsx`, e o PNG
  `public/logo-diamond.png` (500×500, transparente).

**A regra do app: a casca fica dourada sempre, e a cor muda só no miolo e no
brilho em volta.** A marca nunca vira verde ou vermelha inteira: ela continua
sendo o Oráculo, e a cor só informa.

Cores do miolo e do brilho no app (`TONE_TOKENS` em `OracleSpeakerMark.tsx`):

| Tom | Nome no app | Miolo | Brilho |
|---|---|---|---|
| `neutral` | Oráculo | `#f3d48a` | `rgba(243,212,138,0.2)` |
| `guide` | Guia | `#9fd8ff` | `rgba(159,216,255,0.20)` |
| `success` | Progresso | `#7cf5b1` | `rgba(124,245,177,0.22)` |

Casca e borda: dourado, `rgba(243,212,138,0.46)`. Fundo do círculo: um
gradiente de `rgba(45,38,28,0.98)` para preto.

---

## 3. Qual push usa qual tom (combinado com o Afonso em 08/10)

| Push | Tom |
|---|---|
| Leitura: ciclo indo bem | `success` (verde, Progresso) |
| Leitura: ciclo começa hoje | `guide` (azul, Guia) |
| Leitura: abaixo do ritmo, ou só o dia | `neutral` (dourado, Oráculo) |
| Leitura: prazo do ciclo acabou | `guide` (azul, Guia) |
| Card de Sabedoria | `neutral` (dourado, Oráculo) |

**Vermelho e amarelo de alerta ficam de fora**, para o push nunca soar como
bronca.

Se quiserem mudar alguma cor ou tom, escrevam aqui. O Claude lê esta tabela.

---

## 4. As três imagens

| Arquivo | Tom |
|---|---|
| `oraculo-push-oraculo.png` | `neutral`, dourado |
| `oraculo-push-guia.png` | `guide`, azul |
| `oraculo-push-progresso.png` | `success`, verde |

**Formato:**

- **1024 × 512 px** (proporção 2:1), PNG ou JPG, **até ~300 KB**. O Android
  recusa imagem de push acima de 1 MB e corta a proporção para 2:1 quando
  expandida.
- **Fundo escuro e opaco**, sem transparência, no tom do app: quase preto,
  levemente quente. Imagem transparente vira fundo branco em alguns aparelhos.
- **A marca centralizada, ocupando uns 60% da altura.** Com a notificação
  fechada, o Android pode mostrar só o **quadrado do centro** (512×512) como
  miniatura. Então nada importante fora desse quadrado.
- **Sem texto dentro da imagem.** O texto do push já vem por cima, e letra
  dentro da figura fica ilegível na miniatura.
- O brilho do tom pode se espalhar pelo fundo, de leve, mas a casca continua
  dourada.

---

## 5. A cor de destaque (o "pinta o ícone")

Ela aparece pequena, no ícone e no nome do app, **em cima de fundo claro e de
fundo escuro**, porque a gaveta de notificações muda com o tema do celular. Os
tons do miolo (`#7cf5b1`, `#9fd8ff`, `#f3d48a`) são claros demais e somem no
fundo branco.

Proposta, para conferir num celular com tema claro e com tema escuro:

| Tom | Cor de destaque |
|---|---|
| `neutral` | `#C9A23A` |
| `guide` | `#3B9EE6` |
| `success` | `#2FBF71` |

Escolham as definitivas e anotem nesta tabela.

---

## 6. Onde entregar

1. Salvar as três em `public/assets/oracle/push/` com os nomes da seção 4.
2. O celular só consegue baixar a imagem por um endereço público. Enquanto o
   site não for publicado com essa pasta, o Afonso sobe as mesmas três no
   bucket `user-images` do Supabase, numa pasta `oracle/`, com os mesmos nomes.

O resto é do Claude: o servidor passa a mandar a cor e a imagem de cada push, e
o Afonso testa no celular.
