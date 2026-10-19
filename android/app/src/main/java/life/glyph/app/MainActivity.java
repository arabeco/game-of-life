package life.glyph.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import life.glyph.app.billing.StoreBillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StoreBillingPlugin.class);
        registerPlugin(GlyphWidgetPlugin.class);
        registerPlugin(InstallReferrerPlugin.class);
        super.onCreate(savedInstanceState);

        // Vibracao desligada no menu nao vibra (19/10/2026). Segurar um cartao do
        // planner e um toque longo, e o Android dava a vibracao de toque longo do
        // sistema por conta propria. Quem vibra e o app, pelo @capacitor/haptics
        // (motor de vibracao direto, que isto nao afeta), so quando a pessoa deixou.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setHapticFeedbackEnabled(false);
        }
    }
}
