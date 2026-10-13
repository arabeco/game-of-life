import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

/**
 * QUEM TEM COROA (13/10/2026).
 *
 * O cartao publico nao diz se a pessoa assina; quem diz e coroas_de(ids), no
 * servidor (migracao 20261013100000_coroa_publica.sql). Cada cartao pede o seu
 * id aqui, e os pedidos do mesmo instante viram UMA chamada — a lista de amigos
 * inteira custa uma ida ao banco, e depois fica guardada na sessao.
 */
const conhecidas = new Map<string, boolean>();
const pendentes = new Set<string>();
const ouvintes = new Set<() => void>();
let agendado: ReturnType<typeof setTimeout> | null = null;

const pedir = (id: string) => {
    pendentes.add(id);
    if (agendado) return;
    agendado = setTimeout(async () => {
        const ids = [...pendentes];
        pendentes.clear();
        agendado = null;
        ids.forEach((pedido) => conhecidas.set(pedido, false));
        try {
            const { data, error } = await supabase.rpc('coroas_de', { p_user_ids: ids });
            if (!error && Array.isArray(data)) data.forEach((comCoroa) => conhecidas.set(String(comCoroa), true));
        } catch {
            // sem resposta, sem coroa: nao vale um erro na tela
        }
        ouvintes.forEach((avisar) => avisar());
    }, 40);
};

export function useCoroa(userId?: string | null): boolean {
    const [, redesenhar] = useState(0);
    useEffect(() => {
        if (!userId) return;
        const avisar = () => redesenhar((n) => n + 1);
        ouvintes.add(avisar);
        if (!conhecidas.has(userId)) pedir(userId);
        return () => { ouvintes.delete(avisar); };
    }, [userId]);
    return Boolean(userId && conhecidas.get(userId));
}
