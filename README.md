# Carokann

## 📌 개요

Carokann은 반복 작업을 완료해도 체크 기록이 바로 사라지지 않도록 설계한 개인용 작업 리셋 트래커입니다. 탭 단위 분류, 다양한 반복 주기, 비회원 로컬 저장과 Google 로그인 저장을 함께 제공해 루틴과 반복 작업을 한 사이클 안에서 얼마나 진행했는지 직관적으로 확인할 수 있게 만들었습니다

참여 인원 : 1인

기간 : 2026.03 ~ 2026.04

Live : https://carokann.app/

<br />

## 🤔 개발 동기

기존 작업 관리 서비스들은 반복 작업을 완료하면 체크가 즉시 해제되거나 다음 상태로 전환되어 이번 주기 안에서 내가 얼마나 진행했는지를 직관적으로 확인하기 어렵다는 아쉬움이 있었습니다. 특히 게임에서의 루틴처럼 한 번의 완료 여부보다 "이번 주에 3번 했는지", "이번 달 목표를 얼마나 채웠는지"가 더 중요한 작업에서는 이런 방식이 적합하지 않다고 느꼈습니다

Carokann은 이 문제를 해결하기 위해 만들었습니다. 사용자가 매일, 매주, 매월, 매년뿐 아니라 원하는 간격의 커스텀 주기까지 자유롭게 설정할 수 있도록 했고, 반복 작업의 체크 기록이 다음 리셋 시점까지 유지되도록 구성해 현재 사이클의 진행도를 눈으로 확인할 수 있게 했습니다. 단순히 작업을 지우고 다시 만드는 방식이 아니라 반복되는 작업을 더 명확하게 추적하는 경험 자체를 목표로 설계한 서비스입니다

<br />

## ✨ 주요 기능

반복 작업 관리

- 일반 작업과 반복 작업을 분리해 목적에 맞게 관리할 수 있습니다
- 반복 작업은 매일, 매주, 매월, 매년, 커스텀 N일 주기를 지원합니다
- 한 사이클 안에서 달성해야 할 체크 횟수를 설정해 다중 체크 목표를 관리할 수 있습니다
- 다음 리셋 시점과 남은 시간을 표시해 현재 사이클의 진행 상황을 바로 파악할 수 있습니다
- Plain 또는 브라우저 시간대 기준 계산을 지원해 리셋 기준 시각을 제어할 수 있습니다

저장 및 계정 흐름

- 로그인 없이도 바로 사용할 수 있는 비회원 모드를 제공합니다
- 비회원 상태에서는 탭과 작업 데이터를 브라우저 로컬 스토리지에 저장합니다
- Google 계정 로그인은 Supabase Auth OAuth 흐름으로 처리합니다
- 최초 로그인 시 로컬 스냅샷을 DB 기준 스냅샷과 비교해 기존 작업 흐름을 자연스럽게 이어갈 수 있습니다
- 로그인 이후에는 DB에 데이터를 저장해 다른 기기에서도 같은 상태를 이어서 사용할 수 있습니다

사용성

- dnd-kit 기반으로 탭과 작업 모두 드래그 앤 드롭 정렬을 지원합니다
- 탭 삭제와 작업 삭제 후 Sonner 토스트를 통해 일정 시간 안에 복구할 수 있습니다
- 데스크톱과 모바일 환경에 맞춰 사이드바와 메인 영역이 반응형으로 동작합니다
- 입력값 정규화와 범위 보정을 적용해 잘못된 반복 설정이 저장되지 않도록 방어했습니다

<br />

## 🛠️ 기술 스택

| 분류         | 사용 기술                           |
| ------------ | ----------------------------------- |
| 프레임워크   | Next.js 16 (App Router)             |
| UI           | React 19, Tailwind CSS 4, shadcn/ui |
| 언어         | TypeScript 5                        |
| 상태 관리    | Zustand                             |
| 상호작용     | dnd-kit, Sonner                     |
| 인증         | Supabase Auth                       |
| 데이터베이스 | PostgreSQL, Prisma                  |
| 날짜/시간    | `@js-temporal/polyfill`             |
| 테스트       | Vitest                              |
| 배포         | Vercel                              |

<br />

## 🏗️ 아키텍처

```text
비회원 로컬 스토리지(tab/task)
  ↓ 앱 시작 시 로컬 snapshot 읽기
Supabase Auth 세션 확인
  ↓
로그인 안 됨 → local 모드로 hydrate
로그인 됨 → bootstrapTracker 실행
  ↓
Prisma trackerSnapshot 조회 / 최초 생성
  ↓
Zustand tabStore, taskStore hydrate
  ↓ 사용자 수정
local 모드: 즉시 localStorage 저장
db 모드: 0.8초 debounce 후 upsert
  ↓
pagehide / visibilitychange 시 flush 및 repeat task sync
```

- 비회원 사용자는 `tabStorage`, `taskStorage`를 통해 브라우저 로컬 스토리지에 상태를 저장합니다
- 로그인 사용자는 서버 액션에서 Supabase Auth 유저를 확인한 뒤 Prisma `TrackerSnapshot`을 `findUnique` / `create` / `upsert`로 관리합니다
- 클라이언트에서는 `TrackerPersistenceProvider`가 bootstrap, hydrate, debounce save, pagehide flush, 주기 동기화를 한 곳에서 담당합니다
- 반복 작업 주기 계산은 Temporal API 기반으로 처리해 월말, 윤년, 커스텀 간격 같은 경계 조건을 안정적으로 다룹니다

<br />

## 📁 프로젝트 구조

```text
src/
├── app/                # App Router 엔트리, 인증/트래커 라우트
├── actions/            # 인증, 프로필, 트래커 서버 액션
├── features/
│   └── tracker/        # 화면, 상태, 반복 작업 도메인 로직
├── components/         # 공통 UI와 SVG 컴포넌트
├── lib/                # supabase, prisma, 유틸리티
└── generated/prisma/   # Prisma client output
prisma/
├── schema.prisma
└── migrations/
```

<br />

## 🧩 로컬 실행 방법

### 1. 사전 준비

- Node.js 24.x 권장
- pnpm 10.x 권장
- 로그인 저장과 마이그레이션 확인을 위해 유효한 PostgreSQL 또는 Supabase Postgres 연결 정보가 필요합니다.

현재 검증 환경

- Node.js `v24.14.0`
- pnpm `10.33.0`

<br />

### 2. 저장소 클론

```bash
git clone https://github.com/carokann1945/carokann
cd carokann
```

<br />

### 3. 패키지 설치

```bash
pnpm install
```

<br />

### 4. 환경변수 설정

루트의 `.env.example`을 복사해 `.env` 파일을 만든 뒤 값을 채워 넣습니다.

```bash
cp .env.example .env
```

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key
- `NEXT_PUBLIC_SITE_URL`: 로컬 또는 배포 기준 사이트 URL
- `DATABASE_URL`: 앱 런타임에서 사용하는 Postgres 연결 문자열
- `DIRECT_URL`: Prisma 마이그레이션용 direct 연결 문자열

<br />

### 5. 데이터베이스 준비

현재 저장소에는 Prisma 마이그레이션 파일이 포함되어 있으므로 환경변수 설정 후 아래 명령으로 스키마를 맞출 수 있습니다.

```bash
pnpm exec prisma migrate dev
```

<br />

### 6. 개발 서버 실행

```bash
pnpm dev
```

<br />

브라우저에서 `http://localhost:3000`으로 접속합니다.

### 7. 검증 명령어

```bash
pnpm test
pnpm build
pnpm lint
```

- `pnpm test`: 반복 작업 주기 계산과 리셋 로직 테스트
- `pnpm build`: 프로덕션 빌드 확인
- `pnpm lint`: 정적 분석

참고로 `pnpm test`는 현재 저장소 기준으로 바로 실행할 수 있으며, `pnpm build`와 실제 로그인 흐름 확인에는 유효한 환경변수가 필요합니다. 또한 `pnpm lint`는 2026-04-11 기준 `src/components/ui/typing-animation.tsx` 등 기존 lint 이슈로 실패할 수 있습니다.

<br />

## ⚙️ 기술적 고민

1. 반복 작업의 진척도를 어떻게 다음 리셋 전까지 유지할 것인가

기존 서비스처럼 완료 즉시 체크를 비워 버리면 사용자는 이번 사이클 안에서 얼마나 진행했는지 확인하기 어렵습니다. Carokann은 체크 기록을 다음 리셋 시점까지 유지하고 목표 횟수와 완료 수를 함께 보여주는 방식으로 이 문제를 풀었습니다. 단순 `Date` 계산으로 흔들리기 쉬운 월말, 윤년, 커스텀 간격 경계를 안정적으로 처리하기 위해 Temporal API를 도입했고, `repeatTask.test.ts`로 핵심 케이스를 고정했습니다.

<br />

2. 비회원 로컬 사용성과 로그인 저장을 하나의 흐름으로 연결

처음부터 로그인만 강제하면 진입 장벽이 높고 반대로 로컬 저장만 제공하면 기기 간 연속성이 약해집니다. 그래서 비회원 모드에서는 즉시 로컬 스토리지에 저장하고 로그인 시점에는 서버 snapshot bootstrap 흐름으로 자연스럽게 전환되도록 구성했습니다. `TrackerPersistenceProvider`에서 auth 상태 변화 감지, 초기 hydrate, debounce save, pagehide flush까지 한 번에 다루도록 정리해 중복 저장과 불필요한 서버 write를 줄였습니다.

<br />

3. 복잡해지는 반복 작업 상태를 어떻게 안전하게 갱신할 것인가

반복 작업은 제목만 바뀌는 수정과 주기 설정 자체가 바뀌는 수정을 다르게 다뤄야 합니다. 주기, 시작 시각, 목표 횟수가 달라지면 기존 체크 상태를 유지하면 안 되고, 반대로 단순 텍스트 수정인데 매번 상태를 초기화해도 안 됩니다. 이를 위해 `taskStore`에서 config 변경 여부를 분기하고, 필요한 경우에만 체크 배열과 완료 상태를 초기화하도록 설계했습니다.

<br />

4. 반응형 UI와 상호작용 로직을 한 화면에서 어떻게 관리할 것인가

사이드바 토글, 탭 정렬, 작업 정렬, 삭제 복구, 로그인 상태 표시가 모두 같은 화면에 모이면 UI 로직이 쉽게 얽힙니다. Carokann은 feature 구조를 적용해 트래커 도메인 로직을 한곳에 모으고 사이드바 상태와 작업 상태를 분리해 관리했습니다. 덕분에 모바일 오버레이, 데스크톱 고정 사이드바, 드래그 앤 드롭 정렬 같은 상호작용을 비교적 독립적으로 유지할 수 있었습니다.
