<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { parseUploadList, validateAndNormalizeSvg } from '~/utils/svg/validate';
import type { ResultItem } from '~/utils/svg/validate';
import IconResultCard from '~/components/IconResultCard.vue';

const props = defineProps<{ open: boolean; keyword: string }>();
const emit = defineEmits<{ close: [] }>();

const localKeyword = ref<string>('');
const description = ref<string>('');
const count = ref<number>(3);

// Prompt-build state
const buildingPrompt = ref<boolean>(false);
const buildError = ref<string>('');
const generatedPrompt = ref<string>('');
const references = ref<{ id: string }[]>([]);
const tokens = ref<string[]>([]);
const promptCopied = ref(false);

// Paste / result state
const rawInput = ref<string>('');
const results = ref<ResultItem[]>([]);

const COUNT_OPTIONS = [1, 2, 3, 4, 6, 8];

let resettingOnOpen = false;

watch(
  () => props.open,
  open => {
    if (open) {
      resettingOnOpen = true;
      localKeyword.value = props.keyword || '';
      description.value = '';
      generatedPrompt.value = '';
      references.value = [];
      tokens.value = [];
      rawInput.value = '';
      results.value = [];
      buildError.value = '';
      buildingPrompt.value = false;
      nextTick(() => {
        resettingOnOpen = false;
      });
    }
  }
);

watch(rawInput, val => {
  if (resettingOnOpen) return;
  if (!val.trim()) {
    results.value = [];
    return;
  }
  results.value = parseUploadList(val).map((p, i) => {
    const v = validateAndNormalizeSvg(p.svg);
    return {
      id: `r-${Date.now()}-${i}`,
      svg: v.ok ? v.svg : p.svg,
      validation: v,
      rawMeta: p.meta,
    };
  });
});

const validResultCount = computed(() => results.value.filter(r => r.validation.ok).length);

const canBuild = computed(() => localKeyword.value.trim().length > 0 && !buildingPrompt.value);

function onOpenChange(v: boolean) {
  if (!v && !buildingPrompt.value) emit('close');
}

async function onBuildPrompt() {
  if (!canBuild.value) return;
  buildingPrompt.value = true;
  buildError.value = '';
  generatedPrompt.value = '';
  references.value = [];
  tokens.value = [];

  try {
    const res = await fetch('/api/icons/build-prompt', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        keyword: localKeyword.value.trim(),
        description: description.value.trim(),
        count: count.value,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      prompt: string;
      tokens: string[];
      references: { id: string }[];
    };
    generatedPrompt.value = json.prompt;
    tokens.value = json.tokens ?? [];
    references.value = json.references ?? [];
  } catch (e: unknown) {
    buildError.value = e instanceof Error ? e.message : '프롬프트 생성 실패';
  } finally {
    buildingPrompt.value = false;
  }
}

async function onCopyPrompt() {
  if (!generatedPrompt.value) return;
  try {
    await navigator.clipboard.writeText(generatedPrompt.value);
    promptCopied.value = true;
    setTimeout(() => (promptCopied.value = false), 1500);
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent size="xl">
      <template #header>
        <DialogHeader>
          <DialogTitle>AI 아이콘 생성</DialogTitle>
          <DialogDescription>
            ① 키워드 입력 → ② 로컬 Ollama가 라이브러리에서 관련 아이콘을 골라 프롬프트를 만들어 줍니다 →
            ③ 이 프롬프트를 Claude / GPT 등에 붙여넣어 결과를 받고 → ④ 아래 결과 영역에 다시 붙여넣어 저장하세요.
          </DialogDescription>
        </DialogHeader>
      </template>

      <div class="grid grid-cols-1 gap-24 md:grid-cols-2">
        <div class="flex flex-col gap-16">
          <div>
            <label class="text-13 font-medium text-gray-700">
              키워드 <span class="text-danger">*</span>
            </label>
            <input
              placeholder="예: 연구원, 클라우드 데이터, 결제"
              class="mt-4 h-40 w-full rounded-md border border-gray-200 bg-white px-12 text-14 outline-none focus:border-primary"
              v-model="localKeyword" />
          </div>

          <label class="block text-13 text-gray-700">
            설명
            <textarea
              rows="2"
              maxlength="500"
              placeholder="아이콘 의도·맥락"
              class="mt-4 w-full resize-y rounded-md border border-gray-200 px-12 py-8 text-13 outline-none focus:border-primary"
              v-model="description" />
          </label>

          <div class="flex items-center gap-12">
            <label class="flex items-center gap-8 text-13 text-gray-700">
              결과 개수
              <select
                :disabled="buildingPrompt"
                class="h-32 rounded-md border border-gray-200 bg-white px-8 text-13 outline-none focus:border-primary"
                v-model.number="count">
                <option :value="n" v-for="n in COUNT_OPTIONS" :key="n">{{ n }}개</option>
              </select>
            </label>
            <button
              type="button"
              class="flex h-36 items-center gap-6 rounded-md bg-primary px-16 text-13 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canBuild"
              @click="onBuildPrompt">
              <i class="material-icons text-16">auto_awesome</i>
              {{ buildingPrompt ? '프롬프트 만드는 중…' : '프롬프트 생성' }}
            </button>
          </div>

          <div
            v-if="buildError"
            class="rounded-md border border-danger/30 bg-danger/5 px-12 py-8 text-12 text-danger">
            {{ buildError }}
          </div>

          <div v-if="generatedPrompt" class="flex flex-col gap-6">
            <div class="flex items-center justify-between text-12 text-gray-500">
              <span>
                생성된 프롬프트
                <span v-if="tokens.length > 0">· tokens: {{ tokens.join(', ') }}</span>
              </span>
              <button
                type="button"
                class="flex items-center gap-4 rounded-md border border-gray-200 bg-white px-10 py-4 text-12 text-gray-700 transition hover:bg-gray-100"
                @click="onCopyPrompt">
                <i class="material-icons text-14">{{ promptCopied ? 'check' : 'content_copy' }}</i>
                {{ promptCopied ? '복사됨' : '프롬프트 복사' }}
              </button>
            </div>
            <textarea
              readonly
              class="h-[14rem] w-full resize-y rounded-md border border-gray-200 bg-gray-50 p-12 font-mono text-11 text-gray-700 outline-none"
              :value="generatedPrompt" />
            <div v-if="references.length > 0" class="truncate text-11 text-gray-400">
              참조: <span class="font-mono">{{ references.map(r => r.id).join(' · ') }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-6">
            <label class="text-13 font-medium text-gray-700">
              결과 붙여넣기 (Claude / GPT 출력)
            </label>
            <textarea
              class="h-[12rem] w-full resize-none rounded-md border border-gray-200 bg-white p-12 font-mono text-12 outline-none focus:border-primary"
              placeholder='{ "items": [ { "name":"...", "svg":"<svg ...>...</svg>" }, ... ] }'
              v-model="rawInput" />
          </div>
        </div>

        <div class="flex flex-col">
          <div class="mb-12 text-13 text-gray-600">
            결과
            <template v-if="results.length > 0">
              · {{ localKeyword || '키워드 없음' }} · {{ results.length }}개
              <span v-if="validResultCount !== results.length" class="text-gray-400">
                (valid {{ validResultCount }} / invalid {{ results.length - validResultCount }})
              </span>
            </template>
          </div>
          <div
            v-if="results.length > 0"
            class="grid grid-cols-2 gap-12 lg:grid-cols-3">
            <IconResultCard
              :key="item.id"
              v-for="item in results"
              :item="item"
              :fallback-name="localKeyword || ''" />
          </div>
          <div
            v-else
            class="flex flex-1 items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 p-24 text-13 text-gray-400">
            붙여넣은 결과가 여기에 표시됩니다.
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
