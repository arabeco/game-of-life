import React from 'react';

/**
 * As QUATRO direcoes da placa, no codigo.
 *
 * Elas existiam so em `docs/drafts/reward-modal-4-direcoes.html`, uma folha
 * estatica com conteudo de mentira. Comparar direcao ali e comparar maquete:
 * a de patente com seis itens cabia, a de resgate com quatro metricas nao, e
 * isso so aparece com o payload de verdade.
 *
 * Aqui as quatro sao aplicaveis ao componente REAL, pelo prop `direcao` do
 * RewardPackModal. Os valores sao copia literal do bloco de cada direcao na
 * folha — nao aproximacao, nao "inspirado em". Quem quiser mudar o desenho
 * muda aqui e ve no aparelho, com o conteudo que o jogo entrega.
 *
 * B (monolito) e a aprovada. As outras tres continuam de pe porque a decisao
 * pode voltar atras, e porque comparar exige ter as quatro vivas.
 */

export type DirecaoDaPlaca = 'A' | 'B' | 'C' | 'D';

// Proporcao comum dos modais: 1:1,7. No app a referencia e 368 x 626.
// O terceiro termo reduz largura e altura
// juntos em aparelhos baixos; por isso a placa nunca vira uma tela cheia
// espremida nem perde a silhueta vertical.
export const REWARD_PLATE_VIEWPORT_STYLE: React.CSSProperties = {
    width: 'min(368px, calc(100vw - 32px), calc((100svh - 40px) * 0.588235))',
    aspectRatio: '10 / 17',
    maxHeight: 'calc(100svh - 40px)',
};

type EstiloDaPlaca = {
    nome: string;
    /** Estilo da placa. `rgb` e o tom do acontecimento. */
    placa: (rgb: string) => React.CSSProperties;
    /** Estilo do suporte do emblema. */
    crest: (rgb: string) => React.CSSProperties;
    /** Recorte do botao da skin. */
    botao: React.CSSProperties;
    /** Padding da placa, em Tailwind. */
    respiro: string;
};

const fundoComTom = (rgb: string, base: string) => [
    `radial-gradient(ellipse at 50% -6%, rgba(${rgb},.16), transparent 42%)`,
    `linear-gradient(145deg, rgba(${rgb},.055), transparent 35%, rgba(${rgb},.025) 72%, transparent)`,
    base,
].join(', ');

export const DIRECOES: Record<DirecaoDaPlaca, EstiloDaPlaca> = {
    // A — Fissura: chanfro assimetrico, sombra solida so de um lado.
    A: {
        nome: 'A · Fissura',
        respiro: 'px-[22px] pb-5 pt-6',
        placa: (rgb) => ({
            border: '1px solid #424548',
            background: fundoComTom(rgb, 'linear-gradient(160deg, #181a1d, #08090b 58%, #0e1012)'),
            boxShadow: '-7px 9px 0 #060708, 0 28px 78px #000',
            clipPath: 'polygon(0 32px, 32px 0, 100% 0, 100% calc(100% - 46px), calc(100% - 46px) 100%, 0 100%)',
        }),
        crest: () => ({
            border: '1px solid #5b5e62',
            background: 'linear-gradient(155deg, #17191c, #060708 62%)',
            clipPath: 'polygon(50% 0, 100% 32%, 82% 100%, 18% 100%, 0 32%)',
        }),
        botao: { clipPath: 'polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)' },
    },

    // B — Monolito Central: a aprovada. Placa espessa, chanfro simetrico,
    // tres aneis por dentro e duas sombras solidas deslocadas.
    B: {
        nome: 'B · Monolito Central',
        respiro: 'px-7 pb-[26px] pt-[30px]',
        placa: (rgb) => ({
            border: '3px solid #56585a',
            background: fundoComTom(rgb, 'linear-gradient(160deg, #1a1c1f, #090a0c 58%, #111315)'),
            boxShadow: [
                'inset 0 0 0 5px #090b0d',
                'inset 0 0 0 6px #33363a',
                'inset 0 0 0 9px #0b0d0f',
                '9px 11px 0 #050607',
                '12px 14px 0 #24272a',
                '0 30px 86px #000',
                `0 0 32px rgba(${rgb},.055)`,
            ].join(', '),
            clipPath:
                'polygon(0 28px, 28px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 28px), calc(100% - 28px) 100%, 28px 100%, 0 calc(100% - 28px))',
        }),
        crest: (rgb) => ({
            border: `1px solid ${rgb ? `rgba(${rgb},.55)` : '#5b5e62'}`,
            background: 'linear-gradient(135deg, #191c20, #07090b 68%)',
            boxShadow: 'inset 0 0 0 5px #080a0c, inset 0 0 0 6px #30343a, 5px 6px 0 #050607',
            clipPath: 'polygon(18% 0, 82% 0, 100% 18%, 100% 82%, 82% 100%, 18% 100%, 0 82%, 0 18%)',
        }),
        botao: { clipPath: 'polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)' },
    },

    // C — Santuario estratificado: ombro no topo, dois fios internos.
    C: {
        nome: 'C · Santuário',
        respiro: 'px-[22px] pb-5 pt-6',
        placa: (rgb) => ({
            border: '1px solid #414449',
            background: fundoComTom(rgb, 'linear-gradient(160deg, #181a1d, #08090b 58%, #0e1012)'),
            boxShadow: '0 30px 85px #000, inset 0 0 0 7px #0c0e10, inset 0 0 0 8px #282b2e',
            clipPath:
                'polygon(38px 0, calc(100% - 38px) 0, 100% 55px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0 calc(100% - 22px), 0 55px)',
        }),
        crest: () => ({
            border: '1px solid #5b5e62',
            background: 'linear-gradient(145deg, #17191c, #060708)',
            clipPath: 'polygon(50% 0, 94% 26%, 94% 74%, 50% 100%, 6% 74%, 6% 26%)',
        }),
        botao: { clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)' },
    },

    // D — Bipartido: costura metalica no eixo central.
    D: {
        nome: 'D · Bipartido',
        respiro: 'px-[22px] pb-5 pt-6',
        placa: (rgb) => ({
            border: '1px solid #42464a',
            background: [
                `radial-gradient(ellipse at 50% 0, rgba(${rgb},.06), transparent 38%)`,
                'linear-gradient(90deg, #14171a, #07090a 49.7%, #111316 50.3%, #090b0d)',
            ].join(', '),
            boxShadow: '0 28px 76px #000, inset 0 0 0 6px #0a0c0e',
            clipPath:
                'polygon(22px 0, calc(100% - 22px) 0, 100% 22px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0 calc(100% - 22px), 0 22px)',
        }),
        crest: () => ({
            border: '1px solid #5b5e62',
            background: 'linear-gradient(135deg, #181a1d, #070809 65%)',
            clipPath: 'polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)',
        }),
        botao: { clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' },
    },
};

export const DIRECAO_PADRAO: DirecaoDaPlaca = 'B';
