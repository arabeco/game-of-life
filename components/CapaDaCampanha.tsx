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
