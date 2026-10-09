/**
 * AS FAIXAS — O SeasonQuestCard DE VERDADE, UMA FAMILIA POR LINHA.
 *
 * Suba com `npm run bancada` e abra /as-faixas.html
 */
import '../index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SeasonQuestCard } from '../views/SeasonView';

const Bancada: React.FC = () => {
    const [tocou, setTocou] = useState('nada ainda');
    const toque = (nome: string) => () => setTocou(nome);
    return (
        <div className="telefone">
            <div className="tela space-y-2">
                <p className="rotulo">Da temporada</p>
                <SeasonQuestCard title="Andarilho: 20 caminhadas" icon="🥾" metaLabel="Temporada" isAccepted progress={30} progressLabel="6/20" family="temporada" onClick={toque('Andarilho')} />
                <p className="rotulo">Sua escolha</p>
                <SeasonQuestCard title="Primeiros passos: 3 dias seguidos" icon="🌱" metaLabel="Iniciante" isAccepted progress={66} progressLabel="2/3" family="iniciante" onClick={toque('Primeiros passos')} />
                <SeasonQuestCard title="Missão individual: 10 ações de Treino" icon="🎯" metaLabel="Individual" isAccepted progress={100} progressLabel="10/10" family="individual" onClick={toque('Missão individual')} />
                <SeasonQuestCard title="Leitor: 7 dias de leitura com um nome bem comprido para ver o corte" icon="📚" metaLabel="Individual" isAccepted={false} progress={0} family="individual" onClick={toque('Leitor')} />
                <p className="rotulo">Do grupo</p>
                <SeasonQuestCard title="Ordem: 500 ações do clã" icon="🛡️" metaLabel="Grupo" isAccepted progress={62} progressLabel="312/500" participants={8} family="grupo" onClick={toque('Ordem')} />
            </div>
            <p className="log">Último toque: {tocou}</p>
        </div>
    );
};

createRoot(document.getElementById('raiz')!).render(<Bancada />);
