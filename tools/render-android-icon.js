// 안드로이드 앱 아이콘(적응형 아이콘의 앞면)을 공통 엠블럼(carpoom-brand.js)으로 그린다.
// 결과: android/app/src/main/res/mipmap-*/ic_launcher_foreground.png (투명 배경, 흰 엠블럼)
// 사용: node tools/render-android-icon.js
const fs = require('fs');
const path = require('path');
const { launch } = require('../test/browser');
const brand = require('../carpoom-brand.js');

const root = path.join(__dirname, '..');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
// 적응형 아이콘 앞면은 108dp, 엠블럼은 가운데 66dp 안전 영역 안에 들어가도록 62dp 폭으로 둔다
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  for (const [name, scale] of Object.entries(DENSITIES)) {
    const size = Math.round(108 * scale);
    const w = Math.round(62 * scale);
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:transparent;color:#fff">
        <div style="width:${w}px">${brand.emblem('icon').replace('<svg ', '<svg style="display:block;width:100%;height:auto" ')}</div>
      </body>`,
    );
    const dir = path.join(res, 'mipmap-' + name);
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'ic_launcher_foreground.png'), omitBackground: true });
    console.log('mipmap-' + name, size + 'px');
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
