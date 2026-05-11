export const usePostStore = defineStore('post', {
  state: () => ({
    loading: 0,
    post: null as PostResponse | null,
    originalPost: null as PostResponse | null,
    postList: null as PostResponse[] | null,
  }),

  getters: {
    isPostModified: s => {
      if (!s.post || !s.originalPost) return false;
      return JSON.stringify(s.post) !== JSON.stringify(s.originalPost);
    },
  },

  actions: {
    async getPost(id: number) {
      const postService = usePostService();
      const response = await postService.getPost(id);
      this.post = response;
      this.originalPost = structuredClone(response);
    },
    async getPostList() {
      const postService = usePostService();
      const response = await postService.getPostList();
      this.postList = response;
    },
    async createPost(data: CreatePostRequest) {
      const postService = usePostService();
      await postService.createPost(data);

      navigateTo('/post');
    },
    async updatePost(id: number, data: UpdatePostRequest) {
      const postService = usePostService();
      await postService.updatePost(id, data);

      navigateTo('/post');
    },
    async deletePost(ids: number[]) {
      const postService = usePostService();
      await postService.deletePost(ids);
    },
  },
});
