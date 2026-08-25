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

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new BayFactory(getApplicationContext());
    }

    static class BayItem {
        String actionId = "";
        String name = "";
        String arenaName = "";
        int count = 1;
        boolean scheduledToday = false;
    }

    static class BayFactory implements RemoteViewsService.RemoteViewsFactory {
        private final Context context;
        private final List<BayItem> items = new ArrayList<>();

        BayFactory(Context context) {
            this.context = context;
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
                JSONObject root = new JSONObject(prefs.getString(GlyphWidgetPlugin.SNAPSHOT_KEY, "{}"));
                JSONObject daily = root.optJSONObject("daily");
                if (daily == null) return;

                JSONArray quick = daily.optJSONArray("quickActions");
                if (quick == null) return;

                for (int index = 0; index < quick.length(); index++) {
                    JSONObject entry = quick.optJSONObject(index);
                    if (entry == null) continue;
                    BayItem item = new BayItem();
                    item.actionId = entry.optString("actionId", "");
                    item.name = entry.optString("name", "Acao");
                    item.arenaName = entry.optString("arenaName", "");
                    item.count = Math.max(1, entry.optInt("count", 1));
                    item.scheduledToday = entry.optBoolean("scheduledToday", false);
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
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.glyph_bay_item);
            if (position < 0 || position >= items.size()) return views;

            BayItem item = items.get(position);
            String label = item.count > 1 ? item.name + "  x" + item.count : item.name;
            views.setTextViewText(R.id.glyph_bay_item_text, label);
            views.setTextViewText(R.id.glyph_bay_item_arena, item.arenaName);

            // Agendada ganha um ponto no canto, como aviso de icone de celular. A
            // lista continua uma so: separar em outra aba duplicaria ou sumiria com
            // ela, porque acao agendada sai da baia.
            views.setViewVisibility(R.id.glyph_bay_item_dot,
                    item.scheduledToday ? View.VISIBLE : View.GONE);

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
