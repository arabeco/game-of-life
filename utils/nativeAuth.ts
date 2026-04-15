import { isCapacitorNativeRuntime } from './runtimePlatform';

const NATIVE_AUTH_SCHEME = 'life.glyph.app';
const NATIVE_AUTH_HOST = 'auth';
const NATIVE_AUTH_PATH = '/callback';

export const NATIVE_AUTH_REDIRECT_URL = `${NATIVE_AUTH_SCHEME}://${NATIVE_AUTH_HOST}${NATIVE_AUTH_PATH}`;

export const getGoogleAuthRedirectUrl = (webAppOrigin: string): string =>
  isCapacitorNativeRuntime() ? NATIVE_AUTH_REDIRECT_URL : `${webAppOrigin.replace(/\/+$/, '')}/`;

export const extractOAuthRedirectUrl = (value: string): string | null => {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    return parsed.searchParams.get('redirect_to');
  } catch (_error) {
    return null;
  }
};

export const isNativeAuthCallbackUrl = (value: string): boolean => {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === `${NATIVE_AUTH_SCHEME}:`
      && parsed.hostname === NATIVE_AUTH_HOST
      && parsed.pathname === NATIVE_AUTH_PATH;
  } catch (_error) {
    return false;
  }
};

export const parseNativeAuthCallback = (value: string) => {
  try {
    const parsed = new URL(value);
    return {
      code: parsed.searchParams.get('code'),
      error: parsed.searchParams.get('error'),
      errorDescription: parsed.searchParams.get('error_description'),
    };
  } catch (_error) {
    return {
      code: null,
      error: 'invalid_callback_url',
      errorDescription: null,
    };
  }
};
