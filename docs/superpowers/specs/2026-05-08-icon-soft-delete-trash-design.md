# 아이콘 Soft-Delete & 휴지통 설계

작성일: 2026-05-08
대상: `incoassets` (Nuxt 3 + Pinia + better-sqlite3)

## 1. 배경 / 목적

현재 `IconCard.vue`의 삭제 버튼은 `window.confirm`으로 즉시 hard-delete를 수행한다 (`server/api/icons/[id].delete.ts` → `deleteIcon()` → `DELETE FROM icons`). 삭제 사유가 기록되지 않고, 실수 삭제 시 복구가 불가능하다.

이를 다음과 같이 개선한다:

1. 삭제 시 `pages/template.vue`의 `AlertDialog` 컴포넌트 (`variant="danger"`)를 사용해 사유 입력을 받는다 (필수).
2. Soft delete로 전환하고 사유를 DB에 저장한다.
3. 메인 페이지 그리드 위에 `활성 / 삭제됨` 토글을 두고, 삭제됨 모드에서는 카드에 `복구 / 복사 / 다운로드` 액션을 노출한다.

## 2. 비목표 (Out of scope)

- 영구 삭제(purge) UX, 자동 보관 기간 만료, 삭제 이력 감사 페이지 — 추후 별도 작업으로 분리.
- 다중 선택 일괄 삭제/복구.
- 사유 프리셋(드롭다운) — 자유 입력 필수만.

## 3. 데이터 모델 변경

### 3.1 컬럼 추가

```sql
ALTER TABLE icons ADD COLUMN deleted_at      TEXT;  -- NULL = 활성
ALTER TABLE icons ADD COLUMN deleted_reason  TEXT;  -- 활성 행은 NULL
```

### 3.2 slug UNIQUE 제거 (마이그레이션)

SQLite는 `DROP CONSTRAINT`를 지원하지 않으므로 테이블 재생성으로 처리한다. 기존 `runMigrations()`의 "description 컬럼 누락 시 재생성" 패턴을 확장한다.

마이그레이션 절차 (idempotent):

1. `PRAGMA table_info(icons)`로 `deleted_at` 컬럼 존재 여부 확인.
2. 없으면:
   - 트랜잭션 시작
   - `CREATE TABLE icons_new (...)` — slug에 UNIQUE 없음, `deleted_at`/`deleted_reason` 포함
   - `INSERT INTO icons_new (...) SELECT ... FROM icons` — 기존 데이터 보존
   - `DROP TABLE icons`
   - `ALTER TABLE icons_new RENAME TO icons`
   - 기존 인덱스 / FTS 가상 테이블 / FTS 트리거 재생성 (현 `MIGRATIONS_SQL` 그대로 활용 — `IF NOT EXISTS` 사용 중)
   - FTS 백필: `INSERT INTO icons_fts(...) SELECT id, name, tags_text, category, description FROM icons WHERE deleted_at IS NULL` — 삭제된 행은 검색 대상에서 제외
   - 트랜잭션 커밋

### 3.3 신규 스키마 (재생성 후)

```sql
CREATE TABLE IF NOT EXISTS icons (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  slug            TEXT    NOT NULL,                       -- UNIQUE 제거
  category        TEXT    NOT NULL DEFAULT '',
  description     TEXT    NOT NULL DEFAULT '',
  tags_json       TEXT    NOT NULL DEFAULT '[]',
  tags_text       TEXT    NOT NULL DEFAULT '',
  svg             TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT,
  deleted_reason  TEXT
);

CREATE INDEX IF NOT EXISTS idx_icons_created_at  ON icons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_icons_deleted_at  ON icons(deleted_at);
```

FTS 트리거는 기존과 동일 (AFTER INSERT/UPDATE/DELETE). soft-delete는 UPDATE이므로 FTS 인덱스가 갱신되지만, **검색 쿼리에서 `i.deleted_at IS NULL` 필터를 추가**해 삭제된 행이 결과에 섞이지 않도록 한다.

## 4. 서버 코드 변경

### 4.1 `server/utils/repo/icons.ts`

`IconRow` 타입에 추가:
```ts
deletedAt: string | null;
deletedReason: string | null;
```

`row()` 매퍼에 두 필드 추가. `COLUMNS` 상수에 `deleted_at, deleted_reason` 포함.

함수 변경:

- `insertIcon()` — retry-suffix 로직 제거. 단일 INSERT만 수행. (UNIQUE가 없으므로 충돌 불가.)
- `listIcons()` — 입력에 `mode?: 'active' | 'deleted'` 추가 (default `'active'`). 활성 모드는 `WHERE i.deleted_at IS NULL`, 삭제 모드는 `WHERE i.deleted_at IS NOT NULL ORDER BY i.deleted_at DESC`. FTS 경로에도 동일 필터.
- `deleteIcon()` 제거.
- `softDeleteIcon(id: number, reason: string): boolean` 추가 — `UPDATE icons SET deleted_at = datetime('now'), deleted_reason = ?, updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL`. `info.changes > 0` 반환.
- `restoreIcon(id: number): boolean` 추가 — `UPDATE icons SET deleted_at = NULL, deleted_reason = NULL, updated_at = datetime('now') WHERE id = ? AND deleted_at IS NOT NULL`.

### 4.2 `server/api/icons/[id].delete.ts`

```ts
// body { reason: string } 필수
const { reason } = await readBody<{ reason?: string }>(event) ?? {};
if (typeof reason !== 'string' || reason.trim().length === 0) {
  throw createError({ statusCode: 400, data: { error: { code: 'INVALID_INPUT', message: 'reason required' } } });
}
const ok = softDeleteIcon(id, reason.trim());
if (!ok) throw createError({ statusCode: 404, ... });
return { ok: true };
```

### 4.3 `server/api/icons/[id].restore.post.ts` (신규)

```ts
const id = parseId(...);
const ok = restoreIcon(id);
if (!ok) throw createError({ statusCode: 404, ... });
return { ok: true };
```

### 4.4 `server/api/icons/index.get.ts`

쿼리스트링에 `deleted=true` 지원. 받은 값을 `mode`로 매핑해 `listIcons`에 전달. 응답 row에 `deletedAt`, `deletedReason` 포함.

## 5. 클라이언트 (Pinia store)

`stores/search.ts`:

- `IconDto`에 `deletedAt: string | null`, `deletedReason: string | null` 추가.
- 새 상태 `mode = ref<'active' | 'deleted'>('active')`.
- `fetchPage`: URL에 `mode === 'deleted'`일 때 `deleted=true` 파라미터 추가.
- `setMode(next)` — `mode`가 바뀌면 `q`는 유지하되 `offset=0`, `hasMore=true`로 초기화하고 `fetchPage(true)` 호출.
- `softDelete(id, reason)` — `fetch('/api/icons/' + id, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) })`. 성공 시 `remove(id)`.
- `restore(id)` — `fetch('/api/icons/' + id + '/restore', { method: 'POST' })`. 성공 시 `remove(id)` (현재 보고 있는 삭제됨 목록에서 제거).
- 기존 `setQuery` 동작은 그대로 — 단, 내부적으로 `mode` 상태가 함께 쿼리에 반영됨.

## 6. UI 변경

### 6.1 메인 페이지 토글 (`pages/[...all].vue`)

`IconGrid` 바로 위에 `SwitchSquare`로 토글 배치:

```vue
<SwitchSquare
  :options="[
    { value: 'active',  label: '활성',   icon: 'apps' },
    { value: 'deleted', label: '삭제됨', icon: 'delete' },
  ]"
  :model-value="search.mode"
  @update:model-value="search.setMode($event)" />
```

### 6.2 삭제 다이얼로그 (`IconCard.vue`)

`window.confirm` 제거. 삭제 버튼을 `AlertDialog`의 `#trigger`로 감싼다.

```vue
<AlertDialog variant="danger" msg="삭제 사유를 입력해 주세요">
  <template #trigger>
    <button … data-test="icon-action-delete" …><i class="material-icons text-16">delete</i></button>
  </template>
  <template #title>"{{ icon.name }}"을(를) 삭제하시겠습니까?</template>
  <p class="text-13 text-gray-500 mb-8">삭제된 아이콘은 휴지통에서 복구할 수 있습니다.</p>
  <Textarea v-model="reason" rows="3" placeholder="삭제 사유 (필수)" />
  <template #footer>
    <Button variant="danger" size="sm" :disabled="!reason.trim()" :click-close="false" @click="confirmDelete">삭제</Button>
    <Button variant="outline" size="sm">취소</Button>
  </template>
</AlertDialog>
```

`confirmDelete()`는 `search.softDelete(props.icon.id, reason.value.trim())` 후 다이얼로그를 닫고 `reason.value = ''`.

`AlertDialog`가 footer 슬롯의 자식 버튼을 자동으로 `DialogClose`로 감싸기 때문에, "삭제" 버튼은 `:click-close="false"`로 두고 fetch 성공 후 직접 닫는다 (실패 시 다이얼로그 유지). 다이얼로그 닫힘 제어는 `Dialog`의 `v-model:open`을 사용 — 필요 시 `IconCard.vue`에서 `dialogOpen` ref를 별도로 관리.

주의: 카드 root에 `@click="detailOpen = true"`가 있으므로, `#trigger` 슬롯의 삭제 버튼에 `@click.stop`을 유지해 카드 detail 다이얼로그가 동시에 열리지 않도록 한다.

### 6.3 삭제됨 카드 (`IconDeletedCard.vue`, 신규)

레이아웃은 `IconCard`와 동일하되:

- 카드 자체에 `opacity-70` + `grayscale` 적용해 시각적으로 구분.
- 카드 클릭 시 `IconDetailDialog`를 여는 동작은 유지 (사유 확인용으로 detail dialog에 `deleted_reason` 표시 — 6.4 참조).
- hover 액션 3개:
  - 복구: `restore_from_trash` 아이콘, `aria-label="${name} 복구"`, 클릭 시 `search.restore(icon.id)`.
  - 복사: `content_copy` 아이콘, 기존 `onCopy` 동작과 동일.
  - 다운로드: `file_download` 아이콘, 기존 `onDownload` 동작과 동일.
- 삭제 버튼은 없음.
- 카드 좌상단에 작은 chip/badge로 `삭제됨 · {deleted_at 상대시간}` 표시.

### 6.4 IconDetailDialog 보조 (선택)

삭제 모드에서 카드 클릭으로 detail dialog가 열렸을 때, `icon.deletedAt`이 있으면 사유와 일시를 정보 영역에 표시. (구현은 plan에서 detail dialog 코드 확인 후 결정.)

### 6.5 IconGrid 변경

```vue
<template v-if="search.mode === 'active'">
  <IconCreateCard @open="emit('openCreate')" />
</template>
<!-- skeleton 동일 -->
<template v-if="!showSkeleton">
  <component
    :is="search.mode === 'deleted' ? IconDeletedCard : IconCard"
    v-for="icon in search.items"
    :key="icon.id"
    :icon="icon" />
</template>
```

`IconCreateCard`는 활성 모드에서만 노출.

## 7. 테스트 / 검증

- 단위: `softDeleteIcon`/`restoreIcon`이 deleted_at/deleted_reason 컬럼을 올바르게 갱신하고, 멱등성(이미 삭제된 행에 다시 softDelete → 0 changes) 검증.
- 마이그레이션: 기존 데이터(UNIQUE slug 포함) 가 있는 DB 파일에서 `runMigrations()` 실행 → 데이터 손실 없음, 새 컬럼 NULL 채움, FTS 검색 정상.
- API: DELETE에 reason 누락 시 400, 정상 시 200 → 재호출 시 404. restore 정상 시 200 → 재호출 시 404. GET `?deleted=true`에 활성 행 미포함.
- 검색: 활성 모드에서 q 검색 시 삭제된 행이 결과에 섞이지 않음.
- E2E (수동): 카드에서 삭제 → AlertDialog 표시 → 사유 미입력 시 버튼 비활성 → 사유 입력 후 삭제 → 그리드에서 사라짐 → 토글 "삭제됨" → 해당 아이콘이 보임 → 복구 → 다시 활성 그리드로 이동.

## 8. 마이그레이션 / 호환성 메모

- 마이그레이션은 첫 부팅 시 한 번 자동 실행 (기존 `runMigrations()` 흐름 안에서). 트랜잭션으로 감싸 실패 시 롤백.
- 기존 클라이언트가 새 서버에 붙는 경우: 응답 페이로드에 `deletedAt`/`deletedReason`이 추가될 뿐 호환 깨짐 없음.

## 9. 구현 순서 (writing-plans에서 상세화)

1. DB 마이그레이션 + repo 함수
2. 서버 API (DELETE 본문 변경, restore 추가, GET `deleted` 필터)
3. Store: mode, softDelete, restore
4. UI: AlertDialog로 IconCard 삭제 흐름 교체
5. UI: SwitchSquare 토글 + IconDeletedCard + IconGrid 분기
6. 테스트
