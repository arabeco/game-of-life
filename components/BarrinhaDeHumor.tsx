import React from 'react';
import { MOODS_DATA } from '../constants';

/**
 * O humor de um membro, embaixo do nome. So aparece para o proprio cla.
 * `compacta` e a do palco da Sede: cabe embaixo do nome, sem o rotulo (que
 * continua no title e no leitor de tela).
 */
export const BarrinhaDeHumor: React.FC<{ mood?: number | null; compacta?: boolean }> = ({ mood, compacta = false }) => {
    // undefined: o app ainda nao sabe nada do membro. null: ele nunca registrou
    // humor — o 50 do cadastro nao e humor de ninguem, entao a barra fica vazia.
    if (mood === undefined) return null;
    if (mood === null) {
        return (
            <div className={`flex items-center gap-2 ${compacta ? 'mt-1 justify-center' : 'mt-1'}`} title="Humor: sem dados">
                <div aria-label="Humor: sem dados" className={`h-1 rounded-full border border-white/15 bg-transparent ${compacta ? 'w-14' : 'w-20'}`} />
                {compacta ? null : <span className="text-[9px] uppercase tracking-[0.12em] text-white/30">Sem dados</span>}
            </div>
        );
    }
    if (!Number.isFinite(mood)) return null;
    const valor = Math.max(0, Math.min(100, mood));
    const faixa = MOODS_DATA.find((m) => valor >= m.min && valor < m.max) || MOODS_DATA[MOODS_DATA.length - 1];
    return (
        <div className={`flex items-center gap-2 ${compacta ? 'mt-1 justify-center' : 'mt-1'}`} title={`Humor: ${faixa.label}`}>
            <div
                role="meter"
                aria-label="Humor"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(valor)}
                aria-valuetext={faixa.label}
                className={`h-1 overflow-hidden rounded-full bg-white/10 ${compacta ? 'w-14' : 'w-20'}`}
            >
                <div className="h-full rounded-full" style={{ width: `${valor}%`, background: `linear-gradient(90deg, ${faixa.trackStart}, ${faixa.trackEnd})` }} />
            </div>
            {compacta ? null : <span className="text-[9px] uppercase tracking-[0.12em] text-white/40">{faixa.label}</span>}
        </div>
    );
};
