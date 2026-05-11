<template>
  <Container v-if="postStore.post != null" size="md">
    <div class="rounded-lg bg-white p-40 shadow">
      <h2>글수정</h2>
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
          v-model="postStore.post.title" />
        <Label for="postContent" class="mb-12 mt-24">
          내용
          <sup class="text-danger">*</sup>
        </Label>
        <Textarea
          ref="refContent"
          id="postContent"
          placeholder="내용을 입력해주세요."
          rows="5"
          :invalid="!!errors.content"
          :invalid-message="errors.content"
          @input="check('content')"
          v-model="postStore.post.content" />
        <div class="mt-24 flex justify-end gap-12">
          <Button variant="outline-secondary" @click="$router.back()">취소하기</Button>
          <Button
            variant="primary"
            :disabled="!postStore.isPostModified"
            @click="handleUpdatePost()">
            수정하기
          </Button>
        </div>
      </form>
    </div>
  </Container>
</template>

<script setup lang="ts">
useHead({
  title: '글수정',
});
definePageMeta({
  middleware: 'auth',
});
const route = useRoute();
const id = Number(route.params.id);
const postStore = usePostStore();

// Input refs
const refTitle = ref();
const refContent = ref();

const refs = {
  title: refTitle,
  content: refContent,
};
const { errors, validate, check } = validation(UpdatePostRequestSchema, () => ({
  title: postStore.post?.title,
  content: postStore.post?.content,
}));

function handleUpdatePost() {
  if (postStore.loading > 0) return;
  if (!validate(refs)) return;
  postStore.updatePost(id, postStore.post);
}

onMounted(async () => {
  await postStore.getPost(id);
});
onUnmounted(() => {
  postStore.$reset();
});
</script>
