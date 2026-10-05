import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AssetPentagon } from '../components/AssetPentagon';
import { LIFE_AREAS, MASTERY_AREA_MAX_LEVEL } from '../constants/lifeAreas';
import { MASTERY_BADGE_CUTS } from '../constants/masteryBadgeTiers';
import '../index.css';

/**
 * O componente e o DE VERDADE. O que varia aqui e so o `tempLevels`, que e
 * exatamente por onde a tela de maestria alimenta o pentagono enquanto o dedo
 * arrasta — entao o que aparece nesta pagina e o que o app desenha.
 */

/** Distribui uma maestria alvo entre as cinco areas, o mais parelho possivel. */
const espalhar = (maestria: number): Record<string, number> => {
    const alvo = Math.max(0, Math.min(MASTERY_AREA_MAX_LEVEL * 5, maestria));
    const base = Math.floor(alvo / 5);
    const sobra = alvo - base * 5;
    const saida: Record<string, number> = {};
    LIFE_AREAS.forEach((area, i) => { saida[area.id] = Math.min(MASTERY_AREA_MAX_LEVEL, base + (i < sobra ? 1 : 0)); });
    return saida;
};

const ATIVOS = LIFE_AREAS.map((area) => ({ ...area, level: 0 })) as any[];

/*
 * HOJE x COM ANEL, LADO A LADO, NA MESMA FAIXA.
 *
 * "Hoje" e o `centralStyle="plain"` que a tela de maestria usa de verdade — a
 * bancada mostrava o padrao `badge`, que nao e o que o app desenha. "Com anel"
 * e a proposta: aro com o metal e a espessura da faixa, veu atras do glifo, e
 * segundo aro a partir do 50.
 */
const Degrau: React.FC<{ nivel: number; nota: string }> = ({ nivel, nota }) => (
    <div className="degrau">
        <h2>Nível {nivel}</h2>
        <p>{nota}</p>
        <div className="par">
            <figure>
                <div className="palco">
                    <AssetPentagon assets={ATIVOS} tempLevels={espalhar(nivel / 2)} centralStyle="plain" size="100%" />
                </div>
                <figcaption>hoje</figcaption>
            </figure>
            <figure>
                <div className="palco">
                    <AssetPentagon assets={ATIVOS} tempLevels={espalhar(nivel / 2)} centralStyle="anel" size="100%" />
                </div>
                <figcaption className="proposta">com anel</figcaption>
            </figure>
        </div>
    </div>
);

function Bancada() {
    const [vivo, setVivo] = useState(46);

    // Um por faixa: o teto de cada uma e o piso da seguinte.
    const amostras: Array<[number, string]> = [
        [8, 'ferro — abaixo de 25'],
        [24, 'ferro, último antes do corte'],
        [25, 'bronze entra'],
        [50, 'prata entra, e o anel duplo'],
        [75, 'ouro entra'],
        [90, 'a penúltima, onde quase ninguém chega'],
        [100, 'a coroa'],
    ];

    return (
        <>
            <header>
                <h1>O número do meio</h1>
                <p>
                    A bolinha troca de metal e de acabamento em <code>{MASTERY_BADGE_CUTS.join(', ')}</code>.
                    O número nunca apaga — em toda faixa ele usa o tom mais claro do metal, porque
                    quem está em 8 precisa ler o 8 tão bem quanto quem está em 96 lê o 96.
                </p>
            </header>

            <div className="controles">
                <label>
                    Arrastar o nível: <b>{vivo}</b> (maestria {Math.round(vivo / 2)}/50)
                    <input type="range" min={0} max={100} step={2} value={vivo}
                           onChange={(e) => setVivo(Number(e.target.value))} />
                </label>
                <div className="vivo">
                    <div className="par">
                        <figure>
                            <div className="palco">
                                <AssetPentagon assets={ATIVOS} tempLevels={espalhar(vivo / 2)} centralStyle="plain" size="100%" />
                            </div>
                            <figcaption>hoje</figcaption>
                        </figure>
                        <figure>
                            <div className="palco">
                                <AssetPentagon assets={ATIVOS} tempLevels={espalhar(vivo / 2)} centralStyle="anel" size="100%" />
                            </div>
                            <figcaption className="proposta">com anel</figcaption>
                        </figure>
                    </div>
                </div>
            </div>

            <div className="escada">
                {amostras.map(([nivel, nota]) => <Degrau key={nivel} nivel={nivel} nota={nota} />)}
            </div>
        </>
    );
}

createRoot(document.getElementById('raiz')!).render(<Bancada />);
