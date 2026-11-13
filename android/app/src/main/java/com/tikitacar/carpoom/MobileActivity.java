package com.tikitacar.carpoom;

import android.content.res.Configuration;

/** 카품 모바일 앱 (dist/carpoom-standalone.html). 세로 화면, 휴대폰의 밝게/어둡게 설정을 따른다. */
public class MobileActivity extends WebAppActivity {
    @Override
    protected String page() {
        return "carpoom-standalone.html";
    }

    @Override
    protected int initialBackground() {
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        return night ? 0xFF0B0D10 : 0xFFFFFFFF; // 모바일 화면 배경색(어둡게/밝게)
    }
}
