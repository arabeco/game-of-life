import React from 'react';

export interface LegendaDoCartaz {
    rotulo: string;
    valor: string;
    /** Uma nota miuda embaixo do valor, quando o numero sozinho nao se explica. */
    nota?: string;
    tom?: 'normal' | 'bom' | 'alerta';
}

interface SlideCartazProps {
    titulo: string;
    /** O protagonista. Um numero, uma letra, um sinal — nunca uma frase. */
    numero: React.ReactNode;
    sufixo?: string;
    /** O que o numero quer dizer, em uma linha curta. */
    rotulo: string;
    /** 0 a 100. Desenha um traco sob o numero; omitir quando nao houver escala. */
    progresso?: number;
    legenda?: LegendaDoCartaz[];
    /** Uma frase de fechamento, quando o ciclo tem algo a dizer. */
    remate?: string;
    corDoNumero?: string;
}

const TONS: Record<NonNullable<LegendaDoCartaz['tom']>, string> = {
    normal: 'text-white',
    bom: 'text-emerald-300',
    alerta: 'text-amber-300',
};

/**
 * UM NUMERO POR SLIDE, E O RESTO E LEGENDA.
 *
 * A apresentacao do ciclo era seis paineis cinzas em sequencia: o de Execucao
 * empilhava sete blocos do mesmo peso — duas barras, quatro caixas de numero e
 * mais uma barra — e o de Conquistas ocupava 376px de uma area de 626, deixando
 * 250px de preto. Densidade invertida: o primeiro slide sufocava e o do meio era
 * um deserto, e nenhum dos dois dizia o que a pessoa deveria olhar primeiro.
 *
 * Aqui cada slide tem UM protagonista do tamanho de um protagonista, e tudo o
 * mais existe para qualifica-lo. Isso resolve as duas pontas do problema com uma
 * decisao so: o slide cheio passa a ter hierarquia, e o vazio passa a ter escala.
 *
 * O formato tambem e o que separa apresentacao de relatorio. Relatorio se lê
 * varrendo; apresentacao se le num golpe de vista, um quadro de cada vez.
 */
export const SlideCartaz: React.FC<SlideCartazProps> = ({
    titulo,
    numero,
    sufixo,
    rotulo,
    progresso,
    legenda = [],
    remate,
    corDoNumero,
}) => {
    /*
     * O CORPO DO NUMERO CEDE AO COMPRIMENTO DELE.
     *
     * Em 5.6rem fixos, "71" respira e "+1250" encosta nas duas bordas de um
     * telefone de 375px — com o sufixo espremido em cima. O protagonista tem de
     * ser o maior elemento da tela, e nao o mais largo que couber: quem manda no
     * corpo e quantos caracteres ele tem.
     */
    const digitos = String(numero ?? '').length;
    const tamanhoDoNumero = digitos >= 6 ? '3.4rem' : digitos === 5 ? '4.1rem' : digitos === 4 ? '4.9rem' : '5.8rem';

    return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-4 text-center">
        <p className="m-0 text-[10px] font-black uppercase tracking-[0.42em] text-gray-500">{titulo}</p>

        <div className="relative flex flex-col items-center">
            {/* O halo pega a cor da skin de quem le. Ele existe para o numero nao
                flutuar num retangulo preto — e brilho de palco, nao decoracao. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[54px]"
                style={{ background: corDoNumero || 'var(--skin-accent-color)' }}
            />
            <div className="relative z-10 flex items-baseline justify-center gap-1">
                <span
                    className="font-black leading-[0.86] tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
                    style={{ color: corDoNumero || '#ffffff', fontSize: tamanhoDoNumero }}
                >
                    {numero}
                </span>
                {sufixo && (
                    <span className="text-[1.6rem] font-black leading-none tracking-tight text-white/45">{sufixo}</span>
                )}
            </div>

            {typeof progresso === 'number' && (
                <div className="relative z-10 mt-5 h-[3px] w-[180px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                        className="h-full rounded-full transition-[width] duration-1000 ease-out"
                        style={{
                            width: `${Math.max(0, Math.min(100, progresso))}%`,
                            background: corDoNumero || 'var(--skin-accent-color)',
                            boxShadow: `0 0 10px ${corDoNumero || 'var(--skin-accent-color)'}`,
                        }}
                    />
                </div>
            )}

            <p className="relative z-10 mt-4 max-w-[260px] text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
                {rotulo}
            </p>
        </div>

        {legenda.length > 0 && (
            /* Duas colunas, nao quatro caixas: a legenda e para ser conferida
               depois do numero, e nao disputada com ele. Sem moldura, sem fundo —
               so um fio no meio para o olho nao precisar procurar a coluna. */
            <div className="grid w-full max-w-[290px] grid-cols-2 gap-x-5 gap-y-3">
                {legenda.map((item) => (
                    <div key={item.rotulo} className="min-w-0 text-left">
                        <p className="m-0 truncate text-[8.5px] font-black uppercase tracking-[0.2em] text-gray-600">
                            {item.rotulo}
                        </p>
                        <p className={`m-0 truncate text-[1.05rem] font-black leading-tight tabular-nums ${TONS[item.tom || 'normal']}`}>
                            {item.valor}
                        </p>
                        {item.nota && (
                            <p className="m-0 truncate text-[8.5px] font-bold text-gray-600">{item.nota}</p>
                        )}
                    </div>
                ))}
            </div>
        )}

        {remate && (
            <p className="max-w-[280px] text-[11px] font-bold italic leading-relaxed text-white/60">{remate}</p>
        )}
    </div>
    );
};
