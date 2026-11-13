// 단일 파일 빌드: 화면 원본(.html) + 공용 모듈(core·geo·sync) + 에셋(서체·3D 아이콘·three.js·MapLibre)
//  → dist/carpoom-standalone.html (모바일 앱)
//  → dist/pleos-standalone.html  (Pleos 차량 앱)
//  → dist/stage.html             (시연 무대: 휴대폰 2대 + Pleos 화면을 한 화면에, 상태 실시간 연동)
// 원본 .html은 화면 조각이고, 빌드는 오프라인에서도 열리는 완성 페이지를 만든다(지도 타일과 Asta Sans 서체는 인터넷 필요).
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');

const fontsCss = read('assets', 'fonts.css');
const iconDir = path.join(root, 'assets', 'icons');
const icons = {};
// 폴더 목록 순서는 파일 시스템마다 달라서, 이름순으로 정렬해 어디서 빌드해도 결과가 같게 한다
const webpFiles = (dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.webp'))
    .sort();
for (const f of webpFiles(iconDir)) {
  icons[f.replace(/\.webp$/, '')] =
    'data:image/webp;base64,' + fs.readFileSync(path.join(iconDir, f)).toString('base64');
}
// Pleos 공식 차량 이미지(assets/pleos/*.webp)도 같은 표에 'pleos/이름'으로 넣는다
for (const f of webpFiles(path.join(root, 'assets', 'pleos'))) {
  icons['pleos/' + f.replace(/\.webp$/, '')] =
    'data:image/webp;base64,' + fs.readFileSync(path.join(root, 'assets', 'pleos', f)).toString('base64');
}
const VENDOR = {
  three: {
    src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    file: ['assets', 'vendor', 'three.min.js'],
  },
  maplibre: { src: 'assets/vendor/maplibre-gl.js', file: ['assets', 'vendor', 'maplibre-gl.js'] },
};
const MODULES = ['carpoom-core.js', 'carpoom-geo.js', 'carpoom-sync.js', 'carpoom-brand.js'];

// <script src="..."></script>와 <link rel="stylesheet" href="...">(또는 " />")를 찾는 정규식
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const scriptTag = (src) => new RegExp('<script\\s+src="' + esc(src) + '"\\s*>\\s*</script>');
const cssTag = (href) => new RegExp('<link\\s+rel="stylesheet"\\s+href="' + esc(href) + '"\\s*/?>');

function inline(page) {
  let out = page;
  for (const k of Object.keys(VENDOR)) {
    out = out.replace(scriptTag(VENDOR[k].src), () => '<script>\n' + read(...VENDOR[k].file) + '\n</script>');
  }
  out = out.replace(cssTag('assets/fonts.css'), () => '<style>\n' + fontsCss + '</style>');
  out = out.replace(
    cssTag('assets/vendor/maplibre-gl.css'),
    () => '<style>\n' + read('assets', 'vendor', 'maplibre-gl.css') + '\n</style>',
  );
  let first = true;
  for (const m of MODULES) {
    const tag = scriptTag(m);
    if (!tag.test(out)) continue;
    const icon = first ? '<script>window.__CARPOOM_ICONS=' + JSON.stringify(icons) + ';</script>\n' : '';
    first = false;
    out = out.replace(tag, () => icon + '<script>\n' + read(m) + '\n</script>');
  }
  if (/src="(assets|carpoom-)[^"]*"/.test(out.replace(/__CARPOOM_ICONS[\s\S]*?;<\/script>/, ''))) {
    const left = out.match(/(?:src|href)="(?:assets|carpoom-)[^"]*"/g) || [];
    if (left.length) throw new Error('inline 되지 않은 참조: ' + left.join(', '));
  }
  return out;
}
const wrap = (body, opts) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<style>${opts && opts.fullscreen ? 'html,body{margin:0;height:100%;overflow:hidden}' : ':root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}'}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const outputs = [
  ['carpoom.html', 'carpoom-standalone.html', {}],
  ['pleos.html', 'pleos-standalone.html', { fullscreen: true }],
  ['stage.html', 'stage.html', { fullscreen: true, plain: true }],
];
for (const [src, dst, opts] of outputs) {
  if (!fs.existsSync(path.join(root, src))) {
    console.log('skip', src);
    continue;
  }
  let page = read(src);
  // 시연 무대는 iframe으로 단일 파일 빌드 결과를 띄운다
  if (opts.plain)
    page = page
      .replace(/(src|href)="carpoom\.html/g, '$1="carpoom-standalone.html')
      .replace(/(src|href)="pleos\.html/g, '$1="pleos-standalone.html');
  const html = wrap(opts.plain ? page : inline(page), opts);
  fs.writeFileSync(path.join(root, 'dist', dst), html);
  console.log('built dist/' + dst, (html.length / 1024).toFixed(1) + ' KB');
}
