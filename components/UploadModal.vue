<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent size="lg">
      <template #header>
        <DialogHeader>
          <DialogTitle>SVG 생성</DialogTitle>
          <DialogDescription>
            외부 LLM 으로 만든 이미지를 SVG 로 변환해 라이브러리에 등록합니다.
          </DialogDescription>
        </DialogHeader>
      </template>

      <div class="flex flex-col gap-24">
        <Stepper class="px-4" v-model="currentStep">
          <StepperItem :step="1">
            <StepperTrigger>
              <StepperIndicator>1</StepperIndicator>
              <StepperTitle>입력</StepperTitle>
              <StepperDescription>키워드 · 색 · 설명</StepperDescription>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>
          <StepperItem :step="2" :disabled="!promptText">
            <StepperTrigger>
              <StepperIndicator>2</StepperIndicator>
              <StepperTitle>프롬프트 복사</StepperTitle>
              <StepperDescription>외부 LLM 에 붙여넣기</StepperDescription>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>
          <StepperItem :step="3" :disabled="!promptText">
            <StepperTrigger>
              <StepperIndicator>3</StepperIndicator>
              <StepperTitle>이미지 업로드</StepperTitle>
              <StepperDescription>SVG 로 변환</StepperDescription>
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>
          <StepperItem :step="4" :disabled="!convertedSvg">
            <StepperTrigger>
              <StepperIndicator>4</StepperIndicator>
              <StepperTitle>등록</StepperTitle>
              <StepperDescription>메타 입력 후 저장</StepperDescription>
            </StepperTrigger>
          </StepperItem>
        </Stepper>

        <!-- Step 1: 입력 -->
        <section v-if="currentStep === 1" class="flex flex-col gap-12">
          <div>
            <Label for="umKeyword">
              키워드 <span class="text-danger">*</span>
            </Label>
            <Input
              id="umKeyword"
              size="sm"
              placeholder="예: 결제, 클라우드"
              v-model="localKeyword" />
          </div>

          <div>
            <Label for="umDescription">설명</Label>
            <Textarea
              id="umDescription"
              rows="4"
              class="px-14 text-14"
              maxlength="500"
              placeholder="아이콘 의도·맥락"
              v-model="description" />
          </div>

          <p v-if="buildError" class="text-12 text-danger">{{ buildError }}</p>
        </section>

        <!-- Step 2: 프롬프트 출력 -->
        <section v-else-if="currentStep === 2" class="flex flex-col gap-8">
          <Label>생성된 프롬프트</Label>
          <Textarea
            readonly
            rows="14"
            class="font-mono text-11"
            :model-value="promptText" />
          <p class="text-12 text-gray-500">
            아래 프롬프트 복사를 누르고 Claude / GPT / Gemini 등에 붙여넣어 이미지를 생성해주세요.
          </p>
        </section>

        <!-- Step 3: PNG 업로드 -->
        <section v-else-if="currentStep === 3" class="flex flex-col gap-8">
          <Label>결과 이미지</Label>
          <label
            class="relative flex cursor-pointer flex-col items-center justify-center gap-6 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-24 py-40 text-center transition hover:border-primary hover:bg-primary/5"
            :class="{ '!border-primary !bg-primary/10': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDropFile">
            <input
              id="umPng"
              type="file"
              accept="image/png"
              class="sr-only"
              @change="onPickFile" />
            <i class="material-icons text-40 text-gray-400">cloud_upload</i>
            <div v-if="pngFile" class="text-13 text-gray-700">
              <span class="font-medium">{{ pngFile.name }}</span>
              <span class="ml-8 text-12 text-gray-500">({{ formatBytes(pngFile.size) }})</span>
            </div>
            <div v-else class="text-13 text-gray-600">
              <span class="font-medium text-primary">파일 선택</span>
              또는 여기로 드래그
            </div>
            <p class="text-12 text-gray-400">PNG · 최대 10 MB</p>
          </label>
          <p v-if="convertError" class="text-12 text-danger">{{ convertError }}</p>
        </section>

        <!-- Step 4: 미리보기 + 메타 -->
        <section v-else class="grid grid-cols-1 gap-16 md:grid-cols-2">
          <div class="rounded-md border border-gray-200 bg-white p-12">
            <div class="aspect-square w-full" v-html="convertedSvg" />
          </div>
          <div class="flex flex-col gap-10">
            <div class="flex items-center justify-between">
              <span class="text-12 text-gray-500">AI 추천 메타</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="w-32 h-32 rounded-full p-0"
                :title="suggestLoading ? '추천 중…' : '다시 추천'"
                :disabled="suggestLoading || !localKeyword.trim()"
                @click="onRegenerateMeta">
                <i
                  class="material-icons text-16"
                  :class="{ 'animate-spin': suggestLoading }">
                  refresh
                </i>
              </Button>
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div>
                <Label for="umNameKo">
                  이름 (KO) <span class="text-danger">*</span>
                </Label>
                <Input
                  id="umNameKo"
                  size="sm"
                  maxlength="32"
                  placeholder="신용카드 결제"
                  v-model="nameKo" />
              </div>
              <div>
                <Label for="umNameEn">이름 (EN) <span class="text-danger">*</span></Label>
                <Input
                  id="umNameEn"
                  size="sm"
                  maxlength="32"
                  placeholder="credit-card-payment"
                  v-model="nameEn" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div>
                <Label for="umCatKo">카테고리 (KO) <span class="text-danger">*</span></Label>
                <Input
                  id="umCatKo"
                  size="sm"
                  placeholder="결제"
                  v-model="categoryKo" />
              </div>
              <div>
                <Label for="umCatEn">카테고리 (EN) <span class="text-danger">*</span></Label>
                <Input
                  id="umCatEn"
                  size="sm"
                  placeholder="payment"
                  v-model="categoryEn" />
              </div>
            </div>
            <div>
              <Label for="umTags">태그 <span class="text-danger">*</span></Label>
              <Input
                id="umTags"
                size="sm"
                placeholder="결제, 신용카드, payment, credit-card"
                v-model="tagsText" />
            </div>
            <p v-if="saveError" class="text-12 text-danger">{{ saveError }}</p>
          </div>
        </section>
      </div>

      <template #footer>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">닫기</Button>
          </DialogClose>
          <Button
            v-if="currentStep === 1"
            type="button"
            variant="primary"
            :disabled="!canBuild"
            @click="onBuildPrompt">
            {{ buildLoading ? '프롬프트 만드는 중…' : '프롬프트 생성' }}
          </Button>
          <Button
            v-else-if="currentStep === 2"
            type="button"
            variant="primary"
            @click="onCopyPrompt">
            프롬프트 복사
          </Button>
          <Button
            v-else-if="currentStep === 3"
            type="button"
            variant="primary"
            :disabled="!canConvert"
            @click="onConvert">
            {{ convertLoading ? '변환 중…' : 'SVG 로 변환' }}
          </Button>
          <Button
            v-else
            type="button"
            variant="primary"
            :disabled="!canSave"
            @click="onSave">
            {{ saveLoading ? '등록 중…' : suggestLoading ? '정보 생성 중…' : '등록' }}
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; keyword: string }>();
const emit = defineEmits<{ close: [] }>();

const iconStore = useIconStore();
const customize = useCustomizeStore();

const localKeyword = ref('');
const description = ref('');
const promptText = ref('');
const buildError = ref('');
const buildLoading = ref(false);

const pngFile = ref<File | null>(null);
const convertedSvg = ref('');
const convertLoading = ref(false);
const convertError = ref('');
const isDragging = ref(false);

const nameKo = ref('');
const nameEn = ref('');
const categoryKo = ref('');
const categoryEn = ref('');
const tagsText = ref('');
const detailDescription = ref('');
const saveLoading = ref(false);
const saveError = ref('');
const suggestLoading = ref(false);

// Wizard 의 활성 step. action 성공 시 자동 증가하지만 StepperTrigger 로
// 이전 step 으로 자유 이동 가능 (이미 거친 step 한정).
const currentStep = ref<1 | 2 | 3 | 4>(1);

const canBuild = computed(
  () => localKeyword.value.trim().length > 0 && !buildLoading.value
);
const canConvert = computed(() => !!pngFile.value && !convertLoading.value);
const canSave = computed(() => {
  if (!convertedSvg.value || saveLoading.value || suggestLoading.value) return false;
  return (
    nameKo.value.trim().length > 0 &&
    nameEn.value.trim().length > 0 &&
    categoryKo.value.trim().length > 0 &&
    categoryEn.value.trim().length > 0 &&
    tagsText.value.trim().length > 0
  );
});

// 모달이 열릴 때 step·local state 초기화. customize.color 는 store 가 가진
// 마지막 값 그대로 유지 (CustomizePanel 에서 설정한 색이 prompt 빌더에 그대로 반영).
watch(
  () => props.open,
  (open) => {
    if (open) {
      currentStep.value = 1;
      localKeyword.value = props.keyword || '';
      description.value = '';
      promptText.value = '';
      buildError.value = '';
      buildLoading.value = false;
      pngFile.value = null;
      convertedSvg.value = '';
      convertLoading.value = false;
      convertError.value = '';
      nameKo.value = '';
      nameEn.value = '';
      categoryKo.value = '';
      categoryEn.value = '';
      tagsText.value = '';
      detailDescription.value = '';
      saveLoading.value = false;
      saveError.value = '';
      suggestLoading.value = false;
    }
  }
);

function parseList(s: string): string[] {
  return s.split(/[,#\n]+/).map(t => t.trim()).filter(t => t.length > 0);
}

// 한글이 한 글자라도 포함되면 KO, 그 외(영문/숫자/하이픈 등)는 EN 으로 분류.
function splitTagsByLang(s: string): { ko: string[]; en: string[] } {
  const tokens = parseList(s);
  const ko: string[] = [];
  const en: string[] = [];
  for (const t of tokens) {
    if (/[가-힣]/.test(t)) ko.push(t);
    else en.push(t);
  }
  return { ko, en };
}

async function onBuildPrompt() {
  buildLoading.value = true;
  buildError.value = '';
  promptText.value = '';

  const kw = localKeyword.value.trim();

  // 1) suggestMeta 는 fire-and-forget — Ollama 호출(3~30초)이지만 step 4 등록 폼에만
  //    필요하므로 백그라운드로 보냄. 사용자는 step 2(프롬프트 복사) 로 즉시 이동.
  //    미실행/실패 시 store 가 null 반환 → 폼은 빈 상태로 유지되어 사용자가 직접 입력.
  suggestLoading.value = true;
  iconStore
    .suggestMeta({ keyword: kw, description: description.value })
    .then((suggested) => {
      if (!suggested) return;
      if (!nameKo.value && suggested.name.ko) nameKo.value = suggested.name.ko;
      if (!nameEn.value && suggested.name.en) nameEn.value = suggested.name.en;
      if (!categoryKo.value && suggested.category.ko) categoryKo.value = suggested.category.ko;
      if (!categoryEn.value && suggested.category.en) categoryEn.value = suggested.category.en;
      if (!tagsText.value) {
        const merged = [...suggested.tags.ko, ...suggested.tags.en];
        if (merged.length > 0) tagsText.value = merged.join(', ');
      }
    })
    .finally(() => {
      suggestLoading.value = false;
    });

  // 2) buildPrompt 는 사실상 문자열 치환 — Ollama 와 무관하게 즉시 응답.
  try {
    const res = await iconStore.buildPrompt({
      keyword: kw,
      description: description.value,
    });
    if (res) {
      promptText.value = res.prompt;
      currentStep.value = 2;
    } else {
      buildError.value = '프롬프트 생성 실패';
    }
  } finally {
    buildLoading.value = false;
  }
}

// 사용자가 step 4 에서 "다시 추천" 클릭 시 — suggestMeta 재호출 후 모든 메타 필드 덮어씀.
// onBuildPrompt 의 fire-and-forget 자동 채움과 달리, 명시적 액션이라 빈 필드 조건 없이 전체 갱신.
async function onRegenerateMeta() {
  const kw = localKeyword.value.trim();
  if (!kw) return;
  suggestLoading.value = true;
  try {
    const suggested = await iconStore.suggestMeta({
      keyword: kw,
      description: description.value,
    });
    if (!suggested) return;
    nameKo.value = suggested.name.ko;
    nameEn.value = suggested.name.en;
    categoryKo.value = suggested.category.ko;
    categoryEn.value = suggested.category.en;
    const merged = [...suggested.tags.ko, ...suggested.tags.en];
    tagsText.value = merged.join(', ');
  } finally {
    suggestLoading.value = false;
  }
}

async function onCopyPrompt() {
  if (!promptText.value) return;
  const ok = await copyToClipboard(promptText.value);
  if (ok) {
    toast.success('프롬프트를 복사했습니다.');
    currentStep.value = 3;
  } else {
    toast.error('복사에 실패했습니다. 다시 시도해주세요.');
  }
}

function acceptFile(f: File | null | undefined) {
  if (!f) return;
  if (!f.type.startsWith('image/png')) {
    convertError.value = 'PNG 파일만 업로드 가능합니다.';
    return;
  }
  pngFile.value = f;
  convertedSvg.value = '';
  convertError.value = '';
}

function onPickFile(ev: Event) {
  const t = ev.target as HTMLInputElement;
  acceptFile(t.files?.[0] ?? null);
}

function onDropFile(ev: DragEvent) {
  isDragging.value = false;
  acceptFile(ev.dataTransfer?.files?.[0] ?? null);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function onConvert() {
  if (!pngFile.value) return;
  convertLoading.value = true;
  convertError.value = '';
  convertedSvg.value = '';
  try {
    const res = await iconStore.convertPngToSvg(pngFile.value, customize.color);
    if (res) {
      convertedSvg.value = res.svg;
      currentStep.value = 4;
    } else {
      convertError.value = 'SVG 변환 실패';
    }
  } finally {
    convertLoading.value = false;
  }
}

async function onSave() {
  saveLoading.value = true;
  saveError.value = '';
  try {
    const row = await iconStore.createIcon({
      name: { ko: nameKo.value.trim(), en: nameEn.value.trim() },
      category: { ko: categoryKo.value.trim(), en: categoryEn.value.trim() },
      tags: splitTagsByLang(tagsText.value),
      description: detailDescription.value.trim(),
      svg: convertedSvg.value,
    });
    if (row) {
      emit('close');
    } else {
      saveError.value = '등록 실패';
    }
  } finally {
    saveLoading.value = false;
  }
}

function onOpenChange(v: boolean) {
  if (!v) emit('close');
}
</script>
