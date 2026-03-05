# Padrão de Commit GLYPH

Sempre siga este padrão para manter o rastreamento de versões e o histórico de progresso (Checklist).

## Estrutura do Commit
`Glyph[VERSÃO][SUFIXO] - [x] [DESCRIÇÃO]`

- **VERSÃO**: Versão atual do projeto (ex: `1.001`).
- **SUFIXO**: Letra incremental para sub-entregas (`a`, `b`, `c`, `d`...).
- **CHECKBOX**: Adicione `- [x]` antes da descrição para indicar conclusão.

## Exemplo de Uso
Se estivermos na versão `1.001` e for o commit atual:
`Glyph1.001b - [x] Implementação do Hub de Tutoriais e Preview Mode`

Se houver um ajuste logo em seguida:
`Glyph1.001c - [x] Correção de lint no App.tsx`

---

## Script Automatizado (push.sh)
Você pode usar o script `push.sh` criado na raiz:

```bash
# Uso básico (sufixo 'a' automático)
./push.sh "Descrição da mudança"

# Especificando sufixo b, c, d...
./push.sh "Descrição da mudança" "b"
```

## Push Atual (Copie e cole no terminal)
```bash
git add .
git commit -m "Glyph1.001d - [x] Consolidação de Toasts do Sistema e Focus Audio Player"
git push
```
