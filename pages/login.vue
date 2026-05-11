<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-24">
    <img src="@/assets/images/logo/logo@3x.png" class="mt-[3rem] h-48" alt="로고" />
    <div
      class="mb-[6.25rem] mt-[2.5rem] w-[472px] max-w-[100%] rounded-[1rem] bg-white p-[2.5rem] shadow">
      <h1 class="text-[2.5rem] font-bold">로그인</h1>
      <p class="mt-8 text-gray-600">App 시스템을 이용하시려면 로그인이 필요합니다.</p>
      <label for="username" class="mt-[3rem] inline-block">사용자 ID</label>
      <Input
        ref="refUsername"
        id="username"
        type="text"
        input-style="line"
        class="rounded-none border-0 border-b p-0 !shadow-none"
        placeholder="사용자 ID를 입력하세요."
        :invalid="!!errors.username"
        :invalid-message="errors.username"
        @input="check('username')"
        @keydown.enter="handleLogin()"
        v-model="authStore.username" />
      <label for="password" class="mt-[2rem] inline-block">비밀번호</label>
      <Input
        ref="refPassword"
        id="password"
        type="password"
        input-style="line"
        class="rounded-none border-0 border-b p-0"
        autocomplete="off"
        placeholder="비밀번호를 입력하세요."
        :invalid="!!errors.password"
        :invalid-message="errors.password"
        @input="check('password')"
        @keydown.enter="handleLogin()"
        v-model="authStore.password" />
      <Button
        variant="dark"
        class="mt-[2rem] w-full"
        :disabled="authStore.loading > 0"
        @click="handleLogin()">
        <Spinner v-if="authStore.loading > 0" />
        로그인 하기
      </Button>
      <Button variant="none" class="mt-[0.5rem] w-full">회원가입 하기</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '로그인',
});
definePageMeta({
  layout: false,
});

// Input refs
const refUsername = ref();
const refPassword = ref();

// ============================================
// 로그인
// ============================================
const authStore = useAuthStore();
const refs = {
  username: refUsername,
  password: refPassword,
};
const { errors, validate, check } = validation(LoginRequestSchema, () => ({
  username: authStore.username,
  password: authStore.password,
}));

const handleLogin = async () => {
  if (authStore.loading > 0) return;
  if (!validate(refs)) return;
  await authStore.login();
};

onMounted(() => {
  const authMsg = useCookie('auth_msg');
  if (authMsg.value) {
    toast.error(authMsg.value);
    authMsg.value = null;
  }
});
</script>
