/*
 * 카품 지도 모듈 — 모바일 앱과 Pleos 앱이 같은 실제 좌표, 경로 계산을 쓴다.
 * - 지도 그림: MapLibre GL + OpenFreeMap 벡터 타일(키 없음, 인터넷 필요). 이 모듈은 그리기와 무관한 좌표 계산만 담는다.
 * - 경로: 시나리오 경로(아래 BAKED, OSRM에서 미리 받음) → OSRM 공개 서버 → 직선 순으로 쓴다.
 * - 좌표는 { lat, lng }, 거리는 m.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CarpoomGeo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 데모 시나리오: 퇴근한 A씨(운전자)가 데이케어센터의 아버지와 학교의 딸을 태우고 집으로 간다. 서울 서초동 일대.
  const PLACES = {
    office: { lat: 37.497155, lng: 127.026056, label: '회사 주차장', icon: 'car', key: 'S' },
    daycare: { lat: 37.492764, lng: 127.01697, label: '데이케어센터 앞', icon: 'hospital', key: 'D' },
    school: { lat: 37.498642, lng: 127.023415, label: '서초초등학교 앞', icon: 'school', key: 'K' },
    home: { lat: 37.49501, lng: 127.012872, label: '집 (아파트 정문)', icon: 'apartment', key: 'H' },
  };
  const CENTER = { lat: 37.4955, lng: 127.0195 };
  const STYLE = {
    light: 'https://tiles.openfreemap.org/styles/positron',
    dark: 'https://tiles.openfreemap.org/styles/dark',
  };
  const OSRM = 'https://router.project-osrm.org/route/v1/driving/';

  // OSRM에서 미리 받은 시나리오 경로: { d: 총거리, c: [[lng,lat]...], s: [[거리, 종류, 방향, 도로명, 구간]...] }
  // 키: S=회사, D=데이케어센터, K=학교, H=집 (지나는 순서)
  // 시나리오 경로 데이터(OSRM에서 미리 받은 좌표). 포매터가 펼치지 않도록 한 줄로 둔다
  // prettier-ignore
  const BAKED = {"SDK":{"d":2664,"c":[[127.026056,37.497155],[127.025998,37.49727],[127.025942,37.497384],[127.026909,37.49768],[127.027126,37.497747],[127.027531,37.497866],[127.027621,37.497891],[127.027663,37.497904],[127.02773,37.497923],[127.0277,37.497989],[127.027681,37.498048],[127.027618,37.498029],[127.02758,37.498017],[127.027473,37.497984],[127.026904,37.497806],[127.026405,37.497657],[127.025913,37.497503],[127.025087,37.497256],[127.024385,37.497034],[127.024345,37.497021],[127.02421,37.496979],[127.024059,37.496933],[127.024017,37.49692],[127.0234,37.496731],[127.022522,37.496455],[127.021891,37.496264],[127.021568,37.496166],[127.021012,37.495978],[127.020869,37.495881],[127.020455,37.495743],[127.019052,37.495313],[127.018951,37.495283],[127.017902,37.494959],[127.017652,37.494882],[127.017711,37.494802],[127.017755,37.494742],[127.017903,37.493898],[127.017206,37.493687],[127.017431,37.493217],[127.01683,37.493037],[127.01697,37.492764],[127.01683,37.493037],[127.017431,37.493217],[127.017206,37.493687],[127.016992,37.494106],[127.0168,37.4945],[127.016774,37.494554],[127.0176,37.494804],[127.017652,37.494882],[127.017902,37.494959],[127.018951,37.495283],[127.019052,37.495313],[127.020455,37.495743],[127.020869,37.495881],[127.021025,37.495863],[127.021587,37.496037],[127.021946,37.496148],[127.022575,37.496343],[127.024033,37.496795],[127.024072,37.496808],[127.024111,37.49682],[127.024262,37.496867],[127.024237,37.496921],[127.02421,37.496979],[127.024159,37.497083],[127.024137,37.497128],[127.024112,37.497174],[127.023954,37.497501],[127.023524,37.498419],[127.0235,37.49847],[127.023491,37.498488],[127.023467,37.498537],[127.023415,37.498642]],"s":[[27,"depart","","서초대로74길",0],[150,"continue","right","서초대로",0],[988,"continue","uturn","서초대로",0],[113,"continue","left","서초대로58길",0],[66,"turn","right","서초중앙로22길",0],[56,"turn","left","서초대로56길",0],[57,"turn","right","서초대로54길",0],[33,"continue","left","서초대로54길",0],[0,"arrive","","서초대로54길",0],[33,"depart","","서초대로54길",1],[57,"continue","right","서초대로54길",1],[159,"turn","left","서초대로56길",1],[715,"end of road","right","서초대로",1],[211,"turn","left","서운로",1],[0,"arrive","","서운로",1]]},"SKD":{"d":3025,"c":[[127.026056,37.497155],[127.025998,37.49727],[127.025942,37.497384],[127.026909,37.49768],[127.027126,37.497747],[127.027531,37.497866],[127.027621,37.497891],[127.027663,37.497904],[127.02773,37.497923],[127.0277,37.497989],[127.027681,37.498048],[127.027641,37.498169],[127.027547,37.498373],[127.027488,37.498496],[127.027328,37.498837],[127.027148,37.499231],[127.026993,37.499549],[127.026968,37.499602],[127.026838,37.499876],[127.026582,37.500409],[127.026297,37.501057],[127.026236,37.501224],[127.026036,37.501639],[127.025849,37.501976],[127.025703,37.50229],[127.025536,37.502648],[127.025058,37.503601],[127.024893,37.503945],[127.024727,37.504301],[127.024603,37.504499],[127.024428,37.504449],[127.024153,37.504371],[127.02361,37.504189],[127.023482,37.504154],[127.022795,37.503947],[127.021956,37.503695],[127.021619,37.503594],[127.021282,37.503494],[127.02112,37.503445],[127.021173,37.503326],[127.021247,37.503162],[127.021374,37.502878],[127.021538,37.502554],[127.02166,37.502302],[127.021722,37.502174],[127.021778,37.502059],[127.021818,37.501978],[127.02192,37.501768],[127.021957,37.501679],[127.022128,37.501262],[127.02224,37.50103],[127.022274,37.500961],[127.022315,37.500877],[127.02233,37.500844],[127.022424,37.500651],[127.022484,37.500529],[127.022589,37.50031],[127.022727,37.500026],[127.022747,37.499985],[127.022804,37.499867],[127.022876,37.499719],[127.023415,37.498642],[127.023467,37.498537],[127.023491,37.498488],[127.0235,37.49847],[127.023524,37.498419],[127.023954,37.497501],[127.024112,37.497174],[127.024137,37.497128],[127.024159,37.497083],[127.02421,37.496979],[127.024059,37.496933],[127.024017,37.49692],[127.0234,37.496731],[127.022522,37.496455],[127.021891,37.496264],[127.021568,37.496166],[127.021012,37.495978],[127.020869,37.495881],[127.020455,37.495743],[127.019052,37.495313],[127.018951,37.495283],[127.017902,37.494959],[127.017652,37.494882],[127.017711,37.494802],[127.017755,37.494742],[127.017903,37.493898],[127.017206,37.493687],[127.017431,37.493217],[127.01683,37.493037],[127.01697,37.492764]],"s":[[27,"depart","","서초대로74길",0],[150,"continue","right","서초대로",0],[800,"turn","left","강남대로",0],[329,"turn","left","사평대로",0],[571,"turn","left","서운로",0],[0,"arrive","","서운로",0],[198,"depart","","서운로",1],[626,"turn","right","서초대로",1],[113,"continue","left","서초대로58길",1],[66,"turn","right","서초중앙로22길",1],[56,"turn","left","서초대로56길",1],[57,"turn","right","서초대로54길",1],[33,"continue","left","서초대로54길",1],[0,"arrive","","서초대로54길",1]]},"KH":{"d":1375,"c":[[127.023415,37.498642],[127.023467,37.498537],[127.023491,37.498488],[127.0235,37.49847],[127.023524,37.498419],[127.023954,37.497501],[127.024112,37.497174],[127.024137,37.497128],[127.024159,37.497083],[127.02421,37.496979],[127.024059,37.496933],[127.024017,37.49692],[127.0234,37.496731],[127.022522,37.496455],[127.021891,37.496264],[127.021568,37.496166],[127.021012,37.495978],[127.020869,37.495881],[127.020455,37.495743],[127.019052,37.495313],[127.018951,37.495283],[127.017902,37.494959],[127.017652,37.494882],[127.017546,37.494904],[127.01672,37.494657],[127.015594,37.494325],[127.014382,37.493948],[127.014158,37.493882],[127.013975,37.493934],[127.013869,37.493963],[127.013596,37.494048],[127.013539,37.494327],[127.01337,37.495112],[127.013241,37.495094],[127.012865,37.495043],[127.012872,37.49501]],"s":[[198,"depart","","서운로",0],[956,"turn","right","서초대로",0],[53,"turn","slight right","",0],[120,"turn","right","서초중앙로",0],[49,"continue","left","서초중앙로",0],[0,"arrive","","서초중앙로",0]]},"DH":{"d":619,"c":[[127.01697,37.492764],[127.01683,37.493037],[127.016255,37.492866],[127.016049,37.493318],[127.015206,37.493227],[127.014578,37.493158],[127.013805,37.49308],[127.013761,37.493301],[127.013713,37.493511],[127.013682,37.493683],[127.013642,37.493835],[127.013596,37.494048],[127.013539,37.494327],[127.01337,37.495112],[127.013241,37.495094],[127.012865,37.495043],[127.012872,37.49501]],"s":[[33,"depart","","서초대로54길",0],[54,"continue","left","서초대로54길",0],[53,"continue","right","서초대로54길",0],[200,"turn","left","서초중앙로22길",0],[229,"end of road","right","서초중앙로",0],[49,"continue","left","서초중앙로",0],[0,"arrive","","서초중앙로",0]]},"SD":{"d":1490,"c":[[127.026056,37.497155],[127.025998,37.49727],[127.025942,37.497384],[127.026909,37.49768],[127.027126,37.497747],[127.027531,37.497866],[127.027621,37.497891],[127.027663,37.497904],[127.02773,37.497923],[127.0277,37.497989],[127.027681,37.498048],[127.027618,37.498029],[127.02758,37.498017],[127.027473,37.497984],[127.026904,37.497806],[127.026405,37.497657],[127.025913,37.497503],[127.025087,37.497256],[127.024385,37.497034],[127.024345,37.497021],[127.02421,37.496979],[127.024059,37.496933],[127.024017,37.49692],[127.0234,37.496731],[127.022522,37.496455],[127.021891,37.496264],[127.021568,37.496166],[127.021012,37.495978],[127.020869,37.495881],[127.020455,37.495743],[127.019052,37.495313],[127.018951,37.495283],[127.017902,37.494959],[127.017652,37.494882],[127.017711,37.494802],[127.017755,37.494742],[127.017903,37.493898],[127.017206,37.493687],[127.017431,37.493217],[127.01683,37.493037],[127.01697,37.492764]],"s":[[27,"depart","","서초대로74길",0],[150,"continue","right","서초대로",0],[988,"continue","uturn","서초대로",0],[113,"continue","left","서초대로58길",0],[66,"turn","right","서초중앙로22길",0],[56,"turn","left","서초대로56길",0],[57,"turn","right","서초대로54길",0],[33,"continue","left","서초대로54길",0],[0,"arrive","","서초대로54길",0]]},"SK":{"d":738,"c":[[127.026056,37.497155],[127.025998,37.49727],[127.025942,37.497384],[127.026909,37.49768],[127.027126,37.497747],[127.027531,37.497866],[127.027621,37.497891],[127.027663,37.497904],[127.02773,37.497923],[127.0277,37.497989],[127.027681,37.498048],[127.027618,37.498029],[127.02758,37.498017],[127.027473,37.497984],[127.026904,37.497806],[127.026405,37.497657],[127.025913,37.497503],[127.025087,37.497256],[127.024385,37.497034],[127.024345,37.497021],[127.02421,37.496979],[127.024159,37.497083],[127.024137,37.497128],[127.024112,37.497174],[127.023954,37.497501],[127.023524,37.498419],[127.0235,37.49847],[127.023491,37.498488],[127.023467,37.498537],[127.023415,37.498642]],"s":[[27,"depart","","서초대로74길",0],[150,"continue","right","서초대로",0],[362,"continue","uturn","서초대로",0],[198,"turn","right","서운로",0],[0,"arrive","","서운로",0]]},"DK":{"d":1174,"c":[[127.01697,37.492764],[127.01683,37.493037],[127.017431,37.493217],[127.017206,37.493687],[127.016992,37.494106],[127.0168,37.4945],[127.016774,37.494554],[127.0176,37.494804],[127.017652,37.494882],[127.017902,37.494959],[127.018951,37.495283],[127.019052,37.495313],[127.020455,37.495743],[127.020869,37.495881],[127.021025,37.495863],[127.021587,37.496037],[127.021946,37.496148],[127.022575,37.496343],[127.024033,37.496795],[127.024072,37.496808],[127.024111,37.49682],[127.024262,37.496867],[127.024237,37.496921],[127.02421,37.496979],[127.024159,37.497083],[127.024137,37.497128],[127.024112,37.497174],[127.023954,37.497501],[127.023524,37.498419],[127.0235,37.49847],[127.023491,37.498488],[127.023467,37.498537],[127.023415,37.498642]],"s":[[33,"depart","","서초대로54길",0],[57,"continue","right","서초대로54길",0],[159,"turn","left","서초대로56길",0],[715,"end of road","right","서초대로",0],[211,"turn","left","서운로",0],[0,"arrive","","서운로",0]]},"KD":{"d":1147,"c":[[127.023415,37.498642],[127.023467,37.498537],[127.023491,37.498488],[127.0235,37.49847],[127.023524,37.498419],[127.023954,37.497501],[127.024112,37.497174],[127.024137,37.497128],[127.024159,37.497083],[127.02421,37.496979],[127.024059,37.496933],[127.024017,37.49692],[127.0234,37.496731],[127.022522,37.496455],[127.021891,37.496264],[127.021568,37.496166],[127.021012,37.495978],[127.020869,37.495881],[127.020455,37.495743],[127.019052,37.495313],[127.018951,37.495283],[127.017902,37.494959],[127.017652,37.494882],[127.017711,37.494802],[127.017755,37.494742],[127.017903,37.493898],[127.017206,37.493687],[127.017431,37.493217],[127.01683,37.493037],[127.01697,37.492764]],"s":[[198,"depart","","서운로",0],[626,"turn","right","서초대로",0],[113,"continue","left","서초대로58길",0],[66,"turn","right","서초중앙로22길",0],[56,"turn","left","서초대로56길",0],[57,"turn","right","서초대로54길",0],[33,"continue","left","서초대로54길",0],[0,"arrive","","서초대로54길",0]]}};

  const R = 6371008.8,
    rad = (d) => (d * Math.PI) / 180;
  function haversine(a, b) {
    const dLat = rad(b.lat - a.lat),
      dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  /** 도로로 갈 때의 대략적인 거리(직선 × 1.35). 픽업 순서 계산에 쓴다. */
  const estRoadDistance = (a, b) => haversine(a, b) * 1.35;
  function bearing(a, b) {
    const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
    const x =
      Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
      Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }
  const toLL = (c) => ({ lng: c[0], lat: c[1] });

  /** 경로 객체: { coords:[[lng,lat]], cum:[누적거리], length, steps:[{dist, at, type, modifier, name, leg}], legEnds:[누적거리], source } */
  function makeRoute(coords, steps, source) {
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversine(toLL(coords[i - 1]), toLL(coords[i])));
    const length = cum[cum.length - 1];
    let acc = 0;
    const st = [];
    const legEnds = [];
    (steps || []).forEach((s) => {
      st.push({ dist: s[0], at: acc, type: s[1], modifier: s[2], name: s[3], leg: s[4] });
      acc += s[0];
      if (s[1] === 'arrive') legEnds.push(acc);
    });
    // OSRM 단계 거리 합과 좌표 길이가 조금 다를 수 있어 비율로 맞춘다
    const k = acc > 0 ? length / acc : 1;
    st.forEach((s) => {
      s.at *= k;
      s.dist *= k;
    });
    for (let i = 0; i < legEnds.length; i++) legEnds[i] = Math.min(length, legEnds[i] * k);
    if (!legEnds.length) legEnds.push(length);
    legEnds[legEnds.length - 1] = length;
    return { coords, cum, length, steps: st, legEnds, source };
  }
  function pointAlong(route, d) {
    const { coords, cum } = route;
    d = Math.max(0, Math.min(route.length, d));
    if (coords.length < 2) return { lat: coords[0][1], lng: coords[0][0], bearing: 0, i: 0 };
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const a = toLL(coords[i - 1]),
      b = toLL(coords[i]);
    const seg = cum[i] - cum[i - 1];
    const t = seg > 0 ? (d - cum[i - 1]) / seg : 1;
    return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, bearing: bearing(a, b), i };
  }
  /** 경로의 from~to(m) 구간 좌표 */
  function slice(route, from, to) {
    const out = [];
    const p0 = pointAlong(route, from);
    out.push([p0.lng, p0.lat]);
    for (let i = 0; i < route.coords.length; i++)
      if (route.cum[i] > from && route.cum[i] < to) out.push(route.coords[i]);
    const p1 = pointAlong(route, to);
    out.push([p1.lng, p1.lat]);
    return out;
  }
  const near = (a, b, m) => haversine(a, b) <= m;
  // 미리 받은 시나리오 경로는 시나리오 장소 그 자리(10m 이내)일 때만 쓴다(장애물로 45m 옮긴 위치는 새로 계산)
  function placeKey(p) {
    for (const k in PLACES) if (near(p, PLACES[k], 10)) return PLACES[k].key;
    return null;
  }
  function bakedFor(points) {
    const keys = points.map(placeKey);
    if (keys.some((k) => !k)) return null;
    const b = BAKED[keys.join('')];
    return b ? makeRoute(b.c, b.s, 'baked') : null;
  }
  function straight(points) {
    const coords = points.map((p) => [p.lng, p.lat]);
    const steps = [];
    for (let i = 1; i < points.length; i++) {
      steps.push([haversine(points[i - 1], points[i]), 'depart', '', '', i - 1]);
      steps.push([0, 'arrive', '', '', i - 1]);
    }
    return makeRoute(coords, steps, 'straight');
  }
  /** points(2개 이상)를 차례로 지나는 도로 경로. 시나리오 경로 → OSRM → 직선 순. */
  async function fetchRoute(points, opts) {
    opts = opts || {};
    const baked = bakedFor(points);
    if (baked && !opts.live) return baked;
    if (typeof fetch === 'function') {
      try {
        const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctl && setTimeout(() => ctl.abort(), opts.timeoutMs || 6000);
        const url =
          OSRM +
          points.map((p) => p.lng.toFixed(6) + ',' + p.lat.toFixed(6)).join(';') +
          '?overview=full&geometries=geojson&steps=true';
        const res = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
        if (timer) clearTimeout(timer);
        const j = await res.json();
        if (j.code === 'Ok' && j.routes && j.routes[0]) {
          const r = j.routes[0];
          const steps = [];
          r.legs.forEach((l, li) =>
            l.steps.forEach((s) =>
              steps.push([s.distance, s.maneuver.type, s.maneuver.modifier || '', s.name || '', li]),
            ),
          );
          return makeRoute(r.geometry.coordinates, steps, 'osrm');
        }
      } catch (e) {
        /* 아래 대체 경로 */
      }
    }
    return baked || straight(points);
  }
  const TURN_KO = {
    left: '좌회전',
    right: '우회전',
    'slight left': '왼쪽 방향',
    'slight right': '오른쪽 방향',
    'sharp left': '좌회전',
    'sharp right': '우회전',
    uturn: '유턴',
    straight: '직진',
  };
  /** 지금 위치(d)에서 다음 안내: { text, dir:'left'|'right'|'uturn'|'straight'|'arrive', dist, name } */
  function nextManeuver(route, d) {
    const legEnd = route.legEnds.find((e) => e > d + 1);
    for (const s of route.steps) {
      if (s.at <= d + 1) continue;
      if (legEnd != null && s.at >= legEnd - 1) break;
      if (
        s.type === 'depart' ||
        s.type === 'arrive' ||
        s.type === 'new name' ||
        (s.type === 'continue' && (!s.modifier || s.modifier === 'straight'))
      )
        continue;
      const dir =
        s.modifier === 'uturn'
          ? 'uturn'
          : /left/.test(s.modifier)
            ? 'left'
            : /right/.test(s.modifier)
              ? 'right'
              : 'straight';
      return { dir, dist: s.at - d, name: s.name, text: TURN_KO[s.modifier] || '직진' };
    }
    return { dir: 'arrive', dist: (legEnd != null ? legEnd : route.length) - d, name: '', text: '도착' };
  }
  /** 경로 끝(탑승 위치)에서 m만큼 앞(차가 오는 쪽)의 도로 위 지점. 장애물로 탑승 위치를 옮길 때 쓴다. */
  function beforeEnd(route, m) {
    return pointAlong(route, Math.max(0, route.length - m));
  }
  /** 원(50m 접근 표시) GeoJSON 좌표 */
  function circle(center, radiusM, n) {
    n = n || 64;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 * Math.PI;
      const dy = radiusM * Math.cos(t),
        dx = radiusM * Math.sin(t);
      out.push([center.lng + dx / (111320 * Math.cos(rad(center.lat))), center.lat + dy / 110540]);
    }
    return out;
  }
  function labelFor(pt) {
    let best = null;
    for (const k in PLACES) {
      const d = haversine(pt, PLACES[k]);
      if (!best || d < best.d) best = { d, p: PLACES[k] };
    }
    if (best && best.d < 35) return best.p.label;
    if (best && best.d < 250) return best.p.label.replace(/ 앞$/, '') + '에서 ' + Math.round(best.d / 10) * 10 + 'm';
    return '지도에서 고른 위치';
  }
  /** 다크 지도 색 조정: 땅, 길, 물, 글자가 잘 구분되게(OpenFreeMap dark 스타일 층 이름 기준) */
  function tuneDarkMap(m) {
    const P = (id, k, v) => {
      try {
        if (m.getLayer(id)) m.setPaintProperty(id, k, v);
      } catch (e) {
        /* noop */
      }
    };
    P('background', 'background-color', '#0E1115');
    P('water', 'fill-color', '#12253B');
    P('waterway', 'line-color', '#12253B');
    P('landuse_residential', 'fill-color', '#151A20');
    P('landuse_residential', 'fill-opacity', 0.7);
    P('landuse_park', 'fill-color', '#132219');
    P('landcover_wood', 'fill-color', '#132219');
    P('building', 'fill-color', '#1B2027');
    P('building', 'fill-outline-color', '#272D36');
    P('highway_path', 'line-color', '#2C333D');
    P('highway_minor', 'line-color', '#323A45');
    P('highway_minor', 'line-opacity', 1);
    P('highway_major_casing', 'line-color', '#46505D');
    P('highway_major_inner', 'line-color', '#3D4652');
    P('highway_major_subtle', 'line-color', '#3D4652');
    P('highway_motorway_casing', 'line-color', '#56616F');
    P('highway_motorway_inner', 'line-color', '#4A5563');
    P('highway_motorway_subtle', 'line-color', '#4A5563');
    ['railway', 'railway_minor', 'railway_transit'].forEach((id) => P(id, 'line-color', '#2E343C'));
    ['highway_name_other', 'highway_name_motorway'].forEach((id) => {
      P(id, 'text-color', '#C9D2DD');
      P(id, 'text-halo-color', '#0E1115');
      P(id, 'text-halo-width', 1.6);
    });
    ['place_other', 'place_suburb', 'place_village', 'place_town', 'place_city'].forEach((id) => {
      P(id, 'text-color', '#AFB9C6');
      P(id, 'text-halo-color', '#0E1115');
    });
    P('water_name', 'text-color', '#6F93BC');
    P('water_name', 'text-halo-color', '#0E1115');
  }

  const fmtDist = (m) => (m >= 1000 ? (m / 1000).toFixed(1) + 'km' : Math.max(0, Math.round(m / 10) * 10) + 'm');

  return {
    tuneDarkMap,
    PLACES,
    CENTER,
    STYLE,
    BAKED,
    haversine,
    estRoadDistance,
    bearing,
    makeRoute,
    pointAlong,
    slice,
    fetchRoute,
    straight,
    nextManeuver,
    beforeEnd,
    circle,
    labelFor,
    fmtDist,
    placeKey,
  };
});
