package life.glyph.app;

import android.os.RemoteException;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * O CODIGO QUE VEIO COM A INSTALACAO (10/10/2026).
 *
 * Quem instala pelo link de convite (play.google.com/...&referrer=convite%3DCODIGO)
 * traz o codigo junto; a Play Store guarda e entrega aqui pela Install Referrer
 * API. O app le uma vez, guarda, e aplica o convite quando a conta existir.
 *
 * Esta chamada NUNCA rejeita: resolve sempre, com `referrer` (pode vir vazio) e,
 * quando algo falha, `erro`. Convite e bonus, e nada aqui pode travar a abertura.
 */
@CapacitorPlugin(name = "InstallReferrer")
public class InstallReferrerPlugin extends Plugin {

    @PluginMethod
    public void getReferrer(final PluginCall call) {
        final AtomicBoolean respondido = new AtomicBoolean(false);
        final InstallReferrerClient cliente;
        try {
            cliente = InstallReferrerClient.newBuilder(getContext()).build();
        } catch (Exception erro) {
            responder(call, respondido, "", "CLIENTE_INDISPONIVEL");
            return;
        }

        try {
            cliente.startConnection(new InstallReferrerStateListener() {
                @Override
                public void onInstallReferrerSetupFinished(int codigo) {
                    try {
                        if (codigo == InstallReferrerClient.InstallReferrerResponse.OK) {
                            ReferrerDetails detalhes = cliente.getInstallReferrer();
                            String referrer = detalhes.getInstallReferrer();
                            responder(call, respondido, referrer == null ? "" : referrer, null);
                        } else if (codigo == InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED) {
                            responder(call, respondido, "", "FEATURE_NOT_SUPPORTED");
                        } else if (codigo == InstallReferrerClient.InstallReferrerResponse.SERVICE_UNAVAILABLE) {
                            responder(call, respondido, "", "SERVICE_UNAVAILABLE");
                        } else {
                            responder(call, respondido, "", "CODIGO_" + codigo);
                        }
                    } catch (RemoteException erro) {
                        responder(call, respondido, "", "REMOTE_EXCEPTION");
                    } catch (Exception erro) {
                        responder(call, respondido, "", "ERRO_INESPERADO");
                    } finally {
                        try {
                            cliente.endConnection();
                        } catch (Exception ignorado) {
                            // Fechar a conexao nao pode derrubar nada.
                        }
                    }
                }

                @Override
                public void onInstallReferrerServiceDisconnected() {
                    responder(call, respondido, "", "SERVICE_DISCONNECTED");
                }
            });
        } catch (Exception erro) {
            responder(call, respondido, "", "CONEXAO_FALHOU");
        }
    }

    private void responder(PluginCall call, AtomicBoolean respondido, String referrer, String erro) {
        if (!respondido.compareAndSet(false, true)) return;
        JSObject resultado = new JSObject();
        resultado.put("referrer", referrer);
        if (erro != null) resultado.put("erro", erro);
        call.resolve(resultado);
    }
}
