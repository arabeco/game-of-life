import React, { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MasteryWheel } from '../components/MasteryWheel';
import { LIFE_AREAS } from '../constants/lifeAreas';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import '../index.css';
// A roda nao traz o proprio estilo: quem importa mastery-quiz.css e a tela
// (MasteryView, AssetsView). Sem esta linha a bancada mede um componente sem
// clamp e com a fonte errada — e mediria sempre "nenhuma cortada".
import '../views/mastery-quiz.css';

/**
 * A RODA, E A PERGUNTA QUE IMPORTA: A FRASE CABE?
 *
 * Relatado em 05/10/2026 — a frase do degrau escolhido nao aparece inteira, e
 * isso e critico, porque e exatamente o que a pessoa esta escolhendo.
 *
 * Medir isso a olho nao funciona. O `-webkit-line-clamp` corta sem deixar
 * vestigio no layout: a caixa fica do mesmo tamanho e o texto some com
 * reticencias. E contar caractere por linha e chute — a Georgia nao tem largura
 * fixa, e o acento muda o desenho.
 *
 * Entao a pagina pergunta ao navegador: para CADA uma das 55 frases, num molde
 * com a largura e a fonte reais da roda, `scrollHeight > clientHeight`?
 *
 * E ela compara as saidas possiveis lado a lado, para a escolha ser por numero
 * e nao por gosto.
 */

const TODAS = LIFE_AREAS.flatMap((area) =>
    area.levelDescriptions.map((frase, nivel) => ({
        area: area.shortName || area.name,
        nivel,
        frase,
    })),
);

/** Uma saida possivel: o que muda, e quanto de coluna e de altura ela deixa. */
type Candidata = {
    nome: string;
    nota: string;
    /** Largura da coluna da frase, no palco de referencia. */
    coluna: number;
    linhas: number;
    fonte: number;
    alturaLinha: number;
};

/*
 * O palco de referencia e 332px — a largura que a roda recebe num telefone de
 * 393px dentro do painel do quiz, medida no proprio app. Dela saem:
 *
 *   hoje          46px selo + 12 gap + FRASE + 12 gap + 46px vazio + 36 padding
 *   sem o vazio   46px selo + 12 gap + FRASE + 36 padding
 */
const PALCO = 332;
const CANDIDATAS: Candidata[] = [
    {
        nome: 'hoje',
        nota: '3 linhas, e uma coluna vazia de 46px espelhando o selo',
        coluna: PALCO - 36 - 46 - 12 - 46 - 12,
        linhas: 3, fonte: 13.5, alturaLinha: 1.52,
    },
    {
        nome: '4 linhas',
        nota: 'so sobe o clamp; 4 x 20,52 = 82px num item de 84px',
        coluna: PALCO - 36 - 46 - 12 - 46 - 12,
        linhas: 4, fonte: 13.5, alturaLinha: 1.52,
    },
    {
        nome: 'sem a coluna vazia',
        nota: 'a frase ganha os 58px do espelho do selo; continua em 3 linhas',
        coluna: PALCO - 36 - 46 - 12,
        linhas: 3, fonte: 13.5, alturaLinha: 1.52,
    },
    {
        nome: 'sem a coluna vazia + 4 linhas',
        nota: 'as duas juntas',
        coluna: PALCO - 36 - 46 - 12,
        linhas: 4, fonte: 13.5, alturaLinha: 1.52,
    },
];

const Bancada: React.FC = () => {
    const [area, setArea] = useState(0);
    const [nivel, setNivel] = useState(6);
    const [placar, setPlacar] = useState<Array<{ candidata: Candidata; cortadas: number; piores: string[] }>>([]);
    const provaRef = useRef<HTMLDivElement | null>(null);

    /*
     * A medida acontece num molde fora da tela, com as mesmas declaracoes do
     * `.mastery-wheel-frase`. Medir na roda de verdade nao serve: os itens tem
     * transform 3D, e `getBoundingClientRect` devolve o tamanho DEPOIS do
     * scale e do rotateX — foi assim que a primeira leitura desta bancada
     * acusou um item de 28px que o CSS declara com 84.
     */
    useLayoutEffect(() => {
        const prova = provaRef.current;
        if (!prova) return;
        const saida = CANDIDATAS.map((candidata) => {
            const molde = document.createElement('div');
            molde.style.cssText = [
                'position:absolute', 'visibility:hidden', 'left:-9999px',
                `width:${candidata.coluna}px`,
                'font-family:Georgia, "Iowan Old Style", "Noto Serif", "Times New Roman", serif',
                `font-size:${candidata.fonte}px`,
                `line-height:${candidata.alturaLinha}`,
                'letter-spacing:0.006em',
                'display:-webkit-box', '-webkit-box-orient:vertical',
                `-webkit-line-clamp:${candidata.linhas}`, 'overflow:hidden',
            ].join(';');
            prova.appendChild(molde);

            const cortadas: string[] = [];
            TODAS.forEach(({ area: a, frase }) => {
                molde.textContent = frase;
                if (molde.scrollHeight - molde.clientHeight > 1) cortadas.push(`${a} · ${frase}`);
            });
            prova.removeChild(molde);
            return { candidata, cortadas: cortadas.length, piores: cortadas.slice(0, 3) };
        });
        setPlacar(saida);
    }, []);

    return (
        <>
            <header>
                <h1>A roda dos níveis</h1>
                <p>
                    A <code>MasteryWheel</code> de verdade, com as frases de verdade. Abaixo, a
                    pergunta medida: das <strong>{TODAS.length}</strong> frases do app, quantas não
                    cabem? O palco de referência é <code>{PALCO}px</code> — a largura que a roda
                    recebe num telefone de 393px dentro do painel do quiz.
                </p>
            </header>

            {/*
              * A ESCADA INTEIRA, DE UMA VEZ.
              *
              * A roda mostra tres degraus por vez, e a subida de nobreza so se le
              * comparando — que e justamente o que rolar nao deixa fazer. Aqui os
              * onze selos de cada area ficam lado a lado, com as classes de
              * verdade, e o ultimo de cada fileira aceso como o degrau em foco.
              */}
            <div className="medida" style={{ marginTop: 0, marginBottom: 22 }}>
                <h2>A escada dos selos</h2>
                {LIFE_AREAS.map((a) => (
                    <div
                        key={a.id}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0',
                            ['--mastery-accent' as string]:
                                (ASSET_ACCENT_COLORS as Record<string, string>)[a.id] || '#C9A84C',
                        }}
                    >
                        <span style={{ width: 82, fontSize: 10, letterSpacing: '.1em', color: '#8d95a1' }}>
                            {a.shortName || a.name}
                        </span>
                        {Array.from({ length: a.levelDescriptions.length }, (_, n) => (
                            <span
                                key={n}
                                className={`mastery-wheel-item${n === a.levelDescriptions.length - 1 ? ' is-focado' : ''}`}
                                style={{
                                    ['--nobreza' as string]: n / (a.levelDescriptions.length - 1),
                                    display: 'inline-grid', width: 'auto', height: 'auto',
                                    padding: 0, gridTemplateColumns: 'auto', cursor: 'default',
                                }}
                            >
                                <span className="mastery-wheel-selo">{n}</span>
                            </span>
                        ))}
                    </div>
                ))}
            </div>

            <div className="molduras">
                <div className="moldura" style={{ width: PALCO + 20 }}>
                    <h2>A roda</h2>
                    <p className="nota">{LIFE_AREAS[area].name} · degrau {nivel}</p>
                    {/* A cor da area chega pela tela, nao pela roda: MasteryView
                        publica `--mastery-accent` no container. Sem isto a liga
                        dos selos e o metal do fundo ficam invalidos e a escada
                        de nobreza some — a bancada mostraria uma roda apagada
                        que o app nunca desenha. */}
                    <div
                        className="palco"
                        style={{
                            ['--mastery-accent' as string]:
                                (ASSET_ACCENT_COLORS as Record<string, string>)[LIFE_AREAS[area].id] || '#C9A84C',
                        }}
                    >
                        <MasteryWheel
                            key={LIFE_AREAS[area].id}
                            compacto
                            niveis={LIFE_AREAS[area].levelDescriptions.length - 1}
                            selecionado={nivel}
                            frases={[...LIFE_AREAS[area].levelDescriptions]}
                            onSelecionar={setNivel}
                            hapticos={false}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        {LIFE_AREAS.map((a, i) => (
                            <button
                                key={a.id}
                                onClick={() => setArea(i)}
                                style={{
                                    padding: '4px 9px', borderRadius: 8, fontSize: 11,
                                    border: '1px solid ' + (i === area ? '#d8b44c' : '#2b3038'),
                                    background: i === area ? '#241f12' : '#14181d',
                                    color: i === area ? '#e6c76a' : '#8d95a1', cursor: 'pointer',
                                }}
                            >
                                {a.shortName || a.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="medida">
                <h2>Quantas frases não cabem</h2>
                <table>
                    <thead>
                        <tr><th>Saída</th><th>Coluna</th><th>Linhas</th><th>Cortadas</th><th>O que muda</th></tr>
                    </thead>
                    <tbody>
                        {placar.map(({ candidata, cortadas }) => (
                            <tr key={candidata.nome}>
                                <td>{candidata.nome}</td>
                                <td>{candidata.coluna}px</td>
                                <td>{candidata.linhas}</td>
                                <td className={cortadas > 0 ? 'corta' : 'cabe'}>
                                    {cortadas > 0 ? `${cortadas} de ${TODAS.length}` : 'nenhuma'}
                                </td>
                                <td className="cabe">{candidata.nota}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {placar.filter((p) => p.cortadas > 0).map(({ candidata, piores }) => (
                    <p key={candidata.nome} className="nota" style={{ fontSize: 11, color: '#6f7883', marginTop: 8 }}>
                        <strong>{candidata.nome}</strong> corta, por exemplo: {piores.join(' / ')}
                    </p>
                ))}
            </div>

            <div ref={provaRef} aria-hidden="true" />
        </>
    );
};

createRoot(document.getElementById('raiz')!).render(<Bancada />);
