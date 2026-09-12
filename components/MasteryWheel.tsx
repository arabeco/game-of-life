import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { PONTOS_POR_DEGRAU } from '../constants/lifeAreas';
import { safeVibrate } from '../utils/safeVibrate';

/**
 * A RODA DOS NIVEIS.
 *
 * A escala anterior ja tinha resolvido o problema de informacao: dez botoes
 * iguais empilhados obrigavam a ler dez paragrafos, e nenhum dizia onde a pessoa
 * estava em relacao aos outros. Mostrar a de cima, a sua e a de baixo resolveu
 * isso — mas as outras sete SUMIAM, e sumir e diferente de ficar ao fundo.
 *
 * Aqui as dez existem o tempo todo, e o que se distribui e a ATENCAO: a escolhida
 * inteira, as vizinhas de leve, o resto como sombra. E o cilindro do seletor de
 * hora do telefone, e o motivo de ele funcionar nao e enfeite: a pessoa ve que a
 * escada continua para os dois lados sem que isso dispute com a decisao.
 *
 * O ANGULO CARREGA A DISTANCIA. Cada passo do centro inclina o item para longe e
 * o encolhe, entao "quao fundo na roda" e legivel sem contar linhas. A opacidade
 * cai numa curva (1 / (1 + d²·1.9)) e nao em degraus fixos, porque degrau daria
 * um salto visivel entre a segunda e a terceira posicao.
 *
 * QUEM MANDA E O SCROLL, e nao o React. O transform de cada item e escrito
 * direto no DOM dentro do rAF: passar isso por estado re-renderizaria dez
 * componentes a cada quadro de rolagem, e o seletor engasgaria justamente
 * enquanto o dedo esta nele. O React so entra quando o item central MUDA.
 *
 * Por isso `pintar` precisa ser ESTAVEL. Enquanto ele se recriava a cada render,
 * o cleanup do efeito cancelava o quadro pendente sem zerar a referencia — e
 * `aoRolar`, que desiste quando ja existe um quadro marcado, parava de agendar
 * qualquer coisa. A roda rolava e nao se redesenhava mais.
 */

interface MasteryWheelProps {
    /** O degrau mais alto da area. A roda mostra de 0 ate ele. */
    niveis: number;
    /** O degrau escolhido, de 0 a `niveis`. */
    selecionado: number;
    frases: string[];
    onSelecionar: (nivel: number) => void;
    /** Fractional visual preview only; never persisted as an assessment answer. */
    onVisualizar?: (nivel: number) => void;
    compacto?: boolean;
    /** Respeita a preferencia do usuario; o toque so acontece se ele quis. */
    hapticos?: boolean;
}

/** Altura de cada item, em px. Precisa ser fixa: e ela que ancora o snap. */
const ALTURA = 84;
/** Quantos itens cabem na janela. Impar, para haver um centro de verdade. */
const JANELA = 5;

export const MasteryWheel: React.FC<MasteryWheelProps> = ({
    niveis,
    selecionado,
    frases,
    onSelecionar,
    onVisualizar,
    compacto = false,
    hapticos = true,
}) => {
    const trilhoRef = useRef<HTMLDivElement | null>(null);
    const rodaRef = useRef<HTMLDivElement | null>(null);
    const emitidoRef = useRef<number | null>(null);
    const previewRef = useRef(onVisualizar);
    const ultimoPreviewRef = useRef(-1);
    previewRef.current = onVisualizar;
    const itensRef = useRef<Array<HTMLButtonElement | null>>([]);
    const quadroRef = useRef<number | null>(null);
    /** Conta o silencio depois do gesto: e quando o encaixe pode agir. */
    const repousoRef = useRef<number | null>(null);
    /**
     * Enquanto rolamos por causa de um clique, o proprio scroll nao pode
     * "escolher" de volta — os dois se empurrariam e o seletor tremeria.
     */
    const rolandoPorCodigoRef = useRef(false);
    const ultimoCentroRef = useRef(selecionado);
    const jaPosicionouRef = useRef(false);
    /** O pai recria o callback a cada render; a ref mantem `pintar` estavel. */
    const onSelecionarRef = useRef(onSelecionar);
    const hapticosRef = useRef(hapticos);
    const gestoRef = useRef(false);
    const ultimoToqueRef = useRef(-Infinity);
    onSelecionarRef.current = onSelecionar;
    hapticosRef.current = hapticos;

    // Short detents, spaced apart even during a fast fling. Never buzz on mount.
    const tocar = useCallback((nivel: number, total: number) => {
        const agora = performance.now();
        if (!gestoRef.current || !hapticosRef.current || agora - ultimoToqueRef.current < 75) return;
        ultimoToqueRef.current = agora;
        // A escada comeca no ZERO, entao o degrau ja e a propria posicao: com o
        // `nivel - 1` de antes, o abandono pedia uma vibracao negativa.
        safeVibrate(Math.round(7 + 5 * nivel / Math.max(1, total - 1)));
    }, []);

    /** De 0 no degrau mais baixo a 1 no topo. E o que decide a liga do selo. */
    const nobrezaDe = useCallback(
        (nivel: number) => (niveis > 0 ? nivel / niveis : 1),
        [niveis],
    );

    /** Do maior para o menor: o topo da escada em cima, onde se espera que esteja.
     *  Vai ate o ZERO, que e o degrau do abandono e existe como escolha. */
    const ordem = useMemo(
        () => Array.from({ length: niveis + 1 }, (_, i) => niveis - i),
        [niveis],
    );

    /** Redesenha a perspectiva a partir de onde o scroll esta agora. */
    const pintar = useCallback(() => {
        const trilho = trilhoRef.current;
        if (!trilho) return;
        const centro = trilho.scrollTop / ALTURA;
        const visual = Math.max(1, Math.min(ordem.length, ordem.length - centro));
        const nobreza = ordem.length > 1 ? (visual - 1) / (ordem.length - 1) : 1;
        rodaRef.current?.style.setProperty('--nobreza-atual', String(nobreza));
        // Quantized to 1/20 step: smooth pentagon without insignificant renders.
        const preview = Math.round(visual * 20) / 20;
        if (preview !== ultimoPreviewRef.current) {
            ultimoPreviewRef.current = preview;
            previewRef.current?.(preview);
        }

        itensRef.current.forEach((item, indice) => {
            if (!item) return;
            const d = indice - centro;
            const distancia = Math.abs(d);
            // A curva, e nao degraus: entre a segunda e a terceira posicao um
            // degrau fixo daria um salto que o olho pega.
            const opacidade = Math.max(0.05, 1 / (1 + distancia * distancia * 0.35));
            const escala = Math.max(0.72, 1 - distancia * 0.11);
            const giro = Math.max(-62, Math.min(62, -d * 23));
            item.style.opacity = String(opacidade);
            item.style.transform = `translateZ(-${distancia * 26}px) rotateX(${giro}deg) scale(${escala})`;
            // Longe do centro o item vira cenario: nao deve receber o toque que
            // era para a escolha do meio.
            item.style.pointerEvents = distancia > 2.2 ? 'none' : 'auto';
            item.classList.toggle('is-focado', distancia < 0.5);

            // A escolha central tem prioridade, mas as frases vizinhas continuam
            // legiveis para comparar os degraus antes de arrastar.
            const frase = item.querySelector<HTMLElement>('.mastery-wheel-frase');
            if (frase) frase.style.opacity = String(Math.max(0, 1 - distancia * 0.1));
        });

        const maisProximo = Math.round(centro);
        const nivel = ordem[Math.max(0, Math.min(ordem.length - 1, maisProximo))];
        if (nivel !== undefined && nivel !== ultimoCentroRef.current) {
            ultimoCentroRef.current = nivel;
            if (!rolandoPorCodigoRef.current) {
                // O toque a cada item que passa e metade da sensacao do seletor:
                // sem ele a roda parece uma lista que por acaso desliza.
                tocar(nivel, ordem.length);
                emitidoRef.current = nivel;
                onSelecionarRef.current(nivel);
            }
        }
    }, [ordem, tocar]);

    /**
     * O ENCAIXE, quando o snap nativo nao entrega.
     *
     * `scroll-snap-type` deveria bastar, e em geral basta — mas ele depende do
     * navegador reconhecer que o gesto terminou, e o WebView do Android erra
     * isso com alguma frequencia, sobretudo depois de um scroll programatico.
     * Quando erra, o item central fica meio passo fora da faixa de foco: a roda
     * parece torta e a pessoa nao sabe o que escolheu.
     *
     * Este assentar so age quando ja ha diferenca visivel, e sempre para o item
     * MAIS PROXIMO — nunca muda a escolha, so termina o movimento que o dedo
     * comecou.
     */
    const assentar = useCallback(() => {
        const trilho = trilhoRef.current;
        if (!trilho) return;
        const alvo = Math.round(trilho.scrollTop / ALTURA) * ALTURA;
        if (Math.abs(trilho.scrollTop - alvo) < 1.5) return;
        const suave = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        trilho.scrollTo({ top: alvo, behavior: suave ? 'smooth' : 'auto' });
    }, []);

    const aoRolar = useCallback(() => {
        if (repousoRef.current !== null) window.clearTimeout(repousoRef.current);
        repousoRef.current = window.setTimeout(assentar, 140);

        if (quadroRef.current !== null) return;
        quadroRef.current = window.requestAnimationFrame(() => {
            quadroRef.current = null;
            pintar();
        });
    }, [pintar, assentar]);

    /** Leva a roda ate o nivel escolhido de fora (teclado, ou troca de area). */
    useEffect(() => {
        // A parent's echo of our drag must not start a competing smooth scroll.
        if (emitidoRef.current === selecionado) {
            emitidoRef.current = null;
            return;
        }
        const trilho = trilhoRef.current;
        if (!trilho) return;
        const alvo = ordem.indexOf(selecionado) * ALTURA;
        if (alvo < 0) return;
        if (Math.abs(trilho.scrollTop - alvo) < 2) return;

        rolandoPorCodigoRef.current = true;
        ultimoCentroRef.current = selecionado;

        // A PRIMEIRA POSICAO E INSTANTANEA. Animar a abertura faria a roda entrar
        // girando sozinha, como se algo tivesse acontecido — e nada aconteceu, a
        // pessoa so chegou na tela. Depois disso, o movimento e resposta a um
        // gesto e merece ser visto.
        const semAnimacao = !jaPosicionouRef.current
            || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
        jaPosicionouRef.current = true;
        trilho.scrollTo({ top: alvo, behavior: semAnimacao ? 'auto' : 'smooth' });
        pintar();

        // O scroll suave nao avisa quando termina; 420ms cobre a animacao do
        // navegador com folga, e soltar a trava tarde e melhor que solta-la cedo.
        const solta = window.setTimeout(() => {
            rolandoPorCodigoRef.current = false;
            pintar();
        }, semAnimacao ? 0 : 420);
        return () => window.clearTimeout(solta);
    }, [selecionado, ordem, pintar]);

    /** A primeira pintura, antes de qualquer rolagem. */
    useEffect(() => {
        pintar();
        return () => {
            if (quadroRef.current !== null) {
                window.cancelAnimationFrame(quadroRef.current);
                // Zerar aqui e o que mantem `aoRolar` vivo depois de um
                // re-render: ele desiste quando ja existe um quadro marcado.
                quadroRef.current = null;
            }
            if (repousoRef.current !== null) {
                window.clearTimeout(repousoRef.current);
                repousoRef.current = null;
            }
        };
    }, [pintar]);

    const janela = compacto ? 3 : JANELA;
    const respiro = ((janela - 1) / 2) * ALTURA;

    return (
        <div
            className="mastery-wheel"
            ref={rodaRef}
            style={{ ['--altura-item' as string]: `${ALTURA}px`, height: `${janela * ALTURA}px` }}
        >
            {/* A moldura do meio diz onde a escolha acontece, sem precisar de
                seta nem de rotulo: a faixa iluminada e o lugar. */}
            <div className="mastery-wheel-foco" aria-hidden="true" />

            <div
                className="mastery-wheel-trilho"
                ref={trilhoRef}
                onScroll={aoRolar}
                onPointerDown={() => { gestoRef.current = true; }}
                onWheel={() => { gestoRef.current = true; }}
                onKeyDown={() => { gestoRef.current = true; }}
                role="radiogroup"
                aria-label="Nível"
            >
                <div style={{ height: respiro }} aria-hidden="true" />
                {ordem.map((nivel, indice) => (
                    <button
                        key={nivel}
                        type="button"
                        role="radio"
                        aria-checked={nivel === selecionado}
                        aria-label={`Nível ${nivel * PONTOS_POR_DEGRAU}: ${frases[nivel] || ''}`}
                        ref={(node) => { itensRef.current[indice] = node; }}
                        className="mastery-wheel-item"
                        onClick={() => {
                            gestoRef.current = true;
                            if (nivel !== selecionado) tocar(nivel, niveis);
                            onSelecionar(nivel);
                        }}
                        /**
                         * A NOBREZA DO DEGRAU, de 0 a 1.
                         *
                         * O selo nao e a mesma peca em todos os niveis: embaixo e
                         * liga fosca, e vai virando o metal da area conforme sobe.
                         * A escada ja diz isso em palavras — vai de Negligencia a
                         * Obra — e a peca passa a dizer junto, antes da leitura.
                         *
                         * E a mistura mexe na SATURACAO do acento da area, nunca
                         * troca de cor: Saude continua sendo Saude no degrau 2 e
                         * no 20, so mais fosca embaixo.
                         */
                        style={{ ['--nobreza' as string]: nobrezaDe(nivel) }}
                    >
                        {/* O numero vira SELO, e nao rotulo em cima da frase: e a
                            peca que a pessoa cata na roda. O aria-label carrega a
                            palavra que o desenho pode dispensar. */}
                        <span className="mastery-wheel-selo" aria-hidden="true">
                            {nivel * PONTOS_POR_DEGRAU}
                        </span>
                        <span className="mastery-wheel-frase">{frases[nivel]}</span>
                    </button>
                ))}
                <div style={{ height: respiro }} aria-hidden="true" />
            </div>
        </div>
    );
};
