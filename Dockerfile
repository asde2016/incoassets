# syntax=docker/dockerfile:1.7

# =====================================================
# Stage 1: builder — Nuxt build + native module compile
# =====================================================
FROM node:22.14.0-bookworm-slim AS builder

WORKDIR /app

# pnpm via corepack (package.json에 pnpm.onlyBuiltDependencies 설정 활용)
# 네이티브 모듈은 prebuilt 바이너리로 처리됨:
#   - better-sqlite3: Node 22 linux-x64 prebuild 제공
#   - sharp: @img/sharp-libvips-linux-x64 (libvips 번들)
#   - potrace: 순수 JS
# prebuild 다운로드가 실패하는 환경이면 빌드 도구를 다시 추가해야 함.
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# 비대화형 환경에서 corepack 이 다운로드 확인 프롬프트 없이 진행하도록
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Nuxt config가 process.env를 빌드 시점에 평가하므로 build-arg로 주입
ARG API_BASE_URL
ARG CRYPTO_SECRET_KEY
ENV API_BASE_URL=${API_BASE_URL}
ENV CRYPTO_SECRET_KEY=${CRYPTO_SECRET_KEY}

# 의존성 캐시 레이어
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# 소스 복사 후 빌드
COPY . .
ENV NODE_ENV=production
RUN pnpm build

# =====================================================
# Stage 2: runner — 최소 실행 환경
# =====================================================
FROM node:22.14.0-bookworm-slim AS runner

WORKDIR /app

# 비-루트 실행 유저만 생성
# (sharp는 번들된 libvips 사용, ca-certificates는 베이스 이미지에 포함)
RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app

# Nitro node-server preset의 self-contained 출력만 가져오기
COPY --from=builder --chown=app:app /app/.output ./.output

# SQLite 파일이 들어갈 영구 디렉토리 (compose에서 volume으로 마운트)
RUN mkdir -p /app/data && chown -R app:app /app/data

USER app

# 이미지 정체성에 해당하는 값만 유지 — 나머지(HOST/PORT/DB_PATH 등)는 compose에서 주입
ENV NODE_ENV=production

EXPOSE 3000

# PID 1 시그널 전파는 docker-compose 의 `init: true` 옵션이 담당
CMD ["node", ".output/server/index.mjs"]
