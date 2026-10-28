import { useEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { REGRAS_DE_DESBLOQUEIO, expDaRegra, type RegraDeDesbloqueio } from '../constants/desbloqueiosPorRegra';
import { isItemCatalogVisible, resolveItemDef } from '../constants/items';
import type { UnlockCategory, UserUnlocks } from '../types';
import { MARCA_DE_EXP_DO_SEGREDO, MARCA_DE_SEGREDO, expPendente, lerDescobertas, lerExpPago, montarModalDeSegredos, novasConquistas, type FatosDeSegredo } from '../utils/medidorDeSegredos';
import { EVENTO_DE_SEGREDO, criarFilaDeSegredos, regraEscutaEvento, type EventoDeSegredo } from '../utils/eventosDeSegredos';
import { MARCA_DE_GUARDADA } from '../utils/avisoEssencial';

const CATEGORIA_DE_DESBLOQUEIO: Record<string, UnlockCategory> = { border: 'borders', banner: 'banners', skin: 'skins' };
type Modal = ReturnType<typeof montarModalDeSegredos>;

/** Eventos confirmados conferem suas regras; abertura/retomada recupera o restante.
 * A entrega não espera o relatório. Só os modais aguardam a fila de celebrações. */
export const useConquistasSecretas = ({ pausado }: { pausado: boolean }) => {
    const game = useGame();
    const { userProfile, reports, friends, notifications, isProfileLoaded, setAchievementUnlocked } = game;
    const api = useRef(game);
    api.current = game;
    const pedirRef = useRef<(evento: EventoDeSegredo) => void>(() => {});
    const [modais, setModais] = useState<Array<{ userId: string; modal: Modal }>>([]);

    useEffect(() => {
        const userId = userProfile.id;
        if (!isProfileLoaded || !userId || userId === 'placeholder_user') return;
        let encerrado = false;
        let prazo: ReturnType<typeof setTimeout> | undefined;
        const descobertasSessao = new Set<string>();
        const itensEntregues = new Set<string>();
        const vigente = () => !encerrado && api.current.userProfile.id === userId;
        const descobertas = () => new Set([...lerDescobertas(api.current.userProfile.completedSeasonMissions), ...descobertasSessao]);
        const expPagoSessao = new Set<string>();
        const pagos = () => new Set([...lerExpPago(api.current.userProfile.completedSeasonMissions), ...expPagoSessao]);
        const somaDeExp = (regras: RegraDeDesbloqueio[]) => regras.reduce((soma, regra) => soma + expDaRegra(regra), 0);

        // EXP dos segredos (26/10/2026). As regras descobertas antes disso
        // pagam aqui, uma vez, sem modal: o modal delas ja passou.
        const pagarAtrasados = async () => {
            const atrasadas = expPendente(REGRAS_DE_DESBLOQUEIO, descobertas(), pagos());
            if (!atrasadas.length) return;
            const soma = somaDeExp(atrasadas);
            const perfil = api.current.userProfile;
            await api.current.updateUserProfile({
                nobility: { ...perfil.nobility, exp: (perfil.nobility?.exp || 0) + soma },
                completedSeasonMissions: Array.from(new Set([
                    ...(perfil.completedSeasonMissions || []),
                    ...atrasadas.map(regra => MARCA_DE_EXP_DO_SEGREDO + regra.id),
                ])),
            });
            atrasadas.forEach(regra => expPagoSessao.add(regra.id));
            if (soma > 0) api.current.showToast(`Segredos já descobertos agora dão EXP: +${soma.toLocaleString('pt-BR')}.`, 'success');
        };

        // Mentoria vence pelo relógio, sem depender de tocar em uma tela.
        // Só busca o próximo prazo, sem carregar arenas/páginas ou polling contínuo.
        const agendarMentoria = async () => {
            clearTimeout(prazo);
            if (!vigente() || !REGRAS_DE_DESBLOQUEIO.some(r => r.condicao.tipo === 'mentorias_concluidas' && !descobertas().has(r.id))) return;
            const { data, error } = await supabase.from('relationship_links')
                .select('expires_at').eq('mentor_id', userId).eq('link_type', 'mentoria')
                .is('ended_at', null).gt('expires_at', new Date().toISOString())
                .order('expires_at', { ascending: true }).limit(1);
            if (!vigente() || error || !data?.[0]?.expires_at) return;
            const atraso = new Date(data[0].expires_at).getTime() - Date.now();
            if (!Number.isFinite(atraso)) return;
            prazo = setTimeout(() => fila.pedir('vinculo'), Math.min(2147483647, Math.max(0, atraso) + 1000));
        };

        const fila = criarFilaDeSegredos(async eventos => {
            if (!vigente()) return;
            if (eventos.has('recuperacao')) await pagarAtrasados();
            if (!vigente()) return;
            const regras = REGRAS_DE_DESBLOQUEIO.filter(r => regraEscutaEvento(r.condicao, eventos) && !descobertas().has(r.id));
            if (!regras.length) return;
            const { data, error } = await supabase.rpc('minhas_marcas_secretas');
            if (!vigente()) return;
            if (error || !data) {
                if (error) console.warn('[segredos] conferência indisponível:', error.message);
                return;
            }
            const novas = novasConquistas({ fatos: data as FatosDeSegredo, regras, descobertas: descobertas(), arteVisivel: isItemCatalogVisible });
            if (novas.length) {
                const entrega = { items: [] as string[], ownedItems: [] as string[], convertedItems: [] as Array<{ itemId: string; fragments: number }> };
                // A hidratação local pode ainda não ter carregado o inventário.
                const ids = novas.flatMap(r => r.itens);
                const { data: existentes, error: inventoryError } = await supabase.from('user_inventory')
                    .select('item_id').eq('user_id', userId).in('item_id', ids);
                if (inventoryError) throw inventoryError;
                if (!vigente()) return;
                for (const item of existentes || []) itensEntregues.add(item.item_id);
                for (const regra of novas) {
                    for (const itemId of regra.itens) {
                        if (!vigente()) return;
                        if (!itensEntregues.has(itemId) && !api.current.inventory.some(item => item.id === itemId)) {
                            const result = await api.current.grantInventoryItem(itemId, true);
                            if (!result || typeof result !== 'object' || !('item' in result) || !result.item) {
                                throw new Error(`Não foi possível entregar ${itemId}`);
                            }
                            itensEntregues.add(itemId);
                            if ('duplicateConverted' in result && result.duplicateConverted) {
                                entrega.convertedItems.push({ itemId, fragments: Number('fragmentsGranted' in result ? result.fragmentsGranted : 0) });
                            } else entrega.items.push(itemId);
                        } else if (!entrega.items.includes(itemId) && !entrega.ownedItems.includes(itemId)) {
                            entrega.ownedItems.push(itemId);
                        }
                    }
                }
                if (!vigente()) return;
                const perfil = api.current.userProfile;
                const desbloqueios = { ...(perfil.unlockedItems || {}) } as UserUnlocks;
                for (const regra of novas) {
                    for (const itemId of regra.itens) {
                        const categoria = CATEGORIA_DE_DESBLOQUEIO[resolveItemDef(itemId)?.category || ''];
                        if (categoria) desbloqueios[categoria] = { ...(desbloqueios[categoria] || {}), [itemId]: true };
                    }
                }
                await api.current.updateUserProfile({
                    unlockedItems: desbloqueios,
                    nobility: { ...perfil.nobility, exp: (perfil.nobility?.exp || 0) + somaDeExp(novas) },
                    completedSeasonMissions: Array.from(new Set([
                        ...(perfil.completedSeasonMissions || []),
                        ...Array.from(descobertasSessao, id => MARCA_DE_SEGREDO + id),
                        ...novas.map(regra => MARCA_DE_SEGREDO + regra.id),
                        ...Array.from(expPagoSessao, id => MARCA_DE_EXP_DO_SEGREDO + id),
                        ...novas.map(regra => MARCA_DE_EXP_DO_SEGREDO + regra.id),
                        // Essencial: entrou calada. Na volta ao Imersivo, um aviso so.
                        ...(api.current.modoEssencial ? novas.map(regra => MARCA_DE_GUARDADA + regra.id) : []),
                    ])),
                });
                if (!vigente()) return;
                novas.forEach(regra => { descobertasSessao.add(regra.id); expPagoSessao.add(regra.id); });
                setModais(prev => [...prev, { userId, modal: montarModalDeSegredos(novas, entrega) }]);
            }
            if (eventos.has('recuperacao') || eventos.has('vinculo')) await agendarMentoria();
        }, error => console.warn('[segredos] será conferido novamente no próximo evento ou abertura:', error));
        pedirRef.current = fila.pedir;
        const confirmado = (event: Event) => {
            const detalhe = (event as CustomEvent<{ userId: string; evento: EventoDeSegredo }>).detail;
            if (detalhe?.userId === userId) fila.pedir(detalhe.evento);
        };
        const vinculos = () => fila.pedir('vinculo');
        const retomada = () => { if (document.visibilityState === 'visible') fila.pedir('recuperacao'); };
        window.addEventListener(EVENTO_DE_SEGREDO, confirmado);
        window.addEventListener('glyph:relationships-updated', vinculos);
        document.addEventListener('visibilitychange', retomada);
        fila.pedir('recuperacao');
        return () => {
            encerrado = true;
            fila.encerrar();
            pedirRef.current = () => {};
            clearTimeout(prazo);
            window.removeEventListener(EVENTO_DE_SEGREDO, confirmado);
            window.removeEventListener('glyph:relationships-updated', vinculos);
            document.removeEventListener('visibilitychange', retomada);
        };
    }, [isProfileLoaded, userProfile.id]);

    useEffect(() => { pedirRef.current('ciclo'); }, [reports.length]);
    useEffect(() => { pedirRef.current('amizade'); }, [friends.length]);
    const resultados = notifications.filter(n => n.type === 'competition_result').map(n => n.id).join('|');
    useEffect(() => { pedirRef.current('vinculo'); }, [resultados]);

    useEffect(() => {
        if (pausado || !modais.length) return;
        const atual = modais[0];
        if (atual.userId === userProfile.id) {
            const modalPendente = atual.modal;
            setAchievementUnlocked({ type: 'QUEST_COMPLETED', data: modalPendente });
        }
        setModais(prev => prev.slice(1));
    }, [pausado, modais, userProfile.id, setAchievementUnlocked]);
};
