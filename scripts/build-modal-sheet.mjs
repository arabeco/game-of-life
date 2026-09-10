import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

/**
 * OS MODAIS — a folha das telas de recompensa.
 *
 * Esta e a folha que mais corre risco de mentir, e por isso a que mais precisa
 * de disciplina. A tentacao e redesenhar os modais em HTML puro; foi o que a
 * folha das quatro direcoes fez, com conteudo inventado — e o desenho quebrou
 * justamente nos casos que ela nao mostrava (resgate com quatro metricas, item
 * com nome de duas linhas).
 *
 * Aqui nao ha redesenho. A folha:
 *
 *   1. CHAMA os construtores de payload de verdade e mostra o que cada
 *      acontecimento produz — as metricas, os itens, os textos que a pessoa le;
 *   2. desenha as placas com o CSS exportado por `constants/rewardPlateStyles`,
 *      o mesmo objeto que o componente aplica;
 *   3. le as medidas da direcao B direto do `RewardPackBody`.
 *
 * O que ela NAO faz: fingir que e o componente. Para ver o componente rodando,
 * `npm run bancada`.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// A folha principal continua sendo a prova VISUAL aprovada. O relatório
// automático de payloads é útil, mas não pode ocupar o lugar dela: uma grade
// de campos como "gatilho" e "moldura" documenta engenharia, não mostra o
// modal que a pessoa verá.
const saida = path.join(raiz, 'docs', 'os-modais-dados.html');
const saidaVisual = path.join(raiz, 'docs', 'os-modais.html');
const referenciaVisual = path.join(raiz, 'docs', 'drafts', 'reward-season-modals-proof-1-6.html');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { getRewardEmblemUrl, getRewardToneRgb } = await empacota('constants/rewardEmblems.ts', 'modais-emblemas.mjs');
const { DIRECOES } = await empacota('constants/rewardPlateStyles.ts', 'modais-direcoes.mjs');
const { buildAchievementRewardPayload } = await empacota('utils/achievementRewardPayload.ts', 'modais-feito.mjs');
const { buildRedeemRewardPayload } = await empacota('utils/redeemRewardPresentation.ts', 'modais-resgate.mjs');
const { buildCycleRewardPayload } = await empacota('utils/chestRewardPresentation.ts', 'modais-ciclo.mjs');
const { resolveItemDef } = await empacota('constants/items.ts', 'modais-items.mjs');
const { getRarityVisual } = await empacota('constants/rarityVisuals.ts', 'modais-rarity.mjs');

const arte = (url) => String(url || '').replace(/^\/assets\//, '../public/assets/');
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * AS CONSTANTES DO GRAFICO, lidas do componente que o desenha.
 *
 * O pentagono da prova era SVG escrito a mao, e saiu errado: o vertice de
 * Relacoes, que vale 8 de 20, ficava quase na borda. Agora ele e calculado com
 * a mesma conta do SvgRadarChart, com os mesmos numeros — se o raio mudar la, a
 * prova muda junto na proxima geracao.
 */
const constantesDoGrafico = () => {
    const radar = fs.readFileSync(path.join(raiz, 'components', 'SvgRadarChart.tsx'), 'utf8');
    const pent = fs.readFileSync(path.join(raiz, 'components', 'AssetPentagon.tsx'), 'utf8');
    const num = (fonte, re, nome) => {
        const m = fonte.match(re);
        if (!m) throw new Error(`não achei ${nome} — o gerador da prova visual precisa ser ajustado`);
        return Number(m[1]);
    };
    return {
        centro: num(radar, /const CENTER = ([\d.]+)/, 'CENTER'),
        raio: num(radar, /const RADIUS = ([\d.]+)/, 'RADIUS'),
        aneis: num(pent, /levels=\{(\d+)\}/, 'levels'),
        recuoDoNome: num(pent, /labelOffset=\{destacarPontas \? ([\d.]+)/, 'labelOffset'),
        recuoDoValor: num(pent, /valueLabelOffset: destacarPontas \? ([\d.]+)/, 'valueLabelOffset'),
        corpoDoValor: num(pent, /valueLabelSize: destacarPontas \? ([\d.]+)/, 'valueLabelSize'),
        pontoDoVertice: num(pent, /dotRadius: destacarPontas \? ([\d.]+)/, 'dotRadius'),
        nomeTamanho: num(pent, /labelSize=\{([\d.]+)\}/, 'labelSize'),
    };
};

/** O pentagono da prova, com a geometria do componente e um exemplo fixo. */
const pentagonoDaProva = () => {
    const c = constantesDoGrafico();
    const maximo = Number(telaDaMaestria().degrau) * 10;
    const areas = [
        ['PROPÓSITO', 14], ['RELAÇÕES', 8], ['TRABALHO', 16], ['LAZER', 10], ['SAÚDE', 12],
    ];
    const indice = areas.reduce((soma, [, v]) => soma + v, 0);
    const ponto = (i, magnitude) => {
        const ang = ((Math.PI * 2) / areas.length) * i - Math.PI / 2;
        return { x: c.centro + Math.cos(ang) * magnitude, y: c.centro + Math.sin(ang) * magnitude, ang };
    };
    const n = (v) => String(Number(v.toFixed(2)));
    const partes = [];

    for (let nivel = 1; nivel <= c.aneis; nivel += 1) {
        const m = (c.raio * nivel) / c.aneis;
        const pts = areas.map((_, i) => `${n(ponto(i, m).x)},${n(ponto(i, m).y)}`).join(' ');
        partes.push(`<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width=".35"/>`);
    }
    areas.forEach((_, i) => {
        const q = ponto(i, c.raio);
        partes.push(`<line x1="${c.centro}" y1="${c.centro}" x2="${n(q.x)}" y2="${n(q.y)}" stroke="rgba(255,255,255,0.08)" stroke-width=".35"/>`);
    });

    const vertices = areas.map(([, v], i) => ponto(i, (c.raio * v) / maximo));
    partes.push(`<polygon points="${vertices.map((q) => `${n(q.x)},${n(q.y)}`).join(' ')}" fill="#6f5d2f" fill-opacity=".28" stroke="#d6c38e" stroke-width="1.35" stroke-linejoin="round"/>`);
    vertices.forEach((q) => partes.push(`<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${c.pontoDoVertice}" fill="#11110f" stroke="#d6c38e" stroke-width=".55"/>`));

    areas.forEach(([, v], i) => {
        const q = ponto(i, (c.raio * v) / maximo + c.recuoDoValor);
        const r = c.corpoDoValor * (0.62 + 0.2 * String(v).length);
        partes.push(`<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(r)}" fill="#11110f" fill-opacity=".92" stroke="#d6c38e" stroke-width=".5"/>`);
        partes.push(`<text x="${n(q.x)}" y="${n(q.y + c.corpoDoValor * 0.35)}" text-anchor="middle" fill="#fff6dd" font-size="${c.corpoDoValor}" font-weight="900">${v}</text>`);
    });

    partes.push(`<circle cx="${c.centro}" cy="${c.centro}" r="10.3" fill="#0b0c0d" fill-opacity=".38" stroke="#8d7951" stroke-width=".7"/>`);
    partes.push(`<text x="${c.centro}" y="${c.centro + 4.4}" text-anchor="middle" fill="#d6c38e" font-size="11" font-weight="900">${indice}</text>`);

    areas.forEach(([nome], i) => {
        const q = ponto(i, c.raio + c.recuoDoNome);
        const cos = Math.cos(q.ang);
        const sin = Math.sin(q.ang);
        const anchor = cos > 0.22 ? 'start' : cos < -0.22 ? 'end' : 'middle';
        const dy = sin > 0.4 ? 6 : sin < -0.4 ? -4 : 3;
        partes.push(`<text x="${n(q.x)}" y="${n(q.y + dy)}" text-anchor="${anchor}" fill="rgba(235,229,213,0.58)" font-size="${c.nomeTamanho}" font-weight="700" letter-spacing=".3">${nome}</text>`);
    });

    return `<svg viewBox="0 0 100 100" class="pent" aria-hidden="true">${partes.join('')}</svg>`;
};

/**
 * O rodape da prova, com a medida do botao de verdade.
 *
 * `min-w-[10.5rem] px-10` do Tailwind vira 168px de largura minima e 40px de
 * respiro. Converter aqui e o que impede a prova de mostrar um botao com outra
 * largura no dia em que a classe mudar.
 */
const medidaDoBotaoEmPixels = () => {
    const classe = larguraDoBotao() || '';
    const rem = classe.match(/min-w-\[([\d.]+)rem\]/);
    const px = classe.match(/px-(\d+)/);
    if (!rem || !px) throw new Error('não consegui ler a largura do botão primário');
    return { largura: Math.round(Number(rem[1]) * 16), respiro: Number(px[1]) * 4 };
};

/**
 * A tela que fecha a avaliacao de maestria.
 *
 * Ela NAO e um dos seis acontecimentos: nao tem gatilho de recompensa, nao
 * passa pelo RewardPackBody e nao entrega item nenhum. Entra nesta folha porque
 * usa a MESMA placa — e quem for mexer na direcao B precisa saber que mexe aqui
 * tambem.
 */
const telaDaMaestria = () => {
    const fonte = fs.readFileSync(path.join(raiz, 'components', 'MasteryResultModal.tsx'), 'utf8');
    const areas = fs.readFileSync(path.join(raiz, 'constants', 'lifeAreas.ts'), 'utf8');
    const tom = fonte.match(/TOM_DA_MAESTRIA = '([^']+)'/);
    const pentagono = fonte.match(/<AssetPentagon assets=\{assets\} size="([^"]+)"/);
    const degrau = areas.match(/PONTOS_POR_DEGRAU = (\d+)/);
    const maximo = areas.match(/MASTERY_AREA_MAX_LEVEL = (\d+)/);
    return {
        tom: tom ? tom[1] : null,
        pentagono: pentagono ? pentagono[1] : null,
        escala: degrau && maximo ? `0 a ${Number(degrau[1]) * Number(maximo[1])}` : null,
        degrau: degrau ? degrau[1] : null,
    };
};

/** A largura do botao primario, lida do AchievementModal. */
const larguraDoBotao = () => {
    const fonte = fs.readFileSync(path.join(raiz, 'components', 'AchievementModal.tsx'), 'utf8');
    const classe = (fonte.match(/primaryButtonClass = '([^']+)'/) || [])[1] || '';
    // So as duas medidas que importam: o resto da classe e layout, e listar
    // items-center / justify-center / gap-3 no meio esconde o que a linha diz.
    const largura = classe.match(/min-w-\[[^\]]+\]/);
    const respiro = classe.match(/px-\d+/);
    return largura && respiro ? largura[0] + ' ' + respiro[0] : null;
};

/** Quantas vezes a faixa de luz passa, e quando. Lido do index.css. */
const brilhoDoBotao = () => {
    const fonte = fs.readFileSync(path.join(raiz, 'index.css'), 'utf8');
    const m = fonte.match(/animation: luxe-brilho-passa ([\d.]+)s [^ ]+ ([\d.]+)s (\d+)/);
    return m ? `${m[3]}x · ${m[1]}s cada, ${m[2]}s depois de abrir` : 'não encontrado';
};

/**
 * As medidas da placa, lidas do componente.
 *
 * Varias sao CONDICIONAIS: o quadrado da metrica encolhe quando sao quatro ou
 * mais, o item cresce quando e um so, o titulo diminui quando e longo. Mostrar
 * so o valor padrao esconderia justamente a regra — e era no caso de quatro
 * metricas que o desenho quebrava antes.
 */
const medidasDoMiolo = () => {
    const fonte = fs.readFileSync(path.join(raiz, 'components', 'RewardPackBody.tsx'), 'utf8');
    const pega = (re) => {
        const m = fonte.match(re);
        return m ? m.slice(1) : null;
    };
    const linhas = [
        { rotulo: 'Suporte do emblema', v: pega(/mb-\[14px\] grid h-\[(\d+)px\]/) },
        { rotulo: 'PNG do emblema', v: pega(/className="h-\[(\d+)px\] w-\d+/) || pega(/src=\{emblema\}[^]*?h-\[(\d+)px\]/) },
        { rotulo: 'Título', v: pega(/tituloLongo \? 'text-\[(\d+)px\][^]*?: 'text-\[(\d+)px\]/), inverso: true,
          quando: 'título com mais de 25 caracteres' },
        { rotulo: 'Quadrado da métrica', v: pega(/quatroOuMaisMetricas \? 'h-\[(\d+)px\][^]*?: 'h-\[(\d+)px\]/), inverso: true,
          quando: 'quatro ou mais métricas' },
        { rotulo: 'Nicho do símbolo', v: pega(/quatroOuMaisMetricas \? 'mb-\[\d+px\] h-\[(\d+)px\][^]*?: 'mb-\[\d+px\] h-\[(\d+)px\]/), inverso: true,
          quando: 'quatro ou mais métricas' },
        { rotulo: 'Linha do item', v: pega(/itemUnico \? 'h-\[(\d+)px\][^]*?: 'h-\[(\d+)px\]/), inverso: true,
          quando: 'um item só' },
        // O `place-items-center` ancora a linha da ARTE e nao a da caixa: as duas
        // comecam com `itemUnico ? 'h-[`, e sem a ancora o regex casava com a
        // primeira e a medida saia errada em vez de sair vazia.
        { rotulo: 'Arte do item', v: pega(/place-items-center overflow-hidden \$\{itemUnico \? 'h-\[(\d+)px\][^]*?: 'h-\[(\d+)px\]/), inverso: true,
          quando: 'um item só' },
        { rotulo: 'Destaque do baú', v: pega(/grid min-h-\[(\d+)px\] place-items-center/) },
        { rotulo: 'PNG em destaque', v: pega(/featuredRewardItem\.itemDef\.name\}[^]*?h-\[(\d+)px\]/) },
    ];
    return linhas.map((l) => {
        if (!l.v) return { rotulo: l.rotulo, padrao: null, especial: null, quando: l.quando };
        // Quando o codigo escreve `condicao ? especial : padrao`, o primeiro
        // numero capturado e o do CASO ESPECIAL.
        const [a, b] = l.v;
        return l.inverso && b
            ? { rotulo: l.rotulo, padrao: b, especial: a, quando: l.quando }
            : { rotulo: l.rotulo, padrao: a, especial: null, quando: l.quando };
    });
};

/**
 * Os seis acontecimentos, cada um montado pelo construtor REAL. Se um
 * construtor mudar o que entrega, esta folha muda junto na proxima geracao.
 */
const ACONTECIMENTOS = [
    {
        nome: 'Resgate de código',
        tipo: 'geral',
        gatilho: 'views/SettingsView.tsx · handleRedeemCode',
        moldura: 'RewardPackModal',
        payload: buildRedeemRewardPayload({
            success: true, code: 'VANGUARDA25', title: 'Vanguarda 25',
            description: 'Seu código foi aceito. Tudo já entrou na conta.',
            wallet: { gold: 500, fragments: 60 }, premiumDaysGranted: 30,
            chestType: 'Raro', chestCount: 1, itemIds: ['item_border_t1_aprendiz'],
        }),
    },
    {
        nome: 'Missão concluída',
        tipo: 'missao',
        gatilho: 'contexts/GameContext.tsx · grantMissionReward',
        moldura: 'AchievementModal (com vídeo)',
        payload: {
            ...buildAchievementRewardPayload(
                'Missão concluída!', 'A recompensa desta missão já entrou.', '',
                { exp: 150, gold: 120, items: ['insignia_quest_incomum'] }),
            subtitle: 'Cinco dias em movimento',
        },
    },
    {
        nome: 'Ciclo fechado',
        tipo: 'ciclo',
        gatilho: 'views/ReportsView.tsx · fecho do relatório',
        moldura: 'RewardPackModal',
        payload: buildCycleRewardPayload({
            exp: 3240, fragments: 60, insigniaIds: ['insignia_report_comum'],
            chestType: 'Raro', cycleName: 'Reconstrução',
        }),
    },
    {
        nome: 'Quest de temporada',
        tipo: 'temporada',
        gatilho: 'contexts/GameContext.tsx · claimSeasonQuest',
        moldura: 'AchievementModal (com vídeo)',
        payload: {
            ...buildAchievementRewardPayload(
                'Missão concluída!', 'A recompensa desta missão já entrou.', '',
                { exp: 500, items: ['insignia_quest_master'] }),
            subtitle: 'Caminho da Aurora',
        },
    },
    {
        nome: 'Conquista Genesis',
        tipo: 'genesis',
        gatilho: 'contexts/GameContext.tsx · claimSeasonMission (selo)',
        moldura: 'AchievementModal · fundo vertical da temporada',
        payload: {
            ...buildAchievementRewardPayload(
                'Temporada concluída!', 'Marca de quem esteve antes da Primeira Era começar.', '',
                { exp: 1000, items: ['insignia_season_genesis', 'GENESIS', 'insignia_quest_master'] }),
            subtitle: 'Genesis',
        },
    },
    {
        nome: 'Subida de patente',
        tipo: 'patente',
        patente: 'Escudeiro',
        gatilho: 'contexts/GameContext.tsx · observador de patente',
        moldura: 'AchievementModal (com vídeo)',
        payload: {
            ...buildAchievementRewardPayload(
                'Nova patente!', 'Sua patente subiu e o conjunto inteiro entrou no Arsenal.', '',
                { exp: 1200, items: ['CYBER', 'item_skin_1_004', 'item_skin_1_006',
                    'item_border_t1_aprendiz', 'insignia_rank_2_escudeiro', 'item_banner_t1_aprendiz'] }),
            subtitle: 'Escudeiro',
        },
    },
];

const estiloEmTexto = (obj) => Object.entries(obj)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}: ${v}`).join('; ');

const cartaoDoAcontecimento = (evento) => {
    const emblema = getRewardEmblemUrl(evento.tipo, evento.patente);
    const tom = getRewardToneRgb(evento.tipo, evento.patente);
    const p = evento.payload;

    const metricas = (p.metricCards || []).map((card) => `
      <div class="metrica">
        ${card.simbolo
          ? `<span class="nicho"><img src="${esc(arte('/assets/icons/' + card.simbolo + '.png'))}" alt=""></span>`
          : '<span class="nicho vazio">—</span>'}
        <b>${esc(card.value)}</b>
        <span>${esc(card.label)}</span>
      </div>`).join('');

    const itens = (p.itemIds || []).map((id) => {
        const def = resolveItemDef(id);
        if (!def) return `<div class="item falta">${esc(id)} — não existe no catálogo</div>`;
        const r = getRarityVisual(def.rarity);
        return `<div class="item">
          <div class="arte" style="--c:${r.hex}">
            ${def.imageUrl ? `<img src="${esc(arte(def.imageUrl))}" alt="" loading="lazy">` : `<span>${esc(def.icon || '?')}</span>`}
          </div>
          <div><span class="nome">${esc(def.name)}</span><span class="rar" style="color:${r.hex}">${esc(r.label)}</span></div>
        </div>`;
    }).join('');

    const faixa = (p.rewardHighlights || []).map((h) => `
      <div class="faixa" style="--c:rgb(${h.rarityRgb || tom})">
        <span class="rot">${esc(h.label)}</span>
        <b>${esc(h.value)}</b>
        ${h.detail ? `<span class="det">${esc(h.detail)}</span>` : ''}
      </div>`).join('');

    return `<article class="evento">
      <header>
        <img class="emblema" src="${esc(arte(emblema))}" alt="">
        <div>
          <h3>${esc(evento.nome)}</h3>
          <span class="tom" style="--c:rgb(${tom})">tom ${esc(tom)}</span>
        </div>
      </header>
      <dl>
        <dt>gatilho</dt><dd>${esc(evento.gatilho)}</dd>
        <dt>moldura</dt><dd>${esc(evento.moldura)}</dd>
        <dt>sobrancelha</dt><dd>${esc(p.eyebrow || '—')}</dd>
        <dt>título</dt><dd>${esc(p.title || '—')}</dd>
        <dt>resumo</dt><dd>${esc(p.summary || '—')}</dd>
        <dt>botão</dt><dd>${esc(p.buttonLabel || '—')}</dd>
      </dl>
      ${metricas ? `<div class="metricas">${metricas}</div>` : ''}
      ${faixa}
      ${itens ? `<div class="secao">${esc(p.itemSectionTitle || 'Itens recebidos')}</div><div class="itens">${itens}</div>` : ''}
    </article>`;
};

const cartaoDaDirecao = ([letra, dir]) => {
    const rgb = '184,146,82';
    return `<figure class="direcao">
      <div class="placa" style="${esc(estiloEmTexto(dir.placa(rgb)))}">
        <div class="crest" style="${esc(estiloEmTexto(dir.crest(rgb)))}"></div>
        <div class="linhas"><span></span><span></span><span></span></div>
        <div class="botao" style="${esc(estiloEmTexto(dir.botao))}"></div>
      </div>
      <figcaption>${esc(dir.nome)}${letra === 'B' ? ' <b>· aprovada</b>' : ''}</figcaption>
    </figure>`;
};

const commit = (() => {
    try { return execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); }
    catch { return 'sem git'; }
})();
const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Os Modais — Glyph</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 24px 80px; background:#0e1013; color:#e7e9ec;
         font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; }
  h1 { font-size:26px; margin:0 0 6px; }
  h2 { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#8b929c;
       margin:36px 0 12px; border-bottom:1px solid #23262c; padding-bottom:7px; }
  p.lead { color:#969ca6; max-width:72ch; margin:0 0 14px; }
  .carimbo { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 8px; }
  .carimbo span { font:11px/1 ui-monospace,monospace; color:#8b929c; border:1px solid #2a2e35;
                  border-radius:5px; padding:6px 9px; background:#14171b; }
  .nota { margin-top:12px; padding:11px 13px; border-left:2px solid #d8b44c; background:#14171b;
          color:#969ca6; font-size:13.5px; }
  .nota strong { color:#e7e9ec; }
  .eventos { display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:16px; }
  .evento { border:1px solid #23262c; border-radius:10px; background:#111417; padding:14px; }
  .evento header { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
  .emblema { width:52px; height:52px; object-fit:contain; }
  .evento h3 { margin:0; font-size:15px; }
  .tom { display:inline-block; margin-top:4px; font:9px ui-monospace,monospace; letter-spacing:.08em;
         color:var(--c); border:1px solid color-mix(in srgb, var(--c) 45%, transparent);
         border-radius:3px; padding:2px 6px; }
  dl { display:grid; grid-template-columns:78px minmax(0,1fr); gap:4px 10px; margin:0 0 12px; }
  dt { font:9px ui-monospace,monospace; letter-spacing:.1em; text-transform:uppercase; color:#6e747c; }
  dd { margin:0; font-size:12px; color:#c9cdd3; overflow-wrap:anywhere; }
  .metricas { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
  .metrica { width:84px; border:1px solid #3b3934; background:#0d0e11; padding:8px 4px;
             text-align:center; }
  .nicho { display:grid; place-items:center; width:28px; height:28px; margin:0 auto 5px;
           border:1px solid #3a3e47; background:#07090c; }
  .nicho.vazio { color:#4d535b; font-size:11px; }
  .nicho img { width:19px; height:19px; }
  .metrica b { display:block; font-size:14px; }
  .metrica span { display:block; margin-top:4px; font:7px ui-monospace,monospace; letter-spacing:.1em;
                  text-transform:uppercase; color:#858a93; }
  .faixa { border:1px solid color-mix(in srgb, var(--c) 32%, transparent);
           background:color-mix(in srgb, var(--c) 9%, transparent); padding:9px 11px; margin-bottom:10px; }
  .faixa .rot { font:8px ui-monospace,monospace; letter-spacing:.14em; text-transform:uppercase; color:var(--c); }
  .faixa b { display:block; margin-top:3px; font-size:13px; }
  .faixa .det { display:block; margin-top:3px; font-size:10.5px; color:#8b929c; }
  .secao { font:9px ui-monospace,monospace; letter-spacing:.2em; text-transform:uppercase;
           color:#aaadb4; margin:12px 0 7px; }
  .itens { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .item { display:grid; grid-template-columns:38px minmax(0,1fr); gap:8px; align-items:center;
          border-bottom:1px solid #302f2c; background:rgba(18,18,19,.78); padding:6px; }
  .item .arte { width:38px; height:38px; display:grid; place-items:center; overflow:hidden;
                border:1px solid color-mix(in srgb, var(--c) 48%, transparent);
                background:radial-gradient(circle at 34% 27%, color-mix(in srgb, var(--c) 22%, transparent), #07090b 82%); }
  .item .arte img { width:100%; height:100%; object-fit:contain; padding:3px; }
  .item .nome { display:block; font-size:10px; line-height:1.15; }
  .item .rar { display:block; margin-top:3px; font:7px ui-monospace,monospace; letter-spacing:.12em;
               text-transform:uppercase; }
  .item.falta { grid-column:1/-1; color:#e9a268; font-size:11px; }
  .direcoes { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; }
  .direcao { margin:0; }
  .placa { height:190px; padding:16px; display:flex; flex-direction:column; align-items:center; }
  .crest { width:44px; height:44px; flex:none; }
  .linhas { flex:1; width:100%; display:flex; flex-direction:column; justify-content:center; gap:7px; }
  .linhas span { height:7px; background:rgba(255,255,255,.09); }
  .linhas span:nth-child(2) { width:70%; }
  .linhas span:nth-child(3) { width:45%; }
  .botao { height:26px; width:100%; flex:none;
           background-image:linear-gradient(180deg,rgba(255,255,255,.35) 0%,rgba(255,255,255,0) 38%),
                            linear-gradient(135deg,#5c4a1f 0%,#d4af37 50%,#5c4a1f 100%);
           border:1px solid #ffd700; }
  .direcao figcaption { margin-top:8px; font:11px ui-monospace,monospace; color:#8b929c; }
  .direcao b { color:#7fd8a4; }
  table { border-collapse:collapse; width:100%; font-size:13.5px; }
  th,td { text-align:left; padding:8px 12px 8px 0; border-bottom:1px solid #23262c; }
  th { font:10px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; color:#7c828c; }
  td.n { font-variant-numeric:tabular-nums; }
  footer { margin-top:52px; padding-top:16px; border-top:1px solid #23262c; color:#6e747c; font-size:12.5px; }
</style></head><body><div class="wrap">

<h1>Os Modais</h1>
<p class="lead">Não são seis modais: é <strong>uma placa</strong> com seis emblemas e seis conteúdos.
Esta folha não redesenha nada — ela <strong>chama os construtores de payload de verdade</strong> e
mostra o que cada acontecimento produz. Se um construtor mudar, a folha muda junto.</p>

<div class="carimbo">
  <span>gerada ${esc(agora)}</span>
  <span>commit ${esc(commit)}</span>
  <span>miolo: components/RewardPackBody.tsx</span>
</div>

<div class="nota"><strong>Para ver o componente rodando, e não a descrição dele:</strong>
<code>npm run bancada</code> abre a bancada em localhost:3010 com os modais reais, com os mesmos
dados. Esta folha é o registro; a bancada é a prova.</div>

<h2>Os seis acontecimentos</h2>
<div class="eventos">${ACONTECIMENTOS.map(cartaoDoAcontecimento).join('')}</div>

<h2>As quatro direções da placa</h2>
<p class="lead">Desenhadas com o CSS exportado por <code>constants/rewardPlateStyles.ts</code> — o
mesmo objeto que o componente aplica, não uma imitação.</p>
<div class="direcoes">${Object.entries(DIRECOES).map(cartaoDaDirecao).join('')}</div>

<h2>A sétima tela: nível novo marcado</h2>
<p class="nota">
  Fecha a avaliação de maestria. <b>Não é um acontecimento de recompensa</b> — não
  tem gatilho de prêmio, não passa pelo <code>RewardPackBody</code> e não entrega
  item nenhum. Está aqui porque usa a <b>mesma placa</b>: quem mexer na direção B
  mexe nela também.
</p>
<p class="nota">
  E não é modal de conquista de propósito. O número da maestria é
  <b>auto-declarado</b> — a pessoa escreveu o próprio nível no questionário.
  Comemorar isso com vídeo, confete e prêmio gastaria a moeda da comemoração em
  algo que não custou nada, e emprestaria ao número um crédito que ele não tem.
  Por isso não há medalha: medalha é a gramática do que foi conquistado. O
  pentágono já é a forma destes dados.
</p>
<table>
  <thead><tr><th>Peça</th><th>Como é hoje</th><th>Por quê</th></tr></thead>
  <tbody>
    <tr>
      <td>Placa</td>
      <td class="n">direção B, igual às outras</td>
      <td>Um card genérico no meio de um app com gramática visual própria lê como tela de sistema, e não como um momento.</td>
    </tr>
    <tr>
      <td>Tom</td>
      <td class="n">rgb(${esc(telaDaMaestria().tom || '—')})</td>
      <td>Azul-guia — o mesmo que o Oráculo reserva para o que não é vitória nem cobrança. Os outros tons ali significam raridade, e maestria não é raridade nenhuma: o número pode ter caído.</td>
    </tr>
    <tr>
      <td>Pentágono</td>
      <td class="n">${esc(telaDaMaestria().pentagono || '—')}</td>
      <td>Vértices em destaque: a pessoa acabou de escolher os cinco, um a um. O <code>svh</code> amarra o tamanho ao da placa, que encolhe em aparelho baixo — altura fixa vazaria pelo recorte e seria cortada sem avisar.</td>
    </tr>
    <tr>
      <td>Escala</td>
      <td class="n">${esc(telaDaMaestria().escala || '—')} · ${esc(telaDaMaestria().degrau || '?')} pontos por degrau</td>
      <td>A avaliação continua tendo dez degraus; o gráfico mostra de 0 a 20 para as cinco pontas somarem exatamente os 100 do Índice no centro, sem a pessoa ter de fazer a conta.</td>
    </tr>
    <tr>
      <td>Primeira vez</td>
      <td class="n">só o presente</td>
      <td>Não há com o que comparar. A tela diz &ldquo;é assim que você se vê hoje&rdquo; e avisa que na próxima ela vira comparação — que é o motivo de refazer.</td>
    </tr>
    <tr>
      <td>Da segunda em diante</td>
      <td class="n">&ldquo;há 3 meses você se via em 52. Hoje, 60 (+8)&rdquo;</td>
      <td>O único fato que o app tem sobre essa pessoa e que ela não vê em lugar nenhum. Vale nos dois sentidos: se caiu, também é verdade, e aparece sem julgamento — espelho que só mostra melhora é propaganda.</td>
    </tr>
    <tr>
      <td>O que mudou</td>
      <td class="n">só as áreas com diferença</td>
      <td>Listar as cinco com &ldquo;0&rdquo; ao lado de três delas transforma a informação em tabela. O título olha as áreas e não só o Índice: subir dois numa e cair dois noutra dá o mesmo número no centro, e ainda assim mudou.</td>
    </tr>
    <tr>
      <td>Retrato</td>
      <td class="n">tabela <code>mastery_snapshots</code></td>
      <td>Uma linha por avaliação, sem update — <code>asset_levels</code> grava só o valor atual, então cada avaliação apagava a anterior e não havia com o que comparar.</td>
    </tr>
  </tbody>
</table>

<h2>O rodapé: um botão só</h2>
<p class="nota">
  A saída era <b>duas barras douradas de faixa inteira, empilhadas</b> — Compartilhar
  por cima, Prosseguir por baixo, mesma cor e mesmo peso. Quem chegava na placa
  tinha de ler para saber qual era a saída, e o compartilhar aparecia primeiro,
  que é o inverso da importância.
</p>
<table>
  <thead><tr><th>Peça</th><th>Como é hoje</th><th>Por quê</th></tr></thead>
  <tbody>
    <tr>
      <td>Botão primário</td>
      <td class="n">${esc(larguraDoBotao() || 'min-w-[10.5rem] px-10')}</td>
      <td>Do tamanho da palavra, centrado na placa. Gradiente da Skin UI equipada, recorte em bico da direção B.</td>
    </tr>
    <tr>
      <td>Compartilhar</td>
      <td class="n">ícone 44×44, <code>absolute right-0</code></td>
      <td>Fora do fluxo, encostado na direita: aparecer ou não deixa de mover o botão que a pessoa já está mirando.</td>
    </tr>
    <tr>
      <td>Brilho</td>
      <td class="n">${esc(brilhoDoBotao())}</td>
      <td>Corria sozinho preso a <code>group-hover</code>. No aparelho não há hover antes do toque, e depois do toque o modal já fechou: o efeito nunca aconteceu para ninguém. Agora atravessa sozinho ao abrir, duas vezes — infinito viraria ruído ao lado do texto.</td>
    </tr>
    <tr>
      <td>Não mostrar novamente</td>
      <td class="n">linha própria, largura total</td>
      <td>Uma só, igual para arena, missão e relatório. Antes o caso de arena tinha layout próprio e um segundo ícone de compartilhar duplicado.</td>
    </tr>
  </tbody>
</table>

<h2>As medidas da direção B</h2>
<p class="lead">Lidas do <code>RewardPackBody.tsx</code>. Vieram da folha aprovada
<code>docs/drafts/reward-modal-4-direcoes.html</code>, bloco <code>.monolith</code>: trocar uma
delas quebra a família.</p>
<table>
  <thead><tr><th>Peça</th><th>Padrão</th><th>Caso especial</th><th>Quando</th></tr></thead>
  <tbody>${medidasDoMiolo().map((m) => `<tr>
    <td>${esc(m.rotulo)}</td>
    <td class="n">${m.padrao ? esc(m.padrao) + ' px' : '<span style="color:#e9a268">não encontrada</span>'}</td>
    <td class="n">${m.especial ? esc(m.especial) + ' px' : '—'}</td>
    <td>${m.quando && m.especial ? esc(m.quando) : '—'}</td>
  </tr>`).join('')}</tbody>
</table>

<h2>As regras que não mudam</h2>
<div class="nota"><strong>O botão é sempre o da Skin UI equipada</strong>, nunca a cor da raridade.
A direção B muda só o recorte — as duas pontas viram bico.</div>
<div class="nota"><strong>O modal não concede nada.</strong> Ele apresenta o que o fluxo já
entregou. Conceder durante a renderização faria a recompensa depender de a tela abrir.</div>
<div class="nota"><strong>A cor do acontecimento é reflexo, não pintura.</strong> A placa continua
grafite; o tom entra forte no topo e some no resto.</div>
<div class="nota"><strong>Baú aberto não tem tela própria.</strong> Item novo e duplicata caem os
dois no modal do item, com arte grande — a duplicata leva uma linha dizendo que virou fragmento.</div>

<footer>
  Gerada por <code>scripts/build-modal-sheet.mjs</code> · <code>npm run folhas</code>.
  Não edite este arquivo à mão: a próxima geração apaga.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
// A referência aprovada mora um nível abaixo de docs/. Ao publicá-la como a
// folha oficial, só os caminhos dos assets precisam subir um nível a menos.
// Assim `npm run folhas` nunca volta a substituir a prova visual pelo relatório
// técnico.
let visual = fs.readFileSync(referenciaVisual, 'utf8')
    .replaceAll('../../public/', '../public/')
    .replaceAll('./profile-card-soberano-v2.html?embed=1', './drafts/profile-card-soberano-v2.html?embed=1');

/**
 * O QUE A PROVA MOSTRA VEM DO CODIGO.
 *
 * O rascunho carrega o desenho aprovado — cores, molduras, composicao. Mas duas
 * coisas nele descrevem o COMPONENTE, e essas o rascunho nao tem como manter:
 * o pentagono e a largura do botao. Ficaram velhas em silencio uma vez, e a
 * folha passou a mostrar um rodape de duas barras que o app ja nao tinha.
 *
 * Aqui elas sao reescritas a cada geracao. E se a ancora sumir, isto ESTOURA em
 * vez de gerar quieto: uma prova errada e pior que uma prova que faltou.
 */
const trocaAncorada = (texto, inicio, fim, conteudo, nome) => {
    const i = texto.indexOf(inicio);
    if (i < 0) throw new Error(`prova visual: não achei a âncora de ${nome}`);
    const j = texto.indexOf(fim, i);
    if (j < 0) throw new Error(`prova visual: âncora de ${nome} não fecha`);
    return texto.slice(0, i) + conteudo + texto.slice(j + fim.length);
};

visual = trocaAncorada(visual, '<svg viewBox="0 0 100 100" class="pent"', '</svg>', pentagonoDaProva(), 'pentágono');

const botao = medidaDoBotaoEmPixels();
visual = trocaAncorada(
    visual,
    'width:max-content;min-width:',
    ';margin-left:auto',
    `width:max-content;min-width:${botao.largura}px;padding:0 ${botao.respiro}px;margin-left:auto`,
    'largura do botão',
);

fs.writeFileSync(saidaVisual, visual, 'utf8');

console.log(`os-modais: ${path.relative(raiz, saidaVisual)} (prova visual · pentágono e botão redesenhados do código)`);
console.log(`os-modais-dados: ${path.relative(raiz, saida)} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`  ${ACONTECIMENTOS.length} acontecimentos · ${Object.keys(DIRECOES).length} direções · ${medidasDoMiolo().filter((m) => m.padrao).length}/${medidasDoMiolo().length} medidas encontradas`);
