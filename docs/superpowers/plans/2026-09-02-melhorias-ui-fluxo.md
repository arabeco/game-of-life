# Plano: Melhorias de UI, fluxo e lógica de botões do Glyph

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** corrigir os problemas de UI, fluxo e lógica de botões encontrados na auditoria de 02/09/2026 do app Glyph, sem reescrever telas e sem mudar produto.

**Arquitetura:** o app é React 19 + Vite + Tailwind 4 + Supabase, empacotado com Capacitor para Android. Todas as telas moram em `views/`, componentes em `components/`, estado global em `contexts/GameContext.tsx` (14 mil linhas, evite mexer). Cada tarefa deste plano é pequena, isolada e termina em commit.

**Stack:** TypeScript (sem `strict`), React 19, Vite 6, Tailwind 4, testes em Node puro (`node tests/*.regression.mjs`, `assert/strict`), smokes de browser via CDP (`tests/*.cdp.mjs`, exigem servidor e conta QA, não são obrigatórios aqui).

---

## Regras gerais para quem executa

1. **Nunca gerar AAB nem subir a versão** do `package.json`. Isso só acontece ao publicar, por decisão do dono do projeto.
2. **Nunca usar** `SUPABASE_SERVICE_ROLE_KEY`. Não rodar SQL. Se algo precisar de banco, escrever o bloco SQL num arquivo e avisar.
3. **Codificação:** todos os arquivos são UTF-8, alguns com BOM. Preserve o que existir. Depois de qualquer edição com acento, rode `npm run check:encoding`.
4. **Verificação mínima antes de cada commit:**
   ```bash
   npm run type-check && npm run check:encoding && npm test
   ```
   Os três devem terminar com código 0. `npm test` roda `tests/core-loop.regression.mjs`.
5. **Mensagens de commit** seguem o padrão recente do repositório: prefixo `fix:`, `refactor:`, `chore:` ou `docs:` e descrição curta em português, sem acento obrigatório. Terminar com a linha `Co-Authored-By:` do agente se o ambiente exigir.
6. **Não apagar nem renomear ids de DOM** (`id="..."`) sem antes rodar `grep -rn "<id>" tests`. Os smokes CDP dependem deles.
7. **Não tocar** em `contexts/GameContext.tsx` neste plano. Nenhuma tarefa exige.

---

## Mapa de arquivos

| Arquivo | O que muda |
|---|---|
| `vite.config.ts` | expõe `__APP_VERSION__` a partir do `package.json` |
| `vite-env.d.ts` (novo) | declara o global `__APP_VERSION__` |
| `components/AuthenticatedApp.tsx` | usa a versão dinâmica; fallback de Suspense de Histórico e Perfil |
| `views/LoginView.tsx` | esconde Apple sem config; nome acessível no Google; "Voltar"; mostrar senha |
| `components/GlobalHeader.tsx` | rótulos em português; ícone de descanso |
| `components/Icons.tsx` | novo `MoonIcon` |
| `components/SanctuaryAreaStats.tsx` | texto em inglês |
| `views/ArenasView.tsx`, `views/MundoView.tsx`, `views/SettingsView.tsx`, `views/SovereignPanelView.tsx` | remoção de JSX morto `{false && (...)}` |
| `views/NobrezaView.tsx` e arquivos soltos na raiz | remoção do git |
| `.gitignore` | ignora logs e temporários |
| `views/SettingsView.tsx` | rótulo da aba "Geral"; bloco "Premium" em Preferências |
| `hooks/useConfirmation.tsx` (novo) | hook que substitui `window.confirm` |
| 10 componentes com `window.confirm` | migram para o hook |
| `components/FirstUseOnboardingOverlay.tsx` | remove os passos de faixa etária e presença do Oráculo |
| `tests/onboarding-happy-path.cdp.mjs` | acompanha o onboarding mais curto |
| `scripts/list-unlabeled-buttons.mjs` (novo) | lista botões só com ícone sem nome |
| `scripts/fix-accents.mjs` (novo) | normaliza acentuação nos textos de UI |
| `tests/ui-hygiene.regression.mjs` (novo) | trava as regressões deste plano |

---

# Fase 1: correções rápidas e seguras

### Tarefa 1: versão do app lida do `package.json`

Hoje `components/AuthenticatedApp.tsx:105` tem `const APP_VERSION = '1.0.48';` enquanto `package.json` está em `1.0.81`. A função `isBroadcastCompatibleWithVersion` (linhas 259-263) filtra comunicados por `min_app_version` e `max_app_version` usando esse valor errado.

**Arquivos:**
- Modificar: `vite.config.ts`
- Criar: `vite-env.d.ts`
- Modificar: `components/AuthenticatedApp.tsx:105`
- Criar: `tests/ui-hygiene.regression.mjs`

- [ ] **Passo 1: escrever o teste que falha**

Criar `tests/ui-hygiene.regression.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

// 1. A versao do app nao pode voltar a ser um literal escrito a mao.
{
    const source = read('components/AuthenticatedApp.tsx');
    assert.doesNotMatch(
        source,
        /const APP_VERSION = '\d+\.\d+\.\d+'/,
        'APP_VERSION deve vir de __APP_VERSION__ (vite.config.ts), nao de um literal',
    );
    assert.match(source, /__APP_VERSION__/, 'AuthenticatedApp deve usar __APP_VERSION__');
}

console.log('ui-hygiene: ok');
```

- [ ] **Passo 2: rodar e confirmar que falha**

```bash
node tests/ui-hygiene.regression.mjs
```

Esperado: `AssertionError ... APP_VERSION deve vir de __APP_VERSION__`.

- [ ] **Passo 3: expor a versão no Vite**

Em `vite.config.ts`, adicionar a leitura do `package.json` no topo e a entrada em `define`:

```ts
import { fileURLToPath, URL } from 'url';
import { readFileSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
```

E dentro de `define: { ... }`, antes de `'process.env.API_KEY'`:

```ts
      __APP_VERSION__: JSON.stringify(packageJson.version),
```

- [ ] **Passo 4: declarar o global**

Criar `vite-env.d.ts` na raiz (o `tsconfig.json` já inclui `*.ts` da raiz):

```ts
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
```

- [ ] **Passo 5: usar no app**

Em `components/AuthenticatedApp.tsx`, trocar a linha 105:

```ts
const APP_VERSION = '1.0.48';
```

por:

```ts
// Vem do package.json via vite.config.ts (define). Nunca escrever a mao aqui:
// foi assim que ficou travada em 1.0.48 enquanto o app ia para 1.0.81.
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
```

- [ ] **Passo 6: verificar**

```bash
node tests/ui-hygiene.regression.mjs && npm run type-check
```

Esperado: `ui-hygiene: ok` e type-check sem erros.

- [ ] **Passo 7: registrar o teste no `package.json`**

Em `scripts`, depois de `"test:relationship-links"`, adicionar:

```json
    "test:ui-hygiene": "node tests/ui-hygiene.regression.mjs",
```

- [ ] **Passo 8: commit**

```bash
git add vite.config.ts vite-env.d.ts components/AuthenticatedApp.tsx tests/ui-hygiene.regression.mjs package.json
git commit -m "fix: versao do app passa a vir do package.json, nao de um literal"
```

---

### Tarefa 2: tela de login

Quatro ajustes em `views/LoginView.tsx`: o botão "Entrar com Apple" aparece mesmo sem provedor configurado e só mostra um toast dizendo que "falta configurar"; o botão do Google não tem nome acessível (aparece como `button` vazio na árvore de acessibilidade); o botão que fecha o formulário de e-mail chama-se "Voltar ao Google"; e o campo de senha não tem "mostrar senha".

**Arquivos:**
- Modificar: `views/LoginView.tsx:665-692` (Apple), `:653-659` (Google), `:760-768` (senha), `:827-834` (Voltar)

- [ ] **Passo 1: esconder o Apple quando não configurado**

Envolver o botão Apple (linhas 665 a 692, de `<button id="login-apple-button"` até seu `</button>`) em uma condição. O bloco fica:

```tsx
                            {isAppleSignInConfigured() && (
                            <button
                                id="login-apple-button"
                                type="button"
                                onClick={handleAppleLogin}
                                disabled={loading}
                                className="login-apple-button"
                                title="Abrir Sign in with Apple"
                            >
                                {/* ...conteudo interno inalterado... */}
                            </button>
                            )}
```

Manter o `handleAppleLogin` e o toast como estão. Eles voltam a servir no dia em que a URL do provedor for configurada em `utils/appleAuth.ts`.

- [ ] **Passo 2: nome acessível no Google**

Na linha 653, o `<button id="login-google-button"` recebe `aria-label`:

```tsx
                            <button
                                id="login-google-button"
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="login-google-button"
                                aria-label="Entrar com Google"
                            >
```

- [ ] **Passo 3: "Voltar" em vez de "Voltar ao Google"**

Linha 833, trocar o texto do botão `id="login-hide-manual-button"`:

```tsx
                                        Voltar
```

- [ ] **Passo 4: mostrar senha**

Adicionar o estado junto dos outros `useState` (perto da linha 63, onde está `appleToastVisible`):

```tsx
    const [passwordVisible, setPasswordVisible] = useState(false);
```

Importar os ícones. `LoginView.tsx` hoje não importa nada de `Icons`, então adicionar junto dos outros imports do topo:

```tsx
import { EyeIcon, EyeOffIcon } from '../components/Icons';
```

Substituir o `<input id="login-password-input" ... />` (linhas 760-768) por:

```tsx
                                        <div className="relative">
                                            <input
                                                id="login-password-input"
                                                type={passwordVisible ? 'text' : 'password'}
                                                autoComplete={isSigningUp ? 'new-password' : 'current-password'}
                                                placeholder="Senha"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="login-field pr-11"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPasswordVisible((v) => !v)}
                                                aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                                                aria-pressed={passwordVisible}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/55 hover:text-white"
                                            >
                                                {passwordVisible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                            </button>
                                        </div>
```

- [ ] **Passo 5: verificar no browser**

```bash
npm run dev
```

Abrir `http://localhost:3000`, clicar em "Entrar com e-mail" e confirmar: sem botão Apple; botão "Voltar"; olho ao lado da senha alterna o tipo do campo. Depois `npm run type-check`.

- [ ] **Passo 6: commit**

```bash
git add views/LoginView.tsx
git commit -m "fix: login sem botao Apple fantasma, com mostrar senha e rotulos claros"
```

---

### Tarefa 3: cabeçalho global

Em `components/GlobalHeader.tsx` dois `aria-label` estão em inglês ("Adjust mood", "Oracle Assistant") e a Tela de Descanso usa um cadeado, que comunica "bloqueado", não descanso.

**Arquivos:**
- Modificar: `components/Icons.tsx` (novo ícone)
- Modificar: `components/GlobalHeader.tsx:7`, `:287`, `:305-312`, `:353`

- [ ] **Passo 1: criar `MoonIcon`**

Em `components/Icons.tsx`, logo após a linha do `LockIcon` (linha 163), adicionar:

```tsx
export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></IconWrapper>);
```

- [ ] **Passo 2: trocar o import e o ícone no header**

Linha 7 de `GlobalHeader.tsx`:

```tsx
import { SparklesIcon, MoonIcon } from './Icons';
```

Nas linhas 305-312, o botão `id="lock-icon-button"` passa a usar a lua. Manter o `id` (o tutorial aponta para ele):

```tsx
                                <button
                                    id="lock-icon-button"
                                    onClick={() => setRestScreenOpen(true)}
                                    className="shell-float-button absolute right-full mr-2 group"
                                    aria-label="Tela de Descanso"
                                    title="Tela de Descanso"
                                >
                                    <MoonIcon className="shell-float-icon w-4 h-4 group-hover:text-white transition-colors drop-shadow-[0_0_8px_var(--skin-accent-color)]" />
                                </button>
```

- [ ] **Passo 3: rótulos em português**

Linha 287: `aria-label="Adjust mood"` vira `aria-label="Ajustar humor"`.
Linha 353: `aria-label="Oracle Assistant"` vira `aria-label="Oráculo"`.

- [ ] **Passo 4: conferir se algum teste ou tutorial usa o LockIcon ou os rótulos antigos**

```bash
grep -rn "LockIcon\|Adjust mood\|Oracle Assistant" tests components/TutorialOverlay.tsx contexts/TutorialContext.tsx
```

Esperado: nenhuma linha fora de `Icons.tsx`. Se aparecer, ajustar a referência para o novo nome.

- [ ] **Passo 5: verificar e commitar**

```bash
npm run type-check && npm run check:encoding
git add components/Icons.tsx components/GlobalHeader.tsx
git commit -m "fix: cabecalho com rotulos em portugues e icone de lua para descanso"
```

---

### Tarefa 4: texto em inglês e fallback de Suspense

**Arquivos:**
- Modificar: `components/SanctuaryAreaStats.tsx:70`
- Modificar: `components/AuthenticatedApp.tsx:1377`, `:1384`

- [ ] **Passo 1: traduzir**

Linha 70 de `SanctuaryAreaStats.tsx`: `Loading stats...` vira `Carregando...`.

- [ ] **Passo 2: extrair o spinner que já existe**

Em `AuthenticatedApp.tsx`, logo antes de `const isUuid = ...` (linha 100), adicionar:

```tsx
const LazyViewFallback: React.FC = () => (
    <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--skin-accent-color)] border-t-transparent" />
    </div>
);
```

- [ ] **Passo 3: usar nos dois pontos que hoje ficam pretos**

Linha 1377:

```tsx
                        <Suspense fallback={<LazyViewFallback />}>
                            <ReportsView onClose={() => setReportsVisible(false)} />
                        </Suspense>
```

Linha 1384:

```tsx
            <Suspense fallback={isProfileVisible ? <LazyViewFallback /> : null}>
                {isProfileVisible && <ProfileView onClose={() => setProfileVisible(false)} />}
            </Suspense>
```

O `fallback` da função `renderView` (linhas 1215-1219) pode passar a usar `<LazyViewFallback />` também, para não manter o mesmo JSX duas vezes.

- [ ] **Passo 4: verificar e commitar**

```bash
npm run type-check
git add components/SanctuaryAreaStats.tsx components/AuthenticatedApp.tsx
git commit -m "fix: spinner ao abrir historico e perfil, texto em portugues nos santuarios"
```

---

### Tarefa 5: código morto e arquivos soltos

Quatro views mantêm JSX antigo vivo com `{false && (...)}`. `views/NobrezaView.tsx` tem zero bytes. A raiz do repositório versiona dezenas de logs e rascunhos.

**Arquivos:**
- Modificar: `views/ArenasView.tsx:2416-2491`, `views/MundoView.tsx:777-893`, `views/SettingsView.tsx:1966-1990`, `views/SovereignPanelView.tsx:2430-2482`
- Remover do git: lista abaixo
- Modificar: `.gitignore`

- [ ] **Passo 1: estender o teste de higiene**

Em `tests/ui-hygiene.regression.mjs`, antes do `console.log`, acrescentar:

```js
// 2. JSX morto mantido com `{false && (` nao pode voltar.
{
    const files = ['views/ArenasView.tsx', 'views/MundoView.tsx', 'views/SettingsView.tsx', 'views/SovereignPanelView.tsx'];
    for (const file of files) {
        assert.doesNotMatch(read(file), /\{false && \(/, `${file} ainda tem JSX morto com {false && (`);
    }
}
```

Rodar `node tests/ui-hygiene.regression.mjs`. Esperado: falha em `views/ArenasView.tsx`.

- [ ] **Passo 2: apagar os quatro blocos**

Os intervalos de linha foram medidos por balanceamento de chaves. Confirmar antes de apagar que a primeira linha do intervalo é `{false && (` e a última fecha com `)}`:

| Arquivo | Linhas |
|---|---|
| `views/ArenasView.tsx` | 2416 a 2491 |
| `views/MundoView.tsx` | 777 a 893 |
| `views/SettingsView.tsx` | 1966 a 1990 |
| `views/SovereignPanelView.tsx` | 2430 a 2482 |

Apagar os blocos inteiros. Depois rodar `npm run type-check`. Handlers e imports que ficarem sem uso (por exemplo `handleOpenCampaignHub`, `handleCreateCampaignClick`, `FolderStarIcon`, `LinkIcon` em `ArenasView.tsx`) não quebram o tsc, mas devem ser removidos se nenhum outro ponto do arquivo os usar. Conferir com:

```bash
grep -c "handleOpenCampaignHub\|handleCreateCampaignClick\|FolderStarIcon\|LinkIcon\|LayersIcon" views/ArenasView.tsx
```

Um identificador com só 1 ocorrência (a definição ou o import) está órfão.

- [ ] **Passo 3: remover do git os arquivos soltos**

```bash
git rm --quiet views/NobrezaView.tsx ActionModal.head.tsx tmp_ActionModal_HEAD.tsx temp_sephirotfog_original.tsx tmp_inventory_logic.txt tmp_output.txt ts_errors.txt ts_errors_real.txt old_arena.txt old_fog.txt list_out.txt migrations_list.txt db_help.txt test_insert.js "c --noEmit'"
git rm --quiet --cached *.log tests/artifacts/*.log
```

O arquivo `t (startNewCycle|endCycle) =...` na raiz não está versionado; apagar do disco com `rm`.

- [ ] **Passo 4: ignorar logs e temporários**

No `.gitignore`, na seção `# Logs`, trocar `/dev-*.log` por:

```
*.log
```

E na seção `# Backup and temporary files` acrescentar:

```
tmp_*
temp_*
ts_errors*.txt
```

- [ ] **Passo 5: verificar e commitar**

```bash
node tests/ui-hygiene.regression.mjs && npm run type-check && npm run build
git add -A
git commit -m "chore: remove JSX morto, view vazia e logs versionados"
```

O `npm run build` garante que nenhum import órfão quebrou o bundle.

---

### Tarefa 6: Config sem "Premium" duplicado e aba "Geral" com nome certo

Em `views/SettingsView.tsx` a aba Preferências tem uma seção chamada "Premium" com Vínculos, Biblioteca, Assistente e Campanhas e um selo "BLOQUEADO", mas três dos quatro botões funcionam sem Premium. A aba Premium de verdade tem os planos. Além disso, a aba "Geral" mostra patente, nível, nickname, sair e deletar conta: é o perfil.

**Arquivos:**
- Modificar: `views/SettingsView.tsx:2274-2329` e `:2828-2846`

- [ ] **Passo 1: renomear a seção e tirar o selo enganoso**

Linhas 2275-2278, trocar:

```tsx
                <div className="flex items-center justify-between px-1 border-b border-[var(--skin-accent-color)]/20 pb-2">
                    <h2 className="text-sm font-bold accent-text uppercase tracking-widest">Premium</h2>
                    {!isPremium && <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">BLOQUEADO</span>}
                </div>
```

por:

```tsx
                <div className="flex items-center justify-between px-1 border-b border-[var(--skin-accent-color)]/20 pb-2">
                    <h2 className="text-sm font-bold accent-text uppercase tracking-widest">Vínculos e biblioteca</h2>
                </div>
```

Linhas 2323-2327, trocar o aviso genérico:

```tsx
                    {!isPremium && (
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-400">Campanhas exige Premium. O resto já está liberado.</p>
                        </div>
                    )}
```

Remover também o `console.log("PremiumTab: Assistant button clicked -> Opening Settings");` da linha 2303.

- [ ] **Passo 2: rótulo "Perfil" na aba, sem mudar ids nem tipos**

O `id` do botão da aba é derivado do nome (`settings-tab-geral`) e o tipo `SettingsTab` é usado em telemetria e no parâmetro de URL. Para não quebrar nada, mudar só o texto exibido. Acima de `let tabs: SettingsTab[] = ...` (linha 2830), adicionar:

```tsx
    const tabLabels: Record<SettingsTab, string> = {
        'Geral': 'Perfil',
        'Preferências': 'Preferências',
        'Premium': 'Premium',
        'Temporada': 'Temporada',
    };
```

E dentro do `tabs.map`, trocar `{tab}` (linha 2843) por `{tabLabels[tab]}`.

- [ ] **Passo 3: verificar**

```bash
grep -rn "settings-tab-geral\|'Geral'" tests
```

Esperado: nada (já foi conferido; a única referência de teste a abas é `settings-tab-preferencias`, que não muda). Depois `npm run type-check && npm run check:encoding`.

- [ ] **Passo 4: commit**

```bash
git add views/SettingsView.tsx
git commit -m "fix: config sem secao Premium duplicada e aba de perfil com nome certo"
```

---

# Fase 2: `window.confirm` vira `ConfirmationModal`

Há 17 chamadas a `window.confirm` / `confirm` em 10 arquivos, enquanto `components/ConfirmationModal.tsx` já existe e é usado em 19 lugares. No Android o diálogo nativo aparece cinza, fora do tema, e some ao girar a tela.

### Tarefa 7: hook `useConfirmation`

**Arquivos:**
- Criar: `hooks/useConfirmation.tsx`

- [ ] **Passo 1: criar o hook**

```tsx
import React, { useCallback, useState } from 'react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export type ConfirmationRequest = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
};

type PendingConfirmation = ConfirmationRequest & { resolve: (accepted: boolean) => void };

/**
 * Substituto de window.confirm com o visual do app.
 *
 * Uso:
 *   const { confirm, confirmationElement } = useConfirmation();
 *   ...
 *   if (!(await confirm({ title: 'Excluir?', message: '...', variant: 'danger' }))) return;
 *   ...
 *   return (<>{...}{confirmationElement}</>);
 *
 * O modal e renderizado num Portal proprio, entao pode ficar em qualquer
 * ponto da arvore do componente que chama.
 */
export const useConfirmation = () => {
    const [pending, setPending] = useState<PendingConfirmation | null>(null);

    const confirm = useCallback((request: ConfirmationRequest) => (
        new Promise<boolean>((resolve) => {
            setPending({ ...request, resolve });
        })
    ), []);

    const settle = useCallback((accepted: boolean) => {
        pending?.resolve(accepted);
        setPending(null);
    }, [pending]);

    const confirmationElement = pending ? (
        <ConfirmationModal
            title={pending.title}
            message={pending.message}
            confirmLabel={pending.confirmLabel}
            cancelLabel={pending.cancelLabel}
            variant={pending.variant}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
        />
    ) : null;

    return { confirm, confirmationElement };
};
```

- [ ] **Passo 2: estender o teste de higiene**

Em `tests/ui-hygiene.regression.mjs`, antes do `console.log`:

```js
// 3. Confirmacoes usam ConfirmationModal, nunca o dialogo nativo.
{
    const walk = (dir, out = []) => {
        for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
            const relative = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(relative, out);
            else if (relative.endsWith('.tsx')) out.push(relative);
        }
        return out;
    };
    // O confirm nativo recebe uma string; o hook useConfirmation recebe um objeto `{`.
    // Por isso o padrao exige aspas logo depois do parentese.
    const offenders = [...walk('views'), ...walk('components')].filter((file) => (
        /(^|[^A-Za-z.])(window\.)?confirm\(\s*['"`]/.test(read(file).replace(/\/\/.*$/gm, ''))
    ));
    assert.deepEqual(offenders, [], `window.confirm ainda usado em: ${offenders.join(', ')}`);
}
```

Rodar `node tests/ui-hygiene.regression.mjs`. Esperado: falha listando os 10 arquivos.

- [ ] **Passo 3: commit do hook e do teste**

```bash
npm run type-check
git add hooks/useConfirmation.tsx tests/ui-hygiene.regression.mjs
git commit -m "refactor: hook useConfirmation para substituir window.confirm"
```

---

### Tarefa 8: migrar `components/ConnectionsModal.tsx` (modelo para os demais)

**Arquivos:**
- Modificar: `components/ConnectionsModal.tsx:1`, `:307`, `:334`, `:376`, final do arquivo

- [ ] **Passo 1: importar e instanciar o hook**

Depois da linha `import { useGame } from '../contexts/GameContext';`:

```tsx
import { useConfirmation } from '../hooks/useConfirmation';
```

Dentro do componente, junto dos outros hooks (antes de `const desistChallenge`):

```tsx
  const { confirm, confirmationElement } = useConfirmation();
```

- [ ] **Passo 2: trocar as duas chamadas**

Linha 307:

```tsx
  const desistChallenge = async (challengeId: string) => {
    const accepted = await confirm({
      title: 'Desistir do duelo?',
      message: 'Desistir encerra este duelo sem vencedor, e os 50 de ouro não voltam.',
      confirmLabel: 'DESISTIR',
      variant: 'danger',
    });
    if (!accepted) return;
```

Linha 334:

```tsx
  const endLink = async (link: RelationshipLink) => {
    const accepted = await confirm({
      title: 'Encerrar esta conexão?',
      message: 'O histórico de progresso não será apagado.',
      confirmLabel: 'ENCERRAR',
      variant: 'danger',
    });
    if (!accepted) return;
```

- [ ] **Passo 3: renderizar o modal**

O `return (` principal do componente está na linha 376 e o arquivo termina com `</Portal>`. Inserir `{confirmationElement}` logo antes de `</Portal>`:

```tsx
      {confirmationElement}
    </Portal>
  );
};
```

- [ ] **Passo 4: verificar e commitar**

```bash
npm run type-check && node tests/ui-hygiene.regression.mjs
```

O teste ainda falha nos outros 9 arquivos, mas `components/ConnectionsModal.tsx` não pode mais aparecer na lista.

```bash
git add components/ConnectionsModal.tsx
git commit -m "fix: confirmacoes de conexao usam o modal do app"
```

---

### Tarefa 9: migrar os outros nove arquivos

Mesma receita da Tarefa 8 em cada arquivo: (1) `import { useConfirmation } from '../hooks/useConfirmation';` (em `views/PlannerView.tsx` o caminho é o mesmo `../hooks/...`); (2) `const { confirm, confirmationElement } = useConfirmation();` no topo do componente que contém o handler; (3) trocar `if (!window.confirm(...)) return;` por `if (!(await confirm({...}))) return;`, tornando o handler `async` se ainda não for; (4) renderizar `{confirmationElement}` dentro do JSX raiz do componente.

Cuidado com handlers passados a `onClick` que hoje são síncronos: `onClick={() => handleDelete()}` continua funcionando com `async`, mas se o handler faz `return` de valor ou é usado em `Promise.all`, conferir.

Textos a usar (título, mensagem, rótulo de confirmar, variante):

| Arquivo:linha | title | message | confirmLabel | variant |
|---|---|---|---|---|
| `views/PlannerView.tsx:229` | Tarefa corrompida | Esta tarefa não tem ação vinculada. Excluir? | EXCLUIR | danger |
| `components/CampaignDetailModal.tsx:36` | Excluir campanha? | Todas as arenas e ações dentro dela serão excluídas permanentemente. | EXCLUIR | danger |
| `components/CampaignsCodex.tsx:413` | Remover campanha do vínculo? | Isso não pode ser desfeito. | REMOVER | danger |
| `components/CampaignsCodex.tsx:421` | Excluir campanha? | Todas as arenas e ações dentro dela serão excluídas permanentemente. | EXCLUIR | danger |
| `components/CampaignsCodex.tsx:528` | Remover arena da campanha? | A arena continua existindo fora da campanha. | REMOVER | default |
| `components/ClanSlotModal.tsx:192` | Apagar tarefa? | `Apagar "${quest.title}"?` | APAGAR | danger |
| `components/CodexLibrary.tsx:306` | `Excluir ${codex.name}?` | Essa ação remove a campanha da sua biblioteca. | EXCLUIR | danger |
| `components/CodexModal.tsx:477` | Excluir campanha? | Isso não pode ser desfeito. | EXCLUIR | danger |
| `components/CodexModal.tsx:494` | Instalar campanha? | Todas as arenas e ações desta campanha entram no seu jogo. | INSTALAR | default |
| `components/FolderDetailModal.tsx:30` | Excluir pasta? | As arenas serão movidas para a raiz. | EXCLUIR | danger |
| `components/ItemDetailModal.tsx:165` | Doar item? | `Doar ${currentItem.name} para ${amigoNome}? Isso não pode ser desfeito.` | DOAR | default |
| `components/ItemDetailModal.tsx:204` | Quebrar item? | `Quebrar ${currentItem.name} por ${valorAoQuebrar} fragmentos? Isso não pode ser desfeito.` | QUEBRAR | danger |
| `components/RelationshipHubModal.tsx:1313` | Remover campanha do vínculo? | `"${codex.name}" sai deste vínculo.` | REMOVER | danger |
| `components/RelationshipHubModal.tsx:1428` | Remover arena do vínculo? | `"${arenaName}" sai deste vínculo.` | REMOVER | danger |

Observação: `RelationshipHubModal.tsx` não é montado por nenhuma tela viva (ver `status.md`, seção 4), mas migrar mesmo assim para o teste passar. Se preferir, pode ser removido num plano futuro.

- [ ] **Passo 1: migrar um arquivo por vez, rodando após cada um**

```bash
npm run type-check && node tests/ui-hygiene.regression.mjs
```

- [ ] **Passo 2: commit único ao terminar**

```bash
git add views/PlannerView.tsx components/CampaignDetailModal.tsx components/CampaignsCodex.tsx components/ClanSlotModal.tsx components/CodexLibrary.tsx components/CodexModal.tsx components/FolderDetailModal.tsx components/ItemDetailModal.tsx components/RelationshipHubModal.tsx
git commit -m "fix: todas as confirmacoes usam o modal do app em vez de window.confirm"
```

Esperado: `node tests/ui-hygiene.regression.mjs` imprime `ui-hygiene: ok`.

---

# Fase 3: onboarding mais curto

O onboarding tem 16 passos. Dois deles são perguntas que não ajudam a pessoa a fazer nada agora: faixa etária e presença do Oráculo (que já existe em Config › Oráculo & Alertas). Removê-los tira 2 toques antes da primeira ação real e faz o onboarding começar pela única pergunta que muda o texto dos passos seguintes ("Pra que você quer usar o app?").

### Tarefa 10: remover faixa etária e presença do Oráculo

**Arquivos:**
- Modificar: `components/FirstUseOnboardingOverlay.tsx:29-33`, `:99-101`, `:108-128`, `:568`, `:587`, `:617`, `:709-727`, `:751-771`
- Modificar: `components/AuthenticatedApp.tsx:1693-1705`
- Modificar: `tests/onboarding-happy-path.cdp.mjs:341-355`

- [ ] **Passo 1: conferir quem lê os dados hoje**

```bash
grep -rn "onboardingAgeRange\|OnboardingAgeRange\|AGE_RANGES\|ORACLE_PRESENCES" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v dist
```

Esperado: `types.ts:511` (campo opcional do perfil, manter para dados antigos), o overlay e `AuthenticatedApp.tsx`. Se aparecer um consumidor real (relatório, Oráculo), parar e avisar antes de seguir.

- [ ] **Passo 2: tirar os dois passos da lista**

Em `FirstUseOnboardingOverlay.tsx`, apagar os objetos `{ id: 'age-range', ... }` (linhas 108-114) e `{ id: 'oracle-presence', ... }` (linhas 122-128) do array `steps`. O primeiro passo passa a ser `purpose`.

- [ ] **Passo 3: apagar os blocos de UI**

Apagar o bloco `{step.id === 'age-range' && ( ... )}` (linhas 709-727) e o bloco `{step.id === 'oracle-presence' && ( ... )}` (linhas 751-771).

- [ ] **Passo 4: apagar estado, tipo e constantes**

Remover `const [ageRange, setAgeRange] = ...` (linha 99) e `const [oraclePresenceLevel, setOraclePresenceLevel] = ...` (linha 101).

Reduzir o tipo (linhas 29-33) a:

```tsx
export type OnboardingAnswers = {
  purpose: OnboardingPurpose | null;
};
```

Na linha 568, `onComplete(selectedMissionIds, { ageRange, purpose, oraclePresenceLevel });` vira:

```tsx
      onComplete(selectedMissionIds, { purpose });
```

Na lista de dependências do `useCallback` da linha 587, remover `ageRange` e `oraclePresenceLevel`.

Na linha 617, `step.id === 'age-range' || step.id === 'purpose' || step.id === 'oracle-presence'` vira `step.id === 'purpose'`.

Apagar as constantes `AGE_RANGES` (linhas 37-43) e `ORACLE_PRESENCES` (linhas 52-56) e os tipos `OnboardingAgeRange` e o import de `OraclePresenceLevel` se ficarem sem uso. Confirmar com `grep -n "OraclePresenceLevel\|OnboardingAgeRange" components/FirstUseOnboardingOverlay.tsx`.

- [ ] **Passo 5: ajustar quem consome**

Em `AuthenticatedApp.tsx`, o handler `handleCompleteOnboarding` (linha 1693) fica:

```tsx
    const handleCompleteOnboarding = useCallback((acceptedSystemChallenges: string[], answers: OnboardingAnswers) => {
        updateUserProfile({
            ...buildOnboardingCompletePatch(userProfile),
            acceptedSystemChallenges,
            onboardingPurpose: answers.purpose,
        });
        setFirstUseOnboardingActive(false);
```

Apagar as linhas `onboardingAgeRange: answers.ageRange,` e o bloco `if (answers.oraclePresenceLevel !== null) { ... }` com seu comentário. Se `updateOraclePreferences` ficar sem uso no arquivo, remover da desestruturação do `useGame()`.

- [ ] **Passo 6: atualizar o smoke de onboarding**

Em `tests/onboarding-happy-path.cdp.mjs`, linhas 341-355, trocar:

```js
    await waitForOnboardingTitle(page, 'Qual sua faixa etaria?', 25000);
    checkpoints.push('onboarding-open');

    // As tres perguntas de primeiro uso. Cada uma avanca ao escolher, sem botao
    // Proximo, entao o clique na opcao e a unica saida do passo.
    await page.clickSelector('#onboarding-age-25_34');
    await waitForOnboardingTitle(page, 'Pra que voce quer usar o app?', 12000);
    checkpoints.push('age-answered');

    await page.clickSelector('#onboarding-purpose-organizar');
    await waitForOnboardingTitle(page, 'Quanta presenca voce quer do Oraculo?', 12000);
    checkpoints.push('purpose-answered');

    await page.clickSelector('#onboarding-oracle-2');
    checkpoints.push('oracle-presence-answered');
```

por:

```js
    await waitForOnboardingTitle(page, 'Pra que voce quer usar o app?', 25000);
    checkpoints.push('onboarding-open');

    // A unica pergunta de primeiro uso. Avanca ao escolher, sem botao Proximo.
    await page.clickSelector('#onboarding-purpose-organizar');
    checkpoints.push('purpose-answered');
```

- [ ] **Passo 7: verificar**

```bash
npm run type-check && npm run check:encoding && npm test
```

Se houver servidor e conta QA disponíveis (`.env.qa.local`), rodar também `node tests/onboarding-happy-path.cdp.mjs` com `npm run dev` ativo. Sem conta QA, registrar no relatório final que o smoke não foi executado.

- [ ] **Passo 8: commit**

```bash
git add components/FirstUseOnboardingOverlay.tsx components/AuthenticatedApp.tsx tests/onboarding-happy-path.cdp.mjs
git commit -m "fix: onboarding sem perguntas de faixa etaria e presenca do Oraculo"
```

---

# Fase 4: acessibilidade e acentuação

### Tarefa 11: botões só com ícone ganham nome

Uma varredura aproximada achou cerca de 480 dos 860 `<button>` sem texto, `aria-label` ou `title`. Os piores arquivos: `views/SettingsView.tsx` (31), `components/RelationshipHubModal.tsx` (26, tela morta, pular), `views/ReportsView.tsx` (25), `views/MundoView.tsx` (20), `components/CodexModal.tsx` (20), `components/ActionModal.tsx` (19), `components/ClanDetailModal.tsx` (17), `components/ConnectionsModal.tsx` (16), `components/CampaignsCodex.tsx` (15), `views/ArenasView.tsx` (14).

**Arquivos:**
- Criar: `scripts/list-unlabeled-buttons.mjs`
- Modificar: os arquivos listados pelo script, em ordem decrescente

- [ ] **Passo 1: criar o script**

```js
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = process.argv.slice(2);
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
};
walk(path.join(root, 'views'));
walk(path.join(root, 'components'));

const wanted = targets.length
  ? files.filter((file) => targets.some((target) => file.replace(/\\/g, '/').endsWith(target)))
  : files;

let total = 0;
for (const file of wanted) {
  const source = fs.readFileSync(file, 'utf8');
  const pattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let match;
  const hits = [];
  while ((match = pattern.exec(source))) {
    const attrs = match[1];
    const inner = match[2];
    const hasVisibleText = />[^<>{}]*[A-Za-zÀ-ú]{2,}[^<>{}]*</.test(inner)
      || /\{[^}]*(label|name|title|text|children)[^}]*\}/i.test(inner);
    const hasName = /aria-label|title=/.test(attrs);
    if (!hasVisibleText && !hasName) {
      const line = source.slice(0, match.index).split('\n').length;
      hits.push(line);
    }
  }
  if (hits.length) {
    total += hits.length;
    console.log(`${path.relative(root, file)} (${hits.length}): linhas ${hits.join(', ')}`);
  }
}
console.log(`total: ${total}`);
```

Uso: `node scripts/list-unlabeled-buttons.mjs` (tudo) ou `node scripts/list-unlabeled-buttons.mjs views/SettingsView.tsx` (um arquivo).

- [ ] **Passo 2: rotular, arquivo por arquivo**

Regras para escolher o texto do `aria-label`:
- Descreve a ação, no infinitivo, em português com acento: `aria-label="Fechar"`, `aria-label="Editar arena"`, `aria-label="Excluir ação"`, `aria-label="Voltar"`.
- Quando o botão alterna estado, usa a ação que vai acontecer: `aria-label={isOpen ? 'Recolher' : 'Expandir'}`.
- Quando o botão é sobre um item da lista, inclui o nome: `` aria-label={`Abrir ${arena.name}`} ``.
- Nunca copiar o nome do ícone ("XIcon", "Trash").

Ordem sugerida: `views/SettingsView.tsx`, `views/ReportsView.tsx`, `views/MundoView.tsx`, `components/ActionModal.tsx`, `components/CodexModal.tsx`, `components/ClanDetailModal.tsx`, `components/ConnectionsModal.tsx`, `components/CampaignsCodex.tsx`, `views/ArenasView.tsx`, `views/PlannerView.tsx`. Pular `components/RelationshipHubModal.tsx`.

Um commit por arquivo:

```bash
node scripts/list-unlabeled-buttons.mjs views/SettingsView.tsx   # deve imprimir total: 0
npm run type-check
git add views/SettingsView.tsx
git commit -m "fix: botoes de icone em Config com nome acessivel"
```

- [ ] **Passo 3: travar a regressão nos arquivos já limpos**

Em `tests/ui-hygiene.regression.mjs`, antes do `console.log`, acrescentar um bloco que reaproveita a mesma heurística do script para uma lista fixa de arquivos já limpos. A lista começa vazia e cresce a cada commit da etapa anterior:

```js
// 4. Arquivos ja limpos nao podem ganhar botao de icone sem nome.
{
    const cleanFiles = [
        // 'views/SettingsView.tsx',
    ];
    for (const file of cleanFiles) {
        const source = read(file);
        const pattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
        let match;
        while ((match = pattern.exec(source))) {
            const hasVisibleText = />[^<>{}]*[A-Za-zÀ-ú]{2,}[^<>{}]*</.test(match[2])
                || /\{[^}]*(label|name|title|text|children)[^}]*\}/i.test(match[2]);
            const hasName = /aria-label|title=/.test(match[1]);
            assert.ok(hasVisibleText || hasName, `${file}: botao sem nome acessivel perto do indice ${match.index}`);
        }
    }
}
```

Descomentar cada arquivo ao terminar de rotulá-lo.

---

### Tarefa 12: acentuação consistente nos textos de interface

Contagem atual em `views/` e `components/`: "nao" 335 contra "não" 68; "historico" 50 contra "histórico" 4; "possivel" 35 contra "possível" 12. A mistura no mesmo app parece descuido.

**Risco:** os arquivos já tiveram problemas de codificação no passado (existe `scripts/check-encoding.mjs` por isso). O script abaixo só toca em texto dentro de aspas ou entre `>` e `<`, e só quando o trecho tem pelo menos duas palavras, para não tocar em identificadores nem em chaves de enum como `'nao'`.

**Arquivos:**
- Criar: `scripts/fix-accents.mjs`
- Modificar: os `.tsx` de `views/` e `components/` que o script alterar

- [ ] **Passo 1: confirmar que os smokes normalizam acento**

```bash
grep -n "normalize('NFD')\|normalize(\"NFD\")" tests/_smoke.browser.mjs
```

Esperado: pelo menos uma ocorrência dentro dos helpers de comparação de texto (`waitForBodyText`, `clickText` ou equivalente). Se não houver, os smokes que comparam títulos sem acento vão quebrar; nesse caso, adicionar a normalização no helper de comparação antes de seguir:

```js
const fold = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
```

e comparar `fold(bodyText).includes(fold(expected))`.

- [ ] **Passo 2: criar o script**

```js
import fs from 'node:fs';
import path from 'node:path';

// Palavras que aparecem sem acento nos textos de UI. Chave = forma errada,
// valor = forma certa. So minusculas; a capitalizacao e preservada abaixo.
const WORDS = {
  nao: 'não', voce: 'você', voces: 'vocês', acao: 'ação', acoes: 'ações',
  historico: 'histórico', possivel: 'possível', rapido: 'rápido', rapida: 'rápida',
  tambem: 'também', estao: 'estão',
  sera: 'será', serao: 'serão', porem: 'porém', alem: 'além', apos: 'após',
  proximo: 'próximo', proxima: 'próxima', ultimo: 'último', ultima: 'última',
  numero: 'número', usuario: 'usuário', usuarios: 'usuários', missao: 'missão',
  missoes: 'missões', configuracao: 'configuração', configuracoes: 'configurações',
  conexao: 'conexão', conexoes: 'conexões', descricao: 'descrição', opcao: 'opção',
  opcoes: 'opções', codigo: 'código', pagina: 'página', memoria: 'memória',
  automatico: 'automático', automatica: 'automática', publico: 'público',
  publica: 'pública', diario: 'diário', diaria: 'diária',
  media: 'média', minimo: 'mínimo', maximo: 'máximo', nivel: 'nível', niveis: 'níveis',
  oraculo: 'oráculo', cla: 'clã', clas: 'clãs', bau: 'baú', baus: 'baús',
  premio: 'prêmio', premios: 'prêmios', experiencia: 'experiência', sequencia: 'sequência',
  inicio: 'início', termino: 'término', horario: 'horário', horarios: 'horários',
  calendario: 'calendário', relatorio: 'relatório', relatorios: 'relatórios',
  estatisticas: 'estatísticas', conteudo: 'conteúdo', titulo: 'título',
};

// Palavras ambiguas ficam de fora de proposito: "esta" (pronome) vs "está", "so" vs "só",
// "ate" vs "até", "ja" vs "já", "e" vs "é". Remova da tabela acima qualquer outra que gerar diff errado.

const wordPattern = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\b`, 'gi');

const fixWords = (text) => text.replace(wordPattern, (match) => {
  const fixed = WORDS[match.toLowerCase()];
  if (!fixed) return match;
  if (match === match.toUpperCase()) return fixed.toUpperCase();
  if (match[0] === match[0].toUpperCase()) return fixed[0].toUpperCase() + fixed.slice(1);
  return fixed;
});

// So toca em (a) literais de string com pelo menos duas palavras e
// (b) texto JSX entre > e < com pelo menos duas palavras.
const fixSource = (source) => source
  .replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g, (whole, quote, body) => (
    /\s/.test(body.trim()) ? `${quote}${fixWords(body)}${quote}` : whole
  ))
  .replace(/>([^<>{}]+)</g, (whole, body) => (
    /\s/.test(body.trim()) ? `>${fixWords(body)}<` : whole
  ));

const root = process.cwd();
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
};
walk(path.join(root, 'views'));
walk(path.join(root, 'components'));

let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = fixSource(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log('ajustado:', path.relative(root, file));
  }
}
console.log(`arquivos alterados: ${changed}`);
```

- [ ] **Passo 3: rodar e revisar o diff inteiro**

```bash
node scripts/fix-accents.mjs
git diff --stat
git diff | grep "^[-+]" | grep -v "^[-+][-+]" | head -200
```

Ler o diff procurando falsos positivos: identificadores (`const acao =`), chaves de objeto (`{ nao: ... }`), valores de enum (`=== 'nao'`), caminhos de arquivo, `className`. O script evita a maioria por exigir espaço no trecho, mas revisar mesmo assim. Qualquer alteração errada: reverter o arquivo com `git checkout -- <arquivo>` e remover a palavra da tabela.

- [ ] **Passo 4: verificar**

```bash
npm run check:encoding && npm run type-check && npm test && npm run build
```

Todos com código 0.

- [ ] **Passo 5: commit**

```bash
git add -A views components scripts/fix-accents.mjs
git commit -m "fix: acentuacao consistente nos textos de interface"
```

---

# Fora deste plano (decisões de produto)

Estes pontos apareceram na auditoria mas exigem decisão do dono do projeto antes de virar tarefa. Ficam registrados com os pontos de contato no código.

1. **Mundo com três níveis de navegação.** Aba Mundo → sub-abas Social, Loja, Arsenal, Feitos, Temporada → Social ainda tem Pessoas, Mensagens, Clã. Loja e Arsenal são economia, não mundo social. Mover exige mexer em: `views/MundoView.tsx:915-919` (lista de sub-abas), `views/MundoView.tsx:1017-1019` (render de `StoreView`/`ArsenalView`), o evento `navigate-to-store` disparado em `components/AuthenticatedApp.tsx:1940` e `:2030`, `views/SettingsView.tsx:2177`, `components/CampaignsCodex.tsx:220`, os `tutorialId` `nav-loja` e `nav-arsenal` em `contexts/TutorialContext.tsx` e as dicas de tela em `utils/screenIntroTips.ts`.
2. **Duas telas de perfil.** O avatar do cabeçalho abre `components/ProfileView.tsx` (1102 linhas) e a aba Geral de Config mostra patente, nível, nickname e sair. Decidir qual fica.
3. **Onboarding guiado com 14 passos** (após a Tarefa 10). Cada passo aponta para um elemento real da tela, então fundir "abrir, escolher área, nomear, salvar" numa tela só é redesenho, não corte. Se a meta for "primeira ação em 5 toques", o caminho é um formulário próprio do onboarding que cria arena e ação de uma vez, sem usar os modais do app.
4. **`RelationshipHubModal.tsx`** não é montado por tela nenhuma e ainda tem 26 botões sem nome e 2 `window.confirm`. Candidato a remoção.
5. **32 dos 39 `catch` em `contexts/GameContext.tsx` só fazem `console.error`.** Os de mutação (criar arena, ação) avisam por toast e revertem; os silenciosos são de rotinas de fundo. Vale uma revisão separada para decidir quais merecem aviso.

---

## Ordem de execução e critério de pronto

Executar as tarefas na ordem numérica. Cada tarefa termina com o commit indicado e com estes três comandos em código 0:

```bash
npm run type-check
```

```bash
npm run check:encoding
```

```bash
node tests/ui-hygiene.regression.mjs
```

Ao final do plano, `node tests/ui-hygiene.regression.mjs` imprime `ui-hygiene: ok` e `npm run build` gera `dist/` sem erro. Relatar no fechamento quais smokes CDP foram ou não executados e por quê.
