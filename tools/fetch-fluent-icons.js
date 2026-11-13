// 모바일 앱 3D 아이콘 받기 — node tools/fetch-fluent-icons.js
// Microsoft Fluent Emoji 3D(MIT 라이선스, 상업적 사용 가능)를 받아 블루 톤으로 통일하고 144px WebP로 줄여 assets/icons/<이름>.webp에 저장한다.
// (Pleos 앱 레일의 흰 글리프 w-*.webp는 tools/render-icons.js가 만든다)
const path = require('path');
const fs = require('fs');
const { launch } = require('../test/browser');

const OUT = path.join(__dirname, '..', 'assets', 'icons');
const FLUENT = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/';
const MAP = {
  home: 'House',
  'house-garden': 'House with garden',
  pin: 'Round pushpin',
  seat: 'Seat',
  chair: 'Chair',
  recline: 'Couch and lamp',
  sparkles: 'Sparkles',
  bell: 'Bell',
  car: 'Automobile',
  'car-front': 'Oncoming automobile',
  window: 'Window',
  wind: 'Wind face',
  fire: 'Fire',
  hand: 'Raised hand',
  wave: 'Waving hand',
  gear: 'Gear',
  wrench: 'Wrench',
  satellite: 'Satellite antenna',
  phone: 'Mobile phone',
  call: 'Telephone receiver',
  map: 'World map',
  mail: 'Envelope',
  key: 'Key',
  lock: 'Locked',
  clock: 'Alarm clock',
  construction: 'Construction',
  computer: 'Desktop computer',
  camera: 'Camera with flash',
  check: 'Check mark button',
  success: 'Check mark button',
  cross: 'Cross mark',
  info: 'Information',
  warning: 'Warning',
  link: 'Link',
  party: 'Party popper',
  'stop-x': 'Stop sign',
  adult: 'Person',
  child: 'Child',
  arrows: 'Left-right arrow',
  apartment: 'Office building',
  music: 'Musical note',
  plus: 'Plus',
};
async function png(folder) {
  const slug = folder.toLowerCase().replace(/ /g, '_'),
    q = encodeURIComponent(folder);
  for (const p of [`${q}/3D/${slug}_3d.png`, `${q}/Default/3D/${slug}_3d_default.png`]) {
    const r = await fetch(FLUENT + p);
    if (r.ok) return Buffer.from(await r.arrayBuffer());
  }
  throw new Error('not found: ' + folder);
}
(async () => {
  const browser = await launch();
  const page = await (await browser.newContext()).newPage();
  await page.setContent('<!doctype html><body></body>');
  let n = 0;
  for (const [name, folder] of Object.entries(MAP)) {
    const src = 'data:image/png;base64,' + (await png(folder)).toString('base64');
    const webp = await page.evaluate(async (src) => {
      const im = new Image();
      im.src = src;
      await im.decode();
      // 정중앙 맞춤: 원본에서 실제 그림이 있는 영역(투명 아닌 부분)만 잘라, 긴 변을 88%로 맞춰 가운데에 놓는다
      const W = im.naturalWidth,
        Hh = im.naturalHeight,
        o = document.createElement('canvas');
      o.width = W;
      o.height = Hh;
      const og = o.getContext('2d');
      og.drawImage(im, 0, 0);
      const od = og.getImageData(0, 0, W, Hh).data;
      let x0 = W,
        y0 = Hh,
        x1 = -1,
        y1 = -1;
      for (let y = 0; y < Hh; y++)
        for (let x = 0; x < W; x++)
          if (od[(y * W + x) * 4 + 3] > 24) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      if (x1 < 0) {
        x0 = 0;
        y0 = 0;
        x1 = W - 1;
        y1 = Hh - 1;
      }
      const bw = x1 - x0 + 1,
        bh = y1 - y0 + 1,
        k = (144 * 0.88) / Math.max(bw, bh);
      const c = document.createElement('canvas');
      c.width = c.height = 144;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(o, x0, y0, bw, bh, (144 - bw * k) / 2, (144 - bh * k) / 2, bw * k, bh * k);
      // 블루 톤 통일: 원본 명암(입체감)은 살리고 색만 남색 → 블루 → 하늘색 → 흰색 그라데이션으로(아이콘마다 밝기 범위를 맞춤)
      const RAMP = [
        [0, [8, 32, 92]],
        [0.3, [18, 74, 196]],
        [0.56, [47, 140, 255]],
        [0.8, [138, 196, 255]],
        [0.93, [222, 238, 255]],
        [1, [255, 255, 255]],
      ];
      const d = g.getImageData(0, 0, 144, 144),
        px = d.data,
        lum = new Float32Array(144 * 144),
        solid = [];
      for (let i = 0; i < lum.length; i++) {
        const r = px[i * 4] / 255,
          gg = px[i * 4 + 1] / 255,
          b = px[i * 4 + 2] / 255;
        lum[i] = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
        if (px[i * 4 + 3] > 128) solid.push(lum[i]);
      }
      solid.sort((a, b) => a - b);
      const lo = solid.length ? solid[Math.floor(solid.length * 0.02)] : 0,
        hi = solid.length ? solid[Math.floor(solid.length * 0.98)] : 1;
      for (let i = 0; i < lum.length; i++) {
        let t = Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(hi - lo, 1e-3)));
        t = 0.14 + 0.84 * Math.pow(t, 0.9);
        let k = 1;
        while (k < RAMP.length - 1 && RAMP[k][0] < t) k++;
        const [p0, c0] = RAMP[k - 1],
          [p1, c1] = RAMP[k],
          f = (t - p0) / (p1 - p0);
        for (let j = 0; j < 3; j++) px[i * 4 + j] = Math.round(c0[j] * (1 - f) + c1[j] * f);
      }
      g.putImageData(d, 0, 0);
      return c.toDataURL('image/webp', 0.9);
    }, src);
    fs.writeFileSync(path.join(OUT, name + '.webp'), Buffer.from(webp.split(',')[1], 'base64'));
    n++;
  }
  await browser.close();
  console.log('saved', n, 'Fluent Emoji 3D icons →', OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
