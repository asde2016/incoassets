<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui';
import { DialogRoot, useForwardPropsEmits } from 'reka-ui';
import { reactiveOmit } from '@vueuse/core';
import { provide } from 'vue';

interface CustomProps {
  closeIcon?: boolean;
  backdrop?: boolean;
}

const props = withDefaults(defineProps<DialogRootProps & CustomProps>(), {
  closeIcon: true,
  backdrop: false,
});
const emits = defineEmits<DialogRootEmits>();

const customKeys: (keyof CustomProps)[] = ['closeIcon', 'backdrop'];
const delegatedProps = reactiveOmit(props, ...customKeys);
const forwarded = useForwardPropsEmits(delegatedProps, emits);

provide('dialogCloseIcon', props.closeIcon);
provide('dialogBackdrop', props.backdrop);
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
