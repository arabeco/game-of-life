
import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { MOODS_DATA } from '../constants';
import { XIcon } from './Icons';
import { Portal } from './Portal';

export const MoodModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, dailyCommitment, updateMood, updateOperationalScratch, recordMoodEntry, fetchMoodHistory } = useGame();
    const [historico, setHistorico] = React.useState<Array<{ value: number; recordedAt: string }>>([]);
    const [registrando, setRegistrando] = React.useState(false);
    const [localMood, setLocalMood] = useState(userProfile.mood);

    const resolveMood = (value: number) => 
        MOODS_DATA.find(m => value >= m.min && value < m.max) || MOODS_DATA[MOODS_DATA.length - 1];

    const currentMoodInfo = resolveMood(localMood);
    const sliderTrackStyle = useMemo(() => {
        const clamped = Math.max(0, Math.min(100, localMood));
        return {
            background: `linear-gradient(90deg, ${currentMoodInfo.trackStart} 0%, ${currentMoodInfo.trackEnd} ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}%, rgba(255, 255, 255, 0.12) 100%)`,
        } satisfies React.CSSProperties;
    }, [currentMoodInfo.trackEnd, currentMoodInfo.trackStart, localMood]);

    /**
     * Arrastar nao registra nada.
     *
     * O slider dispara onChange a cada movimento — gravar ali daria centenas de
     * pontos por arrasto, e a linha do tempo viraria ruido do dedo em vez de
     * historico. Arrastar so move o cursor; registrar e um ato separado, com
     * nome e numero na frente.
     */
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalMood(Number(e.target.value));
    };

    const mudou = localMood !== userProfile.mood;

    const handleRegistrar = async () => {
        if (registrando) return;
        setRegistrando(true);
        try {
            updateMood(localMood);
            await recordMoodEntry(localMood);
            setHistorico(await fetchMoodHistory(20));
        } finally {
            setRegistrando(false);
        }
    };

    React.useEffect(() => {
        void fetchMoodHistory(20).then(setHistorico);
        // Uma leitura por abertura do humor, nao por carga do app: vinte pontos
        // custam cerca de um kilobyte, e so quem abre paga por eles.
    }, []);
    
    const moodLabels = ['VERGONHA', 'CORAGEM', 'AMOR', 'PAZ', 'ILUMINADO'];

    return (
        <Portal>
        <div className="fixed inset-0 z-[10000] pointer-events-none flex items-start justify-center pt-24 px-4 animate-fade-in" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
            <GlassCard 
                variant="neutral" 
                className="w-full max-w-sm pointer-events-auto space-y-4 rounded-3xl shadow-2xl border border-white/10 relative !bg-[linear-gradient(180deg,rgba(11,13,18,0.94),rgba(7,8,12,0.92))] backdrop-blur-xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">Humor</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <XIcon className="w-5 h-5 text-gray-400"/>
                    </button>
                </div>
                
                <div className="text-center py-2 min-h-[48px] flex items-center justify-center">
                    <p className="text-xl font-semibold transition-colors duration-200" style={{ color: currentMoodInfo.trackEnd }}>
                        {currentMoodInfo.label}
                    </p>
                </div>

                <div className="space-y-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={localMood}
                        onChange={handleSliderChange}
                        className="mood-slider"
                        style={sliderTrackStyle}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                        {moodLabels.map(label => <span key={label}>{label}</span>)}
                    </div>

                    {/* Registrar tem nome e numero na frente: e a pessoa dizendo
                        "hoje eu estou assim", nao o app anotando o dedo dela. */}
                    <button
                        type="button"
                        onClick={() => { void handleRegistrar(); }}
                        disabled={!mudou || registrando}
                        className="luxe-skin-button w-full rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {registrando ? '...' : mudou ? `Registrar · ${currentMoodInfo.label} (${currentMoodInfo.level})` : 'Já registrado'}
                    </button>
                </div>

                {/* A linha do tempo.
                    O humor era um numero so, sobrescrito: registrar como voce esta
                    hoje apagava como voce estava ontem. Num app inteiro sobre
                    perceber trajetoria, era o unico lugar sem passado. */}
                {historico.length > 1 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                            Últimas {historico.length} marcações
                        </p>
                        <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-16 w-full" role="img" aria-label="Histórico de humor">
                            <polyline
                                fill="none"
                                stroke="var(--skin-accent-color)"
                                strokeWidth="1"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                points={historico
                                    .map((ponto, indice) => {
                                        const x = historico.length === 1 ? 50 : (indice / (historico.length - 1)) * 100;
                                        const y = 30 - (Math.max(0, Math.min(100, ponto.value)) / 100) * 28;
                                        return `${x},${y}`;
                                    })
                                    .join(' ')}
                            />
                            {historico.map((ponto, indice) => {
                                const x = historico.length === 1 ? 50 : (indice / (historico.length - 1)) * 100;
                                const y = 30 - (Math.max(0, Math.min(100, ponto.value)) / 100) * 28;
                                return (
                                    <circle
                                        key={`${ponto.recordedAt}-${indice}`}
                                        cx={x}
                                        cy={y}
                                        r="1.6"
                                        fill="var(--skin-accent-color)"
                                        vectorEffect="non-scaling-stroke"
                                    >
                                        <title>{`${resolveMood(ponto.value).label} (${resolveMood(ponto.value).level}) · ${new Date(ponto.recordedAt).toLocaleDateString('pt-BR')}`}</title>
                                    </circle>
                                );
                            })}
                        </svg>
                        <div className="flex justify-between text-[9px] text-white/30">
                            <span>{new Date(historico[0].recordedAt).toLocaleDateString('pt-BR')}</span>
                            <span>{new Date(historico[historico.length - 1].recordedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/56">
                            Rascunho operacional
                        </p>
                        <p className="text-[10px] text-white/35">zera no proximo dia operacional</p>
                    </div>
                    <textarea
                        value={dailyCommitment.operationalScratch || ''}
                        onChange={(event) => updateOperationalScratch(event.target.value)}
                        rows={4}
                        placeholder="Anotacoes rapidas, pendencias, lembretes do dia..."
                        className="w-full resize-none rounded-2xl border border-white/12 bg-black/55 px-3 py-3 text-sm text-white/88 placeholder:text-white/25 focus:outline-none focus:border-[var(--skin-accent-color)]"
                    />
                </div>
            </GlassCard>
        </div>
        </Portal>
    );
};
