import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { EVENTO_COTA_DO_ORACULO, type CotaDoOraculo } from './oraculoIa';

/**
 * AS MENSAGENS QUE AINDA CABEM HOJE (03/11/2026, com o Afonso).
 *
 * A cota e de conversas (3 mensagens cada), mas a pessoa ve as mensagens que
 * restam: as da conversa aberta e as das conversas que sobram. Aparece na aba
 * Conversar e decide quando a caixa fecha. Acompanha o evento de cada chamada.
 */
export const mensagensRestantes = (cota: CotaDoOraculo | null): number | null => {
    if (!cota) return null;
    if (typeof cota.mensagens === 'number') return Math.max(0, cota.mensagens);
    return Math.max(0, cota.limite - cota.usadas) * 3;
};

export const useCotaDoOraculo = () => {
    const [cota, setCota] = useState<CotaDoOraculo | null>(null);
    useEffect(() => {
        let vivo = true;
        void supabase.rpc('oraculo_ia_restantes').then(({ data }) => {
            if (!vivo || !data || typeof data.limite !== 'number') return;
            setCota({
                usadas: Number(data.usadas) || 0,
                limite: data.limite,
                mensagens: typeof data.mensagens === 'number' ? data.mensagens : undefined,
            });
        });
        const aoMudarCota = (evento: Event) => {
            const detalhe = (evento as CustomEvent<CotaDoOraculo>).detail;
            if (vivo && detalhe && typeof detalhe.limite === 'number') setCota(detalhe);
        };
        window.addEventListener(EVENTO_COTA_DO_ORACULO, aoMudarCota);
        return () => { vivo = false; window.removeEventListener(EVENTO_COTA_DO_ORACULO, aoMudarCota); };
    }, []);
    return cota;
};
