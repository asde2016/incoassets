<template>
  <Container>
    <div class="flex min-h-screen items-center justify-center">
      <div class="mb-[30dvh] text-center">
        <h1 class="text-112">500</h1>
        <p class="mb-32 text-20 font-medium text-gray-700">Internal Server Error</p>
        <p class="mb-8 text-gray-600">웹 사이트에서 페이지를 표시할 수 없습니다.</p>
        <NuxtLink to="/" class="text-primary hover:text-primary-hover focus:text-primary-hover">
          ← 메인 페이지로 가기
        </NuxtLink>
      </div>
    </div>
  </Container>
</template>

<script setup lang="ts">
useHead({
  title: '500',
});
definePageMeta({
  layout: false,
});
</script>
