<script setup lang="ts">
import { cn } from '@/utils/shadcn';

const props = defineProps<{
  class?: string;
  size?: 'sm' | 'md' | 'lg';
}>();

const injectedSize = inject<Ref<'sm' | 'md' | 'lg' | undefined>>('radio-size', ref(undefined));
const resolvedSize = computed(() => props.size ?? injectedSize.value);

provide('radio-size', resolvedSize);
</script>

<template>
  <!--
    RadioGroupField: RadioGroupItem + 텍스트를 함께 쓸 때 첫 번째 줄 자동 정렬 wrapper
    - #radio slot: h-[1lh] 로 감싸 첫 줄에 정렬
    - default slot: 라벨/설명 등 텍스트 영역
    - class 속성은 Vue attribute inheritance 로 루트 div 에 자동 적용됨
  -->
  <div
    :class="
      cn('flex', props.class, {
        'gap-[6px]': resolvedSize === 'sm',
        'gap-[8px]': !resolvedSize || resolvedSize === 'md',
        'gap-[10px]': resolvedSize === 'lg',
      })
    ">
    <div
      :class="
        cn('flex h-[1lh] shrink-0 items-center', {
          'mt-[2px]': resolvedSize === 'lg',
        })
      ">
      <slot name="radio" />
    </div>
    <div
      :class="
        cn({
          'text-14': resolvedSize === 'sm',
          'text-16': !resolvedSize || resolvedSize === 'md',
          'text-18': resolvedSize === 'lg',
        })
      ">
      <slot />
    </div>
  </div>
</template>
