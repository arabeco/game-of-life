package life.glyph.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

public class GlyphWidgetProvider extends AppWidgetProvider {
    private static final String DEFAULT_TITLE = "GLYPH";
    private static final String DEFAULT_SUBTITLE = "Abra o app para sincronizar o dia.";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, GlyphWidgetProvider.class));
            for (int id : ids) {
                updateWidget(context, manager, id);
            }
        }
    }

    static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.glyph_widget);
        WidgetCopy copy = readCopy(context);

        views.setTextViewText(R.id.glyph_widget_title, copy.title);
        views.setTextViewText(R.id.glyph_widget_subtitle, copy.subtitle);
        views.setTextViewText(R.id.glyph_widget_end_date, copy.endDate);
        views.setTextViewText(R.id.glyph_widget_meta, copy.meta);
        views.setTextViewText(R.id.glyph_widget_actions_label, copy.actionsLabel);
        views.setTextViewText(R.id.glyph_widget_actions_percent, copy.actionsPercent);
        views.setTextViewText(R.id.glyph_widget_time_label, copy.timeLabel);
        views.setTextViewText(R.id.glyph_widget_time_percent, copy.timePercent);
        /*
         * O ACABAMENTO DO PATAMAR ENTRA AQUI, E NAO NO XML.
         *
         * O fundo e as duas barras eram drawable fixo, em ouro para todo mundo e
         * para sempre. Agora seguem a NOTA do ciclo, como a ficha de ciclo dentro
         * do app: o cartao da tela inicial muda de cor conforme o ciclo anda.
         *
         * O titulo NAO recebe cor. Ele ja e a linha grande da ficha, em branco
         * quente, e tingi-lo competia com o proprio acabamento em vez de somar —
         * era so um texto amarelo por cima de uma placa dourada.
         */
        int larguraPx = medir(context, manager, appWidgetId, AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 300, 1400);
        int alturaPx = medir(context, manager, appWidgetId, AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 56, 600);
        GlyphWidgetPaint.Acabamento metal = GlyphWidgetPaint.acabamentoDe(copy.grade);
        views.setImageViewBitmap(R.id.glyph_widget_background, GlyphWidgetPaint.fundo(metal, copy.grade, larguraPx, alturaPx));
        views.setImageViewBitmap(R.id.glyph_widget_actions_bar, GlyphWidgetPaint.barra(metal, copy.actionsProgressPercent, true, larguraPx));
        views.setImageViewBitmap(R.id.glyph_widget_time_bar, GlyphWidgetPaint.barra(metal, copy.timeProgressPercent, false, larguraPx));
        // O titulo recebe o tom claro do metal e o corpo cai quando o nome e longo.
        views.setImageViewBitmap(R.id.glyph_widget_rule_left, GlyphWidgetPaint.linhaDoTitulo(copy.grade, false));
        views.setImageViewBitmap(R.id.glyph_widget_rule_right, GlyphWidgetPaint.linhaDoTitulo(copy.grade, true));
        views.setTextColor(R.id.glyph_widget_title, GlyphWidgetPaint.molduraDe(copy.grade).claro);
        views.setTextViewTextSize(R.id.glyph_widget_title, TypedValue.COMPLEX_UNIT_SP, GlyphWidgetPaint.tamanhoDoTitulo(copy.title));
        views.setViewVisibility(R.id.glyph_widget_subtitle, copy.showSubtitle ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.glyph_widget_meta, copy.showMeta ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.glyph_widget_actions_row, copy.showMetrics ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.glyph_widget_time_row, copy.showMetrics ? View.VISIBLE : View.GONE);

        Intent openIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("life.glyph.app://widget/reports"));
        openIntent.setClass(context, MainActivity.class);
        openIntent.setPackage(context.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, openIntent, flags);
        views.setOnClickPendingIntent(R.id.glyph_widget_root, pendingIntent);

        manager.updateAppWidget(appWidgetId, views);
    }

    /**
     * O tamanho do widget NA TELA, em pixel, para o bitmap sair na medida.
     *
     * O launcher guarda a largura e a altura em dp nas opcoes do widget, e elas
     * mudam quando a pessoa redimensiona. Na primeira colocacao o mapa costuma
     * vir vazio, entao o padrao e o tamanho declarado no glyph_widget_info.xml.
     *
     * O teto existe porque isto vira alocacao de memoria: um widget arrastado
     * para a tela inteira num tablet pediria um bitmap grande o bastante para
     * incomodar, e a diferenca visual acima desse ponto e nenhuma.
     */
    private static int medir(Context context, AppWidgetManager manager, int appWidgetId, String chave, int padraoDp, int tetoPx) {
        int dp = padraoDp;
        try {
            Bundle opcoes = manager.getAppWidgetOptions(appWidgetId);
            if (opcoes != null) {
                int lido = opcoes.getInt(chave, 0);
                if (lido > 0) dp = lido;
            }
        } catch (Exception _erro) {
            // Mantem o padrao: um bitmap no tamanho declarado e melhor que nenhum.
        }
        float densidade = context.getResources().getDisplayMetrics().density;
        int px = Math.round(dp * densidade);
        return Math.max(1, Math.min(px, tetoPx));
    }

    private static WidgetCopy readCopy(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
            String raw = prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, null);
            if (raw == null || raw.trim().isEmpty()) {
                return WidgetCopy.loggedOut("");
            }

            JSONObject root = new JSONObject(raw);
            // A nota vem do bloco de CICLO, porque e dele que ela e. Sem ciclo
            // nao ha patamar, e o acabamento cai no ouro de sempre.
            JSONObject cycle = root.optJSONObject("cycle");
            JSONObject daily = root.optJSONObject("daily");
            if (daily == null && cycle == null) {
                return WidgetCopy.loggedOut("");
            }

            boolean hasCycle = cycle != null || daily.optBoolean("hasCycle", false);
            if (!hasCycle) {
                return WidgetCopy.noCycle("");
            }

            JSONObject source = cycle != null ? cycle : daily;
            String cycleName = cycle != null ? safeString(source, "name") : safeString(source, "cycleName");
            String title = cycleName.isEmpty() ? DEFAULT_TITLE : cycleName;
            String dayLabel = cycle != null ? safeString(source, "timingLabel") : safeString(source, "cycleDayLabel");
            String subtitle = dayLabel.isEmpty() ? "Ciclo ativo" : dayLabel;
            String startDate = formatDate(cycle != null ? safeString(source, "startDate") : safeString(source, "cycleStartDate"));
            String endDate = formatDate(cycle != null ? safeString(source, "endDate") : safeString(source, "cycleEndDate"));
            int completed = cycle != null
                ? source.optInt("completedTaskCount", 0)
                : source.optInt("completedAllCount", source.optInt("completedCount", 0));
            int total = cycle != null
                ? source.optInt("totalTaskCount", 0)
                : source.optInt("totalAllCount", source.optInt("totalCount", 0));
            int progressPercent = total > 0
                ? clamp((int) Math.round(source.optDouble(cycle != null ? "taskProgressPercent" : "progressPercent", 0)))
                : 0;
            int timeProgress = clamp((int) Math.round(source.optDouble("timeProgressPercent", 0)));
            int elapsedDays = cycle != null ? source.optInt("elapsedDays", 0) : source.optInt("cycleElapsedDays", 0);
            int totalDays = cycle != null ? source.optInt("totalDays", 0) : source.optInt("cycleTotalDays", 0);
            String period = !startDate.isEmpty() && !endDate.isEmpty()
                ? startDate + "-" + endDate
                : endDate;
            String day = elapsedDays > 0 && totalDays > 0 ? "Dia " + elapsedDays + "/" + totalDays : subtitle;

            return new WidgetCopy(
                trim(title.toUpperCase(), 28),
                day,
                period.isEmpty() ? "ABRIR" : period,
                "",
                "Progresso",
                completed + "/" + total + " (" + progressPercent + "%)",
                "Tempo",
                elapsedDays + "/" + totalDays + " (" + timeProgress + "%)",
                progressPercent,
                timeProgress,
                false,
                false,
                true,
                safeString(source, "grade")
            );
        } catch (Exception _error) {
            return new WidgetCopy(DEFAULT_TITLE, "Sincronizando", "ABRIR", "", "Progresso", "0/0 (0%)", "Tempo", "0/0 (0%)", 0, 0, true, false, false, "");
        }
    }

    private static String safeString(JSONObject object, String key) {
        if (object == null || object.isNull(key)) return "";
        String value = object.optString(key, "");
        if (value == null) return "";
        String normalized = value.replaceAll("\\s+", " ").trim();
        return "null".equalsIgnoreCase(normalized) ? "" : normalized;
    }

    private static String formatDate(String isoDate) {
        if (isoDate == null || isoDate.length() < 10) return "";
        return isoDate.substring(8, 10) + "/" + isoDate.substring(5, 7);
    }

    private static int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private static String trim(String value, int maxLength) {
        if (value == null) return "";
        String normalized = value.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= maxLength) return normalized;
        return normalized.substring(0, Math.max(0, maxLength - 1)).trim() + "...";
    }

    private static class WidgetCopy {
        final String title;
        final String subtitle;
        final String endDate;
        final String meta;
        final String actionsLabel;
        final String actionsPercent;
        final String timeLabel;
        final String timePercent;
        final int actionsProgressPercent;
        final int timeProgressPercent;
        final boolean showSubtitle;
        final boolean showMeta;
        final boolean showMetrics;
        /** A nota do ciclo em andamento — SS, S, A, B, C, D, E. Vazia sem ciclo. */
        final String grade;

        WidgetCopy(String title, String subtitle, String endDate, String meta, String actionsLabel, String actionsPercent, String timeLabel, String timePercent, int actionsProgressPercent, int timeProgressPercent, boolean showSubtitle, boolean showMeta, boolean showMetrics, String grade) {
            this.title = title;
            this.subtitle = subtitle;
            this.endDate = endDate;
            this.meta = meta;
            this.actionsLabel = actionsLabel;
            this.actionsPercent = actionsPercent;
            this.timeLabel = timeLabel;
            this.timePercent = timePercent;
            this.actionsProgressPercent = actionsProgressPercent;
            this.timeProgressPercent = timeProgressPercent;
            this.showSubtitle = showSubtitle;
            this.showMeta = showMeta;
            this.showMetrics = showMetrics;
            this.grade = grade;
        }

        static WidgetCopy loggedOut(String grade) {
            return new WidgetCopy("GLYPH", "Entrar", "ABRIR", "", "Progresso", "0/0 (0%)", "Tempo", "0/0 (0%)", 0, 0, true, false, false, grade);
        }

        static WidgetCopy noCycle(String grade) {
            return new WidgetCopy("SEM CICLO ATIVO", "Historico", "ABRIR", "", "Progresso", "0/0 (0%)", "Tempo", "0/0 (0%)", 0, 0, true, false, false, grade);
        }
    }
}
