package com.lucidbruhhh.kotatsucat;

import android.content.Context;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Iterator;

/** Receives the cat's stats snapshot and mood portraits from the game and refreshes the home-screen widget. */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        ctx.getSharedPreferences(CatWidget.PREFS, Context.MODE_PRIVATE).edit().putString("cat", call.getString("json", "")).apply();
        JSObject images = call.getObject("images");
        if (images != null) {
            Iterator<String> keys = images.keys();
            while (keys.hasNext()) {
                String name = keys.next();
                String b64 = images.getString(name);
                if (b64 == null) continue;
                try (FileOutputStream out = new FileOutputStream(new File(ctx.getFilesDir(), "widget_" + name + ".png"))) {
                    out.write(Base64.decode(b64, Base64.DEFAULT));
                } catch (IOException ignored) {
                    // the widget falls back to the previous portrait
                }
            }
        }
        CatWidget.refreshAll(ctx);
        call.resolve();
    }
}
