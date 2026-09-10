import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * O BOTAO PRIMARIO PRECISA SER LEGIVEL EM TODAS AS SKINS.
 *
 * O botao de recompensa deixou de ocupar a faixa inteira e passou a ter a
 * largura da palavra. Parecia uma mudanca so de composicao, e nao era: o fundo
 * dele e um GRADIENTE com paradas escuras nas pontas e a cor viva no meio.
 * Encurtar o botao aproxima as letras das pontas das paradas escuras, porque o
 * texto passa a ocupar uma fatia maior do gradiente.
 *
 * Na skin GOLD, que e a padrao, isso derrubou o contraste do texto de 6.11 para
 * 4.43 — abaixo do minimo de 4.5. Ninguem teria visto: o botao continua bonito,
 * so fica um pouco mais dificil de ler, e so em algumas skins.
 *
 * Este teste faz a conta que ninguem faz de olho: para cada skin declarada no
 * index.html, interpola o gradiente do botao ao longo da faixa que as letras
 * ocupam e cobra o minimo da WCAG.
 *
 * CYBER e NEBULOSA chegaram a entrar aqui como divida, porque ja liam mal ANTES
 * desta mudanca: os gradientes delas terminavam num tom muito claro, bem debaixo
 * do texto branco. O conserto foi de composicao, nao de paleta — as mesmas cores,
 * com o tom vivo nas pontas e o escuro no centro, que e o desenho que VOID e
 * GENESIS sempre tiveram. Por isso nao ha excecao nenhuma nesta lista: toda skin
 * responde pelo mesmo minimo.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

const MINIMO = 4.5;
/** "PROSSEGUIR" a 10px com tracking .3em — a palavra mais longa dos botoes. */
const LARGURA_DO_TEXTO = 92;

const rgb = (hexa) => {
    let h = hexa.replace('#', '');
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const luminancia = ([r, g, b]) => {
    const canal = (v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};

const contraste = (a, b) => {
    const la = luminancia(a);
    const lb = luminancia(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** As paradas do gradiente, com posicao explicita quando o CSS a declara. */
const paradas = (gradiente) => {
    const achados = [...gradiente.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\s*(\d+)?%?/g)];
    return achados
        .map(([, hexa, pos], i) => ({
            pos: pos !== undefined ? Number(pos) / 100 : i / Math.max(1, achados.length - 1),
            cor: rgb(hexa),
        }))
        .sort((a, b) => a.pos - b.pos);
};

/** A cor do gradiente na posicao t, interpolada como o navegador faz. */
const corEm = (ps, t) => {
    if (t <= ps[0].pos) return ps[0].cor;
    if (t >= ps[ps.length - 1].pos) return ps[ps.length - 1].cor;
    for (let i = 0; i < ps.length - 1; i += 1) {
        const a = ps[i];
        const b = ps[i + 1];
        if (t >= a.pos && t <= b.pos) {
            const f = b.pos === a.pos ? 0 : (t - a.pos) / (b.pos - a.pos);
            return a.cor.map((c, k) => Math.round(c + (b.cor[k] - c) * f));
        }
    }
    return ps[ps.length - 1].cor;
};

/** A largura do botao, lida da classe que o componente aplica. */
const larguraDoBotao = () => {
    const fonte = fs.readFileSync(path.join(raiz, 'components', 'AchievementModal.tsx'), 'utf8');
    const classe = (fonte.match(/primaryButtonClass = '([^']+)'/) || [])[1];
    assert.ok(classe, 'não achei primaryButtonClass — o teste precisa ser ajustado');
    const rem = classe.match(/min-w-\[([\d.]+)rem\]/);
    assert.ok(rem, 'o botão primário perdeu a largura mínima declarada');
    return Number(rem[1]) * 16;
};

/** As skins declaradas, com o gradiente do botao e a cor do texto. */
const skins = () => {
    const padraoGold = indexHtml.match(/--metal-gold:\s*([^;]+);/)[1];
    const mapa = new Map();
    for (const [, nome, corpo] of indexHtml.matchAll(/\[data-skin="([A-Z0-9_]+)"\][^{]*\{([^}]*)\}/g)) {
        const atual = mapa.get(nome) || { gold: null, texto: null };
        const gold = corpo.match(/--metal-gold:\s*([^;]+);/);
        const texto = corpo.match(/--luxe-button-text-color:\s*([^;!]+)/);
        if (gold) atual.gold = gold[1].trim();
        if (texto) atual.texto = texto[1].trim();
        mapa.set(nome, atual);
    }
    return [...mapa.entries()]
        .map(([nome, d]) => ({ nome, gold: d.gold || padraoGold, texto: (d.texto || '#1b1408').trim() }))
        .filter((s) => paradas(s.gold).length > 0);
};

/** O pior contraste que uma letra encontra ao longo do botao. */
const piorSobOTexto = (skin, largura) => {
    const ps = paradas(skin.gold);
    const cor = rgb(skin.texto);
    const inicio = (largura - LARGURA_DO_TEXTO) / 2 / largura;
    const fim = 1 - inicio;
    let pior = Infinity;
    for (let k = 0; k <= 40; k += 1) {
        const t = inicio + ((fim - inicio) * k) / 40;
        pior = Math.min(pior, contraste(cor, corEm(ps, t)));
    }
    return pior;
};

const largura = larguraDoBotao();
const lista = skins();

assert.ok(lista.length >= 8, `esperava as skins do index.html, achei ${lista.length}`);

let falhas = 0;
for (const skin of lista) {
    const valor = piorSobOTexto(skin, largura);
    if (valor + 0.005 < MINIMO) {
        falhas += 1;
        console.log(`nao ok - ${skin.nome}: contraste ${valor.toFixed(2)}, mínimo ${MINIMO}`);
    } else {
        console.log(`ok - ${skin.nome}: contraste ${valor.toFixed(2)}`);
    }
}

assert.equal(falhas, 0, 'o botão primário ficou ilegível em alguma skin');

/**
 * A FAIXA DE LUZ PRECISA APARECER EM QUALQUER SKIN.
 *
 * Ela era so branca, e sumia justamente nas skins de botao claro. Um lado claro
 * e um escuro garantem que sempre haja um dos dois visivel.
 */
const css = fs.readFileSync(path.join(raiz, 'index.css'), 'utf8');
const faixa = css.match(/\.luxe-brilho::after\s*\{[^}]*\}/);
assert.ok(faixa, 'a classe .luxe-brilho::after sumiu do index.css');
assert.match(faixa[0], /rgba\(255,\s*255,\s*255/, 'a faixa perdeu o lado claro');
assert.match(faixa[0], /rgba\(0,\s*0,\s*0/, 'a faixa perdeu o lado escuro — some nas skins de botão claro');
assert.match(faixa[0], /animation:\s*luxe-brilho-passa/, 'a faixa deixou de correr sozinha');
assert.doesNotMatch(css, /group-hover:translate-x-full/, 'o brilho voltou a depender do mouse');

console.log(`\n${lista.length} skins conferidas · botão de ${largura}px · mínimo ${MINIMO}`);
