package life.glyph.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GlyphWidget")
public class GlyphWidgetPlugin extends Plugin {
    static final String PREFS_GROUP = "CapacitorStorage";
    static final String SNAPSHOT_KEY = "glyph_widget_snapshot_v1";

    @PluginMethod
    public void update(PluginCall call) {
        String snapshot = call.getString("snapshot", "{}");
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_GROUP, Context.MODE_PRIVATE);
        prefs.edit().putString(SNAPSHOT_KEY, snapshot).apply();

        broadcastUpdate(context, GlyphWidgetProvider.class);
        broadcastUpdate(context, GlyphDayWidgetProvider.class);

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }

    private void broadcastUpdate(Context context, Class<?> providerClass) {
        Intent intent = new Intent(context, providerClass);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(new ComponentName(context, providerClass));
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);
    }
}
