package com.tikitacar.carpoom;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.PixelCopy;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;
import java.util.function.IntConsumer;

/**
 * 웹 빌드 결과(dist/*.html)를 앱 에셋에서 불러와 WebView로 띄우는 공통 화면.
 * WebViewAssetLoader로 https 주소를 주어 localStorage, BroadcastChannel, 지도 타일 요청이 브라우저와 같게 동작한다.
 * 모바일 앱과 차량 앱은 같은 앱 안에서 같은 주소를 쓰므로 저장 상태를 함께 본다(한 기기에서 둘을 오가며 시연 가능).
 */
public abstract class WebAppActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final long SAMPLE_INTERVAL_MS = 500;

    protected WebView web;
    private FrameLayout root;
    private View topFill;
    private View bottomFill;
    private int topColor;
    private int bottomColor;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable sampler = new Runnable() {
        @Override
        public void run() {
            sampleEdges();
            handler.postDelayed(this, SAMPLE_INTERVAL_MS);
        }
    };

    /** 앱 에셋 안의 페이지 이름 (예: pleos-standalone.html) */
    protected abstract String page();

    /** 처음 그릴 바탕색(페이지가 뜨기 전 깜빡임 방지) */
    protected abstract int initialBackground();

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // 디버그 빌드에서만 PC 크롬(chrome://inspect)으로 화면을 검사할 수 있게 한다
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);

        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setBackgroundColor(initialBackground());
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setTextZoom(100); // 기기 글자 크기 설정과 상관없이 화면 배치를 지킨다
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assets.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost()); // 앱 밖 페이지로 이동하지 않는다
            }
        });

        // 화면 = WebView + 위아래 시스템 막대 자리(막대 뒤까지 그려지는 Android 15 이상에서만 높이가 생긴다)
        root = new FrameLayout(this);
        topFill = new View(this);
        bottomFill = new View(this);
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(topFill, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, 0, Gravity.TOP));
        root.addView(bottomFill, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, 0, Gravity.BOTTOM));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) web.getLayoutParams();
                lp.setMargins(bars.left, bars.top, bars.right, bars.bottom);
                web.setLayoutParams(lp);
                topFill.getLayoutParams().height = bars.top;
                bottomFill.getLayoutParams().height = bars.bottom;
                topFill.requestLayout();
                bottomFill.requestLayout();
                return insets;
            });
        }
        topColor = bottomColor = initialBackground();
        applyBars();
        setContentView(root);
        web.loadUrl("https://" + HOST + "/assets/" + page());
    }

    /**
     * 화면 맨 위와 맨 아래에 실제로 그려진 색을 읽어 시스템 막대를 같은 색으로 칠한다.
     * 밝게/어둡게 전환이나 그라데이션 배경에서도 막대와 화면이 이어져 보인다.
     */
    private void sampleEdges() {
        if (web.getWidth() < 16 || web.getHeight() < 16) return;
        int[] p = new int[2];
        web.getLocationInWindow(p);
        int bottom = p[1] + web.getHeight();
        copyPixel(new Rect(p[0] + 2, p[1] + 1, p[0] + 10, p[1] + 3), c -> {
            if (c != topColor) {
                topColor = c;
                applyBars();
            }
        });
        copyPixel(new Rect(p[0] + 2, bottom - 3, p[0] + 10, bottom - 1), c -> {
            if (c != bottomColor) {
                bottomColor = c;
                applyBars();
            }
        });
    }

    private void copyPixel(Rect area, IntConsumer done) {
        Bitmap px = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
        try {
            PixelCopy.request(getWindow(), area, px, result -> {
                if (result == PixelCopy.SUCCESS) done.accept(px.getPixel(0, 0) | 0xFF000000);
            }, handler);
        } catch (IllegalArgumentException e) {
            // 창이 아직 화면에 붙기 전이면 다음 차례에 다시 읽는다
        }
    }

    private static boolean isLight(int color) {
        return 0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color) > 160;
    }

    /** 막대 자리와 막대 색을 맞추고, 밝은 배경이면 막대 아이콘을 어둡게 한다. */
    @SuppressWarnings("deprecation") // Android 14 이하는 막대 색을 직접 칠한다
    private void applyBars() {
        root.setBackgroundColor(topColor);
        topFill.setBackgroundColor(topColor);
        bottomFill.setBackgroundColor(bottomColor);
        if (Build.VERSION.SDK_INT < 35) {
            getWindow().setStatusBarColor(topColor);
            getWindow().setNavigationBarColor(bottomColor);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c == null) return;
            int appearance = (isLight(topColor) ? WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS : 0)
                    | (isLight(bottomColor) ? WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS : 0);
            c.setSystemBarsAppearance(appearance, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
        } else {
            View d = getWindow().getDecorView();
            int flags = d.getSystemUiVisibility()
                    & ~(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            if (isLight(topColor)) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (isLight(bottomColor)) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            d.setSystemUiVisibility(flags);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        handler.post(sampler);
    }

    @Override
    protected void onPause() {
        handler.removeCallbacks(sampler);
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(sampler);
        web.destroy();
        super.onDestroy();
    }
}
