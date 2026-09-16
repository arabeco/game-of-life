import React from 'react';
import { getPlateFinish, tintaMetalicaDo } from './MetalReportCard';

export interface LegendaDoCartaz {
    rotulo: string;
    valor: string;
    /** Uma nota miuda embaixo do valor, quando o numero sozinho nao se explica. */
    nota?: string;
    tom?: 'normal' | 'bom' | 'alerta';
}

export interface BarraDoCartaz {
    rotulo: string;
    pts: number;
    max: number;
    destaque?: boolean;
}

interface SlideCartazProps {
    titulo: string;
    /**
     * O protagonista quando ele e um DESENHO — um radar, um mapa, uma grade.
     *
     * Nem todo quadro tem um numero para mostrar: o de Territorio e o de Atlas
     * sao figuras, e espremer um numero inventado no topo delas seria arrumar a
     * hierarquia com dado de enfeite. Quando `figura` vem, ela ocupa o lugar do
     * numero e cresce para o que sobrar.
     */
    figura?: React.ReactNode;
    /** O protagonista. Um numero, uma letra, um sinal — nunca uma frase. */
    numero?: React.ReactNode;
    sufixo?: string;
    /** O que o numero quer dizer, em uma linha curta. */
    rotulo: string;
    /** 0 a 100. Desenha um traco sob o numero; omitir quando nao houver escala. */
    progresso?: number;
    legenda?: LegendaDoCartaz[];
    /** A decomposicao de uma nota, quando ela existe. */
    barras?: BarraDoCartaz[];
    /** Uma frase de fechamento, quando o ciclo tem algo a dizer. */
    remate?: string;
    /** A nota do ciclo. E ela que da o acabamento do quadro. */
    rank: string;
}

const TONS: Record<NonNullable<LegendaDoCartaz['tom']>, string> = {
    normal: '',
    bom: 'text-emerald-300',
    alerta: 'text-amber-300',
};

/**
 * UM NUMERO POR SLIDE, E O RESTO E LEGENDA — NA GRAMATICA DAS PLACAS.
 *
 * Duas coisas estavam erradas na apresentacao do ciclo, e elas se escondiam uma
 * atras da outra.
 *
 * A PRIMEIRA ERA HIERARQUIA. Eram seis paineis cinzas em sequencia, com a
 * densidade invertida: Execucao empilhava sete blocos do mesmo peso — duas
 * barras, quatro caixas de numero e mais uma barra — em 706px de conteudo para
 * 626px de tela, enquanto Conquistas ocupava 376px e deixava 250px de preto.
 * Aqui cada quadro tem UM protagonista do tamanho de um protagonista, e tudo o
 * mais existe para qualifica-lo. E o que separa apresentacao de relatorio:
 * relatorio se le varrendo, apresentacao se le num golpe de vista.
 *
 * A SEGUNDA ERA ESTILO, e so apareceu depois. O app inteiro migrou para a
 * gramatica das placas — canto chanfrado, moldura que corre do escuro ao claro
 * varias vezes para parecer metal torneado, tinta metalica no texto, acabamento
 * por patamar. Estes slides ficaram falando o dialeto anterior: cinza, borda de
 * 1px, numero branco chapado. Corrigir so a hierarquia deixaria seis quadros bem
 * organizados que continuariam parecendo de outro aplicativo.
 *
 * Entao o acabamento vem de `PLATE_FINISHES`, o MESMO da placa: o quadro e
 * pintado pelo RESULTADO do ciclo, e nao pelo tema escolhido. Um ciclo A e
 * dourado do primeiro slide ao ultimo; um ciclo E e terroso. A placa do fim
 * deixa de ser um objeto bonito no meio de telas neutras e passa a ser o fecho
 * de uma serie que ja era dela.
 */
export const SlideCartaz: React.FC<SlideCartazProps> = ({
    titulo,
    figura,
    numero,
    sufixo,
    rotulo,
    progresso,
    legenda = [],
    barras = [],
    remate,
    rank,
}) => {
    const acabamento = getPlateFinish(rank);
    const tinta = tintaMetalicaDo(acabamento);

    /*
     * O CORPO DO NUMERO CEDE AO COMPRIMENTO DELE.
     *
     * Em corpo fixo, "71" respira e "+1250" encosta nas duas bordas de um
     * telefone de 375px — com o sufixo espremido em cima. O protagonista tem de
     * ser o maior elemento da tela, e nao o mais largo que couber.
     */
    const digitos = String(numero ?? '').length;
    const tamanhoDoNumero = digitos >= 6 ? '3.4rem' : digitos === 5 ? '4.1rem' : digitos === 4 ? '4.9rem' : '5.8rem';

    const chanfro = 18;
    const recorte = {
        clipPath: `polygon(${chanfro}px 0, calc(100% - ${chanfro}px) 0, 100% ${chanfro}px, 100% calc(100% - ${chanfro}px), calc(100% - ${chanfro}px) 100%, ${chanfro}px 100%, 0 calc(100% - ${chanfro}px), 0 ${chanfro}px)`,
    };

    return (
        <div
            className="relative flex w-full flex-col items-center justify-center gap-6 px-7 py-8 text-center"
            style={{
                /* O quadro PREENCHE a area do slide; `SlideAjustado` publica
                   quanto ha. Sem isto ele boiava: 406px de cartaz com moldura
                   propria no meio de 626px de preto liam como um cartao solto. */
                minHeight: 'var(--altura-do-slide, 32rem)',
                background: [
                    'repeating-linear-gradient(118deg, rgba(255,255,255,.02) 0 1px, transparent 1px 7px)',
                    `radial-gradient(ellipse at 50% 8%, ${acabamento.face}, transparent 64%)`,
                    'linear-gradient(180deg, #0b0b0c, #050505)',
                ].join(', '),
                ...recorte,
            }}
        >
            {/* A MOLDURA E A MESMA DA PLACA: `border-image` correndo do escuro ao
                claro varias vezes, sobre o mesmo chanfro. E o que faz a borda
                parecer metal torneado em vez de linha pintada. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[6px] z-[2]"
                style={{
                    border: '2px solid transparent',
                    borderImageSource: `linear-gradient(135deg, ${acabamento.mid} 0%, ${acabamento.pale} 8%, ${acabamento.mid} 13%, ${acabamento.dark} 40%, ${acabamento.dark} 85%, ${acabamento.pale} 100%)`,
                    borderImageSlice: 1,
                    clipPath: `polygon(${chanfro - 4}px 0, calc(100% - ${chanfro - 4}px) 0, 100% ${chanfro - 4}px, 100% calc(100% - ${chanfro - 4}px), calc(100% - ${chanfro - 4}px) 100%, ${chanfro - 4}px 100%, 0 calc(100% - ${chanfro - 4}px), 0 ${chanfro - 4}px)`,
                }}
            />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[11px] z-[2]"
                style={{ border: `1px solid ${acabamento.mid}44`, ...recorte }}
            />

            <p
                className="relative z-[3] m-0 text-[10px] font-black uppercase tracking-[0.42em]"
                style={{ color: `${acabamento.pale}88` }}
            >
                {titulo}
            </p>

            <div className={`relative z-[3] flex flex-col items-center ${figura ? 'w-full flex-1 justify-center' : ''}`}>
                {/* O halo pega o acabamento do patamar, e nao a cor do tema: o
                    quadro brilha da cor do resultado. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[58px]"
                    style={{ background: acabamento.mid }}
                />
                {figura ? (
                    <div className="relative z-10 w-full">{figura}</div>
                ) : (
                    <div className="relative z-10 flex items-baseline justify-center gap-1">
                        <span
                            className="font-bold leading-[0.86] tracking-tight"
                            style={{ fontSize: tamanhoDoNumero, fontFamily: 'Cinzel, Georgia, serif', ...tinta }}
                        >
                            {numero}
                        </span>
                        {sufixo && (
                            <span
                                className="text-[1.5rem] font-black leading-none tracking-tight"
                                style={{ color: `${acabamento.pale}66` }}
                            >
                                {sufixo}
                            </span>
                        )}
                    </div>
                )}

                {typeof progresso === 'number' && (
                    <div
                        className="relative z-10 mt-5 h-[3px] w-[180px] overflow-hidden rounded-full"
                        style={{ background: `${acabamento.dark}` }}
                    >
                        <div
                            className="h-full rounded-full transition-[width] duration-1000 ease-out"
                            style={{
                                width: `${Math.max(0, Math.min(100, progresso))}%`,
                                background: `linear-gradient(90deg, ${acabamento.mid}, ${acabamento.pale})`,
                                boxShadow: `0 0 10px ${acabamento.mid}`,
                            }}
                        />
                    </div>
                )}

                <p
                    className="relative z-10 mt-4 max-w-[260px] text-[10.5px] font-black uppercase leading-relaxed tracking-[0.2em]"
                    style={{ color: `${acabamento.pale}7a` }}
                >
                    {rotulo}
                </p>
            </div>

            {legenda.length > 0 && (
                /* Duas colunas, nao quatro caixas: a legenda e para ser conferida
                   depois do numero, e nao disputada com ele. Sem moldura e sem
                   fundo — o fio de cima ja separa. */
                <div
                    className="relative z-[3] grid w-full max-w-[290px] grid-cols-2 gap-x-5 gap-y-3 pt-5"
                    style={{ borderTop: `1px solid ${acabamento.mid}33` }}
                >
                    {legenda.map((item) => (
                        <div key={item.rotulo} className="min-w-0 text-left">
                            <p
                                className="m-0 truncate text-[8.5px] font-black uppercase tracking-[0.2em]"
                                style={{ color: `${acabamento.pale}55` }}
                            >
                                {item.rotulo}
                            </p>
                            <p
                                className={`m-0 truncate text-[1.05rem] font-bold leading-tight tabular-nums ${TONS[item.tom || 'normal']}`}
                                style={{
                                    fontFamily: 'Cinzel, Georgia, serif',
                                    ...(item.tom && item.tom !== 'normal' ? {} : tinta),
                                }}
                            >
                                {item.valor}
                            </p>
                            {item.nota && (
                                <p className="m-0 truncate text-[8.5px] font-bold" style={{ color: `${acabamento.pale}44` }}>
                                    {item.nota}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {barras.length > 0 && (
                /* A decomposicao da nota: cada criterio vale ate um teto, entao a
                   barra mede o quanto daquele teto o ciclo alcancou. Tudo no
                   acabamento do patamar — era cinza sobre cinza, cinco fios de
                   1px que ninguem lia. */
                <div
                    className="relative z-[3] w-full max-w-[290px] space-y-2 pt-5"
                    style={{ borderTop: `1px solid ${acabamento.mid}33` }}
                >
                    {barras.map((barra) => (
                        <div key={barra.rotulo} className="flex items-center gap-3">
                            <span
                                className="w-[74px] shrink-0 truncate text-right text-[8.5px] font-black uppercase tracking-[0.16em]"
                                style={{ color: barra.destaque ? '#EAB308' : `${acabamento.pale}55` }}
                            >
                                {barra.rotulo}
                            </span>
                            <div className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: acabamento.dark }}>
                                <div
                                    className="h-full rounded-full transition-[width] duration-700"
                                    style={{
                                        width: `${barra.max > 0 ? Math.min(100, (barra.pts / barra.max) * 100) : 0}%`,
                                        background: barra.destaque
                                            ? 'linear-gradient(90deg, #a97e12, #ffe08a)'
                                            : `linear-gradient(90deg, ${acabamento.mid}, ${acabamento.pale})`,
                                    }}
                                />
                            </div>
                            <span
                                className="w-7 shrink-0 text-right text-[9px] font-black tabular-nums"
                                style={{ color: barra.destaque ? '#EAB308' : `${acabamento.pale}88` }}
                            >
                                +{barra.pts}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {remate && (
                <p
                    className="relative z-[3] max-w-[280px] text-[11px] font-bold italic leading-relaxed"
                    style={{ color: `${acabamento.pale}70` }}
                >
                    {remate}
                </p>
            )}
        </div>
    );
};
