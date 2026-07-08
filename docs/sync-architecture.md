# Account And Sync Architecture

이 문서는 1RM 계산기를 로컬 전용 앱에서 계정 기반 서비스로 확장할 때의 설계 기준입니다.

## Recommended Stack

현재 앱은 Firebase Hosting으로 배포되고, 별도 서버 없이 React/Vite PWA로 동작합니다. 이 구조에서는 **Firebase Auth + Firestore Lite**가 1차 선택입니다.

선택 이유:

- 이미 Firebase Hosting 설정이 있습니다.
- 개인 운동 기록은 문서 단위 CRUD가 많아 Firestore 모델과 잘 맞습니다.
- 앱은 실시간 공동 편집이 아니라 수동 동기화 버튼으로 병합하므로 Firestore Lite를 사용합니다.
- Auth 모듈과 Firestore Lite 모듈은 필요 시점에 지연 로드해 첫 방문과 로컬 모드 사용자의 초기 로딩 부담을 줄입니다.
- 오프라인 캐시와 나중 동기화 전략이 앱의 PWA 성격과 맞습니다.
- 서버를 직접 운영하지 않아도 계정, 보안 규칙, 데이터 저장을 시작할 수 있습니다.

Supabase는 SQL 분석, 관리자 쿼리, 관계형 리포팅이 중요해지는 시점의 대안입니다. 지금 단계에서는 앱 구조와 배포 흐름을 크게 바꾸지 않는 Firebase가 더 작고 빠른 경로입니다.

## Data Model

Firestore 예상 구조:

```text
users/{uid}
  profile
    unit
    createdAt
    updatedAt

users/{uid}/workoutRecords/{recordId}
  exerciseId
  weightKg
  reps
  sets
  rpe
  notes
  rmKg
  formula
  date
  createdAt
  updatedAt
  syncVersion

users/{uid}/goals/{exerciseId}
  targetKg
  targetDate
  createdAt
  updatedAt
  syncVersion

users/{uid}/deletedWorkoutRecords/{recordId}
  id
  deletedAt
  updatedAt
  syncVersion

users/{uid}/deletedGoals/{exerciseId}
  id
  deletedAt
  updatedAt
  syncVersion
```

로컬 스토리지의 `id`는 Firestore 문서 ID로 그대로 사용할 수 있습니다. 이렇게 해야 로그인 전 로컬 기록을 로그인 후 서버 데이터로 올릴 때 중복을 줄일 수 있습니다.

## Migration Flow

로그인 시나리오:

1. 사용자가 로그인합니다.
2. 로컬 기록과 서버 기록을 모두 읽습니다.
3. 같은 `id`의 기록은 `updatedAt`이 더 최신인 쪽을 선택합니다.
4. 로컬에만 있는 기록은 서버에 업로드합니다.
5. 서버에만 있는 기록은 로컬 Zustand 상태로 내려받습니다.
6. 병합 후 로컬과 서버 양쪽에 같은 결과를 저장합니다.

목표 데이터는 `exerciseId`가 문서 ID입니다. 같은 종목 목표가 충돌하면 `updatedAt`이 최신인 값을 선택합니다. 삭제한 목표는 `deletedGoals` tombstone으로 남겨 원격에 오래된 목표 문서가 있어도 다음 동기화에서 다시 살아나지 않게 합니다.

## Conflict Rules

- 같은 기록 ID: `updatedAt` 최신 값 우선
- 같은 목표 종목: `updatedAt` 최신 값 우선
- 기록 삭제 동기화: `deletedWorkoutRecords` tombstone 컬렉션을 기준으로 처리합니다.
- 목표 삭제 동기화: `deletedGoals` tombstone 컬렉션을 기준으로 처리합니다.
- 삭제보다 최신인 같은 ID 기록이 있으면 기록을 살리고, 오래된 tombstone은 정리합니다.
- 삭제보다 최신인 같은 종목 목표가 있으면 목표를 살리고, 오래된 목표 tombstone은 정리합니다.
- 단위 변경: 원본 계산 기준은 항상 kg 필드를 기준으로 저장하고, 표시만 kg/lb로 변환합니다.

## Privacy Boundary

초기 서비스는 민감한 개인정보를 최소화합니다.

- 필수 계정 정보: Firebase Auth uid
- 저장 데이터: 운동 기록, 목표, 앱 설정
- 저장하지 않을 데이터: 실명, 생년월일, 위치, 신체 정보

## Implementation Steps

1. 기록과 목표에 `createdAt`, `updatedAt`, `syncVersion`을 항상 포함합니다. 완료
2. 환경 변수가 없으면 로컬 모드, 있으면 Firebase 준비 모드로 표시합니다. 완료
3. 로컬/원격 데이터 병합 기준을 순수 함수로 고정합니다. 완료
4. Firebase SDK를 설치하고 클라이언트 초기화 파일을 추가합니다.
5. Auth 상태를 관리하는 store를 추가합니다.
6. 로그인 후 로컬 기록을 서버 기록과 병합하는 `syncService`를 만듭니다.
7. 삭제 tombstone 정책을 추가합니다. 완료
8. Firestore Security Rules를 작성합니다. 완료
9. Firestore 쓰기 스키마를 로컬 테스트 모델로 검증합니다. 완료
10. Firestore 에뮬레이터 테스트를 추가합니다.

## Environment Variables

`.env.example`에 계정 동기화 준비에 필요한 값을 정의합니다.

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
```

필수 값은 `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `APP_ID`입니다. 이 값이 없으면 앱은 명시적으로 로컬 저장 모드로 표시되어야 합니다.

## First Release Gate

계정 동기화 기능은 아래 조건을 통과해야 공개할 수 있습니다.

- 로그아웃 상태에서도 현재 로컬 앱 기능이 모두 동작합니다.
- 로그인해도 기존 로컬 기록이 사라지지 않습니다.
- 같은 계정으로 새 브라우저에서 로그인하면 기록과 목표가 복원됩니다.
- 삭제한 기록과 목표는 서버에 남아 있어도 다음 동기화에서 다시 나타나지 않습니다.
- 삭제 이후 같은 ID로 더 최신 기록이 생기면 최신 기록이 보존됩니다.
- 프로필에서 마지막 동기화 시각, 반영된 기록/목표 수, 최근 오류를 확인할 수 있습니다.
- JSON 내보내기는 로그인 여부와 관계없이 항상 사용할 수 있습니다.
- Firestore 쓰기/삭제 경로와 문서 스키마는 가짜 Firestore 기반 자동 테스트로 검증합니다.
- `firestore.rules` 파일은 로컬 스키마 계약과 broad write 차단 조건을 정적 audit으로 검증합니다.
- 실제 Firebase 프로젝트 연결 후 Firestore Emulator로 보안 규칙을 다시 검증합니다.
