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

public class GlyphDayWidgetProvider extends AppWidgetProvider {
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
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, GlyphDayWidgetProvider.class));
            for (int id : ids) {
                updateWidget(context, manager, id);
            }
        }
    }

    static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.glyph_day_widget);
        DayCopy copy = readCopy(context);

        views.setTextViewText(R.id.glyph_day_title, copy.title);
        views.setTextViewText(R.id.glyph_day_subtitle, copy.subtitle);
        views.setTextViewText(R.id.glyph_day_done, copy.done);
        views.setTextViewText(R.id.glyph_day_planned, copy.planned);
        views.setTextViewText(R.id.glyph_day_stock, copy.stock);
        views.setTextViewText(R.id.glyph_day_checklist, copy.checklist);
        views.setTextViewText(R.id.glyph_day_focus, copy.focus);
        views.setProgressBar(R.id.glyph_day_progress_bar, 100, copy.progressPercent, false);

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setAction(Intent.ACTION_MAIN);
        openIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 1, openIntent, flags);
        views.setOnClickPendingIntent(R.id.glyph_day_root, pendingIntent);

        manager.updateAppWidget(appWidgetId, views);
    }

    private static DayCopy readCopy(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
            String raw = prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, null);
            if (raw == null || raw.trim().isEmpty()) {
                return DayCopy.loggedOut();
            }

            JSONObject root = new JSONObject(raw);
            JSONObject daily = root.optJSONObject("daily");
            if (daily == null) {
                return DayCopy.loggedOut();
            }

            boolean hasCycle = daily.optBoolean("hasCycle", false);
            String cycleName = safeString(daily, "cycleName");
            String stage = translateStage(safeString(daily, "stage"));
            int completed = daily.optInt("completedAllCount", daily.optInt("completedCount", 0));
            int total = daily.optInt("totalAllCount", daily.optInt("totalCount", 0));
            int stock = daily.optInt("availableUnitCount", 0);
            int checklistDone = daily.optInt("checklistCompleted", 0);
            int checklistTotal = daily.optInt("checklistTotal", 0);
            int progress = clamp((int) Math.round(daily.optDouble("progressPercent", 0)));
            JSONObject focusArena = daily.optJSONObject("focusArena");
            String focus = focusArena != null ? safeString(focusArena, "name") : "";

            if (!hasCycle) {
                return new DayCopy(
                    "RESUMO DO DIA",
                    "Sem ciclo ativo",
                    "0 feitas",
                    "0 programadas",
                    "0 estoque",
                    checklistDone + "/" + checklistTotal + " checklist",
                    "Crie um ciclo para ativar seu SITREP",
                    0
                );
            }

            if (focus.isEmpty()) {
                focus = stock > 0 ? "Estoque pronto para puxar acao" : "Nenhuma arena foco definida";
            }

            return new DayCopy(
                "RESUMO DO DIA",
                trim(cycleName.isEmpty() ? stage : cycleName + " - " + stage, 38),
                completed + " feitas",
                total + " programadas",
                stock + " estoque",
                checklistDone + "/" + checklistTotal + " checklist",
                trim(focus, 48),
                progress
            );
        } catch (Exception _error) {
            return new DayCopy("RESUMO DO DIA", "Widget sincronizando", "--", "--", "--", "--", "Abra o GLYPH para atualizar", 0);
        }
    }

    private static String translateStage(String stage) {
        if ("locked".equals(stage)) return "Em execucao";
        if ("completed".equals(stage)) return "Dia fechado";
        if ("planning".equals(stage)) return "Planejando";
        return stage.isEmpty() ? "Hoje" : stage;
    }

    private static String safeString(JSONObject object, String key) {
        if (object == null || object.isNull(key)) return "";
        String value = object.optString(key, "");
        if (value == null) return "";
        String normalized = value.replaceAll("\\s+", " ").trim();
        return "null".equalsIgnoreCase(normalized) ? "" : normalized;
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

    private static class DayCopy {
        final String title;
        final String subtitle;
        final String done;
        final String planned;
        final String stock;
        final String checklist;
        final String focus;
        final int progressPercent;

        DayCopy(String title, String subtitle, String done, String planned, String stock, String checklist, String focus, int progressPercent) {
            this.title = title;
            this.subtitle = subtitle;
            this.done = done;
            this.planned = planned;
            this.stock = stock;
            this.checklist = checklist;
            this.focus = focus;
            this.progressPercent = progressPercent;
        }

        static DayCopy loggedOut() {
            return new DayCopy("RESUMO DO DIA", "Aguardando login", "--", "--", "--", "--", "Abra o app para sincronizar", 0);
        }
    }
}
