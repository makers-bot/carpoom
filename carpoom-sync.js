/*
 * 카품 화면 간 동기화 어댑터 (체험용) — 모바일 앱과 Pleos 앱이 같은 상태를 실시간으로 본다.
 * 실제 서비스에서는 서버(WebSocket/푸시)가 이 역할을 한다. 여기서는 기기 안에서만 전달한다.
 *  1) 시연 무대(stage.html) 안의 iframe이면 부모 창으로 postMessage → 무대가 다른 화면으로 전달
 *  2) 같은 출처의 다른 탭이면 BroadcastChannel
 *  3) 그 밖에는 localStorage 'storage' 이벤트
 * 받은 상태는 rev(변경 번호)가 더 클 때만 반영한다(core.adopt). 로그인 사용자처럼 기기별 값은 유지한다.
 */
(function (root) {
  'use strict';
  function attach(core, opts) {
    opts = opts || {};
    const id = (opts.appId || 'app') + ':' + Math.random().toString(36).slice(2, 8);
    const keepLocal = opts.keepLocal || ['sessionUserId'];
    let bc = null;
    const receive = (msg) => {
      if (!msg || !msg.__carpoom || msg.from === id || !msg.state) return;
      core.adopt(msg.state, keepLocal);
    };
    try {
      bc = new BroadcastChannel('carpoom');
      bc.onmessage = (e) => receive(e.data);
    } catch (e) {
      bc = null;
    }
    window.addEventListener('message', (e) => receive(e.data));
    if (opts.storageKey) {
      window.addEventListener('storage', (e) => {
        if (e.key !== opts.storageKey || !e.newValue) return;
        try {
          const s = JSON.parse(e.newValue);
          receive({ __carpoom: 1, from: 'storage', state: s });
        } catch (_) {
          /* noop */
        }
      });
    }
    const post = (state) => {
      const msg = { __carpoom: 1, from: id, rev: state.rev, state };
      try {
        if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
      } catch (e) {
        /* noop */
      }
      try {
        if (bc) bc.postMessage(msg);
      } catch (e) {
        /* noop */
      }
    };
    core.subscribe((state, reason) => {
      if (reason !== 'sync') post(state);
    });
    // 시작할 때 무대에 최신 상태를 요청(다른 화면이 이미 앞서 있으면 그 상태를 받는다)
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ __carpoomHello: 1, from: id }, '*');
    } catch (e) {
      /* noop */
    }
    window.addEventListener('message', (e) => {
      if (e.data && e.data.__carpoomHello && e.data.from !== id) post(core.state);
    });
    // 실시간 차량 위치처럼 자주 바뀌는 값은 상태(rev)에 넣지 않고 따로 흘려보낸다(실제로는 FusedLocation → 서버 → 휴대폰)
    const liveHandlers = new Set();
    const onLiveMsg = (d) => {
      if (d && d.__carpoomLive && d.from !== id)
        liveHandlers.forEach((fn) => {
          try {
            fn(d.data);
          } catch (e) {
            /* noop */
          }
        });
    };
    window.addEventListener('message', (e) => onLiveMsg(e.data));
    let bcLive = null;
    try {
      bcLive = new BroadcastChannel('carpoom-live');
      bcLive.onmessage = (e) => onLiveMsg(e.data);
    } catch (e) {
      bcLive = null;
    }
    const sendLive = (data) => {
      const msg = { __carpoomLive: 1, from: id, data };
      try {
        if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
      } catch (e) {
        /* noop */
      }
      try {
        if (bcLive) bcLive.postMessage(msg);
      } catch (e) {
        /* noop */
      }
    };
    return {
      id,
      post: () => post(core.state),
      sendLive,
      onLive: (fn) => {
        liveHandlers.add(fn);
        return () => liveHandlers.delete(fn);
      },
    };
  }
  root.CarpoomSync = { attach };
})(typeof self !== 'undefined' ? self : this);
