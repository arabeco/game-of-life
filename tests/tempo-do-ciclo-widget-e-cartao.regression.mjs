import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

/**
 * O DIA E O TEMPO DO CICLO (19/10/2026, Afonso).
 *
 * 1. Num ciclo de segunda a domingo (14 dias), domingo e 7 e 14. O widget
 *    mostrava 13: desenhava o "Dia N/T" que o app mandou da ultima vez que foi
 *    aberto. Agora o widget calcula o dia sozinho (CicloDoWidget.java), pela
 *    mesma regra do app: o primeiro dia e o 1, hoje ja conta, o dia vira as 4h.
 * 2. A linha Tempo mostra a porcentagem ao lado do dia, como a de Progresso:
 *    "Dia 7/14 (50%)" — no widget e no cartao do ciclo (Ativos e Arenas, o mesmo
 *    CycleSummaryCard).
 */
const saida = await build({ entryPoints: ['utils/dateUtils.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { getCycleTimingSummary } = await import('data:text/javascript;base64,' + Buffer.from(saida.outputFiles[0].text).toString('base64'));
const rotulo = (hoje) => { const t = getCycleTimingSummary('2026-10-06', '2026-10-19', hoje); return `${t.statusLabel} (${Math.round(t.timeProgress)}%)`; };
assert.equal(rotulo('2026-10-06'), 'Dia 1/14 (7%)', 'o primeiro dia ja conta');
assert.equal(rotulo('2026-10-12'), 'Dia 7/14 (50%)', 'o primeiro domingo e o dia 7');
assert.equal(rotulo('2026-10-19'), 'Dia 14/14 (100%)', 'o segundo domingo e o dia 14');

// O cartao do app mostra a porcentagem ao lado do dia.
const cartao = readFileSync(new URL('../components/CycleSummaryCard.tsx', import.meta.url), 'utf8');
assert.match(cartao, /\$\{cycleSummary\.statusLabel\} \(\$\{cycleSummary\.timeProgress\}%\)/, 'a linha Tempo do cartao nao mostra a porcentagem');

// O widget calcula o dia sozinho, com a mesma regra.
const provedor = readFileSync(new URL('../android/app/src/main/java/life/glyph/app/GlyphWidgetProvider.java', import.meta.url), 'utf8');
assert.match(provedor, /CicloDoWidget\.tempo\(startRaw, endRaw/, 'o widget ainda usa o dia velho do snapshot');
const java = readFileSync(new URL('../android/app/src/main/java/life/glyph/app/CicloDoWidget.java', import.meta.url), 'utf8');
assert.match(java, /CORTE_DO_DIA = 4;/, 'o widget vira o dia em outra hora que o app');

// Se houver JDK nesta maquina, roda o Java e compara com o app, dia por dia.
const jdk = ['C:/Program Files/Android/Android Studio/jbr/bin', process.env.JAVA_HOME && join(process.env.JAVA_HOME, 'bin')].filter(Boolean).find((p) => existsSync(join(p, process.platform === 'win32' ? 'javac.exe' : 'javac')));
if (jdk) {
  const pasta = mkdtempSync(join(tmpdir(), 'ciclo-'));
  mkdirSync(join(pasta, 'life/glyph/app'), { recursive: true });
  copyFileSync('android/app/src/main/java/life/glyph/app/CicloDoWidget.java', join(pasta, 'life/glyph/app/CicloDoWidget.java'));
  const dias = Array.from({ length: 16 }, (_, i) => `2026-10-${String(5 + i).padStart(2, '0')}`);
  writeFileSync(join(pasta, 'life/glyph/app/Prova.java'), `package life.glyph.app; import java.util.Calendar;
public class Prova { public static void main(String[] a) { for (String d : a) { Calendar c = Calendar.getInstance(); c.clear();
c.set(Integer.parseInt(d.substring(0,4)), Integer.parseInt(d.substring(5,7)) - 1, Integer.parseInt(d.substring(8,10)), 12, 0, 0);
int[] r = CicloDoWidget.tempo("2026-10-06", "2026-10-19", c); System.out.println(r == null ? "antes" : CicloDoWidget.rotulo(r)); } } }`);
  execFileSync(join(jdk, 'javac'), ['life/glyph/app/CicloDoWidget.java', 'life/glyph/app/Prova.java'], { cwd: pasta });
  const doJava = execFileSync(join(jdk, 'java'), ['-cp', '.', 'life.glyph.app.Prova', ...dias], { cwd: pasta, encoding: 'utf8' }).trim().split(/\r?\n/);
  const doApp = dias.map((d) => (d < '2026-10-06' ? 'antes' : rotulo(d)));
  assert.deepEqual(doJava, doApp, 'o widget e o app contam o dia diferente');
  console.log('  (conferido tambem no Java: 16 dias iguais ao app)');
}
console.log('Tempo do ciclo: dia certo no widget sem abrir o app, e "Dia 7/14 (50%)" nos dois.');
