<template>
  <Container size="md">
    <div class="rounded-lg bg-white p-40 shadow">
      <h2>글작성</h2>
      <form>
        <Label for="postTitle" class="mb-12 mt-24">
          제목
          <sup class="text-danger">*</sup>
        </Label>
        <Input
          ref="refTitle"
          id="postTitle"
          type="text"
          placeholder="제목을 입력해주세요."
          required
          :invalid="!!errors.title"
          :invalid-message="errors.title"
          @input="check('title')"
          v-model="data.title" />
        <Label for="postContent" class="mb-12 mt-24">
          내용
          <sup class="text-danger">*</sup>
        </Label>
        <Textarea
          ref="refContent"
          id="postContent"
          rows="10"
          placeholder="내용을 입력해주세요."
          :invalid="!!errors.content"
          :invalid-message="errors.content"
          @input="check('content')"
          v-model="data.content" />
        <div class="mt-24 flex justify-end gap-12">
          <Button variant="outline-secondary" @click="$router.back()">취소하기</Button>
          <Button variant="primary" @click="handleCreatePost()">저장하기</Button>
        </div>
      </form>
    </div>
  </Container>
</template>

<script setup lang="ts">
useHead({
  title: '글작성',
});
definePageMeta({
  middleware: 'auth',
});
const postStore = usePostStore();

// Input refs
const refTitle = ref();
const refContent = ref();

// 로컬 상태로 관리 (타입 안전성 확보)
const data = ref({
  title: '',
  content: '',
});

const refs = {
  title: refTitle,
  content: refContent,
};
const { errors, validate, check } = validation(CreatePostRequestSchema, () => ({
  title: data.value.title,
  content: data.value.content,
}));

function handleCreatePost() {
  if (postStore.loading > 0) return;
  if (!validate(refs)) return;
  postStore.createPost(data);
}
</script>
