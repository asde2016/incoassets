export function usePostService() {
  const { GET, POST, PATCH, DELETE } = useApi();

  return {
    getPost: (id: number) => GET(`/posts/${id}`, PostResponseSchema),
    getPostList: () => GET('/posts', PostListResponseSchema),
    createPost: (data: CreatePostRequest) => POST('/posts', MessageResponseSchema, data),
    updatePost: (id: number, data: UpdatePostRequest) =>
      PATCH(`/posts/${id}`, MessageResponseSchema, data),
    deletePost: (data: object) => DELETE('/posts', MessageResponseSchema, data),
  };
}
