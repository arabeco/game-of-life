# 🚀 Guia de Início Rápido

## Para iniciar o projeto rapidamente:

### Opção 1: Script PowerShell (Recomendado)
```powershell
.\start-vite.ps1
```
Ou simplesmente dê duplo clique em `start-vite.ps1`

### Opção 2: Script Batch
```cmd
start-vite.bat
```
Ou duplo clique em `start-vite.bat`

### Opção 3: Comando direto
```bash
npm run dev
```

**O servidor iniciará em:** `http://localhost:5173`

---

## 🔌 Porta 6543 - Transaction Pooler do Supabase

### O que é?
A porta **6543** é o **Transaction Pooler** do Supabase. É uma conexão otimizada para:
- **Múltiplas conexões simultâneas** (até 200 conexões)
- **Aplicações serverless** (Lambda, Vercel, etc.)
- **Conexões de curta duração** (não mantém estado entre requisições)

### Quando usar?
- ✅ **Use a porta 6543** quando:
  - Você tem muitas conexões simultâneas
  - Está em ambiente serverless
  - Precisa de melhor performance com muitas requisições
  - Está usando Edge Functions ou APIs

- ❌ **NÃO use a porta 6543** quando:
  - Precisa de sessões persistentes
  - Está usando transações longas
  - Precisa de prepared statements
  - Está em desenvolvimento local simples

### Como configurar?

#### 1. No código (supabaseClient.js):
```javascript
const supabaseUrl = "https://seu-projeto.supabase.co"; // Porta padrão: 443 (HTTPS)
// OU para transaction pooler:
const supabaseUrl = "https://seu-projeto.supabase.co:6543"; // Transaction pooler
```

#### 2. Connection String:
```
# Padrão (porta 5432 - direto ao Postgres)
postgresql://postgres:[senha]@db.seu-projeto.supabase.co:5432/postgres

# Transaction Pooler (porta 6543)
postgresql://postgres:[senha]@db.seu-projeto.supabase.co:6543/postgres?pgbouncer=true
```

#### 3. No Supabase Dashboard:
- Vá em **Settings** → **Database**
- Copie a **Connection String** com `?pgbouncer=true` para usar o pooler

### Para este projeto:
Atualmente o projeto usa a **URL padrão do Supabase** (sem porta específica), que funciona bem para desenvolvimento local.

**Se precisar usar o transaction pooler**, edite `src/lib/supabaseClient.js`:
```javascript
const supabaseUrl = "https://seu-projeto.supabase.co:6543";
```

---

## 📝 Checklist Diário

1. ✅ Abrir terminal na pasta do projeto
2. ✅ Executar `npm run dev` ou `.\start-vite.ps1`
3. ✅ Acessar `http://localhost:5173`
4. ✅ Verificar se o Supabase está conectado (se necessário)

---

## 🐛 Problemas Comuns

### Porta 5173 já em uso?
O Vite tentará usar outra porta automaticamente. Verifique no terminal qual porta foi atribuída.

### Erro ao iniciar?
```bash
# Limpar cache e reinstalar
rm -rf node_modules
npm install
npm run dev
```

### Supabase não conecta?
- Verifique se as variáveis estão no `.env` ou `localStorage`
- Verifique se a URL está correta
- Para desenvolvimento local, a porta padrão (443) geralmente é suficiente
