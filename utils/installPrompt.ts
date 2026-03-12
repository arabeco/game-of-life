type DeferredInstallPrompt = any;

let cachedPrompt: DeferredInstallPrompt | null = null;
let initialized = false;
const listeners = new Set<(prompt: DeferredInstallPrompt | null) => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(cachedPrompt));
};

export const startInstallPromptCapture = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (event: Event) => {
    const installEvent = event as DeferredInstallPrompt;
    installEvent.preventDefault?.();
    cachedPrompt = installEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    cachedPrompt = null;
    notifyListeners();
  });
};

export const getInstallPrompt = () => cachedPrompt;

export const subscribeInstallPrompt = (listener: (prompt: DeferredInstallPrompt | null) => void) => {
  listeners.add(listener);
  listener(cachedPrompt);
  return () => {
    listeners.delete(listener);
  };
};

export const promptForInstall = async () => {
  if (!cachedPrompt) return false;

  const prompt = cachedPrompt;
  prompt.prompt?.();
  const choiceResult = await prompt.userChoice;
  cachedPrompt = null;
  notifyListeners();

  return choiceResult?.outcome === 'accepted';
};
