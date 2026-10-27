import React, { useState } from 'react';
import { isProbablyImageUrl } from './CodexCoverArt';

/**
 * A CAPA DA CAMPANHA COMO FUNDO (27/10/2026).
 *
 * A capa deixou de ser um emoji num quadradinho: e uma imagem que vem DENTRO
 * do app (`/assets/campanhas/...`), atras do card da loja e no fundo da ficha
 * da campanha, sempre sob um veu escuro para o texto continuar legivel. Sem
 * imagem — ou enquanto a arte nao chega — fica so o tom da campanha.
 */

/**
 * As capas que vem DENTRO do app (public/assets/campanhas, WebP 720x900).
 * Mapa pelo id do catalogo, e nao pelo banco: o 118/119 nao tem esses
 * arquivos, e uma capa trocada no banco mostraria imagem quebrada neles.
 */
const CAPA_LOCAL: Record<string, string> = {
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01': 'sono-de-elite',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06': 'detox-digital',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04': 'controle-de-impulsos',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05': 'presenca-real',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02': 'mente-sem-armadilhas', // Leitura Ativa vira Mente sem Armadilhas
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10': 'expressao-criativa',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08': 'circulo-forte', // Construcao de Cla vira Circulo Forte
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08': 'estoicismo-aplicado',
    '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01': 'despertar-de-ferro',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09': 'financas-com-intencao',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05': 'maestria-financeira',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04': 'lideranca-sem-cargo',
    '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05': 'construcao-de-identidade',
    '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03': 'corpo-de-elite',
    '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03': 'foco-blindado',
    // faxina-total: entra quando a campanha nova existir no catalogo.
};

/** A capa local da campanha, se houver; senao, a do banco. */
export const capaDaCampanha = (catalogId?: string | null, cover?: string | null): string | undefined => {
    const local = catalogId ? CAPA_LOCAL[catalogId] : undefined;
    return local ? `/assets/campanhas/${local}.webp` : (cover || undefined);
};

/** Fundo do card da loja: imagem cobrindo o card, com veu. */
export const CapaDeFundoDaCampanha: React.FC<{ cover?: string | null; tom?: string }> = ({ cover, tom }) => {
    const [falhou, setFalhou] = useState(false);
    const temImagem = isProbablyImageUrl(cover) && !falhou;
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
            {temImagem ? (
                <img src={cover!} alt="" loading="lazy" onError={() => setFalhou(true)} className="h-full w-full object-cover opacity-70" />
            ) : (
                <div className="h-full w-full" style={{ background: `radial-gradient(circle at 80% 0%, ${tom || '#d5b878'}33, transparent 60%)` }} />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,11,14,0.35)_0%,rgba(10,11,14,0.78)_55%,rgba(10,11,14,0.94)_100%)]" />
        </div>
    );
};

/** Fundo da ficha da campanha: veu, a imagem cobrindo a placa, e o degrade de sempre por baixo. */
export const fundoComCapa = (cover: string | null | undefined, degrade: string): React.CSSProperties => (
    isProbablyImageUrl(cover)
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(10,11,14,0.45), rgba(10,11,14,0.9) 42%), url("${cover}"), ${degrade}`,
            backgroundSize: 'cover, cover, cover',
            backgroundPosition: 'center top, center top, center',
            backgroundRepeat: 'no-repeat',
        }
        : { backgroundImage: degrade }
);
