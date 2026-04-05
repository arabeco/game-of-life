import { Browser } from '@capacitor/browser';
import { isCapacitorNativeRuntime } from './runtimePlatform';

const getRawAppleSignInUrl = (): string =>
  String(import.meta.env.VITE_APPLE_SIGN_IN_URL || import.meta.env.VITE_APPLE_SIGNIN_URL || '').trim();

export const getAppleSignInUrl = (): string | null => {
  const configured = getRawAppleSignInUrl();
  return configured ? configured : null;
};

export const isAppleSignInConfigured = (): boolean =>
  Boolean(getAppleSignInUrl());

export const getAppleSignInPendingMessage = (): string =>
  'Sign in with Apple ja esta armado nesta tela. Falta apenas conectar a URL/provedor Apple para o botao abrir o fluxo real.';

export const launchAppleSignIn = async (): Promise<boolean> => {
  const authUrl = getAppleSignInUrl();
  if (!authUrl) return false;

  if (isCapacitorNativeRuntime()) {
    await Browser.open({ url: authUrl });
    return true;
  }

  window.location.assign(authUrl);
  return true;
};
