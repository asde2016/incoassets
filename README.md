# FED Dev environment

## Prerequisites

- **Node.js**: `22.14.0 LTS`
- **NPM**: `10`
- **Package Manager**: `pnpm` (권장) 또는 `npm`

### Node.js 설치 가이드

- **파일 다운로드**: [https://nodejs.org/dist/v22.14.0/](https://nodejs.org/dist/v22.14.0/)
  - (MacOS) `node-v22.14.0.pkg` 다운로드
  - (WinOS) `node-v22.14.0-x64.msi` 다운로드

- **NVM으로 설치 시**
  - (MacOS) [nvm-sh/nvm](https://github.com/nvm-sh/nvm) 참고
  - (WinOS) [coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows) 참고

- **NVM 도움말**
  ```bash
  $ nvm ls-remote  # 사용 가능한 Node Version List
  $ nvm install 22.14.0 # 특정 버전의 Node 설치
  $ nvm use 22.14.0 # 사용할 Node 버전 설정
  $ nvm install --lts # LTS Version으로 설치
  ```

---

## Folder Structure

Nuxt 4 표준 구조를 따르며, 주요 소스는 아래와 같이 구성되어 있습니다.

- **`assets/`**: 컴파일 전 소스 (SCSS, Fonts, Images)
- **`components/`**: 재사용 가능한 Vue 컴포넌트
- **`composables/`**: 공통 로직 및 API 서비스 (`composables/services`)
- **`layouts/`**: 페이지 레이아웃 템플릿
- **`middleware/`**: 경로 가드 및 인증 로직
- **`pages/`**: 애플리케이션 라우트 및 페이지 뷰
- **`public/`**: 정적 자산 (PWA 아이콘, 파비콘 등)
- **`stores/`**: Pinia 상태 관리 모듈 (Cookie/LocalStorage 기반)
- **`types/`**: TypeScript 정의 및 Zod 스키마

---

## Usage

### Install dependencies

```bash
pnpm install
```

### Compiles and minifies for production

```bash
pnpm build
```

### Server & Compiles and hot-reloads for development

```bash
pnpm dev
```

### Convert SVG to Icon Font

```bash
pnpm font
```

### Preview production build

```bash
pnpm preview
```

---

## Features include

- **Vue 3 & Nuxt 4**: 고성능 하이브리드 렌더링 (SSR/CSR)
- **Vite**: 개발 환경에서의 고속 Hot Module Replacement (HMR)
- **Tailwind CSS & Shadcn**: 유틸리티 퍼스트 스타일링 및 접근성 보장 UI
- **PWA Ready**: 오프라인 지원 및 서비스 워커 최적화
- **SEO Master Switch**: `nuxt.config.ts`의 `IS_SEO_ENABLED` 설정을 통한 통합 제어

---

## Code Quality (ESLint & Prettier)

ESLint와 Prettier를 함께 사용하여 코드 품질과 일관된 포맷팅을 유지합니다.

### ESLint

Nuxt ESLint 모듈 기반의 Flat Config(`eslint.config.mjs`)를 사용합니다.

- **Base**: `@nuxt/eslint` + `airbnb-base` + `prettier`
- **Lint 제외 대상**: `components/ui/**`, `pages/template.vue`, `iconfont/**`

```bash
pnpm lint       # 코드 검사
pnpm lint:fix   # 코드 검사 및 자동 수정
```

#### 주요 규칙 설정

| 카테고리        | 설명                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| **TypeScript**  | `no-undef`, `no-shadow`, `no-unused-vars` 등 ESLint 중복 규칙 비활성화 |
| **Import**      | Nuxt auto-import 충돌 방지를 위한 import 관련 규칙 비활성화            |
| **Airbnb 완화** | `no-param-reassign`(props 허용), `no-console`(warn) 등 완화 적용       |
| **Vue**         | 컴포넌트명 `PascalCase` 강제, 속성 순서(`attributes-order`) 정의       |

### Prettier

`.prettierrc` 설정 파일을 통해 코드 포맷팅 규칙을 관리합니다.

| 옵션              | 값                            | 설명                                |
| ----------------- | ----------------------------- | ----------------------------------- |
| `semi`            | `true`                        | 세미콜론 사용                       |
| `singleQuote`     | `true`                        | 작은따옴표 사용                     |
| `tabWidth`        | `2`                           | 들여쓰기 2칸                        |
| `trailingComma`   | `es5`                         | ES5 호환 후행 쉼표                  |
| `printWidth`      | `100`                         | 최대 줄 너비 100자                  |
| `arrowParens`     | `avoid`                       | 화살표 함수 단일 파라미터 괄호 생략 |
| `endOfLine`       | `lf`                          | 줄바꿈 LF 사용                      |
| `bracketSameLine` | `true`                        | 닫는 괄호 같은 줄 배치              |
| `plugins`         | `prettier-plugin-tailwindcss` | Tailwind 클래스 자동 정렬           |

```bash
pnpm format       # 포맷팅 검사
pnpm format:fix   # 포맷팅 자동 수정
```

### VSCode 연동

`.vscode/settings.json`에 아래 설정이 포함되어 있습니다.

- **기본 포맷터**: Prettier (`esbenp.prettier-vscode`)
- **저장 시 자동 포맷팅**: 활성화
- **저장 시 ESLint 자동 수정**: 활성화

> VSCode 확장 프로그램 [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)와 [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)를 설치해야 합니다.
