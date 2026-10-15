import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { ToqueNativo } from './hapticsMapa';

/**
 * O TOQUE NATIVO (15/10/2026).
 *
 * No celular, o @capacitor/haptics usa o motor de vibracao do proprio Android:
 * toques curtos e bem definidos, que o navigator.vibrate nao consegue (em muitos
 * aparelhos ele so liga o motor por alguns milissegundos e a pessoa nem sente).
 * Fora do app nativo (navegador, bancada), devolve false e quem chamou cai no
 * padrao antigo de vibracao.
 */
export function vibrarNativo(toque: ToqueNativo): boolean {
    if (!Capacitor.isNativePlatform()) return false;
    const falhou = () => { /* sem motor de vibracao: segue sem toque */ };
    switch (toque) {
        case 'leve': void Haptics.impact({ style: ImpactStyle.Light }).catch(falhou); break;
        case 'medio': void Haptics.impact({ style: ImpactStyle.Medium }).catch(falhou); break;
        case 'forte': void Haptics.impact({ style: ImpactStyle.Heavy }).catch(falhou); break;
        case 'passo': void Haptics.selectionChanged().catch(falhou); break;
        case 'sucesso': void Haptics.notification({ type: NotificationType.Success }).catch(falhou); break;
        case 'aviso': void Haptics.notification({ type: NotificationType.Warning }).catch(falhou); break;
        case 'erro': void Haptics.notification({ type: NotificationType.Error }).catch(falhou); break;
    }
    return true;
}
