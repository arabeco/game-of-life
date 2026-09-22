import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, AppUpdateResultCode } from '@capawesome/capacitor-app-update';

/**
 * A ATUALIZACAO NATIVA DO GOOGLE PLAY.
 *
 * Ate aqui o app so sabia MANDAR a pessoa para a loja: `window.open` numa URL,
 * que joga ela no navegador, fora do app, e torce para ela voltar. A Play tem
 * uma API propria para isso — a tela de atualizacao desenhada pelo Google, com
 * barra de progresso, por dentro do app.
 *
 * SAO DOIS MODOS, E A DIFERENCA E DE QUEM MANDA.
 *
 * `flexivel` baixa em segundo plano e so avisa quando esta pronto para
 * reiniciar. E o certo para versao de rotina: ninguem e interrompido, e mesmo
 * assim a base vai ficando atual sozinha — que e o que faz a trava de
 * emergencia quase nunca precisar existir.
 *
 * `imediato` toma a tela inteira e nao devolve o app ate terminar. Isso so se
 * faz quando a versao instalada esta fazendo estrago, e por isso ele nao dispara
 * sozinho: quem chama e o comunicado travado.
 *
 * O QUE ELA NAO RESOLVE, e vale estar escrito aqui do lado da que resolve:
 * a atualizacao nativa so aparece quando JA EXISTE versao nova publicada e
 * propagada na Play. Quando o defeito e descoberto de madrugada e o conserto
 * ainda nem foi escrito, ela nao tem o que oferecer — quem segura a versao ruim
 * naquela hora e o `app_broadcasts` com `dismissible: false`.
 *
 * FORA DA PLAY, TUDO AQUI E SILENCIO. No navegador, no `npm run dev` e num APK
 * instalado a mao, a API nao existe ou responde que nao ha o que atualizar. As
 * funcoes devolvem o motivo em vez de estourar, porque o chamador precisa saber
 * se deve cair no link como plano B.
 */

export type ResultadoDaAtualizacao =
    | 'iniciada'
    | 'sem_atualizacao'
    | 'nao_permitida'
    | 'recusada'
    | 'indisponivel'
    | 'erro';

const foraDaPlay = (): boolean => Capacitor.getPlatform() !== 'android';

/** Ha versao nova publicada e propagada para este aparelho? */
export const haVersaoNovaNaLoja = async (): Promise<boolean> => {
    if (foraDaPlay()) return false;
    try {
        const info = await AppUpdate.getAppUpdateInfo();
        return info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
    } catch {
        // App instalado fora da Play, sem Play Services, ou sem rede. Nao saber
        // se ha atualizacao nao e um erro que a pessoa precise ver.
        return false;
    }
};

/**
 * A atualizacao de rotina: baixa por baixo, sem interromper.
 *
 * Chamada na abertura do app. Se a pessoa recusar, ela recusou — nao se insiste
 * na mesma sessao nem se transforma isso num aviso.
 */
export const atualizarEmSegundoPlano = async (): Promise<ResultadoDaAtualizacao> => {
    if (foraDaPlay()) return 'indisponivel';
    try {
        const info = await AppUpdate.getAppUpdateInfo();
        if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return 'sem_atualizacao';
        if (!info.flexibleUpdateAllowed) return 'nao_permitida';

        const resultado = await AppUpdate.startFlexibleUpdate();
        if (resultado.code === AppUpdateResultCode.CANCELED) return 'recusada';
        if (resultado.code !== AppUpdateResultCode.OK) return 'erro';
        return 'iniciada';
    } catch {
        return 'indisponivel';
    }
};

/**
 * A atualizacao que nao devolve o app: para quando a versao instalada esta
 * fazendo estrago.
 *
 * Se o modo imediato nao for permitido pela Play — acontece quando a versao
 * nova e antiga demais ou a politica de staleness nao bateu —, abre a ficha da
 * loja como plano B, que ainda e melhor que nao oferecer nada.
 */
export const exigirAtualizacaoAgora = async (): Promise<ResultadoDaAtualizacao> => {
    if (foraDaPlay()) return 'indisponivel';
    try {
        const info = await AppUpdate.getAppUpdateInfo();
        if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return 'sem_atualizacao';

        if (!info.immediateUpdateAllowed) {
            await AppUpdate.openAppStore();
            return 'nao_permitida';
        }

        const resultado = await AppUpdate.performImmediateUpdate();
        if (resultado.code === AppUpdateResultCode.CANCELED) return 'recusada';
        if (resultado.code !== AppUpdateResultCode.OK) return 'erro';
        return 'iniciada';
    } catch {
        return 'indisponivel';
    }
};

/** A ficha do app na Play, por dentro do app quando da. */
export const abrirFichaDaLoja = async (): Promise<boolean> => {
    if (foraDaPlay()) return false;
    try {
        await AppUpdate.openAppStore();
        return true;
    } catch {
        return false;
    }
};
