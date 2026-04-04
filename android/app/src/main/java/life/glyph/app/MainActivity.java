package life.glyph.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import life.glyph.app.billing.StoreBillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StoreBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
