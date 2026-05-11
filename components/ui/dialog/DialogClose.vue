<script setup lang="ts">
import type { DialogCloseProps } from 'reka-ui';
import { DialogClose } from 'reka-ui';

const props = defineProps<DialogCloseProps>();
</script>

<template>
  <DialogClose
    v-bind="props"
    class="focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0">
    <slot />
  </DialogClose>
</template>
