import React, { useMemo } from 'react';
import type { LegacyRenderPayload } from '../types';
import { LegacyProjectionScene } from '../components/LegacyProjectionScene';
import { LegacyGrandPlaque } from '../components/LegacyGrandPlaque';

const parseLegacyRenderPayload = (rawPayload: string | null): LegacyRenderPayload | null => {
    if (!rawPayload) return null;

    const candidates = [rawPayload];

    try {
        candidates.push(decodeURIComponent(rawPayload));
    } catch {
        // Ignore URI decode errors and continue with other decoding strategies.
    }

    try {
        const normalized = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        candidates.push(window.atob(padded));
    } catch {
        // Ignore base64 decode errors and continue.
    }

    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate) as LegacyRenderPayload;
            if (parsed && parsed.version && parsed.sovereignName && Array.isArray(parsed.eras)) {
                return parsed;
            }
        } catch {
            // Try the next decoding strategy.
        }
    }

    return null;
};

export const LegacyRenderView: React.FC = () => {
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const payload = useMemo(() => parseLegacyRenderPayload(params.get('payload')), [params]);
    const captureMode = params.get('capture') === '1';
    const plaqueOnly = params.get('plaque') === '1';

    if (!payload) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
                <div className="max-w-xl rounded-[28px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Legacy Render</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight">Payload ausente ou invalido</h1>
                    <p className="mt-4 text-sm leading-relaxed text-gray-400">
                        Esta rota isolada espera `?render=legacy&payload=...` com o JSON do legado serializado para o worker/headless abrir a cena sem a UI normal do app.
                    </p>
                </div>
            </div>
        );
    }

    if (plaqueOnly) {
        return (
            <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.1),_transparent_34%),linear-gradient(180deg,_#10161d,_#030506)] p-4 text-white sm:p-8">
                <div className="w-full max-w-[760px]">
                    <LegacyGrandPlaque
                        eras={payload.eras}
                        sovereignName={payload.sovereignName}
                        identity={payload.fallbackIdentity}
                        identityMode="current"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#050505] text-white overflow-hidden ${captureMode ? 'p-0' : 'p-6'}`}>
            <div className={captureMode ? 'mx-auto w-[1920px]' : 'mx-auto max-w-[1720px]'}>
                <LegacyProjectionScene
                    eras={payload.eras}
                    sovereignName={payload.sovereignName}
                    projectionActive
                    interactive={!captureMode}
                    autoAdvance={captureMode}
                    fallbackIdentity={payload.fallbackIdentity}
                />
            </div>
        </div>
    );
};
