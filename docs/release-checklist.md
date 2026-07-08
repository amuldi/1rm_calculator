# Release Checklist

이 체크리스트는 1RM 계산기를 공개 서비스로 배포하기 전에 확인해야 할 항목입니다.

## 1. Local Verification

필수 명령:

```bash
npm run test
npm run verify:env
npm run verify:release
npm run build
npm run verify:performance
npm run dev -- --host 127.0.0.1 --port 5173
npm run qa:browser
```

제한된 실행 환경에서 npm 하위 프로세스가 Chrome DevTools 포트를 열지 못하면 `node --experimental-websocket scripts/verify-browser.mjs`로 같은 QA 스크립트를 직접 실행합니다.

통과 기준:

- 계산 공식, 백업/복원, 목표 계획, 동기화 병합, PWA/개인정보 콘텐츠 테스트가 통과합니다.
- Firebase 환경 변수 값이 들어간 경우 형식과 프로젝트 ID 일관성 검증이 통과합니다.
- 공개 도메인, robots.txt, sitemap.xml, health.json, Firebase/Vercel rewrite, `.env.example`, Firestore rules 연결 검증이 통과합니다.
- `/health.json`은 서비스 이름, 버전, canonical URL, 주요 품질 게이트를 포함하고 캐시되지 않습니다.
- GitHub Actions CI가 `npm ci` 후 `npm run check`를 실행하고, 별도 브라우저 QA 잡에서 `npm run qa:browser:server`를 실행합니다.
- 프로덕션 빌드가 성공하고 PWA service worker가 생성됩니다.
- 성능 예산 검사가 통과합니다. 기준은 전체 assets 1.6MB 이하, 개별 JS 청크 500KB 이하, CSS 80KB 이하입니다.
- `npm run qa:browser`에서 계산, 기록 수정, 목표 설정, 대시보드, 프로필, 데이터 처리 안내, 출시 준비도, 진단 정보, 삭제 흐름이 동작합니다.
- 진단 정보 화면에서 최근 오류 없음 상태와 지원 패키지 생성 버튼이 표시됩니다.

## 2. Firebase Environment

필수 환경 변수:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_SUPPORT_EMAIL
```

선택 환경 변수:

```text
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

통과 기준:

- 환경 변수가 없으면 앱은 프로필에서 로컬 모드로 표시됩니다.
- 필수 환경 변수가 있고 형식 검증을 통과하면 계정 동기화 준비됨 상태가 표시됩니다.
- `npm run verify:env`가 API key, Auth domain, Project ID, App ID 형식과 프로젝트 ID 기반 Auth domain/storage bucket 일치를 검증합니다.
- 배포 환경에서는 `REQUIRE_FIREBASE_ENV=1 npm run verify:env`를 실행해 필수 Firebase 값과 운영 문의 이메일 누락도 실패 처리합니다.
- 잘못된 API key, Auth domain, Project ID, App ID는 출시 준비도 화면에서 형식 오류로 표시됩니다.
- 출시 준비도 화면에서 Firebase 환경 변수별 출처, 용도, 설정 여부가 표시됩니다.
- Google Auth provider가 Firebase 콘솔에서 활성화되어 있습니다.
- `VITE_SUPPORT_EMAIL`에 올바른 이메일 주소가 있으면 데이터 처리 안내 화면에 계정 데이터 삭제 요청 메일 링크가 표시됩니다.

## 3. Firestore

필수 확인:

- `firestore.rules`가 배포 대상 Firebase 프로젝트에 배포되어야 합니다.
- `/users/{uid}` 하위 데이터는 해당 uid 사용자만 읽고 쓸 수 있어야 합니다.
- `workoutRecords`, `deletedWorkoutRecords`, `goals`, `deletedGoals` 컬렉션이 동기화 대상입니다.

통과 기준:

- 로그인한 사용자는 자신의 기록과 목표만 동기화할 수 있습니다.
- 다른 uid 경로 접근은 거부됩니다.
- 기록, 삭제 tombstone, 목표 문서는 허용된 필드와 타입만 쓸 수 있습니다.
- 삭제 tombstone이 서버에 남은 기록과 목표를 재등장시키지 않습니다.
- 로컬 테스트의 Firestore 접근 모델은 소유자 경계, 비로그인 접근, 미허용 컬렉션 접근, 문서 스키마를 검증합니다.
- `firestore.rules` 정적 audit은 broad write 차단, owner scoped write, 허용 컬렉션, rules 필드 목록과 앱 스키마 일치를 검증합니다.
- 실제 Firebase 프로젝트 연결 후에는 Emulator 기반 rules 테스트로 같은 경계를 다시 검증합니다.

## 4. Product QA

수동 확인:

- 첫 방문 상태에서 빈 대시보드가 깨지지 않습니다.
- 첫 방문 상태에서 대시보드는 1RM 계산, 세션 기록, 목표 설정 순서를 안내합니다.
- 분석 화면의 빈 상태는 계산기로 이동하는 행동을 제공합니다.
- 계산기에서 기록을 만들고 수정할 수 있습니다.
- 목표 날짜를 넣으면 주간 필요 증가량이 표시됩니다.
- 프로필에서 JSON 백업을 내려받을 수 있습니다.
- 데이터 처리 안내 화면에 저장 데이터와 사용자 제어 항목이 보입니다.
- 데이터 처리 안내 화면에 계정 데이터 삭제 요청 절차가 보입니다.
- `docs/account-deletion-runbook.md`에 서버 데이터 삭제 범위와 운영 절차가 정의되어 있습니다.
- 진단 정보 화면에서 런타임 오류 보관 방식과 지원 패키지 생성 방식이 설명됩니다.
- 지원 패키지는 앱 버전, 브라우저 정보, 동기화 설정 상태, 최근 오류만 포함하고 운동 기록, 목표, Firebase 비밀값을 포함하지 않습니다.
- 오프라인 상태에서 안내 배너가 표시됩니다.

## 5. Launch Gaps

아직 실제 운영 전 보강이 필요한 항목:

- 운영 문의 이메일 실제 값 연결
- 실제 Firebase 프로젝트 ID가 반영된 개인정보 안내
- Firestore Emulator 기반 보안 규칙 자동 테스트
- 외부 오류 모니터링 서비스 연결
