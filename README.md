# 냉장고 레시피 (앱인토스 미니앱)

냉장고 사진을 찍으면 AI가 재료를 인식하고, 지금 있는 재료로 만들 수 있는 레시피를 추천해줘요.
부족한 재료는 쿠팡파트너스 링크로 바로 구매할 수 있어요.

- 프론트엔드: `@apps-in-toss/web-framework` (Granite) + `@toss/tds-mobile`
- 백엔드: Cloudflare Workers (`server/`) — Gemini Vision 분석 + 쿠팡파트너스 딥링크 발급
- 수익화: 앱인토스 인앱 광고(배너 + 전면/보상형 통합광고) + 쿠팡파트너스 제휴 수수료

## 1. 백엔드(server/) 먼저 배포하기

```bash
cd server
npm install
npx wrangler login          # 최초 1회, Cloudflare 계정 로그인
npx wrangler secret put GEMINI_FREE_KEYS   # 무료 키 여러 개, 쉼표로 구분 (먼저 돌려 씀)
npx wrangler secret put GEMINI_PAID_KEY    # 무료가 전부 막혔을 때만, 하루 300회 상한
npx wrangler secret put COUPANG_ACCESS_KEY
npx wrangler secret put COUPANG_SECRET_KEY
npm run deploy
```

로컬 개발 시에는 `server/.dev.vars`(git에 커밋되지 않아요)에 키를 넣고 `npm run dev`로 실행하세요.
형식은 `server/.dev.vars.example` 참고.

배포 후 `GET /api/health/deep` 으로 Gemini 키가 실제로 응답하는지 확인하세요.
`/api/health` 는 Worker 가 떠 있는지만 봐서, 키가 죽어도 ok 를 줘요(2026-08~10 두 달간 이걸로 고장을 못 봤어요).

배포가 끝나면 콘솔에 출력되는 워커 주소(`https://fridge-recipe-api.<subdomain>.workers.dev`)를 복사해두세요.

## 2. 프론트엔드 설정

1. 루트에 `.env` 파일을 만들고 위에서 복사한 워커 주소를 넣어주세요.
   ```
   VITE_API_BASE_URL=https://fridge-recipe-api.<subdomain>.workers.dev
   ```
2. `granite.config.ts`의 `brand.icon`에 콘솔 '앱 정보'에 등록한 로고 전체 URL을 붙여넣어주세요.
3. `src/adConfig.ts`에 앱인토스 콘솔 > 수익화 > 인앱 광고에서 발급받은 광고 그룹 ID 3개(배너/전면형/보상형)를 채워주세요.
   비워두면 해당 광고는 자동으로 표시되지 않아요.

```bash
npm install
npm run dev     # 로컬 개발 (granite dev)
npm run build   # 빌드 (ait build)
npm run deploy  # 앱인토스 콘솔로 배포 (ait deploy)
```

- 앱인토스 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키 에서 발급받을 수 있어요.
- 빌드/배포 후에는 콘솔에서 검토 요청 → 출시하기 순서로 진행하면 돼요.

## 3. 쿠팡파트너스

- `server/src/coupang.ts`에서 Open API(Access/Secret Key)로 검색 키워드를 실제 제휴 딥링크(`link.coupang.com/...`)로 변환해요.
- 채널(서브 ID)은 `server/wrangler.jsonc`의 `vars.COUPANG_SUB_ID`로 설정되어 있어요(`tossfridge`).
- 화면 하단에 쿠팡파트너스 수수료 고지 문구(`PartnersDisclosure` 컴포넌트)가 항상 노출돼요. 문구는 임의로 삭제/수정하지 마세요(쿠팡파트너스 운영정책).
- API 키 발급/확인: [쿠팡파트너스](https://partners.coupang.com/) > 계정 > Open API 관리

## 4. 마케팅

- 스마트 발송(푸시) 문구 초안: [`docs/marketing-copy.md`](./docs/marketing-copy.md)
- 앱인토스 콘솔 > 마케팅 > 스마트 발송에서 등록/발송하면 돼요.

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
