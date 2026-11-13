// 카품 3D 아이콘 렌더러 — node tools/render-icons.js
// tools/icon-glyphs.js의 선 도안을 three.js로 3D 튜브(광택 재질)로 빚어 투명 배경 WebP로 렌더링한다.
//  - assets/icons/w-<이름>.webp : 화이트 3D (Pleos 앱 다크 타일 위 글리프)
// 외부 아이콘 세트를 쓰지 않는다. 브라우저는 test/browser.js 규칙으로 찾는다.
const path = require('path');
const fs = require('fs');
const { launch } = require('../test/browser');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'icons');
const SIZE = 160; // 저장 크기(px)
const SS = 2; // 슈퍼샘플링 배율

(async () => {
  const glyphs = require('./icon-glyphs.js');
  const browser = await launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 400, height: 400 } })).newPage();
  await page.setContent('<!doctype html><html><body style="margin:0;background:transparent"></body></html>');
  await page.addScriptTag({ path: path.join(ROOT, 'assets', 'vendor', 'three.min.js') });
  await page.evaluate(
    ({ SIZE, SS }) => {
      const T = THREE;
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(SIZE * SS, SIZE * SS);
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.setClearColor(0x000000, 0);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(20, 1, 1, 500);
      scene.add(new T.HemisphereLight(0xffffff, 0x1b2a44, 0.75));
      const key = new T.DirectionalLight(0xffffff, 2.1);
      key.position.set(-35, 50, 70);
      scene.add(key);
      const fill = new T.DirectionalLight(0xcfe2ff, 0.55);
      fill.position.set(45, -15, 40);
      scene.add(fill);
      const rim = new T.DirectionalLight(0xffffff, 1.1);
      rim.position.set(10, 30, -60);
      scene.add(rim);
      const lin = (hex) => new T.Color(hex).convertSRGBToLinear();
      const PALETTE = {
        blue: {
          bottom: lin(0x072f86),
          top: lin(0x3d9dff),
          mat: { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 },
        },
        white: {
          bottom: lin(0xaebcce),
          top: lin(0xffffff),
          mat: { roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.2 },
        },
      };
      const R = 1.18; // 튜브 반지름(24 격자 기준) ≈ 선 굵기 2.16
      const svgNS = 'http://www.w3.org/2000/svg';
      const holder = document.createElementNS(svgNS, 'svg');
      holder.setAttribute('viewBox', '0 0 24 24');
      holder.style.cssText = 'position:absolute;left:-999px;width:24px;height:24px';
      document.body.appendChild(holder);

      // 도안의 선을 따라 점을 촘촘히 뽑는다(하위 경로는 끊어진 곳에서 나눈다)
      function runsOf(markup) {
        holder.innerHTML = markup;
        const runs = [],
          dots = [];
        holder.querySelectorAll('path,circle,rect,ellipse,line').forEach((el) => {
          const len = el.getTotalLength();
          if (len < 0.3) {
            const p = el.getPointAtLength(0);
            dots.push(p);
            return;
          }
          const step = 0.06;
          let run = [],
            prev = null;
          for (let d = 0; d <= len + 1e-6; d += step) {
            const p = el.getPointAtLength(Math.min(d, len));
            const q = { x: p.x, y: p.y };
            if (prev && Math.hypot(q.x - prev.x, q.y - prev.y) > 0.3) {
              runs.push(run);
              run = [];
            }
            run.push(q);
            prev = q;
          }
          if (run.length) runs.push(run);
        });
        return { runs: runs.filter((r) => r.length > 1), dots };
      }
      const V = (p) => new T.Vector3(p.x - 12, 12 - p.y, 0);
      window.renderGlyph = (markup, variant) => {
        const pal = PALETTE[variant];
        const group = new T.Group();
        const mat = new T.MeshPhysicalMaterial(Object.assign({ vertexColors: true, metalness: 0 }, pal.mat));
        const add = (geo) => {
          group.add(new T.Mesh(geo, mat));
        };
        const sphere = (v) => {
          const g = new T.SphereGeometry(R, 28, 20);
          g.translate(v.x, v.y, v.z);
          add(g);
        };
        const { runs, dots } = runsOf(markup);
        runs.forEach((run) => {
          let pts = run.map(V);
          // 거의 같은 점 제거
          pts = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 0.02);
          if (pts.length < 2) {
            sphere(pts[0]);
            return;
          }
          const closed = pts.length > 8 && pts[0].distanceTo(pts[pts.length - 1]) < 0.15;
          if (closed) pts.pop();
          const curve = new T.CatmullRomCurve3(pts, closed, 'centripetal');
          const seg = Math.min(600, Math.max(24, Math.round(curve.getLength() * 10)));
          add(new T.TubeGeometry(curve, seg, R, 24, closed));
          if (!closed) {
            sphere(pts[0]);
            sphere(pts[pts.length - 1]);
          }
          // 꺾이는 곳은 구로 메워 매끈하게
          for (let i = 3; i < pts.length - 3; i++) {
            const a = pts[i]
                .clone()
                .sub(pts[i - 3])
                .normalize(),
              b = pts[i + 3].clone().sub(pts[i]).normalize();
            if (a.dot(b) < 0.55) {
              sphere(pts[i]);
              i += 4;
            }
          }
        });
        dots.forEach((p) => {
          const g = new T.SphereGeometry(R * 1.15, 28, 20);
          const v = V(p);
          g.translate(v.x, v.y, 0);
          add(g);
        });
        // 위→아래 그라데이션(정점 색)
        group.children.forEach((m) => {
          const g = m.geometry,
            pos = g.attributes.position,
            col = new Float32Array(pos.count * 3),
            c = new T.Color();
          for (let i = 0; i < pos.count; i++) {
            const t = Math.max(0, Math.min(1, (pos.getY(i) + 12) / 24));
            c.copy(pal.bottom).lerp(pal.top, t);
            col.set([c.r, c.g, c.b], i * 3);
          }
          g.setAttribute('color', new T.BufferAttribute(col, 3));
        });
        // 정면을 보게 둔다(입체감은 둥근 튜브의 명암으로). 화면 가운데에 맞춘다
        group.rotation.set(0, 0, 0);
        scene.add(group);
        const box = new T.Box3().setFromObject(group),
          ctr = box.getCenter(new T.Vector3()),
          sz = box.getSize(new T.Vector3());
        group.position.sub(ctr);
        const fit = Math.max(sz.x, sz.y) / 0.84;
        const dist = fit / 2 / Math.tan((camera.fov * Math.PI) / 180 / 2) + sz.z;
        camera.position.set(0, 0, dist);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        // 축소 저장(슈퍼샘플링)
        const out = document.createElement('canvas');
        out.width = out.height = SIZE;
        const ctx = out.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(renderer.domElement, 0, 0, SIZE, SIZE);
        scene.remove(group);
        group.children.forEach((m) => m.geometry.dispose());
        mat.dispose();
        return out.toDataURL('image/webp', 0.92);
      };
    },
    { SIZE, SS },
  );

  // 기존 아이콘(외부 세트에서 가져온 것)을 지우고 새로 만든다
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (f.startsWith('w-') && f.endsWith('.webp')) fs.unlinkSync(path.join(OUT, f));
  let n = 0;
  for (const [name, markup] of Object.entries(glyphs)) {
    for (const variant of ['white']) {
      // 모바일 컬러 아이콘은 tools/fetch-fluent-icons.js
      const url = await page.evaluate(({ markup, variant }) => window.renderGlyph(markup, variant), {
        markup,
        variant,
      });
      const file = path.join(OUT, (variant === 'white' ? 'w-' : '') + name + '.webp');
      fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
      n++;
    }
  }
  await browser.close();
  console.log('rendered', n, 'icons →', OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
