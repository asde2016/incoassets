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
const backgroundHex = ref<'#FFFFFF' | '#000000'>('#FFFFFF');
const buildError = ref('');
const buildLoading = ref(false);

const pngFile = ref<File | null>(null);
const convertedSvg = ref('');
const convertLoading = ref(false);
const convertError = ref('');
const isDragging = ref(false);

const name = ref('');
const tagsText = ref('');
const category = ref('');
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
const canSave = computed(
  () => !!convertedSvg.value && name.value.trim().length > 0 && !saveLoading.value
);

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
      backgroundHex.value = '#FFFFFF';
      buildError.value = '';
      buildLoading.value = false;
      pngFile.value = null;
      convertedSvg.value = '';
      convertLoading.value = false;
      convertError.value = '';
      name.value = '';
      tagsText.value = '';
      category.value = '';
      detailDescription.value = '';
      saveLoading.value = false;
      saveError.value = '';
    }
  }
);

async function onBuildPrompt() {
  buildLoading.value = true;
  buildError.value = '';
  promptText.value = '';

  // ollama 메타 추론은 사용자 흐름과 병렬. 실패해도 prompt 흐름은 진행되도록 catch.
  $fetch<{ category: string; tags: string[] }>('/api/icons/suggest-meta', {
    method: 'POST',
    body: {
      keyword: localKeyword.value.trim(),
      description: description.value,
    },
  })
    .then((meta) => {
      // 사용자가 이미 직접 입력했다면 덮어쓰지 않음
      if (!category.value && meta.category) category.value = meta.category;
      if (!tagsText.value && meta.tags.length > 0) {
        tagsText.value = meta.tags.join(', ');
      }
    })
    .catch(() => {
      /* ollama 미실행·실패는 silent fallback — 메타는 사용자가 직접 입력 */
    });

  try {
    const res = await $fetch<{ prompt: string; backgroundHex: '#FFFFFF' | '#000000' }>(
      '/api/icons/build-prompt',
      {
        method: 'POST',
        body: {
          keyword: localKeyword.value.trim(),
          baseHex: customize.color,
          description: description.value,
        },
      }
    );
    promptText.value = res.prompt;
    backgroundHex.value = res.backgroundHex;
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
    form.append('backgroundHex', backgroundHex.value);
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
    const tags = tagsText.value
      .split(/[,#\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const row = await $fetch<IconDto>('/api/icons', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        tags,
        category: category.value.trim(),
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
            <div>
              <Label for="um-name">
                이름 <span class="text-danger">*</span>
              </Label>
              <Input
                id="um-name"
                size="sm"
                placeholder="아이콘 이름"
                v-model="name" />
            </div>
            <div>
              <Label for="um-tags">
                태그 <span class="text-danger">*</span>
              </Label>
              <Input
                id="um-tags"
                size="sm"
                placeholder="콤마 또는 해시 구분"
                v-model="tagsText" />
            </div>
            <div>
              <Label for="um-category">
                카테고리 <span class="text-danger">*</span>
              </Label>
              <Input
                id="um-category"
                size="sm"
                placeholder="예: 결제, 사용자"
                v-model="category" />
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
