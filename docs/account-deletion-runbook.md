# Account Deletion Runbook

이 문서는 사용자가 계정 동기화 데이터 삭제를 요청했을 때 운영자가 확인해야 할 절차입니다.

## Scope

삭제 대상 Firestore 경로:

```text
users/{uid}/workoutRecords
users/{uid}/deletedWorkoutRecords
users/{uid}/goals
users/{uid}/deletedGoals
```

선택 처리:

- Firebase Auth 사용자 비활성화
- Firebase Auth 사용자 삭제

로컬 브라우저 데이터는 서버에서 삭제할 수 없습니다. 사용자에게 프로필의 기록 삭제 기능 또는 브라우저 사이트 데이터 삭제 방법을 안내해야 합니다.

## Required Request Info

사용자 요청에는 아래 중 하나 이상이 필요합니다.

- Firebase Auth 이메일
- Firebase Auth uid

요청자가 계정 소유자인지 확인할 수 없으면 삭제를 실행하지 않습니다.

## Procedure

1. 요청 이메일의 Firebase Auth 이메일 또는 uid를 확인합니다.
2. Firebase Console에서 해당 Auth 사용자를 찾습니다.
3. Firestore에서 `users/{uid}` 하위 컬렉션을 확인합니다.
4. `workoutRecords`, `deletedWorkoutRecords`, `goals`, `deletedGoals` 문서를 삭제합니다.
5. 요청 범위에 Auth 계정 삭제가 포함되어 있으면 Firebase Auth 사용자도 삭제하거나 비활성화합니다.
6. 처리 완료 메일을 사용자에게 회신합니다.

## Response Template

```text
요청하신 1RM Calculator 계정 동기화 데이터 삭제가 완료되었습니다.

삭제한 서버 데이터:
- 운동 기록
- 운동 기록 삭제 tombstone
- 목표
- 목표 삭제 tombstone

브라우저 로컬 데이터는 서버에서 삭제할 수 없으므로, 같은 기기에서 프로필 > 모든 기록 삭제 또는 브라우저 사이트 데이터 삭제를 진행해 주세요.
```

## Verification

삭제 후 확인 기준:

- `users/{uid}/workoutRecords`에 문서가 없습니다.
- `users/{uid}/deletedWorkoutRecords`에 문서가 없습니다.
- `users/{uid}/goals`에 문서가 없습니다.
- `users/{uid}/deletedGoals`에 문서가 없습니다.
- 필요한 경우 Auth 사용자가 비활성화 또는 삭제되어 있습니다.
