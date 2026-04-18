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
        views.setTextViewText(R.id.glyph_widget_progress, copy.progress);
        views.setTextViewText(R.id.glyph_widget_focus, copy.focus);
        views.setTextViewText(R.id.glyph_widget_oracle, copy.oracle);

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
                return new WidgetCopy(DEFAULT_TITLE, DEFAULT_SUBTITLE, "0/0", "Sem plano aberto", "Oraculo aguardando");
            }

            JSONObject root = new JSONObject(raw);
            JSONObject daily = root.optJSONObject("daily");
            JSONObject oracle = root.optJSONObject("oracle");
            if (daily == null) {
                return new WidgetCopy(DEFAULT_TITLE, DEFAULT_SUBTITLE, "0/0", "Sem plano aberto", "Oraculo aguardando");
            }

            String cycleName = daily.optString("cycleName", "");
            String title = cycleName == null || cycleName.trim().isEmpty() ? DEFAULT_TITLE : cycleName.trim();
            String dayLabel = daily.optString("cycleDayLabel", "");
            String subtitle = dayLabel == null || dayLabel.trim().isEmpty() ? "Hoje no GLYPH" : dayLabel.trim();
            int completed = daily.optInt("completedAllCount", daily.optInt("completedCount", 0));
            int total = daily.optInt("totalAllCount", daily.optInt("totalCount", 0));
            String progress = completed + "/" + total;

            JSONObject focusArena = daily.optJSONObject("focusArena");
            String focus = focusArena != null ? focusArena.optString("name", "") : "";
            if (focus == null || focus.trim().isEmpty()) {
                int available = daily.optInt("availableUnitCount", 0);
                focus = available > 0 ? available + " acao(es) no estoque" : "Nenhuma prioridade definida";
            }

            String oracleCopy = "Oraculo em silencio";
            if (oracle != null) {
                String unread = oracle.optString("latestUnreadPreview", "");
                String latest = oracle.optString("latestFeedPreview", "");
                String preview = unread != null && !unread.trim().isEmpty() ? unread : latest;
                if (preview != null && !preview.trim().isEmpty()) {
                    oracleCopy = preview.trim();
                }
            }

            return new WidgetCopy(title, subtitle, progress, focus, trim(oracleCopy, 86));
        } catch (Exception _error) {
            return new WidgetCopy(DEFAULT_TITLE, DEFAULT_SUBTITLE, "0/0", "Abra o app", "Widget sincronizando");
        }
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
        final String progress;
        final String focus;
        final String oracle;

        WidgetCopy(String title, String subtitle, String progress, String focus, String oracle) {
            this.title = title;
            this.subtitle = subtitle;
            this.progress = progress;
            this.focus = focus;
            this.oracle = oracle;
        }
    }
}
