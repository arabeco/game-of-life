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
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class GlyphDayWidgetProvider extends AppWidgetProvider {
    private static final String ACTION_TAB_TODAY = "life.glyph.app.widget.TAB_TODAY";
    private static final String ACTION_TAB_DO = "life.glyph.app.widget.TAB_DO";
    private static final String ACTION_COMPLETE = "life.glyph.app.widget.COMPLETE";
    private static final String EXTRA_ACTION_ID = "action_id";
    private static final String TAB_KEY_PREFIX = "glyph_day_widget_tab_";
    private static final Set<String> ACTIONS_IN_FLIGHT = Collections.synchronizedSet(new HashSet<>());

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) updateWidget(context, manager, appWidgetId);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        int appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);

        if (ACTION_TAB_TODAY.equals(action) || ACTION_TAB_DO.equals(action)) {
            saveTab(context, appWidgetId, ACTION_TAB_DO.equals(action) ? "do" : "today");
            updateWidget(context, AppWidgetManager.getInstance(context), appWidgetId);
            return;
        }

        if (ACTION_COMPLETE.equals(action)) {
            String actionId = intent.getStringExtra(EXTRA_ACTION_ID);
            if (actionId != null && !actionId.isEmpty() && ACTIONS_IN_FLIGHT.add(actionId)) {
                completeAction(context, appWidgetId, actionId);
            }
            return;
        }

        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action)) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, GlyphDayWidgetProvider.class));
            for (int id : ids) updateWidget(context, manager, id);
        }
    }

    static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return;
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.glyph_day_widget);
        WidgetData data = readData(context);
        boolean showDo = "do".equals(readTab(context, appWidgetId));
        List<RowData> rows = showDo ? data.quickActions : data.todayActions;

        views.setTextViewText(R.id.glyph_day_title, "HOJE NO GLYPH");
        views.setTextViewText(R.id.glyph_day_subtitle, data.subtitle);
        views.setTextViewText(R.id.glyph_day_tab_today, "HOJE");
        views.setTextViewText(R.id.glyph_day_tab_do, "FAZER" + (data.quickActions.isEmpty() ? "" : " (" + data.quickActions.size() + ")"));
        views.setTextColor(R.id.glyph_day_tab_today, showDo ? 0xFF8E8878 : 0xFFF6D65B);
        views.setTextColor(R.id.glyph_day_tab_do, showDo ? 0xFFF6D65B : 0xFF8E8878);
        views.setTextViewText(R.id.glyph_day_footer, data.footer);

        bindRow(context, views, appWidgetId, 0, rows, showDo, R.id.glyph_day_row_1, R.id.glyph_day_row_1_text, R.id.glyph_day_row_1_action);
        bindRow(context, views, appWidgetId, 1, rows, showDo, R.id.glyph_day_row_2, R.id.glyph_day_row_2_text, R.id.glyph_day_row_2_action);
        bindRow(context, views, appWidgetId, 2, rows, showDo, R.id.glyph_day_row_3, R.id.glyph_day_row_3_text, R.id.glyph_day_row_3_action);

        views.setOnClickPendingIntent(R.id.glyph_day_tab_today, providerIntent(context, appWidgetId, ACTION_TAB_TODAY, 10, null));
        views.setOnClickPendingIntent(R.id.glyph_day_tab_do, providerIntent(context, appWidgetId, ACTION_TAB_DO, 20, null));
        views.setOnClickPendingIntent(R.id.glyph_day_open_planner, plannerIntent(context, appWidgetId));
        manager.updateAppWidget(appWidgetId, views);
    }

    private static void bindRow(Context context, RemoteViews views, int widgetId, int index, List<RowData> rows, boolean showDo, int rowId, int textId, int actionId) {
        if (index >= rows.size()) {
            views.setViewVisibility(rowId, View.GONE);
            return;
        }
        RowData row = rows.get(index);
        views.setViewVisibility(rowId, View.VISIBLE);
        views.setTextViewText(textId, row.text);
        views.setViewVisibility(actionId, showDo && row.actionable ? View.VISIBLE : View.GONE);
        if (showDo && row.actionable) {
            views.setTextViewText(actionId, "FEITO");
            views.setOnClickPendingIntent(actionId, providerIntent(context, widgetId, ACTION_COMPLETE, 100 + index, row.actionId));
        }
    }

    private static PendingIntent providerIntent(Context context, int widgetId, String action, int offset, String actionId) {
        Intent intent = new Intent(context, GlyphDayWidgetProvider.class);
        intent.setAction(action);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        if (actionId != null) intent.putExtra(EXTRA_ACTION_ID, actionId);
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

    private static void completeAction(Context context, int widgetId, String actionId) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        RemoteViews pending = new RemoteViews(context.getPackageName(), R.layout.glyph_day_widget);
        pending.setTextViewText(R.id.glyph_day_footer, "REGISTRANDO...");
        manager.partiallyUpdateAppWidget(widgetId, pending);

        new Thread(() -> {
            try {
                SharedPreferences prefs = context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
                JSONObject root = new JSONObject(prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, "{}"));
                JSONObject auth = root.optJSONObject("auth");
                if (auth == null) throw new Exception("Abra o GLYPH para conectar o widget");

                String supabaseUrl = auth.optString("supabaseUrl", "");
                String anonKey = auth.optString("anonKey", "");
                String accessToken = auth.optString("accessToken", "");
                if (supabaseUrl.isEmpty() || anonKey.isEmpty() || accessToken.isEmpty()) throw new Exception("Sessao ausente");

                Calendar now = Calendar.getInstance();
                Calendar operational = (Calendar) now.clone();
                if (now.get(Calendar.HOUR_OF_DAY) < 4) operational.add(Calendar.DAY_OF_MONTH, -1);
                int minute = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
                JSONObject payload = new JSONObject();
                payload.put("actionId", actionId);
                payload.put("date", new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(operational.getTime()));
                payload.put("completionMinute", minute);

                String refreshToken = auth.optString("refreshToken", "");
                if (!refreshToken.isEmpty()) {
                    JSONObject refreshed = refreshSession(supabaseUrl, anonKey, refreshToken);
                    accessToken = refreshed.optString("access_token", accessToken);
                    auth.put("accessToken", accessToken);
                    auth.put("refreshToken", refreshed.optString("refresh_token", refreshToken));
                    prefs.edit().putString(GlyphWidgetPlugin.SNAPSHOT_KEY, root.toString()).apply();
                }

                JSONObject response = postJson(supabaseUrl + "/functions/v1/widget-action", anonKey, accessToken, payload);
                JSONObject task = response.optJSONObject("task");
                if (!response.optBoolean("success", false) || task == null) throw new Exception(response.optString("error", "Falha ao registrar"));

                applySuccessfulCompletion(root, actionId, task);
                prefs.edit().putString(GlyphWidgetPlugin.SNAPSHOT_KEY, root.toString()).apply();
                updateWidget(context, manager, widgetId);
            } catch (Exception error) {
                RemoteViews failed = new RemoteViews(context.getPackageName(), R.layout.glyph_day_widget);
                failed.setTextViewText(R.id.glyph_day_footer, trim(error.getMessage() == null ? "NAO FOI POSSIVEL. TENTE DE NOVO." : error.getMessage(), 46));
                manager.partiallyUpdateAppWidget(widgetId, failed);
            } finally {
                ACTIONS_IN_FLIGHT.remove(actionId);
            }
        }).start();
    }

    private static JSONObject postJson(String endpoint, String anonKey, String accessToken, JSONObject payload) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(15000);
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setRequestProperty("apikey", anonKey);
        connection.setRequestProperty("Authorization", "Bearer " + accessToken);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(payload.toString().getBytes(StandardCharsets.UTF_8));
        }
        int status = connection.getResponseCode();
        InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) body.append(line);
        }
        JSONObject result = new JSONObject(body.toString().isEmpty() ? "{}" : body.toString());
        if (status < 200 || status >= 300) throw new Exception(result.optString("error", "Falha no servidor"));
        return result;
    }

    private static JSONObject refreshSession(String supabaseUrl, String anonKey, String refreshToken) throws Exception {
        JSONObject payload = new JSONObject();
        payload.put("refresh_token", refreshToken);
        HttpURLConnection connection = (HttpURLConnection) new URL(supabaseUrl + "/auth/v1/token?grant_type=refresh_token").openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(15000);
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setRequestProperty("apikey", anonKey);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(payload.toString().getBytes(StandardCharsets.UTF_8));
        }
        int status = connection.getResponseCode();
        InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) body.append(line);
        }
        JSONObject result = new JSONObject(body.toString().isEmpty() ? "{}" : body.toString());
        if (status < 200 || status >= 300) throw new Exception("Abra o GLYPH para renovar a sessao");
        return result;
    }

    private static void applySuccessfulCompletion(JSONObject root, String actionId, JSONObject task) throws Exception {
        JSONObject daily = root.optJSONObject("daily");
        if (daily == null) return;
        JSONArray quick = daily.optJSONArray("quickActions");
        JSONArray nextQuick = new JSONArray();
        String name = task.optString("name", "Acao");
        String icon = task.optString("icon", "•");
        String arenaName = "Sem arena";
        if (quick != null) {
            for (int i = 0; i < quick.length(); i++) {
                JSONObject item = quick.optJSONObject(i);
                if (item == null) continue;
                if (actionId.equals(item.optString("actionId"))) {
                    arenaName = item.optString("arenaName", arenaName);
                    int count = item.optInt("count", 1);
                    if (count > 1) {
                        item.put("count", count - 1);
                        nextQuick.put(item);
                    }
                } else nextQuick.put(item);
            }
        }
        daily.put("quickActions", nextQuick);
        JSONArray today = daily.optJSONArray("todayActions");
        if (today == null) today = new JSONArray();
        JSONObject row = new JSONObject();
        row.put("taskId", task.optString("taskId"));
        row.put("actionId", actionId);
        row.put("name", name);
        row.put("icon", icon);
        row.put("arenaName", arenaName);
        row.put("startTime", task.optInt("startTime", 0));
        row.put("completed", true);
        today.put(row);
        daily.put("todayActions", today);
        Set<String> touchedArenas = new HashSet<>();
        for (int i = 0; i < today.length(); i++) {
            JSONObject item = today.optJSONObject(i);
            if (item != null && item.optBoolean("completed", false)) {
                touchedArenas.add(item.optString("arenaName", "Sem arena"));
            }
        }
        daily.put("touchedArenaCount", touchedArenas.size());
        daily.put("completedAllCount", daily.optInt("completedAllCount", 0) + 1);
        daily.put("earnedExp", daily.optInt("earnedExp", 0) + task.optInt("exp", 0));
        daily.put("openActionCount", Math.max(0, daily.optInt("openActionCount", 0) - 1));
    }

    private static WidgetData readData(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
            JSONObject root = new JSONObject(prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, "{}"));
            JSONObject daily = root.optJSONObject("daily");
            if (daily == null) return WidgetData.empty("Abra o GLYPH para sincronizar");
            String cycleName = safeString(daily, "cycleName");
            String cycleDay = safeString(daily, "cycleDayLabel");
            String subtitle = cycleName.isEmpty() ? "Sem ciclo ativo" : trim(cycleName + (cycleDay.isEmpty() ? "" : " · " + cycleDay), 40);
            List<RowData> today = parseTodayRows(daily.optJSONArray("todayActions"));
            List<RowData> quick = parseQuickRows(daily.optJSONArray("quickActions"));
            if (today.isEmpty()) today.add(new RowData("", "Nenhuma ação registrada hoje", false));
            if (quick.isEmpty()) quick.add(new RowData("", "Nada disponível agora", false));
            String footer = daily.optInt("completedAllCount", 0) + " feitas · " + daily.optInt("touchedArenaCount", 0) + " arenas · +" + daily.optInt("earnedExp", 0) + " XP";
            return new WidgetData(subtitle, today, quick, footer);
        } catch (Exception error) {
            return WidgetData.empty("Abra o GLYPH para sincronizar");
        }
    }

    private static List<RowData> parseTodayRows(JSONArray items) {
        List<RowData> rows = new ArrayList<>();
        if (items == null) return rows;
        for (int i = 0; i < Math.min(3, items.length()); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) continue;
            int start = item.optInt("startTime", -1);
            String time = start >= 0 ? String.format("%02d:%02d", start / 60, start % 60) + "  " : "";
            rows.add(new RowData("", time + item.optString("icon", "•") + " " + item.optString("name", "Ação") + (item.optBoolean("completed", false) ? "  ✓" : ""), false));
        }
        return rows;
    }

    private static List<RowData> parseQuickRows(JSONArray items) {
        List<RowData> rows = new ArrayList<>();
        if (items == null) return rows;
        for (int i = 0; i < Math.min(3, items.length()); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) continue;
            String count = item.optInt("count", 1) > 1 ? " ×" + item.optInt("count") : "";
            String text = item.optString("icon", "•") + " " + item.optString("name", "Ação") + count + "\n" + item.optString("arenaName", "Sem arena");
            rows.add(new RowData(item.optString("actionId", ""), text, true));
        }
        return rows;
    }

    private static void saveTab(Context context, int widgetId, String tab) {
        context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE).edit().putString(TAB_KEY_PREFIX + widgetId, tab).apply();
    }

    private static String readTab(Context context, int widgetId) {
        return context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE).getString(TAB_KEY_PREFIX + widgetId, "today");
    }

    private static String safeString(JSONObject object, String key) {
        if (object == null || object.isNull(key)) return "";
        String value = object.optString(key, "");
        return "null".equalsIgnoreCase(value) ? "" : value.replaceAll("\\s+", " ").trim();
    }

    private static String trim(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value == null ? "" : value;
        return value.substring(0, Math.max(0, maxLength - 3)).trim() + "...";
    }

    private static class RowData {
        final String actionId;
        final String text;
        final boolean actionable;
        RowData(String actionId, String text, boolean actionable) { this.actionId = actionId; this.text = text; this.actionable = actionable; }
    }

    private static class WidgetData {
        final String subtitle;
        final List<RowData> todayActions;
        final List<RowData> quickActions;
        final String footer;
        WidgetData(String subtitle, List<RowData> today, List<RowData> quick, String footer) { this.subtitle = subtitle; this.todayActions = today; this.quickActions = quick; this.footer = footer; }
        static WidgetData empty(String subtitle) {
            List<RowData> empty = new ArrayList<>();
            empty.add(new RowData("", "Nenhuma ação disponível", false));
            return new WidgetData(subtitle, empty, empty, "Abra o app para atualizar");
        }
    }
}
