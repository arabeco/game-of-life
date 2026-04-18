package life.glyph.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
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
        views.setTextViewText(R.id.glyph_widget_progress, copy.progress);
        views.setTextViewText(R.id.glyph_widget_time, copy.time);
        views.setProgressBar(R.id.glyph_widget_progress_bar, 100, copy.progressPercent, false);

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setAction(Intent.ACTION_MAIN);
        openIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, openIntent, flags);
        views.setOnClickPendingIntent(R.id.glyph_widget_root, pendingIntent);

        manager.updateAppWidget(appWidgetId, views);
    }

    private static WidgetCopy readCopy(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
            String raw = prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, null);
            if (raw == null || raw.trim().isEmpty()) {
                return WidgetCopy.loggedOut();
            }

            JSONObject root = new JSONObject(raw);
            JSONObject daily = root.optJSONObject("daily");
            if (daily == null) {
                return WidgetCopy.loggedOut();
            }

            boolean hasCycle = daily.optBoolean("hasCycle", false);
            if (!hasCycle) {
                return WidgetCopy.noCycle();
            }

            String cycleName = safeString(daily, "cycleName");
            String title = cycleName.isEmpty() ? DEFAULT_TITLE : cycleName;
            String dayLabel = safeString(daily, "cycleDayLabel");
            String subtitle = dayLabel.isEmpty() ? "Ciclo ativo" : dayLabel;
            String endDate = formatDate(safeString(daily, "cycleEndDate"));
            int completed = daily.optInt("completedAllCount", daily.optInt("completedCount", 0));
            int total = daily.optInt("totalAllCount", daily.optInt("totalCount", 0));
            int progressPercent = clamp((int) Math.round(daily.optDouble("progressPercent", 0)));
            int timeProgress = clamp((int) Math.round(daily.optDouble("timeProgressPercent", 0)));
            int elapsedDays = daily.optInt("cycleElapsedDays", 0);
            int totalDays = daily.optInt("cycleTotalDays", 0);
            int arenaCount = daily.optInt("activeArenaCount", 0);
            String meta = subtitle + " - " + arenaCount + " arena" + (arenaCount == 1 ? "" : "s");
            String day = elapsedDays > 0 && totalDays > 0 ? "Dia " + elapsedDays + "/" + totalDays : subtitle;

            return new WidgetCopy(
                trim(title.toUpperCase(), 28),
                day,
                endDate.isEmpty() ? "ABRIR" : endDate,
                trim(meta, 42),
                completed + "/" + total + " - " + progressPercent + "%",
                timeProgress + "%",
                progressPercent
            );
        } catch (Exception _error) {
            return new WidgetCopy(DEFAULT_TITLE, "Widget sincronizando", "ABRIR", "Abra o app para atualizar", "--", "--", 0);
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
        final String progress;
        final String time;
        final int progressPercent;

        WidgetCopy(String title, String subtitle, String endDate, String meta, String progress, String time, int progressPercent) {
            this.title = title;
            this.subtitle = subtitle;
            this.endDate = endDate;
            this.meta = meta;
            this.progress = progress;
            this.time = time;
            this.progressPercent = progressPercent;
        }

        static WidgetCopy loggedOut() {
            return new WidgetCopy("GLYPH", "Aguardando login", "ENTRAR", "Abra o app para sincronizar seu ciclo", "--", "--", 0);
        }

        static WidgetCopy noCycle() {
            return new WidgetCopy("SEM CICLO ATIVO", "Historico pronto", "ABRIR", "Inicie um ciclo para ver seu progresso aqui", "0/0 - 0%", "0%", 0);
        }
    }
}
