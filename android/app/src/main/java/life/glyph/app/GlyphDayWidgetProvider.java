package life.glyph.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/**
 * O WIDGET DO DIA — VITRINE, NAO CONTROLE REMOTO (13/10/2026).
 *
 * Antes ele concluia e agendava acoes por conta propria (aba FAZER), chamando o
 * servidor com o login que o app guardava no celular. Isso competia com o
 * proprio Glyph e deixava uma sessao fora do app. Agora:
 *
 *   - duas abas, RESUMO e PLANNER, desenhadas por GlyphDayPaint;
 *   - tocar em qualquer lugar abre o planner no app (life.glyph.app://widget/planner);
 *   - embaixo, "ATUALIZADO AS 14:32": o widget nao e tempo real, e diz de quando e.
 *
 * O desenho acompanha o tamanho: o launcher avisa em onAppWidgetOptionsChanged.
 */
public class GlyphDayWidgetProvider extends AppWidgetProvider {
    private static final String ACTION_TAB_RESUMO = "life.glyph.app.widget.TAB_RESUMO";
    private static final String ACTION_TAB_PLANNER = "life.glyph.app.widget.TAB_PLANNER";
    private static final String TAB_KEY_PREFIX = "glyph_day_widget_tab_";
    // Restos do widget antigo, apagados ao desenhar.
    private static final String SELECTED_KEY_PREFIX = "glyph_widget_selected_";

    private static final int ATIVA = 0xFFF1D595;
    private static final int APAGADA = 0xFF8E8878;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) updateWidget(context, manager, appWidgetId);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        updateWidget(context, manager, appWidgetId);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (!ACTION_TAB_RESUMO.equals(action) && !ACTION_TAB_PLANNER.equals(action)) return;
        int appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        prefs(context).edit().putString(TAB_KEY_PREFIX + appWidgetId, ACTION_TAB_RESUMO.equals(action) ? "resumo" : "planner").apply();
        updateWidget(context, AppWidgetManager.getInstance(context), appWidgetId);
    }

    static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return;
        limparRestosDoWidgetAntigo(context, appWidgetId);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.glyph_day_widget);
        Dados dados = lerDados(context);
        boolean resumo = "resumo".equals(prefs(context).getString(TAB_KEY_PREFIX + appWidgetId, "planner"));

        views.setTextColor(R.id.glyph_day_tab_resumo, resumo ? ATIVA : APAGADA);
        views.setTextColor(R.id.glyph_day_tab_planner, resumo ? APAGADA : ATIVA);
        views.setTextViewText(R.id.glyph_day_footer, dados.rodape);

        // O corpo: o widget menos a moldura (padding 8dp, cabecalho 20dp, rodape 12dp, margens 7dp).
        float d = context.getResources().getDisplayMetrics().density;
        int largura = medir(manager, appWidgetId, AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250, d, 1400) - Math.round(16 * d);
        int altura = medir(manager, appWidgetId, AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 110, d, 2000) - Math.round(55 * d);
        largura = Math.max(Math.round(60 * d), largura);
        altura = Math.max(Math.round(40 * d), altura);

        views.setImageViewBitmap(R.id.glyph_day_body, resumo
                ? GlyphDayPaint.resumo(d, largura, altura, dados.feitas, dados.planejadas, dados.tempoMin, dados.exp)
                : GlyphDayPaint.planner(d, largura, altura, dados.blocos, agoraNoDia(dados.diaComecaEm), dados.diaComecaEm));

        PendingIntent abrir = plannerIntent(context, appWidgetId);
        views.setOnClickPendingIntent(R.id.glyph_day_root, abrir);
        views.setOnClickPendingIntent(R.id.glyph_day_body, abrir);
        views.setOnClickPendingIntent(R.id.glyph_day_tab_resumo, tabIntent(context, appWidgetId, ACTION_TAB_RESUMO, 10));
        views.setOnClickPendingIntent(R.id.glyph_day_tab_planner, tabIntent(context, appWidgetId, ACTION_TAB_PLANNER, 20));
        manager.updateAppWidget(appWidgetId, views);
    }

    /** Minutos desde o comeco do dia do planner (04:00 = 0); a madrugada conta no fim. */
    private static int agoraNoDia(int diaComecaEm) {
        Calendar agora = Calendar.getInstance();
        int minutos = agora.get(Calendar.HOUR_OF_DAY) * 60 + agora.get(Calendar.MINUTE);
        if (minutos < diaComecaEm) minutos += 24 * 60;
        return minutos - diaComecaEm;
    }

    /**
     * O widget antigo guardava a acao escolhida e o snapshot vinha com o login.
     * Sem a aba FAZER, nada disso tem uso: a escolha sai, e o login sai do
     * snapshot guardado ate o app publicar o proximo (que ja vem sem).
     */
    private static void limparRestosDoWidgetAntigo(Context context, int appWidgetId) {
        SharedPreferences prefs = prefs(context);
        SharedPreferences.Editor editor = prefs.edit().remove(SELECTED_KEY_PREFIX + appWidgetId);
        try {
            JSONObject root = new JSONObject(prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, "{}"));
            if (root.has("auth")) {
                root.remove("auth");
                editor.putString(GlyphWidgetPlugin.SNAPSHOT_KEY, root.toString());
            }
        } catch (Exception _erro) {
            // snapshot ilegivel: o proximo do app substitui
        }
        editor.apply();
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
    }

    private static PendingIntent tabIntent(Context context, int widgetId, String action, int offset) {
        Intent intent = new Intent(context, GlyphDayWidgetProvider.class);
        intent.setAction(action);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, widgetId * 1000 + offset, intent, flags);
    }

    private static PendingIntent plannerIntent(Context context, int widgetId) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("life.glyph.app://widget/planner"));
        intent.setClass(context, MainActivity.class);
        intent.setPackage(context.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, widgetId + 50000, intent, flags);
    }

    /** O tamanho na tela, em pixel (o launcher guarda em dp nas opcoes do widget). */
    private static int medir(AppWidgetManager manager, int appWidgetId, String chave, int padraoDp, float d, int tetoPx) {
        int dp = padraoDp;
        try {
            Bundle opcoes = manager.getAppWidgetOptions(appWidgetId);
            if (opcoes != null) {
                int lido = opcoes.getInt(chave, 0);
                if (lido > 0) dp = lido;
            }
        } catch (Exception _erro) {
            // fica no padrao declarado em glyph_day_widget_info.xml
        }
        return Math.max(1, Math.min(Math.round(dp * d), tetoPx));
    }

    private static Dados lerDados(Context context) {
        Dados dados = new Dados();
        try {
            JSONObject root = new JSONObject(prefs(context).getString(GlyphWidgetPlugin.SNAPSHOT_KEY, "{}"));
            JSONObject daily = root.optJSONObject("daily");
            if (daily == null) return dados;
            boolean comCiclo = daily.optBoolean("hasCycle", false);
            dados.feitas = comCiclo ? daily.optInt("completedAllCount", 0) : daily.optInt("freeModeCompletedCount", 0);
            dados.planejadas = comCiclo ? daily.optInt("totalAllCount", 0) : daily.optInt("freeModeTotalCount", 0);
            dados.exp = daily.optInt("earnedExp", 0);
            dados.tempoMin = daily.optInt("tempoRegistradoMin", 0);
            dados.diaComecaEm = daily.optInt("diaComecaEm", 240);
            JSONArray blocos = daily.optJSONArray("plannerDoDia");
            if (blocos != null) {
                for (int i = 0; i < blocos.length(); i++) {
                    JSONObject b = blocos.optJSONObject(i);
                    if (b == null) continue;
                    JSONArray cores = b.optJSONArray("cores");
                    dados.blocos.add(new GlyphDayPaint.Bloco(
                            b.optString("nome", "Ação"),
                            b.optString("arena", "Sem arena"),
                            b.optString("icone", "•"),
                            b.optInt("inicio", 0),
                            b.optInt("duracao", 30),
                            b.optBoolean("feita", false),
                            b.optBoolean("marco", false),
                            b.optBoolean("livre", false),
                            b.optBoolean("lembrete", false),
                            cor(cores, 0, "#2f3a46"),
                            cor(cores, 1, "#1f2730")));
                }
            }
            dados.rodape = rodape(root.optString("updatedAt", ""));
        } catch (Exception _erro) {
            // mostra o widget vazio com o convite para abrir o app
        }
        return dados;
    }

    private static int cor(JSONArray cores, int indice, String padrao) {
        try {
            return Color.parseColor(cores != null ? cores.optString(indice, padrao) : padrao);
        } catch (Exception _erro) {
            return Color.parseColor(padrao);
        }
    }

    /** "ATUALIZADO ÀS 14:32", ou com a data quando nao e de hoje. */
    private static String rodape(String iso) {
        if (iso == null || iso.isEmpty()) return "ABRA O GLYPH PARA SINCRONIZAR";
        try {
            SimpleDateFormat entrada = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            entrada.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date quando = entrada.parse(iso.length() >= 19 ? iso.substring(0, 19) : iso);
            if (quando == null) return "ABRA O GLYPH PARA SINCRONIZAR";
            String hora = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(quando);
            String dia = new SimpleDateFormat("dd/MM", Locale.getDefault()).format(quando);
            String hoje = new SimpleDateFormat("dd/MM", Locale.getDefault()).format(new Date());
            return dia.equals(hoje) ? "ATUALIZADO ÀS " + hora : "ATUALIZADO EM " + dia + " ÀS " + hora;
        } catch (Exception _erro) {
            return "ABRA O GLYPH PARA SINCRONIZAR";
        }
    }

    private static final class Dados {
        int feitas;
        int planejadas;
        int exp;
        int tempoMin;
        int diaComecaEm = 240;
        final List<GlyphDayPaint.Bloco> blocos = new ArrayList<>();
        String rodape = "ABRA O GLYPH PARA SINCRONIZAR";
    }
}
