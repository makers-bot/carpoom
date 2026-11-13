# 카품 (Car Poom)

가족이 휴대폰으로 **픽업 위치, 희망 시간, 좌석**을 요청하면, 운전자 차량의 **Pleos Connect 앱**이 요청을 받아 **픽업 순서를 정하고 길을 안내**합니다. 탑승한 사람이 차량 화면에서 본인을 고르면 **그 좌석에 저장해 둔 좌석, 열선, 공조, 창문 설정을 적용**합니다.

현대자동차그룹 차량용 앱 개발 공모전(Pleos Connect) 출품작의 동작 프로토타입입니다. 세 화면이 같은 도메인 코어(`carpoom-core.js`)를 쓰고, 상태를 실시간으로 주고받습니다.

| 화면          | 파일           | 내용                                                                                                   |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| 모바일 앱     | `carpoom.html` | 동승자(성인, 어린이)와 운전자 계정. 탑승 예약, 내 자리 설정, 초대와 변경 권한, Pleos QR 연결           |
| Pleos 차량 앱 | `pleos.html`   | 16:9 차량 화면. QR 로그인, 픽업 요청 수락, 픽업 순서 계획, 내비게이션, 좌석 배정, 탑승 확인, 설정 적용 |
| 시연 무대     | `stage.html`   | 휴대폰 2대와 Pleos 화면을 한 화면(1920×1080)에 띄우고 실시간으로 연동                                  |

## 바로 실행하기

빌드된 단일 파일이 `dist/`에 들어 있어 설치 없이 브라우저로 열 수 있습니다.

- `dist/stage.html`: 시연 무대(권장). Pleos 화면의 "휴대폰으로 스캔"으로 시작합니다.
- `dist/carpoom-standalone.html`: 모바일 앱
- `dist/pleos-standalone.html`: Pleos 차량 앱

지도 타일과 Asta Sans 서체는 인터넷이 필요합니다. 인터넷이 없으면 단순 지도와 내장 서체로 대신 그립니다.

화면 옵션(주소 뒤 `?`):

- 모바일: `user=u_youngsoo`(계정 고정), `theme=dark` 또는 `light`, `nosplash=1`
- Pleos: `vehicle=v_ioniq6b`, `theme=light`

## 개발

Node.js 18 이상이 필요합니다.

```bash
npm install          # 테스트용 playwright-core, 포매터 prettier
npm run build        # dist/ 다시 만들기
npm test             # 빌드 후 테스트 3종 실행
npm run video        # 시연 영상 녹화(ffmpeg 필요, demo/에 저장)
npm run format       # 코드 정렬(prettier)
```

| 명령                 | 내용                                            |
| -------------------- | ----------------------------------------------- |
| `npm run test:core`  | 도메인 규칙 39건(권한, 예약 상태, 픽업 순서 등) |
| `npm run test:ui`    | 모바일 앱 흐름과 화면 107건(브라우저)           |
| `npm run test:pleos` | Pleos 앱과 시연 무대 연동 33건(브라우저)        |
| `npm run icons`      | 3D 아이콘 다시 만들기(`tools/`)                 |

브라우저 테스트는 `test/browser.js`가 Playwright를 찾아 설치된 Chrome으로 실행합니다. 다른 위치의 Playwright나 브라우저를 쓰려면 `PLAYWRIGHT_PATH`, `CHROME_PATH` 환경변수로 지정합니다. 영상 녹화는 `FFMPEG_PATH`(ffmpeg 위치), `DEMO_TIME`(화면 시각, 기본 17:40), `VIDEO_NAME`(파일 이름)을 받습니다.

## 데모 시나리오

퇴근한 운전자가 데이케어센터의 아버지와 학교의 딸을 태우고 집으로 가는 가족 픽업입니다. 지역은 서울 서초동이고, 인물과 차량 번호는 모두 가상입니다.

| 계정         | 역할               | 첫째 차(12가 3456)            | 둘째 차(34나 7890) | 시나리오                       |
| ------------ | ------------------ | ----------------------------- | ------------------ | ------------------------------ |
| `u_jimin`    | 운전자             | 소유                          | 소유               | 퇴근 후 회사 주차장에서 출발   |
| `u_youngsoo` | 동승자(아버지)     | 초대와 변경 권한, 조수석 기억 | 초대 없음          | 데이케어센터 앞, 지금 바로     |
| `u_haneul`   | 동승자(딸, 어린이) | 초대만, 확인만 가능           | 초대와 변경 권한   | 초등학교 앞, 시간 지정, 뒷좌석 |

차량은 Pleos 개발자 사이트(document.pleos.ai) 공식 디자인 가이드의 기준 차량인 **아이오닉 6**를 씁니다. 화면의 차 이미지도 같은 가이드에서 가져왔고, 모바일 좌석 화면의 반투명 차체는 아이오닉 6 제원(전장 4,855mm, 축거 2,950mm, 전고 1,495mm)을 따릅니다. 차량별 지원 항목은 체험용 가정이며, 실제 앱에서는 Vehicle SDK의 지원 여부 확인 결과를 씁니다.

## 주요 기능

- **탑승 예약**: 지도에서 탑승 위치를 고르고 희망 시간(지금 바로, 10분, 20분, 30분 뒤, 직접 입력)과 좌석을 정해 요청합니다.
- **내 자리 설정**: 좌석 위치, 등받이, 열선, 공조, 창문을 3D 좌석으로 보며 조절합니다. 저장한 값과 차량 적용 상태를 따로 보여 줍니다.
- **초대와 변경 권한**: 운전자가 차량별로 동승자를 초대하고 설정 변경 권한을 주거나 회수합니다. 성인과 어린이에게 같은 규칙이 적용되며, 권한 검사는 화면뿐 아니라 저장 처리에서도 합니다.
- **픽업 순서 최적화**: 모든 순서를 비교해 끝나는 시각과 늦게 도착한 시간을 함께 따져 가장 좋은 순서를 고르고, Pleos 화면에 이유를 보여 줍니다.
- **탑승 확인과 설정 적용**: 좌석 점유 감지, 본인 선택, 앉은 좌석 확인 뒤 저장한 설정을 적용합니다. 예정 좌석과 다르면 배정을 바꿀지 묻습니다.
- **탑승 위치 변경**: 탑승 장소에 장애물이 있다는 정보가 오면 새 위치를 안내하고, 동승자가 확인하면 차량 경로를 바로 다시 계산합니다.
- **Pleos QR 연결**: Pleos가 30초마다 새 QR을 띄우고, 운전자 휴대폰이 스캔한 뒤 승인해야 연결됩니다. 만료된 QR은 실패하고 다시 스캔하도록 안내합니다.

## Pleos SDK 사용 계획과 제약

공식 문서(document.pleos.ai)를 기준으로 정리했습니다.

| 기능              | 사용 API                                                                                                    | 프로토타입에서          |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------- |
| 좌석 앞뒤, 등받이 | `moveSeatForeAft`, `moveSeatBackrestAngle`(`MoveControl`) + `getCurrentSeatXxxPosition`, `selectSeatMemory` | 적용 내역에 표시        |
| 열선, 통풍        | `setHvacSeatTemperature`, `setHvacSeatVentilation`                                                          | 적용 내역에 표시        |
| 좌석별 공조       | `setHvacDual(false)` 후 `setHvacTemperature(area)`, `setHvacFanSpeed`                                       | 적용 내역에 표시        |
| 창문              | `setWindowPosition(area)`                                                                                   | 적용 내역에 표시        |
| 탑승 감지         | `registerSeatOccupancy`, `getCurrentSeatOccupancy`                                                          | 착석 감지 단계          |
| 지원 범위         | `checkXxxCapabilities` → `AreaBounds`                                                                       | 차량별 미지원 항목 잠금 |
| 경로, 경유지      | NaviHelper `requestRouteWithWaypoints`, `onWayPointArrived`                                                 | 순서 카드, 내비게이션   |
| 50m 접근          | FusedLocation `addProximityAlert`(반경 50m, ENTER)                                                          | 50m 접근 알림           |

구현할 때 지켜야 할 제약:

- **시트와 차량 설정은 모든 지역에서 주행 중 금지**입니다. 그래서 설정은 정차(탑승 확인) 때만 적용하고, 주행 중에는 좌석 조정을 막습니다.
- **좌석 위치와 등받이는 절대값 지정 API가 없습니다.** 현재 위치를 보며 목표까지 움직이거나 차량 메모리 슬롯을 불러옵니다.
- **NaviHelper 경유지는 최대 2개**입니다. 정류장이 더 많으면 도착 이벤트마다 다음 구간을 이어서 요청합니다.
- **차량 제어 퍼미션은 App Market 사전 승인이 필요**합니다. 에뮬레이터와 Virtual Console에서 검증하고, 실차 배포는 승인 범위 안에서 진행합니다.

## 프로토타입과 실제 연동

| 항목                        | 프로토타입                                                   | 실제 서비스                       |
| --------------------------- | ------------------------------------------------------------ | --------------------------------- |
| 상태 공유                   | 같은 기기 안 postMessage, BroadcastChannel, localStorage     | 서버 API와 WebSocket, 푸시        |
| 지도와 경로                 | OpenFreeMap 타일, 시나리오 경로 내장, 그 밖은 OSRM 공개 서버 | Pleos NaviHelper, 모바일 지도 SDK |
| 차량 위치                   | 경로를 따라 움직이는 체험 차량                               | FusedLocation SDK                 |
| 좌석 점유와 설정 적용       | 감지와 적용 내역 표시                                        | Vehicle SDK(승인된 퍼미션)        |
| 본인, 연령 인증, 통화, 푸시 | 체험 표시(실제 인증으로 취급하지 않음)                       | 인증 제공자, VoIP, FCM/APNs       |

## 파일 구조

```
├─ carpoom.html        모바일 앱 화면
├─ pleos.html          Pleos 차량 앱 화면(1600×900 설계, 창 크기에 맞춰 확대와 축소)
├─ stage.html          시연 무대(휴대폰 2대와 Pleos, iframe 연동)
├─ carpoom-core.js     도메인 코어: 권한, 설정, 예약 상태, 희망 시간, 픽업 순서, 좌석 배정, 탑승 확인, QR, 동기화
├─ carpoom-geo.js      지도 계산: 시나리오 장소와 경로, 턴 안내, 지오펜스, 거리
├─ carpoom-sync.js     화면 간 동기화(상태 버전 + 실시간 차량 위치)
├─ carpoom-brand.js    엠블럼(세 화면 공용)
├─ build.js            단일 파일 빌드 → dist/
├─ dist/               빌드 결과(바로 실행용)
├─ assets/             서체, 3D 아이콘, Pleos 차량 이미지, three.js, MapLibre, LICENSES.txt
├─ tools/              아이콘 만들기 도구
└─ test/               core, ui, pleos 테스트, 영상 녹화, 브라우저 찾기
```

## 사용한 외부 자료

출처와 라이선스 전문은 [`assets/LICENSES.txt`](assets/LICENSES.txt)에 있습니다.

| 자료                                     | 용도                                       | 라이선스                         |
| ---------------------------------------- | ------------------------------------------ | -------------------------------- |
| Asta Sans (Google Fonts)                 | Pleos Connect 시스템 서체                  | SIL OFL 1.1                      |
| Pretendard 1.3.9                         | 오프라인 대체 서체(글자 수를 줄인 사본)    | SIL OFL 1.1                      |
| MapLibre GL JS 5.6.0                     | 지도 렌더링(한글 도로명 세로쓰기 한 줄 끔) | BSD-3-Clause                     |
| OpenFreeMap, OpenMapTiles, OpenStreetMap | 지도 타일과 데이터(지도에 출처 표기)       | ODbL 1.0                         |
| OSRM 공개 서버                           | 시나리오 경로와 실시간 경로                | 데이터 © OSM contributors       |
| three.js r128                            | 모바일 3D 좌석                             | MIT                              |
| Microsoft Fluent Emoji 3D                | 모바일 앱 3D 아이콘(블루 톤으로 다시 칠함) | MIT                              |
| Pleos 디자인 가이드 차량 이미지          | Pleos 앱 차량 화면(`assets/pleos/`)        | 현대자동차그룹, 공모전 시연 목적 |
