# ALDEIA DO GRUPO — Spec para Implementação

## CONCEITO

Cada grupo (clã) tem uma aldeia visual. É uma imagem 2D com 6 posições fixas. 5 slots são "cuidáveis" — precisam de presença dos membros pra se manter vivos. O 6º é o Trono, reservado pro líder, e só aparece quando a Ordem está em 100%.

A Ordem é a saúde da aldeia. É a média da saúde dos 5 slots. Se ninguém cuida, decai exponencialmente. Se cuidam, recupera. A missão de season do grupo é manter a Ordem acima de 70% até o fim da temporada.

---

## OS 6 SLOTS

| Slot | Quem pode | Regra |
|------|-----------|-------|
| **Fogueira** | Qualquer membro | Precisa de presença |
| **Forja** | Qualquer membro | Precisa de presença |
| **Torre** | Qualquer membro | Precisa de presença |
| **Horta** | Qualquer membro | Precisa de presença |
| **Altar** | Qualquer membro | Precisa de presença |
| **Trono** | Só o líder | Aparece APENAS quando Ordem = 100% |

- Cada entrada num slot conta **1h automática**
- O membro pode trocar de slot quando quiser
- Pode cuidar de todos os 5 no mesmo dia se quiser
- Muralha e Estandarte aparecem na arte mas NÃO são slots (só decoração)

---

## MECÂNICA DE PRESENÇA

- Membro abre o app → escolhe slot (ou cai no último que estava) → avatar aparece → conta 1h
- Após 1h de inatividade → avatar sai do slot
- Cada nova entrada no mesmo slot ou outro → conta mais 1h
- Pode trocar de slot livremente durante o dia

---

## FÓRMULA DA ORDEM

### Meta diária

```
metaTotal = totalMembros × 1h
metaPorSlot = metaTotal / 5
```

| Membros | Meta total/dia | Meta por slot |
|---------|---------------|---------------|
| 2 | 2h | 24min |
| 3 | 3h | 36min |
| 4 | 4h | 48min |
| 5 | 5h | 1h |
| 6 | 6h | 1h12min |

### Saúde de cada slot (0-100%)

Cada slot tem sua própria saúde. A presença enche, a ausência esvazia.

**Decaimento (dias sem visita ao slot):**

```
streakRuim = dias seguidos sem visita neste slot
perdaDiaria = min(2 + (streakRuim × 0.8), 15)
saudeSlot = max(saudeSlot - perdaDiaria, 0)
```

| Dia sem visita | Perda | Saúde |
|----------------|-------|-------|
| 1 | -2.8 | 97.2% |
| 2 | -3.6 | 93.6% |
| 3 | -4.4 | 89.2% |
| 4 | -5.2 | 84.0% |
| 5 | -6.0 | 78.0% |
| 6 | -6.8 | 71.2% |
| 7 | -7.6 | 63.6% |
| 8 | -8.4 | 55.2% |
| 9 | -9.2 | 46.0% |
| 10 | -10.0 | 36.0% |
| 11 | -10.8 | 25.2% |
| 12 | -11.6 | 13.6% |
| 13 | -12.4 | 1.2% |
| 14 | -13.2 | 0% |

~14 dias sem ninguém visitar = slot morto.

**Recuperação (dias seguidos visitando o slot):**

```
streakBom = dias seguidos com visita neste slot
ganhoDiario = min(2 + (streakBom × 0.5), 10)
saudeSlot = min(saudeSlot + ganhoDiario, 100)
```

| Dia visitado | Ganho | Saúde |
|--------------|-------|-------|
| 1 | +2.5 | 2.5% |
| 2 | +3.0 | 5.5% |
| 3 | +3.5 | 9.0% |
| 4 | +4.0 | 13.0% |
| 5 | +4.5 | 17.5% |
| 7 | +5.5 | 28.0% |
| 10 | +7.0 | 47.5% |
| 13 | +8.5 | 71.5% |
| 15 | +9.5 | 90.0% |
| 16 | +10.0 | 100% |

~16 dias de cuidado consistente pra reviver do zero. Mais difícil subir do que cair.

### Ordem total

```
ordem = (saudeForgueira + saudeForja + saudeTorre + saudeHorta + saudeAltar) / 5
```

### Trono

```
SE ordem == 100:
  líder aparece no trono
SENÃO:
  trono vazio
```

---

## MISSÃO DE SEASON

**Nome:** Manter a Ordem
**Requisito:** Ordem média acima de 70% no último dia da season
**Cálculo:** média da Ordem dos últimos 7 dias da season
**Recompensa:** resgatável na aba de missões (toast dourado)

---

## TIERS VISUAIS DA ALDEIA

4 artes diferentes baseadas no rank do grupo. Mesmos 5 slots + trono nas mesmas coordenadas. Os elementos evoluem visualmente.

### Tier 1 — Acampamento (ranks 1-3)

| Slot | Visual |
|------|--------|
| Fogueira | Lenha no chão com fogo fraco |
| Forja | Pedra de amolar |
| Torre | Poste com pano |
| Horta | Terra revolvida com brotos |
| Altar | Pedras empilhadas |
| Trono | Tronco cortado |
| Decoração | Cerca de estacas, pano como estandarte |

### Tier 2 — Aldeia (ranks 4-6)

| Slot | Visual |
|------|--------|
| Fogueira | Fogueira com pedras ao redor |
| Forja | Bigorna simples com brasa |
| Torre | Torre de madeira |
| Horta | Canteiro organizado com plantas |
| Altar | Altar de madeira com velas |
| Trono | Cadeira de madeira talhada |
| Decoração | Paliçada, bandeira com símbolo |

### Tier 3 — Fortaleza (ranks 7-9)

| Slot | Visual |
|------|--------|
| Fogueira | Braseiro de ferro grande |
| Forja | Forja completa com fogo |
| Torre | Torre de pedra com tocha |
| Horta | Jardim florido com cerca |
| Altar | Templo pequeno de pedra |
| Trono | Trono de pedra com detalhes |
| Decoração | Muralha de pedra, estandarte com brasão |

### Tier 4 — Cidadela (rank 10)

| Slot | Visual |
|------|--------|
| Fogueira | Pira cerimonial com chamas altas |
| Forja | Forja ornamentada com brasas douradas |
| Torre | Torre colossal com farol no topo |
| Horta | Jardim imperial com árvore central |
| Altar | Santuário com árvore ancestral brilhando |
| Trono | Trono dourado com glifos luminosos |
| Decoração | Muralha dupla, portão colossal, estandarte com glifo do grupo |

---

## IMPLEMENTAÇÃO VISUAL

### Imagem de fundo

Cada tier é uma imagem 2D estática. Os avatares dos membros são posicionados por cima com `position: absolute` usando coordenadas em porcentagem.

### Coordenadas dos slots

```typescript
const ALDEIA_SLOTS = [
  { id: 'fogueira', label: 'Fogueira', x: 50, y: 55 },  // centro
  { id: 'forja',    label: 'Forja',    x: 20, y: 40 },  // esquerda
  { id: 'torre',    label: 'Torre',    x: 80, y: 25 },  // direita alta
  { id: 'horta',    label: 'Horta',    x: 75, y: 70 },  // direita baixa
  { id: 'altar',    label: 'Altar',    x: 25, y: 70 },  // esquerda baixa
  { id: 'trono',    label: 'Trono',    x: 50, y: 20 },  // centro topo
];
```

As coordenadas acima são placeholder. Definir os valores finais após gerar a arte.

### Saúde visual dos slots

| Saúde | Visual do slot |
|-------|---------------|
| 80-100% | Brilhante, vivo, com glow |
| 50-79% | Normal, sem brilho |
| 20-49% | Escurecido, apagando |
| 0-19% | Quase apagado, cinza |
| 0% | Morto, sem vida |

---

## SUPABASE

### Tabela: clan_aldeia_slots

```sql
CREATE TABLE clan_aldeia_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id),
  slot_id TEXT NOT NULL,  -- 'fogueira' | 'forja' | 'torre' | 'horta' | 'altar'
  health NUMERIC DEFAULT 100,
  streak_good INTEGER DEFAULT 0,
  streak_bad INTEGER DEFAULT 0,
  last_visited_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: clan_aldeia_presence

```sql
CREATE TABLE clan_aldeia_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  slot_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  hours_counted NUMERIC DEFAULT 1
);

CREATE INDEX idx_presence_clan ON clan_aldeia_presence(clan_id, started_at DESC);
```

### Tabela: clan_order_history

```sql
CREATE TABLE clan_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id),
  ordem NUMERIC NOT NULL,
  calculated_at DATE DEFAULT CURRENT_DATE
);
```

---

## FLUXO RESUMIDO

```
1. Membro abre o app
2. Entra na aldeia do grupo
3. Escolhe um slot (ou cai no último)
4. Avatar aparece no slot → conta 1h de presença
5. Pode trocar de slot → conta 1h no novo
6. Após 1h inativo → avatar sai
7. Cron diário: calcula saúde de cada slot (decai ou recupera)
8. Calcula Ordem = média dos 5 slots
9. Se Ordem == 100 → líder aparece no trono
10. Salva no histórico pra missão de season
```