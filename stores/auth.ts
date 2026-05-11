export const useAuthStore = defineStore('auth', {
  persist: {
    key: hashStorageKey('auth'),
    pick: ['id', 'permission', 'nickname', 'profile_image_path'],
    serializer: {
      serialize: s => encrypt(JSON.stringify(s)),
      deserialize: value => JSON.parse(decrypt(value)),
    },
  },
  state: () => ({
    loading: 0,
    id: -1,
    permission: -1,
    profile_image_path: null,
    nickname: '',
    username: 'test',
    password: 'inco2025!',
  }),

  getters: {
    isAuthenticated: s => !!useCookie('access_token').value || s.id > 0,
  },

  actions: {
    reset() {
      this.id = -1;
      this.permission = -1;
      this.profile_image_path = null;
      this.nickname = '';
      this.username = '';
      this.password = '';
    },
    async login() {
      this.loading += 1;

      try {
        const authService = useAuthService();

        const data = {
          username: this.username,
          password: this.password,
        };
        const response = await authService.login(data);
        if (response) {
          this.id = response.user.id;
          this.permission = response.user.permission;
          this.nickname = response.user.nickname;
          this.profile_image_path = response.user.profile_image_path;
          setTimeout(() => {
            this.username = '';
            this.password = '';
          }, 100);

          const route = useRoute();
          const next = route.query.next as string;
          if (next) {
            // next가 이미 /로 시작하면 중복 슬래시 방지를 위해 그대로 사용
            navigateTo(next.startsWith('/') ? next : `/${next}`);
          } else {
            navigateTo('/');
          }
        }
      } finally {
        this.loading -= 1;
      }
    },
    async logout() {
      this.loading += 1;
      const authService = useAuthService();

      try {
        await authService.logout();

        this.reset();

        navigateTo('/login');
      } finally {
        this.loading -= 1;
      }
    },
    async refresh() {
      this.loading += 1;

      const authService = useAuthService();

      try {
        const response = await authService.refresh();
        if (response && response.user) {
          // 최신 사용자 정보로 자동 동기화 (15분마다)
          this.id = response.user.id;
          this.permission = response.user.permission;
          this.nickname = response.user.nickname;
          this.profile_image_path = response.user.profile_image_path;
        }
      } catch (err) {
        this.reset();
      } finally {
        this.loading -= 1;
      }
    },
  },
});
