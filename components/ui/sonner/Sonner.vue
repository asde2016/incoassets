<script lang="ts" setup>
import 'vue-sonner/style.css';
import type { ToasterProps } from 'vue-sonner';
import { reactiveOmit } from '@vueuse/core';
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-vue-next';
import { Toaster as Sonner } from 'vue-sonner';

const props = withDefaults(defineProps<ToasterProps>(), {
  position: 'top-center',
  duration: 5000,
});
const delegatedProps = reactiveOmit(props, 'toastOptions');
</script>

<template>
  <Sonner
    v-bind="delegatedProps"
    class="flex !w-full justify-center"
    :toast-options="{
      classes: {
        toast:
          '!items-start !w-fit !h-fit !max-w-[calc(100dvw-48px)] !px-16 !py-12 !text-14 !bg-gray-900 !border-0 !text-white !rounded-[1.5rem] !whitespace-normal',
        icon: '!w-20 !h-20 !m-0',
        description: '',
        actionButton: '',
        cancelButton: '',
      },
    }"
    style="--width: auto">
    <template #success-icon>
      <i class="material-icons-round">check_circle_outline</i>
    </template>
    <template #info-icon>
      <i class="material-icons-round">info_outline</i>
    </template>
    <template #warning-icon>
      <i class="material-icons-round">warning_amber</i>
    </template>
    <template #error-icon>
      <i class="material-icons-round">error_outline</i>
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-20 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-20" />
    </template>
  </Sonner>
</template>
