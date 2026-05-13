<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { useSearch, type IconDto } from '~/stores/search';
import { useCustomize } from '~/stores/customize';

const props = defineProps<{ open: boolean; keyword: string }>();
const emit = defineEmits<{ close: [] }>();

const search = useSearch();
const customize = useCustomize();

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
const tagsKoText = ref('');
const tagsEnText = ref('');
const detailDescription = ref('');
const saveLoading = ref(false);
const saveError = ref('');

// Wizard 의 활성 step. action 성공 시 자동 증가하지만 StepperTrigger 로
// 이전 step 으로 자유 이동 가능 (이미 거친 step 한정).
const currentStep = ref<1 | 2 | 3 | 4>(1);

const canBuild = computed(
  () => localKeyword.value.trim().length > 0 && !buildLoading.value
);
const canConvert = computed(() => !!pngFile.value && !convertLoading.value);
const canSave = computed(() => {
  if (!convertedSvg.value || saveLoading.value) return false;
  return (
    nameKo.value.trim().length > 0 &&
    nameEn.value.trim().length > 0 &&
    categoryKo.value.trim().length > 0 &&
    categoryEn.value.trim().length > 0 &&
    tagsKoText.value.trim().length > 0 &&
    tagsEnText.value.trim().length > 0
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
      tagsKoText.value = '';
      tagsEnText.value = '';
      detailDescription.value = '';
      saveLoading.value = false;
      saveError.value = '';
    }
  }
);

type Bilingual = { ko: string; en: string };
type BilingualTags = { ko: string[]; en: string[] };
type SuggestedMeta = { name: Bilingual; category: Bilingual; tags: BilingualTags };

function parseList(s: string): string[] {
  return s.split(/[,#\n]+/).map((t) => t.trim()).filter((t) => t.length > 0);
}

async function onBuildPrompt() {
  buildLoading.value = true;
  buildError.value = '';
  promptText.value = '';

  // 1) Ollama 메타 추론 — 실패해도 prompt 흐름은 진행. 사용자가 이미 채운 필드는 보존.
  const kw = localKeyword.value.trim();
  let suggested: SuggestedMeta = {
    name: { ko: '', en: '' },
    category: { ko: '', en: '' },
    tags: { ko: [], en: [] },
  };
  try {
    suggested = await $fetch<SuggestedMeta>('/api/icons/suggest-meta', {
      method: 'POST',
      body: { keyword: kw, description: description.value },
    });
    if (!nameKo.value && suggested.name.ko) nameKo.value = suggested.name.ko;
    if (!nameEn.value && suggested.name.en) nameEn.value = suggested.name.en;
    if (!categoryKo.value && suggested.category.ko) categoryKo.value = suggested.category.ko;
    if (!categoryEn.value && suggested.category.en) categoryEn.value = suggested.category.en;
    if (!tagsKoText.value && suggested.tags.ko.length > 0) {
      tagsKoText.value = suggested.tags.ko.join(', ');
    }
    if (!tagsEnText.value && suggested.tags.en.length > 0) {
      tagsEnText.value = suggested.tags.en.join(', ');
    }
  } catch {
    /* ollama 미실행·실패는 silent fallback — 메타 없이 진행 */
  }

  // 2) 메타를 함께 넘겨 이미지 프롬프트에 Concept 블록으로 포함.
  const bodyTags: BilingualTags = {
    ko: tagsKoText.value ? parseList(tagsKoText.value) : suggested.tags.ko,
    en: tagsEnText.value ? parseList(tagsEnText.value) : suggested.tags.en,
  };

  try {
    const res = await $fetch<{ prompt: string }>('/api/icons/build-prompt', {
      method: 'POST',
      body: {
        keyword: kw,
        description: description.value,
        name: {
          ko: nameKo.value || suggested.name.ko,
          en: nameEn.value || suggested.name.en,
        },
        category: {
          ko: categoryKo.value || suggested.category.ko,
          en: categoryEn.value || suggested.category.en,
        },
        tags: bodyTags,
      },
    });
    promptText.value = res.prompt;
    currentStep.value = 2;
  } catch (e) {
    buildError.value = e instanceof Error ? e.message : '프롬프트 생성 실패';
  } finally {
    buildLoading.value = false;
  }
}

async function onCopyPrompt() {
  if (!promptText.value) return;
  try {
    await navigator.clipboard.writeText(promptText.value);
    toast.success('프롬프트 복사됨');
    currentStep.value = 3;
  } catch {
    /* clipboard unavailable */
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
    const form = new FormData();
    form.append('file', pngFile.value);
    form.append('baseHex', customize.color);
    const res = await $fetch<{ svg: string }>('/api/icons/png-to-svg', {
      method: 'POST',
      body: form,
    });
    convertedSvg.value = res.svg;
    currentStep.value = 4;
  } catch (e) {
    convertError.value = e instanceof Error ? e.message : 'SVG 변환 실패';
  } finally {
    convertLoading.value = false;
  }
}

async function onSave() {
  saveLoading.value = true;
  saveError.value = '';
  try {
    const row = await $fetch<IconDto>('/api/icons', {
      method: 'POST',
      body: {
        name: { ko: nameKo.value.trim(), en: nameEn.value.trim() },
        category: { ko: categoryKo.value.trim(), en: categoryEn.value.trim() },
        tags: { ko: parseList(tagsKoText.value), en: parseList(tagsEnText.value) },
        description: detailDescription.value.trim(),
        svg: convertedSvg.value,
      },
    });
    search.add(row);
    toast.success('등록 완료');
    emit('close');
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : '등록 실패';
  } finally {
    saveLoading.value = false;
  }
}

function onOpenChange(v: boolean) {
  if (!v) emit('close');
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent size="lg">
      <template #header>
        <DialogHeader>
          <DialogTitle>아이콘 생성</DialogTitle>
          <DialogDescription>
            외부 LLM 으로 만든 duotone PNG 를 SVG 로 변환해 라이브러리에 등록합니다.
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
              <StepperTitle>PNG 업로드</StepperTitle>
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
            <Label for="um-keyword">
              키워드 <span class="text-danger">*</span>
            </Label>
            <Input
              id="um-keyword"
              size="sm"
              placeholder="예: 결제, 클라우드"
              v-model="localKeyword" />
          </div>

          <div>
            <Label for="um-description">설명</Label>
            <Textarea
              id="um-description"
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
            아래 「프롬프트 복사」 를 누르고 Claude / GPT 에 붙여넣어 PNG 를 받아오세요.
          </p>
        </section>

        <!-- Step 3: PNG 업로드 -->
        <section v-else-if="currentStep === 3" class="flex flex-col gap-8">
          <Label>결과 PNG</Label>
          <label
            class="relative flex cursor-pointer flex-col items-center justify-center gap-6 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-24 py-40 text-center transition hover:border-primary hover:bg-primary/5"
            :class="{ '!border-primary !bg-primary/10': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDropFile">
            <input
              id="um-png"
              type="file"
              accept="image/png"
              class="sr-only"
              @change="onPickFile" />
            <i class="material-icons text-32 text-gray-400">cloud_upload</i>
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
            <div class="grid grid-cols-2 gap-8">
              <div>
                <Label for="um-name-ko">
                  이름 (KO) <span class="text-danger">*</span>
                </Label>
                <Input
                  id="um-name-ko"
                  size="sm"
                  maxlength="32"
                  placeholder="신용카드 결제"
                  v-model="nameKo" />
              </div>
              <div>
                <Label for="um-name-en">이름 (EN) <span class="text-danger">*</span></Label>
                <Input
                  id="um-name-en"
                  size="sm"
                  maxlength="32"
                  placeholder="credit-card-payment"
                  v-model="nameEn" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div>
                <Label for="um-cat-ko">카테고리 (KO) <span class="text-danger">*</span></Label>
                <Input
                  id="um-cat-ko"
                  size="sm"
                  placeholder="결제"
                  v-model="categoryKo" />
              </div>
              <div>
                <Label for="um-cat-en">카테고리 (EN) <span class="text-danger">*</span></Label>
                <Input
                  id="um-cat-en"
                  size="sm"
                  placeholder="payment"
                  v-model="categoryEn" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div>
                <Label for="um-tags-ko">태그 (KO) <span class="text-danger">*</span></Label>
                <Input
                  id="um-tags-ko"
                  size="sm"
                  placeholder="결제, 신용카드"
                  v-model="tagsKoText" />
              </div>
              <div>
                <Label for="um-tags-en">태그 (EN) <span class="text-danger">*</span></Label>
                <Input
                  id="um-tags-en"
                  size="sm"
                  placeholder="payment, credit-card"
                  v-model="tagsEnText" />
              </div>
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
            <i class="material-icons text-16">content_copy</i>
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
            {{ saveLoading ? '등록 중…' : '등록' }}
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
