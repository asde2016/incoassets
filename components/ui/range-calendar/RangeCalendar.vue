<script lang="ts" setup>
import type { LayoutTypes } from '@/components/ui/calendar';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import type { RangeCalendarRootEmits, RangeCalendarRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { RangeCalendarRoot, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/shadcn';
import VueSelect from '@/components/ui/vselect/VueSelect.vue';
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNextButton,
  RangeCalendarPrevButton,
} from '.';

type DateValue = Parameters<NonNullable<RangeCalendarRootProps['isDateUnavailable']>>[0];

const props = withDefaults(
  defineProps<
    RangeCalendarRootProps & {
      class?: HTMLAttributes['class'];
      layout?: LayoutTypes;
      locale?: string;
      format?: string;
      weekStartSun?: boolean;
    }
  >(),
  {
    layout: '',
    locale: 'ko-KR',
    format: 'YYYY-MM-DD',
    weekStartSun: true,
  }
);

const emits = defineEmits<
  RangeCalendarRootEmits & {
    'update:formatted': [value: { start: string; end: string }];
  }
>();

defineOptions({ inheritAttrs: false });

const delegatedProps = reactiveOmit(props, 'class', 'layout', 'locale', 'format', 'weekStartSun');

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const layoutType = computed(() => props.layout as LayoutTypes);
const weekStartsOn = computed(
  () => ((props as { weekStartSun?: boolean }).weekStartSun === false ? 1 : 0) as 0 | 1
);
const locale = computed(() => String((props as { locale?: string }).locale ?? 'ko-KR'));
const placeholder = ref(today(getLocalTimeZone())) as Ref<DateValue>;
const range = ref<{ start?: DateValue; end?: DateValue }>({});

// Year / Month select options
const currentYear = new Date().getFullYear();

const yearOptions = computed(() => {
  const p = props as { minValue?: { year: number }; maxValue?: { year: number } };
  const minYear = p.minValue?.year ?? currentYear - 10;
  const maxYear = p.maxValue?.year ?? currentYear + 10;
  return Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
    label: `${String(minYear + i)}년`,
    value: minYear + i,
  }));
});

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${String(i + 1)}월`,
  value: i + 1,
}));

function onYearChange(val: unknown) {
  const year = typeof val === 'number' ? val : null;
  if (year == null) return;
  placeholder.value = new CalendarDate(year, placeholder.value.month, placeholder.value.day);
}

function onMonthChange(val: unknown) {
  const month = typeof val === 'number' ? val : null;
  if (month == null) return;
  placeholder.value = new CalendarDate(placeholder.value.year, month, placeholder.value.day);
}

const pad = (n: number) => String(n).padStart(2, '0');
function formatDate(date: DateValue | undefined): string {
  if (!date) return '';
  const d = date.toDate(getLocalTimeZone());
  return (props.format ?? 'YYYY-MM-DD')
    .replace('YYYY', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()));
}

const formattedRange = computed(() => ({
  start: formatDate(range.value.start),
  end: formatDate(range.value.end),
}));

watch(formattedRange, v => emits('update:formatted', v));
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid, weekDays }"
    :class="cn('w-240 bg-white p-8', props.class)"
    :locale="locale"
    v-bind="{ ...forwarded, ...$attrs }"
    :week-starts-on="weekStartsOn"
    v-model="range"
    v-model:placeholder="placeholder">
    <RangeCalendarHeader>
      <RangeCalendarPrevButton />
      <RangeCalendarHeading v-if="!layoutType" />
      <VueSelect
        v-if="layoutType.includes('year')"
        :options="yearOptions"
        :model-value="placeholder.year"
        :reduce="opt => opt.value"
        :clearable="false"
        :searchable="false"
        size="sm"
        class="sm-popover !min-h-36 w-100"
        @update:model-value="onYearChange" />
      <span v-if="layoutType === 'year'" class="text-sm font-medium">
        {{ placeholder.month }}월
      </span>
      <VueSelect
        v-if="layoutType.includes('month')"
        :options="monthOptions"
        :model-value="placeholder.month"
        :reduce="opt => opt.value"
        :clearable="false"
        :searchable="false"
        size="sm"
        class="sm-popover !min-h-36 w-72"
        @update:model-value="onMonthChange" />
      <RangeCalendarNextButton />
    </RangeCalendarHeader>

    <div class="mt-4 flex flex-col gap-y-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <RangeCalendarGrid :key="month.value.toString()" v-for="month in grid">
        <RangeCalendarGridHead>
          <RangeCalendarGridRow>
            <RangeCalendarHeadCell :key="day" v-for="day in weekDays">
              {{ day }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            :key="`weekDate-${index}`"
            v-for="(weekDates, index) in month.rows"
            class="mt-2 w-full">
            <RangeCalendarCell
              :key="weekDate.toString()"
              v-for="weekDate in weekDates"
              :date="weekDate">
              <RangeCalendarCellTrigger :day="weekDate" :month="month.value" />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
