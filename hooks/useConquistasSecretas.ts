import { useEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { REGRAS_DE_DESBLOQUEIO } from '../constants/desbloqueiosPorRegra';
import { isItemCatalogVisible, resolveItemDef } from '../constants/items';
import type { UnlockCategory, UserUnlocks } from '../types';
import {
    MARCA_DE_SEGREDO,
    lerDescobertas,
    montarModalDeSegredos,
    novasConquistas,
    type FatosDeSegredo,
} from '../utils/medidorDeSegredos';

const CATEGORIA_DE_DESBLOQUEIO: Record<string, UnlockCategory> = {
    border: 'borders',
    banner: 'banners',
    skin: 'skins',
};

/**
 * A CONFERENCIA DAS REGRAS SECRETAS.
 *
 * Roda quando o perfil carrega e quando um ciclo fecha. Pergunta os numeros ao
 * banco, deixa o medidor decidir, entrega o premio pelo caminho de sempre e poe
 * UM modal na fila que ja existe.
 *
 * `pausado` segura o modal enquanto o relatorio do ciclo esta aberto: o fecho ja
 * empilha relatorio, bau e as vezes patente, e o segredo entra depois.
 */
export const useConquistasSecretas = ({ pausado }: { pausado: boolean }) => {
    const {
        userProfile, reports, inventory, isProfileLoaded,
        grantInventoryItem, updateUserProfile, setAchievementUnlocked,
    } = useGame();
    const perfilRef = useRef(userProfile);
    perfilRef.current = userProfile;
    const inventarioRef = useRef(inventory);
    inventarioRef.current = inventory;
    const conferindoRef = useRef(false);
    const [modalPendente, setModalPendente] = useState<ReturnType<typeof montarModalDeSegredos> | null>(null);

    useEffect(() => {
        if (!isProfileLoaded || !userProfile.id || userProfile.id === 'placeholder_user') return;
        if (conferindoRef.current) return;
        conferindoRef.current = true;

        void (async () => {
            try {
                const { data, error } = await supabase.rpc('minhas_marcas_secretas');
                // Sem a funcao no banco (migracao ainda nao rodada), fica quieto.
                if (error || !data) return;

                const novas = novasConquistas({
                    fatos: data as FatosDeSegredo,
                    regras: REGRAS_DE_DESBLOQUEIO,
                    descobertas: lerDescobertas(perfilRef.current.completedSeasonMissions),
                    arteVisivel: (itemId) => isItemCatalogVisible(itemId),
                });
                if (novas.length === 0) return;

                // O inventario e o dono de verdade. Quem ja tinha a peca (comprou
                // antes, ou e staff) nao recebe duplicata convertida em fragmento.
                for (const regra of novas) {
                    for (const itemId of regra.itens) {
                        if (!inventarioRef.current.some((item) => item.id === itemId)) {
                            await grantInventoryItem(itemId, true);
                        }
                    }
                }

                // Desbloqueio e marca numa escrita so, montadas do perfil vivo:
                // updateUserProfile faz merge de primeiro nivel, e duas escritas
                // seguidas a partir do mesmo closure apagariam uma a outra.
                const perfil = perfilRef.current;
                const desbloqueios = { ...(perfil.unlockedItems || {}) } as UserUnlocks;
                for (const regra of novas) {
                    for (const itemId of regra.itens) {
                        const categoria = CATEGORIA_DE_DESBLOQUEIO[resolveItemDef(itemId)?.category || ''];
                        if (!categoria) continue;
                        desbloqueios[categoria] = { ...(desbloqueios[categoria] || {}), [itemId]: true };
                    }
                }
                const marcas = perfil.completedSeasonMissions || [];
                const novasMarcas = novas
                    .map((regra) => MARCA_DE_SEGREDO + regra.id)
                    .filter((marca) => !marcas.includes(marca));
                updateUserProfile({
                    unlockedItems: desbloqueios,
                    completedSeasonMissions: [...marcas, ...novasMarcas],
                });

                setModalPendente(montarModalDeSegredos(novas));
            } finally {
                conferindoRef.current = false;
            }
        })();
    }, [isProfileLoaded, userProfile.id, reports.length]);

    useEffect(() => {
        if (pausado || !modalPendente) return;
        setAchievementUnlocked({ type: 'QUEST_COMPLETED', data: modalPendente });
        setModalPendente(null);
    }, [pausado, modalPendente, setAchievementUnlocked]);
};
