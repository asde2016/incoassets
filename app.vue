<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCustomize } from '~/stores/customize';

const customize = useCustomize();
onMounted(() => {
  customize.migrate();
});
</script>
