<template>
  <header class="sticky top-0 z-40 flex h-56 w-full items-center border-0 bg-white shadow-sm">
    <Container class="flex items-center justify-between gap-16">
      <NuxtLink to="/" aria-label="메인 바로가기">
        <h1 class="text-20">incoASSETS</h1>
      </NuxtLink>
      <button
        type="button"
        :class="[
          'flex h-36 w-36 items-center justify-center rounded-full transition',
          search.mode === 'deleted'
            ? 'bg-danger/10 text-danger hover:bg-danger/20'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
        ]"
        :aria-pressed="search.mode === 'deleted'"
        :title="search.mode === 'deleted' ? '활성 아이콘으로 돌아가기' : '휴지통 보기'"
        :aria-label="search.mode === 'deleted' ? '활성 아이콘으로 돌아가기' : '휴지통 보기'"
        @click="toggleTrash">
        <i class="material-icons text-20">
          {{ search.mode === 'deleted' ? 'delete' : 'delete_outline' }}
        </i>
      </button>
    </Container>
  </header>
</template>

<script setup lang="ts">
import { useSearch } from '~/stores/search';

const search = useSearch();

function toggleTrash() {
  search.setMode(search.mode === 'deleted' ? 'active' : 'deleted');
}
</script>
