/**
 * O INVENTARIO E O EDITOR DO SOBERANO, DE VERDADE.
 *
 * Monta o <Inventory> que a Loja usa — e, pelo botao "Editor Soberano" dele, o
 * SovereignCustomizer — com um GameContext de mentira: nada toca banco, rede
 * ou conta. O inventario de mentira tem TODO o catalogo visivel de skins,
 * artefatos e placas, que e o que uma conta de staff recebe.
 *
 * Serve para olhar duas coisas que so aparecem com a grade cheia: a luz por
 * tras dos cards (que dependia do tier) e o slot do artefato no editor, com a
 * placa por baixo.
 *
 * Suba com `npm run bancada` e abra /o-soberano.html
 */
import '../index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameContext } from '../contexts/GameContext';
import { Inventory } from '../components/Store/Inventory';
import { ITEMS_DB, isItemCatalogVisible } from '../constants/items';
import { DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';

const CATEGORIAS = new Set(['skin', 'artifact', 'plate', 'aura']);

const INVENTARIO = ITEMS_DB
    .filter(item => CATEGORIAS.has(item.category) && isItemCatalogVisible(item))
    .map((item, indice) => ({ id: item.id, instanceId: `bancada-${indice}`, acquiredAt: '2026-09-01T00:00:00Z' }));

const SOBERANO = {
    ...DEFAULT_SOVEREIGN_CONFIG,
    body: 'body_masc_1',
    skinTone: '1',
    hairStyle: 'medio_reto',
    hairColor: '1',
    outfit: 'item_skin_4_004',
    artifact: 'item_artifact_5_002',
    extraArtifacts: ['item_artifact_4_002', 'none'],
    sovereignPlate: 'item_plate_5_001',
    artifactPlate: 'item_plate_5_001',
    primaryDisplay: 'item' as const,
};

const contexto = {
    inventory: INVENTARIO,
    userProfile: {
        id: 'bancada',
        role: 'player',
        sovereign: SOBERANO,
        chests: [],
        border: '',
        skin: 'BASIC',
        bannerUrl: '',
    },
    updateUserProfile: async (mudanca: unknown) => console.log('[bancada] perfil', mudanca),
    openChest: async () => null,
    showToast: (mensagem: string) => console.log('[bancada] toast:', mensagem),
    oraclePreferences: { hapticsEnabled: false, animationsEnabled: true },
} as never;

function Bancada() {
    return (
        <>
            <header>
                <h1>O soberano</h1>
                <p>
                    O <code>Inventory</code> de verdade com o catálogo visível inteiro de skins,
                    artefatos e placas. Abra a aba <strong>Soberano</strong> para ver a luz dos
                    cards; o botão <strong>Editor Soberano</strong> abre o editor, e
                    <strong> Editar</strong> lá dentro mostra o slot do artefato com a placa.
                </p>
            </header>
            <div className="telefone">
                <div className="tela">
                    <GameContext.Provider value={contexto}>
                        <Inventory />
                    </GameContext.Provider>
                </div>
            </div>
        </>
    );
}

createRoot(document.getElementById('raiz')!).render(<Bancada />);
