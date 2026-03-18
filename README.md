# 1RM 계산기

무게와 반복 횟수를 입력하면 최대 1회 반복 중량(1RM)을 즉시 계산해주는 웨이트 트레이닝 웹앱

[![배포](https://img.shields.io/badge/배포-Firebase-orange?logo=firebase)](https://rm-calculator-3cf1d.web.app)
[![버전](https://img.shields.io/badge/버전-2.0.0-00C8FF)](#)

---

## 주요 기능

**1RM 계산기**
- 무게 + 반복 횟수 입력 → 5가지 공식으로 1RM 즉시 추정
- 공식별 결과 비교 (Epley · Brzycki · Lombardi · Mayhew · O'Conner)
- 트레이닝 존 테이블 — 60~100% 무게 및 예상 반복 횟수
- kg / lb 실시간 전환
- 개인 최고 기록(PR) 자동 감지

**대시보드**
- 마지막 1RM · 주간 볼륨 · 연속 운동일 · 누적 볼륨 요약
- 종목별 최고 기록 보드
- 목표 달성률 프로그레스 바

**분석**
- 기간 필터 (7일 / 30일 / 3개월 / 전체)
- 볼륨 추이 차트 · 종목별 1RM 커브 · 운동 빈도 도넛 차트
- 종목별 트렌드 (상승 / 유지 / 하락)

**프로필**
- kg / lb 단위 설정 · 다크 / 라이트 모드
- JSON 백업 내보내기 / 가져오기
- 전체 기록 삭제

---

## 기술 스택

| | |
|---|---|
| 프레임워크 | React 18 + Vite 6 |
| 스타일 | Tailwind CSS 3 |
| 애니메이션 | Framer Motion |
| 차트 | Recharts |
| 상태 관리 | Zustand |
| 배포 | Firebase Hosting |
| PWA | vite-plugin-pwa |

---

## 시작하기

```bash
# 설치
npm install

# 개발 서버
npm run dev
# → http://localhost:5173

# 배포
npm run build && firebase deploy
```

---

## 지원 공식

| 공식 | 특징 |
|---|---|
| Epley | 가장 널리 쓰이는 표준 |
| Brzycki | 저반복(1~10회)에 정확 |
| Lombardi | 보수적 추정 |
| Mayhew | 연구 기반 검증 공식 |
| O'Conner | 단순 선형 모델 |

---

## 데이터 저장

백엔드 없이 브라우저 **로컬 스토리지**에 저장됩니다.
프로필 탭에서 JSON으로 내보내기 / 가져오기로 백업할 수 있습니다.

---

MIT License
