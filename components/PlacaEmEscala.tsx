import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * A largura oficial da placa de ciclo: 14.15rem.
 *
 * Ela nasce deste tamanho em TODO lugar — historico, cena do legado,
 * compartilhamento — e e a partir dele que a proporcao existe. Quem precisa de
 * uma placa menor pede uma ESCALA, nunca uma largura diferente.
 */
export const LARGURA_OFICIAL_DA_PLACA = 226.4;

/**
 * A altura que a placa alcanca com o conteudo cheio — trilho, louros, nota,
 * titulo e as quatro metricas.
 *
 * Serve para quem precisa RESERVAR o espaco de uma placa sem ter uma placa:
 * a vaga vazia do ciclo atual, por exemplo. Nao e usada para desenhar placa
 * nenhuma — a altura delas continua vindo do proprio conteudo.
 */
export const ALTURA_OFICIAL_DA_PLACA = 382;

interface PlacaEmEscalaProps {
    /** A largura final desejada, em pixels. A escala sai dela. */
    largura: number;
    className?: string;
    children: React.ReactNode;
}

/**
 * REDUZ A PLACA INTEIRA, E NAO SO A LARGURA DELA.
 *
 * Estreitar a placa NAO a deixa menor: a altura dela vem do conteudo — trilho,
 * louros, nota, titulo e as quatro metricas —, e nao da largura. Colocar a placa
 * num slot de 140px de uma trilha de carrossel produzia 140x328, proporcao 0.43
 * em vez de 0.59: a mesma placa espremida, alta e fina, que e exatamente o que
 * nao pode acontecer com ela.
 *
 * Entao a reducao e por ESCALA, que preserva a proporcao por definicao.
 *
 * O inconveniente da escala e que `transform` nao muda o espaco que o elemento
 * OCUPA: ele continua reservando o tamanho original e estoura o layout. Por isso
 * este involucro assume o tamanho reduzido e esconde o resto.
 *
 * A LARGURA E DECLARADA, e nao herdada. Num primeiro desenho o involucro nao
 * tinha largura propria: ele se media pelo filho, o filho se media por ele, e a
 * placa saia com largura zero. Com `transform-origin` no canto superior esquerdo
 * e a largura cravada, a placa reduzida preenche o involucro exatamente.
 *
 * A ALTURA E MEDIDA, e nao cravada: ela vem do conteudo, e um numero fixo aqui
 * quebraria calado no dia em que aquele componente ganhar mais uma linha.
 */
export const PlacaEmEscala: React.FC<PlacaEmEscalaProps> = ({ largura, className = '', children }) => {
    const alvoRef = useRef<HTMLDivElement | null>(null);
    const [alturaNatural, setAlturaNatural] = useState(0);
    const escala = largura / LARGURA_OFICIAL_DA_PLACA;

    useLayoutEffect(() => {
        const alvo = alvoRef.current;
        if (!alvo) return;
        const medir = () => setAlturaNatural(alvo.offsetHeight);
        medir();
        const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
        observador?.observe(alvo);
        return () => observador?.disconnect();
    }, []);

    return (
        <div
            className={`overflow-hidden ${className}`}
            style={{
                width: `${largura}px`,
                height: alturaNatural ? `${alturaNatural * escala}px` : undefined,
            }}
        >
            <div
                ref={alvoRef}
                style={{
                    width: `${LARGURA_OFICIAL_DA_PLACA}px`,
                    transform: `scale(${escala})`,
                    transformOrigin: 'top left',
                }}
            >
                {children}
            </div>
        </div>
    );
};
