package com.lucidbruhhh.kotatsucat;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.RemoteViews;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

/** Home-screen widget: the cat's face and needs, projected forward while the app is closed. */
public class CatWidget extends AppWidgetProvider {
    static final String PREFS = "nyan_widget";
    private static final String[] KEYS = { "hunger", "fun", "clean", "energy" };
    private static final int[] BARS = { R.id.bar_hunger, R.id.bar_fun, R.id.bar_clean, R.id.bar_energy };

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        for (int id : mgr.getAppWidgetIds(new ComponentName(ctx, CatWidget.class))) mgr.updateAppWidget(id, build(ctx));
    }

    static RemoteViews build(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.cat_widget);
        Intent open = new Intent(ctx, MainActivity.class);
        v.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        String json = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("cat", null);
        if (json == null || json.isEmpty()) {
            v.setTextViewText(R.id.widget_name, "Kotatsu Cat");
            v.setTextViewText(R.id.widget_mood, "Open the app to meet your cat");
            return v;
        }
        try {
            JSONObject c = new JSONObject(json);
            JSONObject needs = c.getJSONObject("needs"), rates = c.getJSONObject("rates");
            // mirrors the game's offline rules: needs fall at their hourly rate but never below 20 while you're away
            double hrs = Math.min(10, Math.max(0, (System.currentTimeMillis() - c.getDouble("at")) / 3_600_000.0));
            boolean asleep = c.optBoolean("asleep");
            double sum = 0;
            for (int i = 0; i < KEYS.length; i++) {
                double val = needs.getDouble(KEYS[i]);
                double now = KEYS[i].equals("energy") && asleep ? Math.min(100, val + hrs * 30) : Math.max(Math.min(val, 20), val - rates.getDouble(KEYS[i]) * hrs);
                sum += now;
                v.setProgressBar(BARS[i], 100, (int) Math.round(now), false);
            }
            double mood = sum / KEYS.length;
            v.setTextViewText(R.id.widget_name, c.optString("name", "Mochi") + "  ·  Lv " + c.optInt("level", 1));
            v.setTextViewText(R.id.widget_mood, mood >= 60 ? "Happy and cozy ♡" : mood >= 35 ? "Could use some attention" : "Misses you…");
            File face = new File(ctx.getFilesDir(), "widget_" + (mood >= 60 ? "happy" : mood >= 35 ? "okay" : "sad") + ".png");
            if (face.exists()) {
                Bitmap bmp = BitmapFactory.decodeFile(face.getAbsolutePath());
                if (bmp != null) v.setImageViewBitmap(R.id.widget_cat, bmp);
            }
        } catch (JSONException ignored) {
            // keep the last good layout
        }
        return v;
    }
}
