import React from 'react';
import { createRoot } from 'react-dom/client';
import { SEASONS, SEASON_ORDER, ACTIVE_SEASON_ID } from '../constants/seasonContent';
import type { SeasonConfig } from '../constants/seasonContent';
import { ITEMS_DB } from '../constants/items';
import { ItemArt } from '../components/ItemArt';
import { getRarityVisual } from '../constants/rarityVisuals';

/**
 * O painel das temporadas.
 *
 * Nao existia lugar nenhum para ver ou mexer nisto: SEASONS mora em
 * constants/seasonContent.ts, e a unica forma de saber o que uma temporada
 * carrega era ler o arquivo. Treze estao cadastradas e onze estao vazias — sem
 * chave, sem jornada e sem item — e isso so aparecia lendo linha por linha.
 *
 * Edita aqui, copia o bloco, cola no arquivo. Mesmo caminho da ferramenta de
 * alinhar avatar, pelo mesmo motivo: o dado continua sendo codigo versionado, e
 * nao um registro solto num banco que ninguem revisa.
 *
 * Fora do build: o Vite so empacota o index.html da raiz. Com `npm run dev`, em
 * /tools/season-editor.html
 */

const PADRAO = { primaria: '#d8b44c', secundaria: '#8a6a12' };

type Editavel = {
    cores: { primaria: string; secundaria: string };
    description: string;
    launchTitle: string;
    launchSummary: string;
    celebrationTitle: string;
    celebrationSummary: string;
    startDate: string;
    endDate: string;
    backgroundUrl: string;
};

const doConfig = (s: SeasonConfig): Editavel => ({
    cores: s.cores ? { ...s.cores } : { ...PADRAO },
    description: s.description || '',
    launchTitle: s.launchTitle || '',
    launchSummary: s.launchSummary || '',
    celebrationTitle: s.celebrationTitle || '',
    celebrationSummary: s.celebrationSummary || '',
    startDate: s.startDate,
    endDate: s.endDate,
    backgroundUrl: s.backgroundUrl || '',
});

const CATEGORIAS: Array<{ chave: string; rotulo: string }> = [
    { chave: 'skin', rotulo: 'Skin' },
    { chave: 'border', rotulo: 'Borda' },
    { chave: 'banner', rotulo: 'Banner' },
    { chave: 'ui_skin', rotulo: 'Tema UI' },
    { chave: 'insignia', rotulo: 'Insígnia' },
];

const Colecao: React.FC<{ chave?: string; cor: string }> = ({ chave, cor }) => {
    const itens = chave ? ITEMS_DB.filter((i) => (i as { seasonKey?: string }).seasonKey === chave) : [];
    return (
        <div className="colecao">
            {CATEGORIAS.map(({ chave: cat, rotulo }) => {
                const achado = itens.find((i) => i.category === cat);
                return (
                    <figure key={cat} className={achado ? '' : 'vazio'}>
                        <div className="slot" style={achado ? { borderColor: cor } : undefined}>
                            {achado ? (
                                <ItemArt
                                    itemId={achado.id}
                                    src={achado.imageUrl}
                                    alt={achado.name}
                                    icon={achado.icon}
                                    category={achado.category}
                                />
                            ) : (
                                <span className="falta">falta</span>
                            )}
                        </div>
                        <figcaption>
                            {rotulo}
                            {achado && (
                                <em style={{ color: getRarityVisual(achado.rarity).hex }}>
                                    {achado.name}
                                </em>
                            )}
                        </figcaption>
                    </figure>
                );
            })}
        </div>
    );
};

const Campo: React.FC<{
    rotulo: string; valor: string; onChange: (v: string) => void; tipo?: string; area?: boolean;
}> = ({ rotulo, valor, onChange, tipo = 'text', area }) => (
    <label className="campo">
        <span>{rotulo}</span>
        {area ? (
            <textarea value={valor} onChange={(e) => onChange(e.target.value)} rows={2} />
        ) : (
            <input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} />
        )}
    </label>
);

const App: React.FC = () => {
    const [edicoes, setEdicoes] = React.useState<Record<string, Editavel>>(() => {
        const inicial: Record<string, Editavel> = {};
        for (const id of SEASON_ORDER) {
            const s = SEASONS[id];
            if (s) inicial[id] = doConfig(s);
        }
        return inicial;
    });

    const mexer = (id: string, campo: keyof Editavel, valor: unknown) =>
        setEdicoes((antes) => ({ ...antes, [id]: { ...antes[id], [campo]: valor } as Editavel }));

    // So o que MUDOU em relacao ao arquivo entra no bloco. Despejar as treze
    // inteiras faria o diff parecer uma reescrita e esconderia o que se mexeu.
    const bloco = React.useMemo(() => {
        const linhas: string[] = [];
        for (const id of SEASON_ORDER) {
            const s = SEASONS[id];
            if (!s) continue;
            const antes = doConfig(s);
            const agora = edicoes[id];
            if (!agora) continue;
            const mudou: string[] = [];
            (Object.keys(antes) as Array<keyof Editavel>).forEach((k) => {
                if (JSON.stringify(antes[k]) === JSON.stringify(agora[k])) return;
                if (k === 'cores') {
                    mudou.push(`  cores: { primaria: '${agora.cores.primaria}', secundaria: '${agora.cores.secundaria}' },`);
                } else {
                    mudou.push(`  ${k}: ${JSON.stringify(agora[k])},`);
                }
            });
            if (mudou.length) linhas.push(`'${id}': {\n${mudou.join('\n')}\n},`);
        }
        return linhas.length
            ? linhas.join('\n')
            : '// nada mudou ainda — mexa em algum campo acima';
    }, [edicoes]);

    return (
        <>
            <header>
                <h1>Temporadas</h1>
                <p>
                    Lê <code>constants/seasonContent.ts</code> ao vivo. Edite, copie o bloco e
                    cole de volta no arquivo — só os campos alterados saem.
                </p>
            </header>

            {SEASON_ORDER.map((id) => {
                const s = SEASONS[id];
                if (!s) {
                    return <section key={id} className="temporada erro"><h2>{id}</h2><p>não existe em SEASONS</p></section>;
                }
                const e = edicoes[id];
                const ativa = id === ACTIVE_SEASON_ID;
                const vazia = !s.seasonKey;
                return (
                    <section
                        key={id}
                        className={`temporada${ativa ? ' ativa' : ''}${vazia ? ' vazia' : ''}`}
                        style={{ borderLeftColor: e.cores.primaria }}
                    >
                        <div className="topo">
                            <h2 style={{ color: e.cores.primaria }}>{s.name}</h2>
                            {ativa && <span className="selo">ativa</span>}
                            {vazia && <span className="selo alerta">sem chave, sem itens, sem jornadas</span>}
                            <code>{id}</code>
                            <span className="jorn">{s.quests?.length || 0} jornadas</span>
                        </div>

                        <div className="corpo">
                            <div className="visual">
                                <div
                                    className="fundo"
                                    style={{
                                        backgroundImage: e.backgroundUrl ? `url(${e.backgroundUrl})` : undefined,
                                        boxShadow: `inset 0 -60px 60px -30px ${e.cores.secundaria}`,
                                        borderColor: e.cores.primaria,
                                    }}
                                >
                                    <span style={{ color: e.cores.primaria }}>{e.launchTitle || s.name}</span>
                                </div>
                                <div className="cores">
                                    <label>
                                        <input
                                            type="color"
                                            value={e.cores.primaria}
                                            onChange={(ev) => mexer(id, 'cores', { ...e.cores, primaria: ev.target.value })}
                                        />
                                        <span>primária</span>
                                    </label>
                                    <label>
                                        <input
                                            type="color"
                                            value={e.cores.secundaria}
                                            onChange={(ev) => mexer(id, 'cores', { ...e.cores, secundaria: ev.target.value })}
                                        />
                                        <span>secundária</span>
                                    </label>
                                </div>
                            </div>

                            <div className="dados">
                                <div className="datas">
                                    <Campo rotulo="começa" tipo="date" valor={e.startDate} onChange={(v) => mexer(id, 'startDate', v)} />
                                    <Campo rotulo="termina" tipo="date" valor={e.endDate} onChange={(v) => mexer(id, 'endDate', v)} />
                                </div>
                                <Campo rotulo="fundo (png)" valor={e.backgroundUrl} onChange={(v) => mexer(id, 'backgroundUrl', v)} />
                                <Campo rotulo="descrição" area valor={e.description} onChange={(v) => mexer(id, 'description', v)} />
                                <Campo rotulo="título de abertura" valor={e.launchTitle} onChange={(v) => mexer(id, 'launchTitle', v)} />
                                <Campo rotulo="texto de abertura" area valor={e.launchSummary} onChange={(v) => mexer(id, 'launchSummary', v)} />
                                <Campo rotulo="título de fecho" valor={e.celebrationTitle} onChange={(v) => mexer(id, 'celebrationTitle', v)} />
                                <Campo rotulo="texto de fecho" area valor={e.celebrationSummary} onChange={(v) => mexer(id, 'celebrationSummary', v)} />
                            </div>
                        </div>

                        <Colecao chave={s.seasonKey} cor={e.cores.primaria} />
                    </section>
                );
            })}

            <footer>
                <h2>Bloco para colar</h2>
                <textarea readOnly value={bloco} rows={12} />
                <button onClick={() => navigator.clipboard.writeText(bloco)}>Copiar</button>
            </footer>
        </>
    );
};

createRoot(document.getElementById('raiz')!).render(<App />);
