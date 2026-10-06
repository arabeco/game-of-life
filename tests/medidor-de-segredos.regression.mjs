import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * O MEDIDOR DAS REGRAS SECRETAS.
 *
 * As regras moram em constants/desbloqueiosPorRegra.ts e so ali. O banco entrega
 * os numeros (minhas_marcas_secretas) e este medidor decide. Se a decisao
 * morasse tambem no SQL, seriam duas copias da mesma regra — e a historia deste
 * app e feita de duas copias que discordam.
 */
const raiz = fileURLToPath(new URL('..', import.meta.url));
const pacote = await build({
    entryPoints: [join(raiz, 'utils/medidorDeSegredos.ts')],
    bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
});
const pasta = mkdtempSync(join(tmpdir(), 'glyph-medidor-'));
const arquivo = join(pasta, 'medidor.mjs');
writeFileSync(arquivo, pacote.outputFiles[0].text);
const {
    condicaoCumprida, novasConquistas, lerDescobertas, montarModalDeSegredos, MARCA_DE_SEGREDO, REGRAS_DE_DESBLOQUEIO,
} = await import(pathToFileURL(arquivo).href);

const ciclo = (extra = {}) => ({ fim: '2026-09-20', dias: 7, nota: 'A', feitas: 66, planejadas: 66, arenasFechadasPorArea: null, ...extra });
const vazio = {
    acoesConcluidas: 0, maiorSequencia: 0, maiorDia: 0, diasSeguidosComCincoAreas: 0,
    maiorSemanaAntesDasSete: 0, paginasDoDiario: 0, diasDeHumor: 0, amizades: 0,
    competicoesVencidas: 0, missoesDoOraculo: 0, mentoriasAteOFim: 0, ciclos: [],
};
const regra = (id) => {
    const achada = REGRAS_DE_DESBLOQUEIO.find((r) => r.id === id);
    assert.ok(achada, `nao existe regra com id ${id}`);
    return achada;
};
const cumpre = (id, fatos) => condicaoCumprida(regra(id).condicao, { ...vazio, ...fatos });

// ------------------------------------------------ 1. cada limiar, na beira
assert.equal(cumpre('disciplinado', { ciclos: [ciclo()] }), true, 'ciclo 100% nota A');
assert.equal(cumpre('disciplinado', { ciclos: [ciclo({ nota: 'B' })] }), false, '100% com nota B nao basta');
assert.equal(cumpre('disciplinado', { ciclos: [ciclo({ feitas: 65 })] }), false, '65 de 66 nao e sem falha');
assert.equal(cumpre('disciplinado', { ciclos: [ciclo({ planejadas: 0, feitas: 0 })] }), false, 'ciclo vazio nao conta');
assert.equal(cumpre('veterano', { ciclos: [ciclo({ fim: '2026-05-10' }), ciclo({ fim: '2026-09-20' }), ciclo({ fim: '2026-10-04' })] }), true);
assert.equal(cumpre('veterano', { ciclos: [ciclo({ fim: '2026-09-13' }), ciclo({ fim: '2026-09-20' })] }), false);
assert.equal(cumpre('imparavel', { maiorSequencia: 30 }), true);
assert.equal(cumpre('imparavel', { maiorSequencia: 29 }), false);
assert.equal(cumpre('mistico', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 2 } })] }), true);
assert.equal(cumpre('mistico', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 1, saude: 3 } })] }), false);
assert.equal(cumpre('celestial', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 1, relacoes: 1, trabalho: 1, lazer: 1, saude: 1 } })] }), true);
assert.equal(cumpre('celestial', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 1, relacoes: 1, trabalho: 1, lazer: 1 } })] }), false);
assert.equal(cumpre('transcendente', { ciclos: [ciclo({ planejadas: 100, feitas: 90 })] }), true);
assert.equal(cumpre('transcendente', { ciclos: [ciclo({ planejadas: 99, feitas: 99 })] }), false);
assert.equal(cumpre('oraculo', { missoesDoOraculo: 2 }), true);
assert.equal(cumpre('profeta', { missoesDoOraculo: 4 }), false);
assert.equal(cumpre('profeta', { missoesDoOraculo: 5 }), true);
assert.equal(cumpre('lenda-viva', { acoesConcluidas: 1000 }), true);
assert.equal(cumpre('imperador', { acoesConcluidas: 4999 }), false);
assert.equal(cumpre('imperador', { acoesConcluidas: 5000 }), true);
assert.equal(cumpre('escriba', { paginasDoDiario: 10 }), true);
assert.equal(cumpre('escriba', { paginasDoDiario: 9 }), false);
assert.equal(cumpre('maratona', { maiorDia: 11 }), false);
assert.equal(cumpre('maratona', { maiorDia: 12 }), true);
assert.equal(cumpre('anciao', { ciclos: Array.from({ length: 12 }, () => ciclo()) }), true);
assert.equal(cumpre('anciao', { ciclos: Array.from({ length: 11 }, () => ciclo()) }), false);
assert.equal(cumpre('campeao', { competicoesVencidas: 3 }), true);
assert.equal(cumpre('campeao', { competicoesVencidas: 2 }), false);
assert.equal(cumpre('sereno', { diasDeHumor: 30 }), true);
assert.equal(cumpre('sereno', { diasDeHumor: 29 }), false);
assert.equal(cumpre('alvorada', { maiorSemanaAntesDasSete: 10 }), true);
assert.equal(cumpre('alvorada', { maiorSemanaAntesDasSete: 9 }), false);
assert.equal(cumpre('prisma', { diasSeguidosComCincoAreas: 14 }), true);
assert.equal(cumpre('prisma', { diasSeguidosComCincoAreas: 13 }), false);
assert.equal(cumpre('pedra-da-lua', { ciclos: [ciclo({ nota: 'SS' })] }), false);
assert.equal(cumpre('pedra-da-lua', { ciclos: [ciclo({ nota: 'SSS' })] }), true);
assert.equal(cumpre('popular', { amizades: 5 }), true);
assert.equal(cumpre('popular', { amizades: 4 }), false);
assert.equal(cumpre('guardia', { mentoriasAteOFim: 2 }), true);
assert.equal(cumpre('guardia', { mentoriasAteOFim: 1 }), false);
console.log('ok - as vinte regras, cada limiar na beira');

// ---------------------------- 2. sem arte nao dispara; descoberta nao repete
{
    const fatos = { ...vazio, acoesConcluidas: 6000, ciclos: [ciclo()] };
    const semArteDoImperador = (id) => id !== 'item_skin_5_003';
    const novas = novasConquistas({ fatos, regras: REGRAS_DE_DESBLOQUEIO, descobertas: new Set(), arteVisivel: semArteDoImperador });
    const ids = novas.map((r) => r.id);
    assert.ok(ids.includes('lenda-viva') && ids.includes('disciplinado'), 'as que tem arte destravam');
    assert.ok(!ids.includes('imperador'), 'regra sem arte nao pode disparar');

    const depois = novasConquistas({ fatos, regras: REGRAS_DE_DESBLOQUEIO, descobertas: new Set(ids), arteVisivel: () => true });
    assert.deepEqual(depois.map((r) => r.id), ['imperador'], 'a arte chegou: so a que faltava destrava');
    console.log('ok - regra sem arte espera; descoberta nao repete');
}

// ------------------------------------------ 3. as marcas no perfil
{
    const marcas = ['free_progress_reset_at:2026-09-01', `${MARCA_DE_SEGREDO}disciplinado`, `${MARCA_DE_SEGREDO}veterano`];
    assert.deepEqual([...lerDescobertas(marcas)].sort(), ['disciplinado', 'veterano']);
    assert.equal(lerDescobertas(undefined).size, 0);
    console.log('ok - so as marcas segredo: viram descoberta');
}

// --------------------------- 4. varias de uma vez viram um modal so
{
    const uma = montarModalDeSegredos([regra('disciplinado')]);
    assert.equal(uma.secreta, true);
    assert.equal(uma.title, 'Disciplinado');
    assert.equal(uma.frase, regra('disciplinado').frase);
    assert.deepEqual(uma.reward.items, regra('disciplinado').itens);

    const duas = montarModalDeSegredos([regra('disciplinado'), regra('veterano')]);
    assert.equal(duas.title, 'Disciplinado · Veterano');
    assert.match(duas.frase, /2 segredos/);
    assert.equal(duas.reward.items.length, 4);
    assert.equal(duas.id, 'segredo:disciplinado+veterano', 'o id e o que a fila usa para nao repetir');
    console.log('ok - um modal so, com todos os premios');
}

// ---------------- 5. o fecho do ciclo anota as arenas fechadas por area
{
    const { readFileSync } = await import('node:fs');
    const contexto = readFileSync(join(raiz, 'contexts/GameContext.tsx'), 'utf8').replace(/\r\n/g, '\n');
    const fecho = contexto.slice(contexto.indexOf('const endCycle = async'));
    const inicioDoRelatorio = fecho.indexOf('const newReport: Report');
    const relatorio = fecho.slice(inicioDoRelatorio, inicioDoRelatorio + 2600);
    assert.match(relatorio, /arenasFechadasPorArea,/, 'o relatorio do ciclo nao leva as arenas fechadas por area');
    assert.match(fecho.slice(0, inicioDoRelatorio), /progresso\.totalCompleted >= progresso\.totalPlanned/,
        'arena fechada e todas as acoes cumpridas, pela mesma conta que a arena mostra');
    console.log('ok - o Mistico e o Celestial passam a ter o que ler');
}

// ------------------------- 6. o SQL so conta; quem decide e o medidor
{
    const { readFileSync } = await import('node:fs');
    const sql = readFileSync(join(raiz, 'supabase/migrations/20261006180000_regras_secretas.sql'), 'utf8');
    assert.match(sql, /product_id not like '%:primeira:%'/, 'a missao inicial do onboarding nao conta');
    assert.match(sql, /function public\.minhas_marcas_secretas\(\)[\s\S]*security definer[\s\S]*auth\.uid\(\)/,
        'a funcao publica le so a conta de quem chama');
    assert.match(sql, /revoke all on function public\._marcas_secretas\(uuid\) from public, anon, authenticated/,
        'a funcao por id nao pode ficar aberta: leria a conta de outra pessoa');
    for (const chave of ['acoesConcluidas', 'maiorSequencia', 'maiorDia', 'diasSeguidosComCincoAreas', 'maiorSemanaAntesDasSete',
        'paginasDoDiario', 'diasDeHumor', 'amizades', 'competicoesVencidas', 'missoesDoOraculo', 'mentoriasAteOFim', 'ciclos']) {
        assert.match(sql, new RegExp(`'${chave}'`), `o SQL nao entrega ${chave}, que o medidor le`);
    }
    console.log('ok - o SQL entrega cada numero que o medidor le, e so da propria conta');
}

// --------------- 7. o modal e o de recompensa normal, so com o titulo
{
    const { readFileSync } = await import('node:fs');
    const modal = readFileSync(join(raiz, 'components/AchievementModal.tsx'), 'utf8');
    const missao = modal.slice(modal.indexOf("case 'QUEST_COMPLETED': {"), modal.indexOf("case 'REPORT_COMPLETED':"));
    assert.match(missao, /data\.secreta/, 'o modal de missao nao reconhece a conquista secreta');
    assert.match(missao, /'Conquista secreta'/, 'o titulo da conquista secreta sumiu');
    console.log('ok - conquista secreta e o modal de recompensa de sempre, com outro titulo');
}

// ------------------------------- 8. a entrega, pelo caminho de sempre
{
    const { readFileSync, existsSync } = await import('node:fs');
    const caminhoDoHook = join(raiz, 'hooks/useConquistasSecretas.ts');
    assert.ok(existsSync(caminhoDoHook), 'a conferencia das regras secretas nao existe');
    const hook = readFileSync(caminhoDoHook, 'utf8');
    assert.match(hook, /rpc\('minhas_marcas_secretas'\)/, 'a conferencia nao pergunta os numeros ao banco');
    assert.match(hook, /novasConquistas\(/, 'a conferencia decide fora do medidor');
    assert.match(hook, /grantInventoryItem\(/, 'o premio deixou de sair pelo caminho de sempre');
    assert.match(hook, /completedSeasonMissions:/, 'a descoberta nao fica gravada no perfil');
    assert.match(hook, /setAchievementUnlocked\(\{ type: 'QUEST_COMPLETED'/, 'o modal nao entra na fila que ja existe');
    const app = readFileSync(join(raiz, 'components/AuthenticatedApp.tsx'), 'utf8');
    assert.match(app, /useConquistasSecretas\(\{ pausado: isReportsVisible \}\)/,
        'a conquista secreta nao espera o relatorio do ciclo fechar');
    console.log('ok - a conferencia pergunta, decide no medidor, entrega e espera o relatorio');
}

// ------------------------------------------- 9. Segredos, com os ???
{
    const { readFileSync, existsSync } = await import('node:fs');
    const caminhoDaSecao = join(raiz, 'components/SegredosSection.tsx');
    assert.ok(existsSync(caminhoDaSecao), 'a secao Segredos nao existe');
    const secao = readFileSync(caminhoDaSecao, 'utf8');
    assert.match(secao, /lerDescobertas\(/, 'Segredos le as descobertas de outro lugar');
    assert.match(secao, /'\?\?\?'/, 'a regra nao descoberta precisa aparecer como ???');
    assert.doesNotMatch(secao, /regra\.condicao/, 'Segredos nao pode dar dica da condicao');
    const temporada = readFileSync(join(raiz, 'views/SeasonView.tsx'), 'utf8');
    const semTemporada = temporada.indexOf('{!activeSeason && (');
    assert.ok(semTemporada > 0 && temporada.indexOf('<SegredosSection />') > semTemporada,
        'Segredos tem de aparecer com ou sem temporada ativa');
    console.log('ok - Segredos mostra o que achou e esconde o resto como ???');
}

console.log('Medidor de segredos: as regras decidem aqui, o banco so conta.');
