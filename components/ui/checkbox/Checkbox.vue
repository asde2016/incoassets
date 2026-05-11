<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/shadcn';
import type { CheckboxVariants } from '.';
import { checkboxVariants } from '.';

defineOptions({ inheritAttrs: false });

const props = defineProps<
  CheckboxRootProps & {
    class?: HTMLAttributes['class'];
    size?: CheckboxVariants['size'];
    invalid?: boolean;
  }
>();

const emits = defineEmits<CheckboxRootEmits>();

const injectedInvalid = inject('checkbox-invalid', ref(false));
const isInvalid = computed(() => props.invalid || (injectedInvalid as Ref<boolean>).value);

const injectedSize = inject<Ref<CheckboxVariants['size']>>('checkbox-size', ref(undefined));
const resolvedSize = computed(() => props.size ?? injectedSize.value);

const delegatedProps = reactiveOmit(props, 'class', 'size', 'invalid');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CheckboxRoot
    v-bind="{ ...forwarded, ...$attrs }"
    :class="
      cn(
        checkboxVariants({ size: resolvedSize }),
        isInvalid && 'border-danger data-[state=unchecked]:focus-visible:ring-danger-ring',
        props.class
      )
    ">
    <CheckboxIndicator class="grid place-content-center text-current">
      <slot>
        <i
          :class="
            cn('material-icons font-bold', {
              'text-10': resolvedSize === 'sm',
              'text-14': !resolvedSize || resolvedSize === 'md',
              'text-16': resolvedSize === 'lg',
            })
          ">
          done
        </i>
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
