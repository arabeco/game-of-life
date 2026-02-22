# ANIMAÇÕES — Spec para Implementação

## REGRA GERAL

- Se o toggle **"Animações em vídeo"** estiver OFF nas Preferências → pula direto pro modal de resultado, sem vídeo nenhum.
- Se estiver ON → toca o vídeo + fluxo completo descrito abaixo.
- Todos os vídeos são **MP4**, tocam **uma única vez** (sem loop).
- Som de vitória toca em **toda abertura de baú** (mesmo som sempre).
- Háptico acompanha o som se o toggle de háptico estiver ON.

---

## 1. RELATÓRIO DE CICLO

### Trigger
Usuário clica em "Gerar Relatório".

### Fluxo

```
1. Abre modal (não fullscreen, centralizado na tela)
2. Vídeo do pergaminho toca no centro do modal
3. Abaixo do vídeo: barra dourada de progresso + frase fixa
4. Frases trocam conforme a barra avança
5. Ao chegar em 100% (selo bate no vídeo), o relatório já foi gerado
6. Usuário ganha recompensa automaticamente (baú ou XP)
7. Modal muda para: "Relatório pronto" com dois botões
   → [Abrir] = abre o vídeo de baú + modal de recompensa
   → [Fechar] = vai pro inventário
```

### Layout do Modal

```
┌──────────────────────────┐
│                          │
│   ┌──────────────────┐   │
│   │                  │   │
│   │  Vídeo pergaminho│   │
│   │  (tamanho médio) │   │
│   │                  │   │
│   └──────────────────┘   │
│                          │
│   ━━━━━━━━━━━░░░░░░░░░   │
│   Analisando arenas...   │
│                          │
└──────────────────────────┘
```

### Frases da Barra de Progresso

| % da barra | Frase |
|-----------|-------|
| 0-20% | Consultando registros... |
| 20-40% | Analisando arenas... |
| 40-60% | Contabilizando ações... |
| 60-80% | Calculando score... |
| 80-100% | Selando pergaminho... |

### Vídeo
- Pergaminho envelhecido sendo laçado com fita, cera de lacre caindo, selo batendo com impacto
- Formato: vertical (portrait)
- Fundo: mesa de madeira escura com luz de vela
- Duração: ~5 segundos (sincronizado com a barra)

---

## 2. ABRIR BAÚ

### Trigger
Usuário clica em "Abrir" em qualquer contexto que tenha baú (arsenal, recompensa de relatório, recompensa de missão).

### Fluxo

```
1. Tela escurece
2. Vídeo do baú toca (de acordo com a raridade do baú)
3. Som de vitória toca quando o baú abre
4. Háptico forte no momento da abertura
5. Quando o vídeo termina → transição pro modal glass card de recompensa
```

### Vídeos por Raridade

| Raridade | Baú | Glow | Fundo |
|----------|-----|------|-------|
| **Normal** | Madeira simples, ferro básico | Sem glow, luz dourada sutil de dentro | Sala de troféus escura |
| **Prata** | Madeira com bandas de prata | Glow prata ao redor e por dentro | Sala de troféus escura |
| **Ouro** | Madeira com detalhes dourados ornamentados | Glow dourado ao redor e por dentro | Sala de troféus escura |
| **Épico** | Madeira com detalhes roxos | Glow roxo ao redor e por dentro | Sala de troféus escura |
| **Lendário** | Ouro e bronze com pedras preciosas, tom alaranjado | Glow laranja intenso ao redor e por dentro | Sala de troféus escura |

### Todos os vídeos
- Câmera fixa, 3/4 de frente olhando de cima pra baixo
- Baú parado, tampa abre com peso, moedas paradas dentro
- Sem magia, sem partículas, sem exagero
- Formato: vertical (portrait)
- Duração: ~3-4 segundos
- Toca uma única vez

### Modal de Recompensa (Glass Card)
Aparece após o vídeo terminar. Mostra **tudo que o usuário ganhou**:

```
┌─────────────────────────────┐
│                             │
│      🏆 RECOMPENSAS         │
│                             │
│  ┌───────┐  ┌───────┐      │
│  │ Item  │  │ Item  │      │
│  │ img   │  │ img   │      │
│  │ nome  │  │ nome  │      │
│  │ rarid.│  │ rarid.│      │
│  └───────┘  └───────┘      │
│                             │
│  + 500 XP                   │
│  + 200 Ouro                 │
│                             │
│       [ Fechar ]            │
│                             │
└─────────────────────────────┘
```

- Pode ter múltiplos itens, XP, ouro — mostra tudo junto
- Glass card style (fundo translúcido, blur)

---

## 3. MISSÃO COMPLETA

### Trigger
Usuário completa todos os requisitos de uma missão (season ou clã).

### Fluxo

```
1. Modal glass card aparece: "Parabéns! Você completou [nome da missão]"
2. Dois botões:
   → [Abrir] = toca o vídeo de baú + modal de recompensa
   → [Fechar] = vai pro inventário
```

### Modal de Parabéns (Glass Card)

```
┌─────────────────────────────┐
│                             │
│      ⚔️ MISSÃO COMPLETA     │
│                             │
│      Parabéns!              │
│      Você completou         │
│      "O Guerreiro"          │
│                             │
│                             │
│   [ Abrir ]    [ Fechar ]   │
│                             │
└─────────────────────────────┘
```

- Sem vídeo nesse modal, só texto e botões
- Glass card style (fundo translúcido, blur)
- Se clicar "Abrir" → segue o fluxo de Abrir Baú (vídeo + recompensa)
- Se clicar "Fechar" → vai pro inventário

---

## RESUMO DOS FLUXOS

### Relatório de Ciclo
```
Clica "Gerar Relatório"
  → Modal com vídeo pergaminho + barra + frases
  → 100%: "Relatório pronto" [Abrir] [Fechar]
  → Se Abrir: vídeo baú → modal recompensa
  → Se Fechar: inventário
```

### Abrir Baú (qualquer contexto)
```
Clica "Abrir Baú"
  → Tela escurece → vídeo baú (raridade) + som vitória
  → Modal recompensa (glass card com tudo que ganhou)
```

### Missão Completa
```
Missão completada
  → Modal parabéns (glass card) [Abrir] [Fechar]
  → Se Abrir: vídeo baú → modal recompensa
  → Se Fechar: inventário
```

---

## SOM

| Momento | Som | Háptico |
|---------|-----|---------|
| Baú abrindo | Som de vitória (mesmo pra todas as raridades) | Forte |
| Selo batendo (relatório) | Nenhum | Nenhum |
| Modal de parabéns | Nenhum | Nenhum |

- Sons respeitam toggle "Sons" das Preferências
- Háptico respeita toggle "Háptico" das Preferências

---

## ARQUIVOS DE VÍDEO

### Estrutura no projeto

```
assets/
  videos/
    chests/
      chest_normal.mp4
      chest_silver.mp4
      chest_gold.mp4
      chest_epic.mp4
      chest_legendary.mp4
    report/
      report_seal.mp4
```

Os vídeos ficam locais no app (não hospedados). Carregamento instantâneo, sem depender de internet.

### Constantes de referência

```typescript
export const CHEST_VIDEOS = {
  normal:    require('@/assets/videos/chests/chest_normal.mp4'),
  silver:    require('@/assets/videos/chests/chest_silver.mp4'),
  gold:      require('@/assets/videos/chests/chest_gold.mp4'),
  epic:      require('@/assets/videos/chests/chest_epic.mp4'),
  legendary: require('@/assets/videos/chests/chest_legendary.mp4'),
};

export const REPORT_VIDEO = require('@/assets/videos/report/report_seal.mp4');
```

### Mock Placeholder (usar até os vídeos finais chegarem)

Enquanto os vídeos finais não estiverem prontos, usar um componente placeholder:

```typescript
// Substituir por <Video source={CHEST_VIDEOS[rarity]} /> quando os MP4 estiverem prontos
const VideoPlaceholder = ({ label, duration = 4000, onEnd }) => {
  useEffect(() => {
    const timer = setTimeout(onEnd, duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#333' }}>{label}</Text>
    </View>
  );
};
```

**Quando os vídeos estiverem prontos:** é só colocar os MP4 na pasta certa e trocar o `VideoPlaceholder` por `<Video>` do `react-native-video`. Os links/paths já estão definidos nas constantes acima.