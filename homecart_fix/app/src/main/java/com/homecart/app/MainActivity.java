package com.homecart.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.speech.RecognizerIntent;
import java.util.ArrayList;

public class MainActivity extends Activity {
    private WebView webView;
    private static final int MIC_REQ = 100;
    private static final int VOICE_REQ = 101;

    @Override
    public void onCreate(Bundle b) {
        super.onCreate(b);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new VoiceBridge(), "AndroidVoice");
        webView.addJavascriptInterface(new PrintBridge(), "AndroidPrint");

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void startNativeVoice() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_REQ);
            return;
        }

        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN");
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Say an item and quantity");
        startActivityForResult(i, VOICE_REQ);
    }

    private void printShoppingList() {
        if (webView == null) return;

        webView.post(() -> {
            PrintManager printManager = (PrintManager) getSystemService(PRINT_SERVICE);
            PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter("HomeCart Shopping List");

            PrintAttributes attributes = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                    .build();

            printManager.print("HomeCart Shopping List", adapter, attributes);
        });
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        if (req == VOICE_REQ && result == RESULT_OK && data != null) {
            ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (r != null && !r.isEmpty()) {
                String text = r.get(0)
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                        .replace("\n", " ")
                        .replace("\r", " ");
                webView.evaluateJavascript("window.androidVoiceResult('" + text + "')", null);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == MIC_REQ && results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            startNativeVoice();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    public class VoiceBridge {
        @JavascriptInterface
        public void startVoice() {
            runOnUiThread(() -> startNativeVoice());
        }
    }

    public class PrintBridge {
        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> printShoppingList());
        }
    }
}
