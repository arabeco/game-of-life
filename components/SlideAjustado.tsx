import React, { useLayoutEffect, useRef, useState } from 'react';

interface SlideAjustadoProps {
    /** Muda quando o conteudo muda, para o ajuste ser refeito do zero. */
    chave: React.Key;
    className?: string;
    children: React.ReactNode;
}

/**
 * O SLIDE CABE NA TELA. SEM ROLAGEM, SEM CORTE.
 *
 * A area de slide do relatorio tinha `overflow-y-auto`: o que nao coubesse virava
 * rolagem. Numa tela de 812px isso dava 569px de area util contra 777px de
 * conteudo no slide do resumo — a placa saia cortada no meio e aparecia uma
 * barrinha de rolagem atravessada numa APRESENTACAO. Apresentacao nao rola: cada
 * slide e um quadro inteiro, ou nao e um quadro.
 *
 * Trocar por `overflow: hidden` resolveria a barra e pioraria o resto, porque o
 * que sobra passa a ser cortado calado. Entao aqui o slide e MEDIDO e reduzido
 * ate caber: nada sai da tela e nada fica escondido.
 *
 * A reducao so acontece quando precisa — `Math.min(1, ...)`. Um slide curto fica
 * no tamanho natural e centralizado, e nao esticado para preencher: esticar
 * tipografia para ocupar espaco e o oposto de compor.
 *
 * As duas medidas sao observadas, e nao cravadas: a altura util muda com o
 * aparelho (85vh) e a altura do conteudo muda com o ciclo — um ciclo com quatro
 * conquistas e mais alto que um sem nenhuma.
 */
export const SlideAjustado: React.FC<SlideAjustadoProps> = ({ chave, className = '', children }) => {
    const caixaRef = useRef<HTMLDivElement | null>(null);
    const alvoRef = useRef<HTMLDivElement | null>(null);
    const [escala, setEscala] = useState(1);
    /*
     * A ALTURA UTIL E PUBLICADA COMO VARIAVEL.
     *
     * Um slide-cartaz quer PREENCHER a tela, e nao boiar nela: com a moldura
     * propria, um quadro de 406px no meio de 626 lia como um cartao solto num
     * retangulo preto. Mas ele nao pode simplesmente pedir `height: 100%` — o
     * involucro aqui tem altura automatica de proposito, porque e dela que sai a
     * medida natural do conteudo.
     *
     * Entao a caixa publica quanto ha, e quem quiser preencher usa isso como
     * PISO. Continua sendo o conteudo quem manda: um slide mais alto que a area
     * ignora o piso e e reduzido como qualquer outro.
     */
    const [alturaUtil, setAlturaUtil] = useState(0);

    useLayoutEffect(() => {
        const caixa = caixaRef.current;
        const alvo = alvoRef.current;
        if (!caixa || !alvo) return;

        const medir = () => {
            const disponivel = caixa.clientHeight;
            // `offsetHeight` ignora transform, entao continua sendo a altura
            // NATURAL mesmo com o slide ja reduzido — sem isto a medida se
            // realimentaria e a escala nunca estabilizaria.
            const natural = alvo.offsetHeight;
            if (!disponivel || !natural) return;
            setAlturaUtil(disponivel);
            setEscala(Math.min(1, disponivel / natural));
        };

        medir();
        const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
        observador?.observe(caixa);
        observador?.observe(alvo);
        return () => observador?.disconnect();
    }, [chave]);

    return (
        <div ref={caixaRef} className={`flex h-full w-full items-center justify-center overflow-hidden ${className}`}>
            <div
                ref={alvoRef}
                className="w-full shrink-0"
                style={{
                    transform: `scale(${escala})`,
                    transformOrigin: 'center center',
                    ['--altura-do-slide' as string]: alturaUtil ? `${alturaUtil}px` : undefined,
                }}
            >
                {children}
            </div>
        </div>
    );
};
