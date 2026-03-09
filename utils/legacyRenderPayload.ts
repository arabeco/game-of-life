import type { LegacyRenderEraSummary, LegacyRenderPayload, ReportIdentitySnapshot } from '../types';

interface BuildLegacyRenderPayloadOptions {
    eras: LegacyRenderEraSummary[];
    sovereignName: string;
    fallbackIdentity?: ReportIdentitySnapshot;
}

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const buildLegacyRenderPayload = ({ eras, sovereignName, fallbackIdentity }: BuildLegacyRenderPayloadOptions): LegacyRenderPayload => ({
    version: 1,
    createdAt: new Date().toISOString(),
    sovereignName,
    fallbackIdentity: fallbackIdentity ? deepClone(fallbackIdentity) : undefined,
    eras: deepClone(eras),
    timing: {
        normalMs: 1500,
        importantMs: 1700,
        identityMs: 1900,
        eraMs: 2400,
        finalHoldMs: 2200,
    },
    theme: {
        aspectRatio: '16:9',
        resolution: '1920x1080',
        background: '#050505',
    },
});

export const encodeLegacyRenderPayload = (payload: LegacyRenderPayload): string => {
    const json = JSON.stringify(payload);
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return window.btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }
    return encodeURIComponent(json);
};

export const buildLegacyRenderUrl = (payload: LegacyRenderPayload, baseUrl = `${window.location.origin}${window.location.pathname}`): string => {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('render', 'legacy');
    url.searchParams.set('payload', encodeLegacyRenderPayload(payload));
    return url.toString();
};
