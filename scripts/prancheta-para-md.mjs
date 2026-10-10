#!/usr/bin/env node
/**
 * A PRANCHETA EM MARKDOWN, PARA QUEM NAO ABRE O CLAUDE.AI.
 *
 * A prancheta de verdade e um artefato com banco (claude.ai/artifact/99dQUHcbX6dy4dcAuu2Dx6).
 * A outra IA nao enxerga o artefato, so a pasta do projeto — entao o Claude
 * baixa os itens (ArtifactData list com out_dir) e roda isto para regravar
 * docs/PRANCHETA.md.
 *
 * A secao "Recados da outra IA" e PRESERVADA entre uma regravacao e outra: e la
 * que a outra IA escreve, e o Claude passa os recados para a prancheta.
 *
 *   node scripts/prancheta-para-md.mjs <pasta-com-os-json-dos-itens>
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const pasta = process.argv[2];
if (!pasta || !existsSync(pasta)) {
  console.error('uso: node scripts/prancheta-para-md.mjs <pasta-com-os-json-dos-itens>');
  process.exit(1);
}

const destino = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'docs', 'PRANCHETA.md');
const MARCA_DOS_RECADOS = '## Recados da outra IA';

const FRENTES = [
  ['lancamento', 'Lançamento'],
  ['app', 'App'],
  ['oraculo', 'Oráculo'],
  ['arte', 'Arte'],
  ['marketing', 'Marketing'],
  ['git', 'Git'],
];
const DONOS = { claude: 'Claude', afonso: 'Afonso', outra: 'outra IA', artista: 'artista' };

const itens = readdirSync(pasta)
  .filter((nome) => nome.endsWith('.json'))
  .map((nome) => ({ id: nome.slice(0, -5), ...JSON.parse(readFileSync(path.join(pasta, nome), 'utf8')) }));

const linha = (item) => {
  const dono = DONOS[item.dono] || item.dono || '?';
  const nota = item.nota ? ` — ${item.nota}` : '';
  return `- [${item.feito ? 'x' : ' '}] ${item.texto} *(${dono})*${nota}`;
};

const recadosAntigos = existsSync(destino)
  ? (() => {
    const atual = readFileSync(destino, 'utf8');
    const inicio = atual.indexOf(MARCA_DOS_RECADOS);
    return inicio >= 0 ? atual.slice(inicio + MARCA_DOS_RECADOS.length).trim() : '';
  })()
  : '';

const abertos = itens.filter((item) => !item.feito).length;
const partes = [
  '# Prancheta do Glyph',
  '',
  `Cópia da prancheta do Afonso (artefato no claude.ai), regravada pelo Claude em ${new Date().toISOString().slice(0, 10)}. ${abertos} abertos de ${itens.length}.`,
  '',
  '**Não edite as listas abaixo** — elas são regravadas a partir da prancheta. Para avisar algo, escreva em "Recados da outra IA", no fim: o Claude lê e passa para a prancheta.',
  '',
];

for (const [chave, titulo] of FRENTES) {
  const daFrente = itens.filter((item) => item.frente === chave).sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
  if (daFrente.length === 0) continue;
  const pendentes = daFrente.filter((item) => !item.feito);
  const feitos = daFrente.filter((item) => item.feito);
  partes.push(`## ${titulo}`, '');
  if (pendentes.length) partes.push(...pendentes.map(linha), '');
  if (feitos.length) {
    partes.push('<details><summary>Feitos (' + feitos.length + ')</summary>', '', ...feitos.map(linha), '', '</details>', '');
  }
}

partes.push(
  MARCA_DOS_RECADOS,
  '',
  recadosAntigos || '<!-- Escreva aqui: data, o que foi feito ou o que precisa. Ex.: "10/10 — banner de cookie do site pronto, commit abc123". -->',
  '',
);

writeFileSync(destino, partes.join('\n'), 'utf8');
console.log(`docs/PRANCHETA.md: ${itens.length} itens, ${abertos} abertos.`);
