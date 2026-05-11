<script setup lang="ts">
const emit = defineEmits<{ open: [] }>();
</script>

<template>
  <button
    type="button"
    aria-label="새 아이콘 업로드"
    class="group flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:-translate-y-2 hover:border-primary hover:bg-primary-foreground hover:text-primary"
    @click="emit('open')">
    <i class="material-icons text-40">add</i>
  </button>
</template>
