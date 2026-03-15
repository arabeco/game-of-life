# Pendencias Supabase

Data: 2026-03-14

## 1. Oracle CORS

Sintoma:
- o frontend em `https://app.glyph.life` chama `functions/v1/oracle`
- a resposta de preflight volta com `Access-Control-Allow-Origin: https://glyph-app-arabecos-projects.vercel.app`

Diagnostico:
- a Edge Function `oracle` publicada no Supabase ainda esta com a versao antiga
- o codigo local ja foi ajustado para aceitar `https://app.glyph.life`

O que precisa fazer:
```powershell
cd C:\Users\Afonso\Downloads\GOL1.006
supabase login
supabase link --project-ref klmsdcncmhtgnlcejzdi
supabase secrets set SITE_URL=https://app.glyph.life OPENROUTER_MODEL=google/gemini-2.0-flash-001
supabase functions deploy oracle --use-api
```

Arquivo relacionado:
- `supabase/functions/oracle/index.ts`

## 2. Deletar Conta

Sintoma:
- ao deletar conta, o app caiu no fallback RPC e retornou:
- `Could not find the function public.delete_my_account()`

Diagnostico:
- faltava infra no banco:
- `delete_account_data_for_user(uuid)` para a Edge Function
- `delete_my_account()` para o fallback RPC

SQL necessario:
- rodar no Supabase SQL Editor o bloco minimo de exclusao de conta
- esse bloco ja foi separado manualmente na conversa

Arquivos de referencia:
- `supabase/migrations/20260312_add_account_delete_edge_support.sql`
- `sql/closed_beta_lockdown.sql`

Depois do SQL, publicar a funcao:
```powershell
cd C:\Users\Afonso\Downloads\GOL1.006
supabase login
supabase link --project-ref klmsdcncmhtgnlcejzdi
supabase functions deploy account-delete --use-api
```

## 3. Ordem recomendada

1. Rodar o SQL de exclusao de conta no SQL Editor
2. Publicar `account-delete`
3. Publicar `oracle`
4. Testar:
- Oraculo em `app.glyph.life`
- Deletar conta

## 4. Observacao importante

Mesmo com o frontend corrigido, sem esses passos no Supabase:
- o Oraculo continua falhando por CORS
- a exclusao de conta continua quebrando por infra incompleta

## 5. Fluxo Google no beta fechado

O login com Google agora segue esta ordem:
1. autentica no Google
2. se a conta ja estiver liberada, entra normal
3. se ainda nao estiver liberada, abre um modal pedindo o Bilhete Dourado
4. se o bilhete for validado, o perfil e criado e a conta entra
5. se cancelar ou falhar, o app tenta apagar a conta provisoria e faz logout local

Dependencia:
- para a limpeza automatica funcionar direito, `account-delete` precisa estar publicado e o SQL de exclusao precisa existir no banco
