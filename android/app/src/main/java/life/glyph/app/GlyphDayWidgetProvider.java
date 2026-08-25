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
    private static final String ACTION_SELECT = "life.glyph.app.widget.SELECT";
    private static final String SELECTED_KEY_PREFIX = "glyph_widget_selected_";
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

        if (ACTION_SELECT.equals(action)) {
            // Tocar na lista escolhe; quem age e a barra de baixo. Widget nao tem
            // long-press nem menu, entao selecionar e o unico jeito de oferecer
            // duas acoes para o mesmo item.
            String selectedId = intent.getStringExtra(EXTRA_ACTION_ID);
            SharedPreferences prefs = context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
            String current = prefs.getString(SELECTED_KEY_PREFIX + appWidgetId, "");
            // Tocar de novo no mesmo item desmarca: sem isso nao havia como sair
            // da selecao sem agir.
            String next = selectedId != null && selectedId.equals(current) ? "" : (selectedId == null ? "" : selectedId);
            prefs.edit().putString(SELECTED_KEY_PREFIX + appWidgetId, next).apply();
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

        if (showDo) {
            // A baia vem da colecao rolavel; o planner segue em linhas fixas porque
            // e leitura curta do dia, nao uma lista para agir.
            Intent adapter = new Intent(context, GlyphBayWidgetService.class);
            adapter.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            adapter.setData(Uri.parse(adapter.toUri(Intent.URI_INTENT_SCHEME)));
            views.setRemoteAdapter(R.id.glyph_day_list, adapter);

            // Item de colecao nao carrega PendingIntent proprio: ele preenche este
            // template com o action_id do que foi tocado.
            Intent template = new Intent(context, GlyphDayWidgetProvider.class);
            template.setAction(ACTION_SELECT);
            template.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            views.setPendingIntentTemplate(R.id.glyph_day_list, PendingIntent.getBroadcast(
                    context, appWidgetId, template,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE));

            views.setViewVisibility(R.id.glyph_day_list, View.VISIBLE);

            // A barra de acao so existe com algo escolhido. Dois botoes soltos sem
            // alvo confundem mais do que ajudam.
            String selectedId = context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE)
                    .getString(SELECTED_KEY_PREFIX + appWidgetId, "");
            RowData selected = null;
            for (RowData row : rows) {
                if (row.actionId != null && row.actionId.equals(selectedId)) { selected = row; break; }
            }

            if (selected != null) {
                views.setViewVisibility(R.id.glyph_day_selection_bar, View.VISIBLE);
                views.setTextViewText(R.id.glyph_day_selection_name, trim(selected.text, 26));

                Intent concluir = new Intent(context, GlyphDayWidgetProvider.class);
                concluir.setAction(ACTION_COMPLETE);
                concluir.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
                concluir.putExtra(EXTRA_ACTION_ID, selected.actionId);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
                views.setOnClickPendingIntent(R.id.glyph_day_selection_complete,
                        PendingIntent.getBroadcast(context, appWidgetId + 60000, concluir, flags));

                // Agendar abre o planner naquela acao. A viagem e de ida: o widget
                // nao tem como trazer a pessoa de volta depois de entrar no app.
                views.setOnClickPendingIntent(R.id.glyph_day_selection_schedule,
                        plannerIntentForAction(context, appWidgetId, selected.actionId));
            } else {
                views.setViewVisibility(R.id.glyph_day_selection_bar, View.GONE);
            }
            views.setViewVisibility(R.id.glyph_day_empty, rows.isEmpty() ? View.VISIBLE : View.GONE);
            views.setTextViewText(R.id.glyph_day_empty, "NADA NA BAIA AGORA.");
        } else {
            views.setViewVisibility(R.id.glyph_day_list, View.GONE);
            views.setViewVisibility(R.id.glyph_day_selection_bar, View.GONE);
            views.setViewVisibility(R.id.glyph_day_empty, View.VISIBLE);
            views.setTextViewText(R.id.glyph_day_empty, buildTodaySummary(rows));
        }

        views.setOnClickPendingIntent(R.id.glyph_day_tab_today, providerIntent(context, appWidgetId, ACTION_TAB_TODAY, 10, null));
        views.setOnClickPendingIntent(R.id.glyph_day_tab_do, providerIntent(context, appWidgetId, ACTION_TAB_DO, 20, null));
        views.setOnClickPendingIntent(R.id.glyph_day_open_planner, plannerIntent(context, appWidgetId));
        manager.updateAppWidget(appWidgetId, views);
        // A colecao nao recarrega sozinha quando o snapshot muda: updateAppWidget
        // redesenha a moldura, nao os itens. Sem este aviso a baia congela no que
        // foi lido da primeira vez.
        manager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.glyph_day_list);
    }

    /**
     * O planner em uma linha. A aba de hoje e leitura curta — quem quer agir usa a
     * baia, que e a aba de abertura e tem a lista rolavel.
     */
    private static String buildTodaySummary(List<RowData> rows) {
        if (rows.isEmpty()) return "NADA AGENDADO PARA HOJE.";
        StringBuilder resumo = new StringBuilder();
        int limite = Math.min(rows.size(), 3);
        for (int index = 0; index < limite; index++) {
            if (index > 0) resumo.append("  ·  ");
            resumo.append(trim(rows.get(index).text, 24));
        }
        if (rows.size() > limite) resumo.append("  +").append(rows.size() - limite);
        return resumo.toString();
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

    private static PendingIntent plannerIntentForAction(Context context, int widgetId, String actionId) {
        Intent intent = new Intent(Intent.ACTION_VIEW,
                Uri.parse("life.glyph.app://widget/planner?action=" + Uri.encode(actionId == null ? "" : actionId)));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, widgetId + 70000, intent, flags);
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
                // Concluida a acao, o widget vira para o planner e mostra onde ela
                // caiu. Sem isso a linha some da baia e a pessoa fica sem retorno
                // de onde aquilo foi parar.
                // Concluida, a selecao perde o alvo: manter marcada uma acao que
                // saiu da baia deixaria a barra apontando para o nada.
                context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE)
                        .edit().remove(SELECTED_KEY_PREFIX + widgetId).apply();
                saveTab(context, widgetId, "today");
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
        // A baia abre primeiro: quem poe o widget na tela quer AGIR, nao consultar.
        // O planner e a segunda aba, e para onde o widget vai sozinho depois que
        // a acao e concluida — para a pessoa ver onde ela caiu.
        return context.getSharedPreferences(GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE).getString(TAB_KEY_PREFIX + widgetId, "do");
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
