<script setup lang="ts">
import type { CalendarRootProps } from 'reka-ui';
import type { DateValue } from '@internationalized/date';
import type { LayoutTypes } from '@/components/ui/calendar';
import { getLocalTimeZone } from '@internationalized/date';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/shadcn';

type DateRange = { start?: DateValue; end?: DateValue };

const props = withDefaults(
  defineProps<
    Omit<CalendarRootProps, 'modelValue'> & {
      modelValue?: DateValue | DateRange;
      placeholder?: string;
      class?: string;
      highlightedDates?: DateValue[];
      layout?: LayoutTypes;
      locale?: string;
      format?: string;
      weekStartSun?: boolean;
      range?: boolean;
      size?: 'md' | 'sm' | 'lg';
      invalid?: boolean;
      invalidMessage?: string;
    }
  >(),
  {
    placeholder: 'YYYY-MM-DD',
    layout: '',
    locale: 'ko-KR',
    format: 'YYYY-MM-DD',
    range: false,
    size: 'md',
  }
) as any;

const emit = defineEmits<{
  'update:modelValue': [value: DateValue | DateRange | undefined];
}>();

const isOpen = ref(false);
const internalDate = ref<DateValue | undefined>(props.modelValue);
const internalRange = ref<DateRange>(props.modelValue ?? {});

const pad = (n: number) => String(n).padStart(2, '0');
function formatDate(d: DateValue | undefined): string {
  if (!d) return '';
  const dt = d.toDate(getLocalTimeZone());
  return (props.format as string)
    .replace('YYYY', String(dt.getFullYear()))
    .replace('yyyy', String(dt.getFullYear()))
    .replace('MM', pad(dt.getMonth() + 1))
    .replace('DD', pad(dt.getDate()))
    .replace('mm', String(dt.getMonth() + 1))
    .replace('dd', String(dt.getDate()));
}

const formattedDate = computed(() => {
  if (props.range) {
    const s = formatDate(internalRange.value.start);
    const e = formatDate(internalRange.value.end);
    return s || e ? `${s} ~ ${e}` : '';
  }
  return formatDate(internalDate.value);
});

function onDateSelect(v: DateValue | undefined) {
  internalDate.value = v;
  emit('update:modelValue', v);
  isOpen.value = false;
}

function onRangeSelect(v: unknown) {
  const r = v as DateRange;
  internalRange.value = r;
  emit('update:modelValue', r);
  if (r.start && r.end) isOpen.value = false;
}

const passProps = computed(() => {
  const {
    modelValue: _mv,
    placeholder: _ph,
    class: _cl,
    highlightedDates,
    range: _r,
    ...rest
  } = props;
  return props.range ? rest : { ...rest, highlightedDates };
});
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <div class="relative h-fit w-full" tabindex="-1">
        <Input
          readonly
          :model-value="formattedDate"
          :placeholder="props.placeholder"
          :size="props.size === 'md' ? 'default' : props.size"
          :invalid="props.invalid"
          :invalid-message="props.invalidMessage"
          :focus="isOpen"
          :class="
            cn(
              'cursor-pointer pl-40',
              isOpen && 'border-primary ring-2 ring-ring ring-offset-0',
              props.invalid && 'ring-danger-ring',
              props.class
            )
          "
          @keydown.enter.prevent="isOpen = !isOpen"
          @keydown.space.prevent="isOpen = !isOpen">
          <template #icon>
            <i
              class="material-icons pointer-events-none absolute left-12 top-[50%] translate-y-[-50%] text-20 text-gray-400">
              calendar_month
            </i>
          </template>
        </Input>
      </div>
    </PopoverTrigger>
    <PopoverContent class="w-auto overflow-hidden p-0" align="start">
      <RangeCalendar
        v-if="props.range"
        :model-value="internalRange"
        v-bind="passProps"
        initial-focus
        @update:model-value="onRangeSelect" />
      <Calendar
        v-else
        :model-value="internalDate"
        v-bind="passProps"
        initial-focus
        @update:model-value="onDateSelect" />
    </PopoverContent>
  </Popover>
</template>
