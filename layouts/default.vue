<template>
  <div class="flex min-h-dvh flex-col">
    <a
      class="sr-only flex items-center justify-center bg-primary text-white focus:not-sr-only"
      href="#content">
      본문 바로가기
    </a>
    <Header />
    <main id="content" class="flex-1 pb-[6.25rem] pt-[3rem]">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts"></script>
