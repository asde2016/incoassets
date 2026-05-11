<script setup lang="ts">
import { ref, computed, watch, nextTick, useAttrs } from 'vue';
import { cn } from '@/utils/shadcn';
import { timepickerColumnStyle, timepickerItemStyle } from '.';

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    modelValue?: string; // "HH:mm" (24h 기준)
    fulltime?: boolean;
    meridiem?: 'ko' | 'EN' | 'en';
    minuteStep?: number;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    invalidMessage?: string;
    size?: 'md' | 'sm' | 'lg';
    class?: string;
  }>(),
  {
    fulltime: false,
    meridiem: 'ko',
    minuteStep: 1,
    size: 'md',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

// ─── 내부 상태 ────────────────────────────────────────────────
const period = ref<'AM' | 'PM'>('AM');
const hour = ref('12');
const minute = ref('00');
const isOpen = ref(false);
const inputText = ref('');
const isFocused = ref(false);

// ─── 키보드 네비게이션 ──────────────────────────────────────────
type ColumnType = 'period' | 'hour' | 'minute';
const activeColumn = ref<ColumnType>('hour');

const columns = computed<ColumnType[]>(() =>
  props.fulltime ? ['hour', 'minute'] : ['period', 'hour', 'minute']
);

// ─── DOM refs ────────────────────────────────────────────────
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);
const hourListRef = ref<HTMLDivElement | null>(null);
const minuteListRef = ref<HTMLDivElement | null>(null);
const periodListRef = ref<HTMLDivElement | null>(null);

const ITEM_H = 36; // px

// ─── 선택 목록 ────────────────────────────────────────────────
const hours = computed(() =>
  props.fulltime
    ? Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
    : Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
);
const minutes = computed(() => {
  const step = Math.max(1, Math.min(60, props.minuteStep));
  return Array.from({ length: Math.ceil(60 / step) }, (_, i) => String(i * step).padStart(2, '0'));
});

// ─── 오전/오후 라벨 ──────────────────────────────────────────
const PERIOD_LABELS: Record<'ko' | 'EN' | 'en', { AM: string; PM: string }> = {
  ko: { AM: '오전', PM: '오후' },
  EN: { AM: 'AM', PM: 'PM' },
  en: { AM: 'am', PM: 'pm' },
};

const periodLabels = computed(() => PERIOD_LABELS[props.meridiem]);
const periodOptions = computed(() => [
  { value: 'AM' as const, label: periodLabels.value.AM },
  { value: 'PM' as const, label: periodLabels.value.PM },
]);

// ─── 표시 포맷 ────────────────────────────────────────────────
const displayValue = computed(() =>
  props.fulltime
    ? `${hour.value}:${minute.value}`
    : `${periodLabels.value[period.value]} ${hour.value}:${minute.value}`
);

// ─── modelValue → 내부 상태 ────────────────────────────────────
function applyModelValue(val: string) {
  // "HH:mm" 24h 형식으로 받는다고 가정
  const match = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return;

  const h = parseInt(match[1]);
  const step = Math.max(1, Math.min(60, props.minuteStep));
  const rawM = Math.min(59, parseInt(match[2]));
  const m = String((Math.round(rawM / step) * step) % 60).padStart(2, '0');
  minute.value = m;

  if (props.fulltime) {
    hour.value = String(Math.min(23, h)).padStart(2, '0');
  } else if (h === 0) {
    period.value = 'AM';
    hour.value = '12';
  } else if (h < 12) {
    period.value = 'AM';
    hour.value = String(h).padStart(2, '0');
  } else if (h === 12) {
    period.value = 'PM';
    hour.value = '12';
  } else {
    period.value = 'PM';
    hour.value = String(h - 12).padStart(2, '0');
  }
}

watch(
  () => props.modelValue,
  val => {
    if (val) applyModelValue(val);
  },
  { immediate: true }
);

// ─── 내부 상태 → emit (항상 24h "HH:mm") ──────────────────────
function emitValue() {
  if (props.fulltime) {
    emit('update:modelValue', `${hour.value}:${minute.value}`);
  } else {
    let h = parseInt(hour.value);
    if (period.value === 'AM') {
      if (h === 12) h = 0;
    } else if (h !== 12) h += 12;
    emit('update:modelValue', `${String(h).padStart(2, '0')}:${minute.value}`);
  }
}

// ─── 타이핑 입력 파싱 ─────────────────────────────────────────
function normalizePeriodToken(token: string): 'AM' | 'PM' {
  if (token === '오전') return 'AM';
  if (token === '오후') return 'PM';
  return token.toUpperCase() as 'AM' | 'PM';
}

function parseInputText(val: string) {
  const matchPeriodFirst = val.match(/^(오전|오후|AM|PM)\s+(\d{1,2}):(\d{2})$/i);
  const matchPeriodLast = val.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i);
  const match24 = val.match(/^(\d{1,2}):(\d{2})$/);

  if (props.fulltime) {
    if (!match24) return;
    hour.value = String(Math.min(23, parseInt(match24[1]))).padStart(2, '0');
    minute.value = String(Math.min(59, parseInt(match24[2]))).padStart(2, '0');
  } else if (matchPeriodFirst) {
    period.value = normalizePeriodToken(matchPeriodFirst[1]!);
    hour.value = String(Math.min(12, Math.max(1, parseInt(matchPeriodFirst[2]!)))).padStart(2, '0');
    minute.value = String(Math.min(59, parseInt(matchPeriodFirst[3]!))).padStart(2, '0');
  } else if (matchPeriodLast) {
    hour.value = String(Math.min(12, Math.max(1, parseInt(matchPeriodLast[1]!)))).padStart(2, '0');
    minute.value = String(Math.min(59, parseInt(matchPeriodLast[2]!))).padStart(2, '0');
    period.value = normalizePeriodToken(matchPeriodLast[3]!);
  } else if (match24) {
    applyModelValue(val);
  } else {
    return;
  }
  emitValue();
}

// ─── 드롭다운 선택 ────────────────────────────────────────────
function selectValue(col: ColumnType, value: string) {
  if (col === 'period' && (value === 'AM' || value === 'PM')) period.value = value;
  else if (col === 'hour') hour.value = value;
  else if (col === 'minute') minute.value = value;
  inputText.value = displayValue.value;
  emitValue();
}

// ─── 스크롤 이동 ─────────────────────────────────────────────
function scrollToSelected() {
  nextTick(() => {
    if (hourListRef.value) {
      const idx = hours.value.indexOf(hour.value);
      hourListRef.value.scrollTop = Math.max(0, idx) * ITEM_H;
    }
    if (minuteListRef.value) {
      const mIdx = minutes.value.indexOf(minute.value);
      minuteListRef.value.scrollTop = Math.max(0, mIdx) * ITEM_H;
    }
    if (periodListRef.value) {
      periodListRef.value.scrollTop = period.value === 'PM' ? ITEM_H : 0;
    }
  });
}

// ─── 드롭다운 닫기 ──────────────────────────────────────────
function closeDropdown() {
  parseInputText(inputText.value);
  inputText.value = displayValue.value;
  isFocused.value = false;
  isOpen.value = false;
}

// ─── 포커스 / 블러 ────────────────────────────────────────────
function onFocus() {
  isFocused.value = true;
  inputText.value = displayValue.value;
  isOpen.value = true;
  activeColumn.value = props.fulltime ? 'hour' : 'period';
  scrollToSelected();
}

function onInput(e: Event) {
  inputText.value = (e.target as HTMLInputElement).value;
}

function onBlur(e: FocusEvent) {
  const related = e.relatedTarget as Node | null;
  if (dropdownRef.value?.contains(related)) return;
  closeDropdown();
}

// ─── 키보드 핸들링 ──────────────────────────────────────────────
function moveColumn(dir: -1 | 1) {
  const cols = columns.value;
  const idx = cols.indexOf(activeColumn.value);
  const next = Math.max(0, Math.min(cols.length - 1, idx + dir));
  activeColumn.value = cols[next];
}

function moveItem(dir: -1 | 1) {
  const col = activeColumn.value;
  if (col === 'period') {
    period.value = period.value === 'AM' ? 'PM' : 'AM';
  } else {
    const list = col === 'hour' ? hours.value : minutes.value;
    const current = col === 'hour' ? hour.value : minute.value;
    const idx = list.indexOf(current);
    const next = Math.max(0, Math.min(list.length - 1, idx + dir));
    if (col === 'hour') hour.value = list[next];
    else minute.value = list[next];
  }
  inputText.value = displayValue.value;
  emitValue();
  scrollToSelected();
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      moveColumn(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      moveColumn(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      moveItem(-1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveItem(1);
      break;
    case 'Enter':
      e.preventDefault();
      closeDropdown();
      inputRef.value?.blur();
      break;
    case 'Tab':
      closeDropdown();
      break;
  }
}

// 드롭다운 클릭 시 input blur 방지
function onDropdownMousedown(e: MouseEvent) {
  e.preventDefault();
}
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <!-- Input -->
    <div class="relative">
      <Input
        v-bind="attrs"
        ref="inputRef"
        :model-value="isFocused ? inputText : displayValue"
        :placeholder="props.placeholder ?? (props.fulltime ? '--:--' : '--:-- --')"
        :size="props.size === 'md' ? 'default' : props.size"
        :disabled="props.disabled"
        :invalid="props.invalid"
        :invalid-message="props.invalidMessage"
        :class="cn('pr-40', attrs.class)"
        @focus="onFocus"
        @input="onInput"
        @blur="onBlur"
        @keydown="onKeydown">
        <template #icon>
          <i
            class="material-icons pointer-events-none absolute right-12 top-[50%] translate-y-[-50%] text-18 text-muted-foreground">
            schedule
          </i>
        </template>
      </Input>
      <!-- Dropdown -->
      <div
        ref="dropdownRef"
        v-if="isOpen"
        tabindex="-1"
        class="absolute left-0 top-full z-10 mt-4 flex overflow-hidden rounded-md border border-border bg-background shadow-md"
        @mousedown="onDropdownMousedown">
        <!-- AM / PM -->
        <div
          ref="periodListRef"
          v-if="!props.fulltime"
          :class="timepickerColumnStyle({ bordered: true })">
          <button
            :key="p.value"
            v-for="p in periodOptions"
            type="button"
            tabindex="-1"
            :class="
              timepickerItemStyle({
                active: period === p.value,
                keyup: activeColumn === 'period',
              })
            "
            @click="selectValue('period', p.value)">
            {{ p.label }}
          </button>
        </div>

        <!-- Hour -->
        <div ref="hourListRef" :class="timepickerColumnStyle({ bordered: true })">
          <button
            :key="h"
            v-for="h in hours"
            type="button"
            tabindex="-1"
            :class="
              timepickerItemStyle({
                active: hour === h,
                keyup: activeColumn === 'hour' && hour === h,
              })
            "
            @click="selectValue('hour', h)">
            {{ h }}
          </button>
        </div>

        <!-- Minute -->
        <div ref="minuteListRef" :class="timepickerColumnStyle()">
          <button
            :key="m"
            v-for="m in minutes"
            type="button"
            tabindex="-1"
            :class="
              timepickerItemStyle({
                active: minute === m,
                keyup: activeColumn === 'minute' && minute === m,
              })
            "
            @click="selectValue('minute', m)">
            {{ m }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
