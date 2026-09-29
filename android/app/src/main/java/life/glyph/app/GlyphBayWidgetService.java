package life.glyph.app;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * A baia inteira, rolavel.
 *
 * O widget desenhava tres linhas fixas no XML e o app so mandava quatro acoes:
 * quem tem uma baia cheia via uma fracao dela e nem sabia que havia mais. Linha
 * fixa nao escala, entao a lista virou uma colecao de verdade.
 *
 * Widget nao tem long-press nem hover: o unico gesto e o toque. Item de colecao
 * tambem nao pode carregar PendingIntent proprio — quem clica preenche um
 * fillInIntent sobre o template que o provider registra.
 */
public class GlyphBayWidgetService extends RemoteViewsService {
    static final String EXTRA_MODE = "glyph_widget_mode";
    static final String MODE_BAY = "bay";
    static final String MODE_TODAY = "today";

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        int widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID);
        return new BayFactory(getApplicationContext(), widgetId,
                intent.getStringExtra(EXTRA_MODE));
    }

    static class BayItem {
        String actionId = "";
        String name = "";
        String icon = "•";
        String arenaName = "";
        int count = 1;
        boolean isUnlimited = false;
        boolean scheduledToday = false;
        boolean completed = false;
        int startTime = -1;
    }

    static class BayFactory implements RemoteViewsService.RemoteViewsFactory {
        private final Context context;
        private final int widgetId;
        private final String mode;
        private final List<BayItem> items = new ArrayList<>();
        private String selectedId = "";

        BayFactory(Context context, int widgetId, String mode) {
            this.context = context;
            this.widgetId = widgetId;
            this.mode = MODE_TODAY.equals(mode) ? MODE_TODAY : MODE_BAY;
        }

        @Override
        public void onCreate() {
            load();
        }

        @Override
        public void onDataSetChanged() {
            load();
        }

        private void load() {
            items.clear();
            try {
                SharedPreferences prefs = context.getSharedPreferences(
                        GlyphWidgetPlugin.PREFS_GROUP, Context.MODE_PRIVATE);
                selectedId = prefs.getString("glyph_widget_selected_" + widgetId, "");
                JSONObject root = new JSONObject(prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, "{}"));
                JSONObject daily = root.optJSONObject("daily");
                if (daily == null) return;

                JSONArray source = MODE_TODAY.equals(mode)
                        ? daily.optJSONArray("todayActions") : daily.optJSONArray("quickActions");
                if (source == null) return;

                for (int index = 0; index < source.length(); index++) {
                    JSONObject entry = source.optJSONObject(index);
                    if (entry == null) continue;
                    BayItem item = new BayItem();
                    item.actionId = entry.optString("actionId", "");
                    item.name = entry.optString("name", "Acao");
                    item.icon = entry.optString("icon", "•");
                    item.arenaName = entry.optString("arenaName", "");
                    item.count = Math.max(1, entry.optInt("count", 1));
                    item.isUnlimited = entry.optBoolean("isUnlimited", false);
                    item.scheduledToday = entry.optBoolean("scheduledToday", false);
                    item.completed = entry.optBoolean("completed", false);
                    item.startTime = entry.optInt("startTime", -1);
                    if (!item.actionId.isEmpty()) items.add(item);
                }
            } catch (Exception ignored) {
                // Snapshot ausente ou malformado deixa a lista vazia; o widget mostra
                // o proprio texto de vazio em vez de quebrar.
            }
        }

        @Override
        public void onDestroy() {
            items.clear();
        }

        @Override
        public int getCount() {
            return items.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            boolean todayMode = MODE_TODAY.equals(mode);
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.glyph_bay_item);
            if (position < 0 || position >= items.size()) return views;

            BayItem item = items.get(position);
            if (todayMode) {
                String time = item.startTime >= 0
                        ? String.format("%02d:%02d  ", item.startTime / 60, item.startTime % 60) : "";
                views.setTextViewText(R.id.glyph_bay_item_text, time + item.icon + " " + item.name);
                views.setViewVisibility(R.id.glyph_bay_item_arena, View.GONE);
                views.setViewVisibility(R.id.glyph_bay_item_action, View.GONE);
                views.setViewVisibility(R.id.glyph_bay_item_dot, View.VISIBLE);
                // Verde confirma entrega; dourado mostra compromisso agendado.
                int stateColor = item.completed ? 0xFF6FC2C4 : 0xFFF6D65B;
                views.setTextViewText(R.id.glyph_bay_item_dot, "●");
                views.setTextColor(R.id.glyph_bay_item_dot, stateColor);
                return views;
            }

            String prefix = "";
            String label = prefix + item.name;
            if (!item.isUnlimited && item.count > 1) label += "  x" + item.count;
            views.setTextViewText(R.id.glyph_bay_item_text, label);
            views.setTextViewText(R.id.glyph_bay_item_arena, item.arenaName);

            // Agendada ganha um ponto no canto, como aviso de icone de celular. A
            // lista continua uma so: separar em outra aba duplicaria ou sumiria com
            // ela, porque acao agendada sai da baia.
            // Na Baia: amarelo se ja ganhou horario; branca para Livre e cinza
            // para uma acao ainda solta. Ela so vira verde depois da confirmacao,
            // quando sai desta aba e aparece como FEITA no Painel.
            views.setViewVisibility(R.id.glyph_bay_item_dot, View.VISIBLE);
            if (item.scheduledToday) {
                views.setTextViewText(R.id.glyph_bay_item_dot, "●");
                views.setTextColor(R.id.glyph_bay_item_dot, 0xFFF6D65B);
            } else if (item.isUnlimited) {
                views.setTextViewText(R.id.glyph_bay_item_dot, "●");
                views.setTextColor(R.id.glyph_bay_item_dot, 0xFFE8E2D4);
            } else {
                views.setTextViewText(R.id.glyph_bay_item_dot, "○");
                views.setTextColor(R.id.glyph_bay_item_dot, 0xFF8E8878);
            }

            // O item escolhido troca o convite por um marcador. A conclusao so
            // acontece na barra de confirmacao logo abaixo.
            boolean isSelected = !selectedId.isEmpty() && selectedId.equals(item.actionId);
            views.setViewVisibility(R.id.glyph_bay_item_action, View.VISIBLE);
            views.setTextViewText(R.id.glyph_bay_item_action, isSelected ? "ESCOLHIDA" : "ESCOLHER");
            views.setTextColor(R.id.glyph_bay_item_text, isSelected ? 0xFFF6D65B : 0xFFE8E2D4);

            Intent fill = new Intent();
            fill.putExtra("action_id", item.actionId);
            views.setOnClickFillInIntent(R.id.glyph_bay_item_root, fill);
            return views;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return false;
        }
    }
}
