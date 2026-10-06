import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * A PREVIA DO CICLO TAMBEM ALCANCA A PEDRA DA LUA.
 *
 * A placa do ciclo em andamento — widget, card dos Ativos, MiniCycleHUD e trilha
 * dos Relatorios, todos via buildCycleWidgetSnapshot — mandava ao notaDoCiclo so
 * conclusao, dias e horas. Sem metas, dias zerados e areas, as frescuras do SSS
 * voltavam falsas, e a pedra da lua nunca aparecia durante o ciclo, nem num
 * ciclo a caminho dela. So o fechamento conseguia dar SSS.
 *
 * Este teste roda o modulo DE VERDADE. widgetSnapshots.ts importa sem extensao,
 * entao o Node puro nao o carrega; o esbuild, que ja vem no projeto, empacota
 * num arquivo temporario. Procurar texto no codigo diria que os campos estao
 * la — nao que a conta das areas e dos dias zerados esta certa.
 */

const raiz = fileURLToPath(new URL('..', import.meta.url));
const pacote = await build({
    entryPoints: [join(raiz, 'utils/widgetSnapshots.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
});
const pasta = mkdtempSync(join(tmpdir(), 'glyph-previa-sss-'));
const arquivo = join(pasta, 'widget.mjs');
writeFileSync(arquivo, pacote.outputFiles[0].text);
const { buildCycleWidgetSnapshot } = await import(pathToFileURL(arquivo).href);

const inicio = new Date('2026-09-07T12:00:00');
const dia = (n) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
};
const CINCO = ['proposito', 'relacoes', 'trabalho', 'lazer', 'saude'];

/**
 * Um ciclo de 28 dias: uma acao por area, com as repeticoes cumpridas uma por
 * dia. `diaPulado` deixa um dia inteiro sem nada, sem mexer na conclusao —
 * basta prometer uma repeticao a menos.
 */
const placa = ({ areas = CINCO, repeticoes = 28, duracao = 90, diaPulado = null, hoje = dia(27) } = {}) => {
    const arenas = areas.map((assetId, i) => ({ id: `arena-${i}`, name: `Arena ${i}`, assetId, actionIds: [`acao-${i}`] }));
    const actions = areas.map((_, i) => ({
        id: `acao-${i}`, name: `Acao ${i}`, arenaId: `arena-${i}`,
        actionType: 'Ação Recorrente', repetitions: repeticoes, duration: duracao,
    }));
    const cycle = { id: 'c1', name: 'Mes', startDate: dia(0), endDate: dia(27), arenaIds: arenas.map((a) => a.id) };
    const tasks = [];
    let feitas = 0;
    for (let d = 0; d < 28 && feitas < repeticoes; d++) {
        if (d === diaPulado) continue;
        areas.forEach((_, i) => tasks.push({
            id: `t-${d}-${i}`, actionId: `acao-${i}`, date: dia(d), startTime: 600, duration: duracao, completed: true,
        }));
        feitas++;
    }
    return buildCycleWidgetSnapshot({ cycle, tasks, actions, arenas, todayDate: hoje });
};

// ===================================== 1. o ciclo impecavel mostra SSS na previa
{
    const impecavel = placa();
    assert.equal(impecavel.taskProgressPercent, 100);
    assert.equal(impecavel.grade, 'SSS', 'a previa de um ciclo impecavel parou no SS — as frescuras sumiram de novo');
}
console.log('ok - 28 dias, 100%, 210h, cinco areas e todo dia: a previa mostra SSS');

// =================== 2. cada frescura segura sozinha, com a conclusao em 100%
{
    const diaVazio = placa({ repeticoes: 27, duracao: 95, diaPulado: 10 });
    assert.equal(diaVazio.taskProgressPercent, 100);
    assert.equal(diaVazio.grade, 'SS', 'um dia inteiro vazio passou no SSS da previa');

    const quatroAreas = placa({ areas: CINCO.slice(0, 4), duracao: 120 });
    assert.equal(quatroAreas.taskProgressPercent, 100);
    assert.equal(quatroAreas.grade, 'SS', 'quatro areas passaram no SSS da previa');
}
console.log('ok - um dia vazio ou uma area a menos seguram o SSS, mesmo com 100%');

// ================ 3. ciclo vencido e ainda nao fechado nao ganha dias vazios
//
// Olhado tres dias depois do fim, o ciclo impecavel continua impecavel: os dias
// depois do prazo nao sao do ciclo, e nao podem virar "dia zerado" so porque o
// fechamento ainda nao rodou.
{
    assert.equal(placa({ hoje: dia(30) }).grade, 'SSS', 'os dias depois do fim viraram dias zerados na previa');
}
console.log('ok - os dias depois do fim do ciclo nao contam como dia zerado');

console.log('Previa do SSS: a placa em andamento segue as mesmas frescuras do fechamento.');
