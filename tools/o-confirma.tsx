/**
 * O MODAL DE CONFIRMACAO, EM TODA SKIN E NOS DOIS TEMAS.
 *
 * O "ENCERRAR CICLO?" sumia no painel escuro, e a folha de estilo dizia que ele
 * era claro: `--ui-card-text` aponta para `--text-primary`, que no tema escuro e
 * #e5e7eb. A tela mostrava outra coisa.
 *
 * Briga entre o que a folha diz e o que a tela faz so o navegador resolve. Aqui
 * o modal aparece com o seletor de skin E o de tema, e a caixa de baixo imprime
 * a COR COMPUTADA de cada texto com o contraste contra o fundo do painel — a
 * mesma conta que o tests/skin-button-contrast faz nos botoes.
 *
 * Nao entra no build: o `npm run build` empacota so o index.html da raiz.
 */
import '../index.css';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmationModal } from '../components/ConfirmationModal';

const SKINS = ['GOLD', 'BASIC', 'FROST', 'EMBER', 'CYBER', 'AURORA', 'VOID'];
const TEMAS = ['theme-dark', 'theme-light'];

/** Luminancia relativa da WCAG, a partir de um `rgb(...)` computado. */
const luminancia = (cor: string): number | null => {
    const m = cor.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b] = m[1].split(',').slice(0, 3).map((v) => Number(v.trim()) / 255);
    const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};

const contraste = (frente: string, fundo: string): string => {
    const a = luminancia(frente);
    const b = luminancia(fundo);
    if (a === null || b === null) return '—';
    const razao = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return razao.toFixed(2);
};

const Bancada: React.FC = () => {
    const [skin, setSkin] = useState('GOLD');
    const [tema, setTema] = useState('theme-dark');
    const [medida, setMedida] = useState<Record<string, string>>({});

    useEffect(() => {
        document.documentElement.setAttribute('data-skin', skin);
        document.body.setAttribute('data-skin', skin);
        document.body.className = `mode-game ${tema}`;

        const id = window.setTimeout(() => {
            const titulo = document.querySelector('.ui-modal-title');
            const copia = document.querySelector('.ui-modal-copy');
            const painel = document.querySelector('.ui-modal-panel');
            if (!titulo || !copia || !painel) return;

            // O painel e um gradiente; a cor computada do fundo nao o descreve.
            // A parada final dele e rgba(8,10,14,.985) no escuro, entao a conta
            // usa esse tom como piso — e o pior caso, que e o que importa.
            const fundoEscuro = 'rgb(8, 10, 14)';
            const fundo = getComputedStyle(painel).backgroundColor;
            const fundoReal = fundo === 'rgba(0, 0, 0, 0)' ? fundoEscuro : fundo;

            setMedida({
                'fundo do painel': fundoReal,
                'título': getComputedStyle(titulo).color,
                'contraste do título': contraste(getComputedStyle(titulo).color, fundoReal),
                'corpo': getComputedStyle(copia).color,
                'contraste do corpo': contraste(getComputedStyle(copia).color, fundoReal),
            });
        }, 120);
        return () => window.clearTimeout(id);
    }, [skin, tema]);

    const ruim = (chave: string) => chave.startsWith('contraste') && Number(medida[chave]) < 4.5;

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <h1 className="m-0 text-[17px] font-bold">O modal de confirmação</h1>
            <p className="mt-1 max-w-[70ch] text-[12.5px] text-white/50">
                O mínimo da WCAG para texto é <strong>4.5</strong>. A conta é a mesma do
                <code className="mx-1 text-[11px] text-[#d8b44c]">tests/skin-button-contrast</code>
                que já guarda os botões.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
                {SKINS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setSkin(s)}
                        className={`rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${
                            skin === s ? 'border-[#d8b44c] bg-[#d8b44c] text-black' : 'border-white/15 bg-white/5 text-white/70'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {TEMAS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTema(t)}
                        className={`rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${
                            tema === t ? 'border-white bg-white text-black' : 'border-white/15 bg-white/5 text-white/70'
                        }`}
                    >
                        {t.replace('theme-', '')}
                    </button>
                ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-[12px]">
                {Object.entries(medida).map(([chave, valor]) => (
                    <div key={chave} className={ruim(chave) ? 'text-[#ff6b6b]' : 'text-white/70'}>
                        <span className="inline-block w-[190px] text-white/40">{chave}</span>
                        {valor}
                        {ruim(chave) ? '  ← ABAIXO DE 4.5' : ''}
                    </div>
                ))}
            </div>

            <ConfirmationModal
                title="Encerrar Ciclo?"
                message="Ao fechar este ciclo, suas ações não concluídas no grid serão movidas para o estoque de ações e suas arenas serão revisadas."
                onConfirm={() => {}}
                onCancel={() => {}}
            />
        </div>
    );
};

createRoot(document.getElementById('raiz')!).render(<Bancada />);
