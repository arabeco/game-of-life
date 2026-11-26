import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * O FEED SOCIAL SO RECARREGA COM A TELA A VISTA (26/11/2026).
 *
 * Recarregava 80 linhas a cada 2 minutos mesmo com o app em segundo plano —
 * o maior gasto continuo de egress, contra 5 GB/mes do plano gratis. As outras
 * recargas periodicas ja olhavam a visibilidade; esta tinha ficado para tras.
 */
const codigo = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const inicio = codigo.indexOf('void fetchSocialFeed();\n        const intervalId');
assert.ok(inicio > 0, 'nao achei o efeito que recarrega o feed');
const efeito = codigo.slice(codigo.lastIndexOf('useEffect(', inicio), codigo.indexOf('}, [session?.user.id, fetchSocialFeed]);', inicio));

assert.match(efeito, /setInterval\(recarregar,/, 'o intervalo tem de passar pelo recarregar, que olha a tela');
assert.match(efeito, /const recarregar = \(\) => \{\s*if \(document\.visibilityState !== 'visible'\) return;/, 'em segundo plano o feed nao pode ir ao banco');
assert.match(efeito, /addEventListener\('visibilitychange', aoVoltar\)/, 'ao voltar para o app o feed tem de se atualizar');
assert.match(efeito, /removeEventListener\('visibilitychange', aoVoltar\)/, 'o ouvinte tem de sair junto com o efeito');
console.log('ok - o feed social so recarrega com a tela a vista e se atualiza ao voltar');
