// 테스트·녹화 공용: playwright(또는 playwright-core)와 브라우저를 찾아 띄운다.
// - PLAYWRIGHT_PATH: playwright 패키지 폴더 경로(선택)
// - CHROME_PATH: 브라우저 실행 파일 경로(선택). 없으면 playwright 동봉 브라우저 → 설치된 Chrome 순으로 시도
const path = require('path');

function loadChromium() {
  const candidates = [process.env.PLAYWRIGHT_PATH, 'playwright', 'playwright-core'].filter(Boolean);
  for (const c of candidates) {
    try {
      return require(c).chromium;
    } catch (e) {
      /* 다음 후보 */
    }
  }
  throw new Error('playwright를 찾을 수 없어요. `npm i playwright-core` 후 PLAYWRIGHT_PATH로 경로를 지정해 주세요.');
}

// opts.args: 브라우저 실행 인자(예: 영상 녹화 때 GPU 사용)
async function launch(opts) {
  const chromium = loadChromium();
  const args = (opts && opts.args) || [];
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH, args });
  try {
    return await chromium.launch({ args });
  } catch (e) {
    return chromium.launch({ channel: 'chrome', args });
  }
}

module.exports = { launch };
