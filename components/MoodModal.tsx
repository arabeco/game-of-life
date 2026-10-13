
import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { MOODS_DATA } from '../constants';
import { XIcon } from './Icons';
import { Portal } from './Portal';
import JournalTab from './JournalTab';
import { anexarEntrada, cabecalhoDeHoje } from '../services/JournalService';
import { TAGS_DO_DIARIO, cabecalhoDaEntrada, type TagDoDiario } from '../utils/diario';

const ESPECTRO_DO_HUMOR = `linear-gradient(90deg, ${MOODS_DATA.flatMap((mood) => [
    `${mood.trackStart} ${mood.min}%`,
    `${mood.trackEnd} ${Math.min(mood.max, 100)}%`,
]).join(', ')})`;

export const MoodModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, dailyCommitment, updateMood, updateOperationalScratch, recordMoodEntry, fetchMoodHistory } = useGame();
    const [historico, setHistorico] = React.useState<Array<{ value: number; recordedAt: string }>>([]);
    const [registrando, setRegistrando] = React.useState(false);
    const [aba, setAba] = useState<'humor' | 'diario'>('humor');

    /*
     * A FRASE NASCE JUNTO DO HUMOR, E NAO NOUTRA ABA.
     *
     * Registrar ja escrevia no diario — com a frase enlatada "Estava me
     * sentindo assim.", que e o que sobra quando ninguem perguntou nada. E
     * quem quisesse dizer o que estava pensando tinha de sair daqui, abrir a
     * outra aba e escrever um texto solto, que entao nao carregava humor
     * nenhum.
     *
     * Sao o mesmo gesto: a pessoa senta para dizer como esta. O nivel e a
     * frase saem da mesma sentada, e o cabecalho carimba os dois juntos.
     */
    const [frase, setFrase] = useState('');
    // A tag da entrada: nenhuma marcada = sem tag. Tocar de novo desmarca.
    const [tag, setTag] = useState<TagDoDiario | null>(null);
    // Tocar na bolinha tira o humor da entrada: vira so uma nota, sem emocao.
    // Mexer na regua devolve.
    const [semHumor, setSemHumor] = useState(false);
    const [localMood, setLocalMood] = useState(userProfile.mood);

    const resolveMood = (value: number) => 
        MOODS_DATA.find(m => value >= m.min && value < m.max) || MOODS_DATA[MOODS_DATA.length - 1];

    const currentMoodInfo = resolveMood(localMood);
    // A BARRA E O ESPECTRO INTEIRO, FIXO (12/10/2026): cada humor pinta a sua
    // faixa, do vermelho da Vergonha ao rosa da Iluminacao. Quem muda e a
    // bolinha, que pega a cor do humor onde esta, junto com o nome em cima.
    const sliderTrackStyle = useMemo(() => ({
        background: ESPECTRO_DO_HUMOR,
        '--mood-thumb': currentMoodInfo.trackEnd,
    }) as React.CSSProperties, [currentMoodInfo.trackEnd]);

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
        setSemHumor(false);
    };

    const mudou = localMood !== userProfile.mood;

    const handleRegistrar = async () => {
        if (registrando) return;
        setRegistrando(true);
        try {
            if (!semHumor) {
                updateMood(localMood);
                await recordMoodEntry(localMood);
                setHistorico(await fetchMoodHistory(20));
            }

            /* REGISTRAR HUMOR ESCREVE NO DIARIO.

               Sem isto, quem so arrasta a bolinha nunca teria uma pagina — e o
               diario de quem nao escreve muito ficaria vazio justamente nos dias
               em que houve alguma coisa a sentir.

               A frase importa: entrada so com a cor seria um espaco em branco
               com uma bolinha do lado. Com ela, a linha se le sozinha, e quem
               quiser continuar escrevendo continua ali mesmo. */
            if (userProfile?.id) {
                void anexarEntrada(
                    userProfile.id,
                    cabecalhoDaEntrada(cabecalhoDeHoje(), semHumor ? null : currentMoodInfo.label, tag),
                    frase.trim() || 'Estava me sentindo assim.',
                );
                setFrase('');
                setTag(null);
                setSemHumor(false);
            }
        } finally {
            setRegistrando(false);
        }
    };

    React.useEffect(() => {
        void fetchMoodHistory(20).then(setHistorico);
        // Uma leitura por abertura do humor, nao por carga do app: vinte pontos
        // custam cerca de um kilobyte, e so quem abre paga por eles.
    }, []);
    
    /**
     * A REGUA MENTIA, E MENTIA MUITO.
     *
     * Eram cinco palavras fixas espalhadas por igual — VERGONHA, CORAGEM, AMOR,
     * PAZ, ILUMINADO — como se a escala fosse linear. Ela nao e: ha dezessete
     * humores, sete deles nos primeiros 35%, e os quatro de cima espremidos nos
     * ultimos 25%. Coragem estava escrita em 25% e mora em 50%; Amor estava em
     * 50% e mora em 80%.
     *
     * Quem arrastava a bolinha ate a palavra recebia outro humor, e concluia
     * que a bolinha estava errada. A bolinha estava certa.
     *
     * Agora os marcos saem de MOODS_DATA: pergunta-se qual humor vive em 0, 25,
     * 50, 75 e 100, e escreve-se esse. Mudar as faixas passa a corrigir a regua
     * sozinho, em vez de deixar as duas se afastarem em silencio.
     */
    const marcosDaRegua = [0, 25, 50, 75, 100].map((posicao) => ({
        posicao,
        label: resolveMood(posicao).label.toUpperCase(),
    }));

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
                    <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/70">Diário</h2>
                    <button aria-label="Fechar" onClick={onClose} className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <XIcon className="w-5 h-5 text-gray-400"/>
                    </button>
                </div>

                {/* DUAS ABAS, E O DIARIO E A QUE DA NOME AO BOTAO.
                    "Como estou" e "por que" sao a mesma frase partida ao meio;
                    o diario estava no modal de Checklist so por vizinhanca. */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/25 p-1">
                    <button
                        type="button"
                        onClick={() => setAba('humor')}
                        className={`rounded-[0.9rem] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-colors ${aba === 'humor' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/75'}`}
                    >
                        Humor
                    </button>
                    <button
                        type="button"
                        onClick={() => setAba('diario')}
                        className={`rounded-[0.9rem] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-colors ${aba === 'diario' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/75'}`}
                    >
                        Páginas
                    </button>
                </div>

                {aba === 'diario' ? (
                    <JournalTab userId={userProfile?.id || ''} />
                ) : (
                <>
                
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
                    {/* Cada marco no SEU lugar, e nao espalhados por igual.
                        `justify-between` distribuia pelo espaco que sobrava, o que so
                        coincide com o valor quando a escala e linear — e esta nao e. */}
                    <div className="relative h-4 px-1">
                        {marcosDaRegua.map(({ posicao, label }) => (
                            <span
                                key={posicao}
                                className="absolute top-0 whitespace-nowrap text-[10px] font-bold text-gray-400"
                                style={{
                                    left: posicao + '%',
                                    transform: posicao === 0
                                        ? 'translateX(0)'
                                        : posicao === 100
                                            ? 'translateX(-100%)'
                                            : 'translateX(-50%)',
                                }}
                            >
                                {label}
                            </span>
                        ))}
                    </div>

                    {/* O campo fica ENTRE a regua e o botao, que e a ordem do
                        gesto: escolhe o nivel, diz por que, registra os dois. Ele
                        nunca e obrigatorio — quem so quer arrastar a bolinha
                        continua arrastando e pronto. */}
                    {/* A bolinha ao lado do campo tem a cor do humor da regua, e muda
                        enquanto a pessoa arrasta: a frase ja nasce com a cor dela. */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/30 px-3 py-2 focus-within:border-[var(--skin-accent-color)]/45">
                        <button
                            type="button"
                            onClick={() => setSemHumor((atual) => !atual)}
                            aria-pressed={!semHumor}
                            aria-label={semHumor ? 'Sem humor (tocar para incluir)' : `Humor: ${currentMoodInfo.label} (tocar para tirar)`}
                            title={semHumor ? 'Incluir o humor' : 'Escrever sem o humor'}
                            className="mt-[0.3rem] h-3 w-3 flex-shrink-0 rounded-full border transition-colors duration-200"
                            style={semHumor
                                ? { background: 'transparent', borderColor: 'rgba(255,255,255,0.3)' }
                                : { background: currentMoodInfo.trackEnd, borderColor: currentMoodInfo.trackEnd, boxShadow: `0 0 10px ${currentMoodInfo.trackEnd}88` }}
                        />
                        <textarea
                            id="mood-frase"
                            value={frase}
                            onChange={(evento) => setFrase(evento.target.value.slice(0, 600))}
                            rows={3}
                            placeholder="Como está se sentindo? O que está pensando?"
                            className="w-full resize-none bg-transparent text-[13px] leading-[1.45] text-white/88 placeholder:text-white/30 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tag da entrada">
                        {TAGS_DO_DIARIO.map((opcao) => (
                            <button
                                key={opcao}
                                type="button"
                                aria-pressed={tag === opcao}
                                onClick={() => setTag((atual) => (atual === opcao ? null : opcao))}
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                                    tag === opcao
                                        ? 'border-[var(--skin-accent-color)]/60 bg-[var(--skin-accent-color)]/15 text-white'
                                        : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/75'
                                }`}
                            >
                                {opcao}
                            </button>
                        ))}
                    </div>

                    {/* Registrar tem nome e numero na frente: e a pessoa dizendo
                        "hoje eu estou assim", nao o app anotando o dedo dela.

                        Escrever sozinho tambem vale: quem nao mexeu na regua mas
                        tem o que dizer nao pode ficar com o botao apagado — a
                        frase e registro tanto quanto o numero. */}
                    <button
                        type="button"
                        onClick={() => { void handleRegistrar(); }}
                        disabled={(semHumor ? !frase.trim() : !mudou && !frase.trim()) || registrando}
                        className="luxe-skin-button w-full rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {registrando
                            ? '...'
                            : semHumor
                                ? 'Registrar no diário'
                                : (mudou || frase.trim())
                                    ? `Registrar · ${currentMoodInfo.label} (${currentMoodInfo.level})`
                                    : 'Já registrado'}
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
                            {/* A LINHA usa a cor da skin — identidade da pessoa, e o que
                                da continuidade ao tracado. Os PONTOS usam a cor do proprio
                                estado: as dezessete ja existem no espectro, e um grafico de
                                humor todo de uma cor so joga fora a unica informacao que ele
                                tinha de graca. */}
                            {historico.map((ponto, indice) => {
                                const x = historico.length === 1 ? 50 : (indice / (historico.length - 1)) * 100;
                                const y = 30 - (Math.max(0, Math.min(100, ponto.value)) / 100) * 28;
                                return (
                                    <circle
                                        key={`${ponto.recordedAt}-${indice}`}
                                        cx={x}
                                        cy={y}
                                        r="1.8"
                                        fill={resolveMood(ponto.value).trackEnd}
                                        stroke="rgba(0,0,0,0.35)"
                                        strokeWidth="0.4"
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
                </>
                )}
            </GlassCard>
        </div>
        </Portal>
    );
};
