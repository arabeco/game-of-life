// O CSS do app, para os componentes reais renderizarem como renderizam no jogo.
// Sem ele as classes do Tailwind nao aplicam e o modal de recompensa aparece
// aqui com a arte em tamanho natural, estourando o layout — a pagina provaria
// errado justamente o que existe para provar.
import '../index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CanvasAvatar } from '../components/CanvasAvatar';
import { AVATAR_OFFSETS } from '../constants/avatarOffsets';
import { ITEMS_DB } from '../constants/items';
import { HAIR_DB } from '../constants/skins';
import { getChestArtUrl } from '../constants/catalogAssets';
import { getRarityVisual, getChestVisual, getChestDisplayName } from '../constants/rarityVisuals';
import { ItemArt } from '../components/ItemArt';
import { ValorIcon } from '../components/ValorIcon';
import { RewardPackModal } from '../components/RewardPackModal';
import { RewardPackBody } from '../components/RewardPackBody';
import { buildAchievementRewardPayload } from '../utils/achievementRewardPayload';
import { getRewardEmblemUrl, getRewardToneRgb } from '../constants/rewardEmblems';
import { DIRECOES, type DirecaoDaPlaca } from '../constants/rewardPlateStyles';
import { buildRedeemRewardPayload } from '../utils/redeemRewardPresentation';
import { buildCycleRewardPayload } from '../utils/chestRewardPresentation';
import type { Valor } from '../components/ValorIcon';

/**
 * Prova o COMPONENTE, nao a conta.
 *
 * tools/avatar-align.html reimplementa o desenho para poder editar ao vivo, e os
 * testes cobrem os helpers isolados. Nenhum dos dois prova que o CanvasAvatar —
 * o componente que o jogo usa de verdade — le a tabela e desenha certo. Esta
 * pagina monta o componente real, com os dados reais.
 *
 * Fora do build: o Vite so empacota o index.html da raiz. Com `npm run dev`, em
 * /tools/avatar-preview.html
 */

const roupas = ITEMS_DB.filter((i) => i.category === 'skin' && i.imageUrl).map((i) => i.id);
const cabelos = HAIR_DB.map((h) => h.id);
const corpos = ['body_masc_1', 'body_masc_3', 'body_fem_5'];

const Celula: React.FC<{ corpo: string; outfit: string; hair: string; rotulo: string }> = ({
    corpo, outfit, hair, rotulo,
}) => (
    <figure style={{ margin: 0, textAlign: 'center' }}>
        <CanvasAvatar
            width={220}
            height={220}
            sovereignConfig={{
                body: corpo,
                skinTone: '1',
                hairStyle: hair,
                hairColor: '1',
                outfit,
                artifact: 'none',
                glyph: 'none',
                aura: 'none',
                orb: 'none',
                sovereignPlate: 'none',
                artifactPlate: 'none',
                glyphPlate: 'none',
            } as never}
            className="quadro"
        />
        <figcaption>{rotulo}</figcaption>
    </figure>
);

/**
 * As seis apresentacoes da mesma placa.
 *
 * Cada uma monta o payload pelo MESMO caminho que o app usa — o construtor do
 * feito ou um payload literal como o do resgate — para a bancada nao virar uma
 * maquete que concorda consigo mesma.
 */
/** As categorias do catalogo, na ordem em que fazem sentido olhar. */
const CATEGORIAS: Array<[string, string]> = [
    ['skin', 'Skins'],
    ['hair', 'Cabelos'],
    ['insignia', 'Insignias'],
    ['border', 'Bordas'],
    ['banner', 'Banners'],
    ['ui_skin', 'Temas de interface'],
    ['artifact', 'Artefatos'],
    ['glyph', 'Glifos'],
    ['orb', 'Orbes'],
    ['plate', 'Placas'],
    ['aura', 'Auras'],
];

const SEIS = [
    {
        nome: 'Resgate de codigo',
        emblema: getRewardEmblemUrl('geral'),
        tom: getRewardToneRgb('geral'),
        nota: 'Terminava em toast. Agora e tela, com o emblema geral que estava no disco sem uso.',
        payload: buildRedeemRewardPayload({
            success: true,
            code: 'VANGUARDA25',
            title: 'Vanguarda 25',
            description: 'Seu codigo foi aceito. Tudo ja entrou na conta.',
            wallet: { gold: 500, fragments: 60 },
            premiumDaysGranted: 30,
            chestType: 'Raro',
            chestCount: 1,
            itemIds: ['item_border_t1_aprendiz'],
        } as never),
    },
    {
        nome: 'Missao concluida',
        emblema: getRewardEmblemUrl('missao'),
        tom: getRewardToneRgb('missao'),
        nota: 'Missao individual, inicial, desafio de sistema ou pacto de arena.',
        payload: buildAchievementRewardPayload(
            'Cinco dias em movimento',
            'Voce concluiu a missao e a recompensa ja entrou.',
            'Missao concluida',
            { exp: 150, gold: 120, items: ['insignia_quest_incomum'] },
        ),
    },
    {
        nome: 'Ciclo fechado',
        emblema: getRewardEmblemUrl('ciclo'),
        tom: getRewardToneRgb('ciclo'),
        nota: 'O bau vai FECHADO para o Arsenal, em faixa, na cor da raridade dele.',
        payload: buildCycleRewardPayload({
            exp: 3240,
            fragments: 60,
            insigniaIds: ['insignia_report_comum'],
            chestType: 'Ciclo',
            cycleName: 'Reconstrucao',
        }),
    },
    {
        nome: 'Quest de temporada',
        emblema: getRewardEmblemUrl('temporada'),
        tom: getRewardToneRgb('temporada'),
        nota: 'A quarta missao, que sela as tres jornadas. Uma vez por temporada.',
        payload: buildAchievementRewardPayload(
            'Selo de Aurora I',
            'As tres jornadas foram seladas.',
            'Selo da temporada',
            { exp: 500, items: ['insignia_season_aurora_1', 'item_skin_2_003'] },
        ),
    },
    {
        nome: 'Conquista Genesis',
        emblema: getRewardEmblemUrl('genesis'),
        tom: getRewardToneRgb('genesis'),
        nota: 'Exclusiva da Temporada Zero. Mitica, a raridade mais alta.',
        payload: buildAchievementRewardPayload(
            'Genesis',
            'Marca de quem esteve antes da Primeira Era comecar.',
            'Conquista da Genesis',
            { exp: 1000, items: ['insignia_season_genesis'] },
        ),
    },
    {
        nome: 'Subida de patente',
        emblema: getRewardEmblemUrl('patente', 'Escudeiro'),
        tom: getRewardToneRgb('patente', 'Escudeiro'),
        nota: 'Dez no jogo inteiro, e a que mais entrega: seis itens de uma vez.',
        payload: buildAchievementRewardPayload(
            'Escudeiro',
            'Sua patente subiu e o conjunto inteiro entrou no Arsenal.',
            'Nova patente',
            {
                exp: 1200,
                items: ['CYBER', 'item_skin_1_004', 'item_skin_1_006',
                    'item_border_t1_aprendiz', 'insignia_rank_2_escudeiro', 'item_banner_t1_aprendiz'],
            },
        ),
    },
];

const App: React.FC = () => {
    const [outfit, setOutfit] = React.useState(roupas[0]);
    const [hair, setHair] = React.useState(cabelos[cabelos.length - 1]);
    const [verModal, setVerModal] = React.useState(false);
    // As quatro direcoes, aplicaveis ao componente real. A folha estatica so
    // deixava comparar com conteudo inventado.
    const [direcao, setDirecao] = React.useState<DirecaoDaPlaca>('B');

    const ajuste = React.useMemo(() => {
        const item = ITEMS_DB.find((i) => i.id === outfit);
        const arquivo = (item?.imageUrl || '').split('/').pop() || '';
        return { arquivo, valor: AVATAR_OFFSETS[arquivo] };
    }, [outfit]);

    return (
        <>
            <header>
                <h1>Bancada do Glyph</h1>
                <p>
                    Os componentes DE VERDADE do jogo, com os dados de verdade: os seis modais de
                    recompensa, os simbolos de valor, os oito baus, o catalogo inteiro e o avatar
                    lendo <code>constants/avatarOffsets.ts</code>. Nada aqui e maquete.
                </p>
                <p style={{ marginBottom: 14 }}>
                    <a href="/avatar-align.html" style={{ color: '#d8b44c' }}>Alinhador de roupa e cabelo</a>
                    {' · '}
                    <a href="/season-editor.html" style={{ color: '#d8b44c' }}>Temporadas</a>
                </p>
                <div className="controles">
                    <label>
                        Roupa
                        <select value={outfit} onChange={(e) => setOutfit(e.target.value)}>
                            {roupas.map((id) => (
                                <option key={id} value={id}>{ITEMS_DB.find((i) => i.id === id)?.name || id}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Cabelo
                        <select value={hair} onChange={(e) => setHair(e.target.value)}>
                            <option value="none">(sem cabelo)</option>
                            {cabelos.map((id) => (
                                <option key={id} value={id}>{HAIR_DB.find((h) => h.id === id)?.name || id}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <pre className="ajuste">
                    {ajuste.arquivo}
                    {'\n'}
                    {ajuste.valor ? JSON.stringify(ajuste.valor) : '(sem ajuste na tabela)'}
                </pre>
            </header>
            <section className="assets">
                <h2>Modal de recompensa · patente, 6 itens</h2>
                <p style={{ color: '#969ca6', fontSize: 12.5, margin: '0 0 10px' }}>
                    O caso que mais sofria com o corte em dois. Fecha e volta pelo botão.
                </p>
                <label style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#969ca6', marginRight: 12 }}>
                    Direção da placa
                    <select value={direcao} onChange={(e) => setDirecao(e.target.value as DirecaoDaPlaca)}>
                        {(Object.keys(DIRECOES) as DirecaoDaPlaca[]).map((d) => (
                            <option key={d} value={d}>{DIRECOES[d].nome}</option>
                        ))}
                    </select>
                </label>
                <button
                    onClick={() => setVerModal(true)}
                    style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #3a3f49', background: '#14161a', color: '#e8eaee', cursor: 'pointer' }}
                >
                    Abrir o modal
                </button>
                {verModal && (
                    <RewardPackModal
                        open
                        onClose={() => setVerModal(false)}
                        emblema={getRewardEmblemUrl('patente', 'Escudeiro')}
                        tom={getRewardToneRgb('patente', 'Escudeiro')}
                        direcao={direcao}
                        payload={{
                            eyebrow: 'NOVA PATENTE',
                            title: 'Escudeiro',
                            summary: 'Sua patente subiu e o conjunto inteiro entrou no Arsenal.',
                            buttonLabel: 'OK',
                            itemSectionTitle: 'Itens recebidos',
                            // Com simbolo, como os payloads de verdade mandam:
                            // e o quadrado com PNG que precisa ser olhado aqui,
                            // nao o retangulo antigo.
                            metricCards: [
                                { label: 'EXP', simbolo: 'exp', value: '+1.200' },
                                { label: 'Patente', simbolo: 'meta', value: '2/10' },
                            ],
                            itemIds: [
                                'CYBER', 'item_skin_1_004', 'item_skin_1_006',
                                'item_border_t1_aprendiz', 'insignia_rank_2_escudeiro',
                                'item_banner_t1_aprendiz',
                            ],
                        } as never}
                        fallbackEyebrow="RECOMPENSA"
                        fallbackTitle="Recompensa"
                        fallbackSummary=""
                        fallbackButtonLabel="OK"
                    />
                )}

                <h2 style={{ marginTop: 22 }}>Os seis, na placa de verdade</h2>
                <p style={{ color: '#969ca6', fontSize: 12.5, margin: '0 0 12px', maxWidth: '72ch' }}>
                    Nao sao seis modais: e a MESMA placa, com seis emblemas e seis conteudos. Cada
                    um abaixo e o <code>RewardPackBody</code> real, com o payload real do
                    acontecimento — o mesmo componente que o app monta.
                </p>
                <div className="modal-grid">
                    {SEIS.map((cena) => (
                        <div key={cena.nome}>
                            <div style={{ font: '600 11px/1.4 ui-monospace, monospace', color: '#d8b44c', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                                {cena.nome}
                            </div>
                            <div style={{ height: 660, display: 'flex', flexDirection: 'column', border: '2px solid #56585a', background: '#0b0d0f', overflow: 'hidden', clipPath: 'polygon(0 20px, 20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px))', boxShadow: 'inset 0 0 0 4px #090b0d, inset 0 0 0 5px #33363a, inset 0 0 0 7px #0b0d0f, 6px 8px 0 #050607, 8px 10px 0 #24272a' }}>
                                <RewardPackBody
                                    payload={cena.payload}
                                    emblema={cena.emblema}
                                    tom={cena.tom}
                                    fallbackEyebrow="RECOMPENSA"
                                    fallbackTitle="Recompensa"
                                    fallbackSummary=""
                                    fallbackEmptyMessage=""
                                />
                                <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: 16 }}>
                                    <button className="luxe-skin-button" style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase' }}>
                                        {cena.payload.buttonLabel || 'OK'}
                                    </button>
                                </div>
                            </div>
                            <p style={{ color: '#969ca6', fontSize: 12, margin: '8px 0 0', maxWidth: '46ch' }}>{cena.nota}</p>
                        </div>
                    ))}
                </div>

                <h2 style={{ marginTop: 18 }}>Símbolos de valor</h2>
                <div className="grade">
                    {(['exp', 'ouro', 'fragmento', 'acoes', 'sequencia'] as Valor[]).map((v) => (
                        <figure key={v}>
                            <div className="slot" style={{ color: '#d8b44c' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
                                    +150 <ValorIcon valor={v} tamanho={20} />
                                </span>
                            </div>
                            <figcaption>{v}</figcaption>
                        </figure>
                    ))}
                </div>
                <h2 style={{ marginTop: 18 }}>Fallback por categoria</h2>
                <div className="grade">
                    {['artifact', 'skin', 'border', 'banner', 'glyph', 'orb', 'plate'].map((cat) => (
                        <figure key={cat}>
                            <div className="slot">
                                <ItemArt itemId={`x-${cat}`} alt={cat} category={cat} />
                            </div>
                            <figcaption>{cat}</figcaption>
                        </figure>
                    ))}
                </div>

                <h2>Os oito baus</h2>
                <div className="grade">
                    {['Comum', 'Incomum', 'Raro', 'Ciclo', 'Épico', 'Season', 'Lendário', 'Skin Comum'].map((tipo) => (
                        <figure key={tipo}>
                            <div className="slot">
                                <ItemArt
                                    itemId={`chest-${tipo}`}
                                    src={getChestArtUrl(tipo)}
                                    alt={tipo}
                                    category="chest"
                                    className="w-full h-full flex items-center justify-center"
                                    imgClassName="w-full h-full object-contain"
                                />
                            </div>
                            <figcaption style={{ color: getChestVisual(tipo).hex }}>{getChestDisplayName(tipo)}</figcaption>
                        </figure>
                    ))}
                </div>

                <h2 style={{ marginTop: 22 }}>O catalogo inteiro</h2>
                <p style={{ color: '#969ca6', fontSize: 12.5, margin: '0 0 12px', maxWidth: '72ch' }}>
                    Todo o <code>ITEMS_DB</code>, por categoria, desenhado pelo <code>ItemArt</code> do
                    app. Quem aparece com emoji e quem ainda nao tem PNG; a legenda vem na cor da
                    raridade oficial. E o inventario inteiro numa tela so — inclusive o que a loja
                    nao mostra.
                </p>
                {CATEGORIAS.map(([categoria, rotulo]) => {
                    const itens = ITEMS_DB.filter((i) => i.category === categoria);
                    if (itens.length === 0) return null;
                    const semArte = itens.filter((i) => !i.imageUrl).length;
                    return (
                        <div key={categoria} style={{ marginBottom: 16 }}>
                            <h3 style={{ font: '700 12px/1.4 system-ui', letterSpacing: '.12em', textTransform: 'uppercase', color: '#e8eaee', margin: '0 0 7px' }}>
                                {rotulo}
                                <span style={{ color: '#969ca6', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                                    {itens.length} {semArte > 0 ? `· ${semArte} sem arte` : '· completa'}
                                </span>
                            </h3>
                            <div className="grade">
                                {itens.map((i) => (
                                    <figure key={i.id}>
                                        <div className="slot" style={{ borderColor: `${getRarityVisual(i.rarity).hex}55` }}>
                                            <ItemArt
                                                itemId={i.id}
                                                src={i.imageUrl}
                                                alt={i.name}
                                                icon={i.icon}
                                                category={i.category}
                                                className="w-full h-full flex items-center justify-center"
                                                imgClassName="w-full h-full object-contain"
                                                iconClassName="text-2xl"
                                            />
                                        </div>
                                        <figcaption style={{ color: getRarityVisual(i.rarity).hex, fontSize: 10 }}>
                                            {i.name}
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>
            <main>
                {corpos.map((corpo) => (
                    <Celula
                        key={corpo}
                        corpo={corpo}
                        outfit={outfit}
                        hair={hair}
                        rotulo={corpo.replace('body_', '')}
                    />
                ))}
            </main>
        </>
    );
};

createRoot(document.getElementById('raiz')!).render(<App />);
