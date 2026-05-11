<template>
  <Container v-if="postStore.postList != null">
    <div class="-mb-38 flex items-center justify-end">
      <Button variant="primary" as-child>
        <NuxtLink to="/post/create">
          <i class="material-icons -ms-2">edit</i>
          글작성
        </NuxtLink>
      </Button>
    </div>
    <div id="postList" />
  </Container>
</template>

<script setup lang="ts">
useHead({
  title: '자유게시판',
});
definePageMeta({
  middleware: 'auth',
});
const postStore = usePostStore();
let incosheet = null;

function setIncosheet() {
  const options = {
    id: 'postList',
    caption: '자유게시판',
    rowHeight: 40,
    height: 500,
    rowSelection: true,
    // 'performanceInfo': true,
    pagination: {
      currentPage: 1,
      perPage: 20,
      size: [10, 20, 50, 100],
      perGroup: 5,
    },
    // 'pagination': false,
    // 'tools': {
    //   'search': false,
    //   'filter': false,
    //   'column': false,
    //   'view': false,
    //   'download': false,
    // },
    customTools: [
      {
        icon: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M0 0h24v24H0V0z' fill='none'></path><path d='M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z'></path></svg>",
        name: '삭제',
        clickEvent: async (e: Event, table: any) => {
          if (table.checkedData.size === 0) {
            showToast({ type: 'danger', message: '선택한 데이터가 없습니다.' });
            return;
          }
          const ids = Array.from(table.checkedData.keys()) as number[];
          postStore.deletePost(ids);

          await postStore.getPostList();
          setIncosheet();
        },
      },
    ],
    // editable: true,
    filters: [],
    params: {
      limit: 'test',
    },
    columns: [
      { title: 'id', field: 'id', view: false },
      {
        title: '제목',
        field: 'title',
        type: 'text',
        width: 300,
        frozen: true,
        html: true,
        formatter: (rowData, value) => {
          // NuxtLink 적용
          setTimeout(() => {
            document
              .querySelector(`a[data-to="/post/${rowData.id}"]`)
              ?.addEventListener('click', () => {
                navigateTo(`/post/${rowData.id}`);
              });
          }, 0);
          return `<a href="javascript:void(0)" class="text-primary focus:text-primary-hover hover:text-primary-hover" data-to="/post/${rowData.id}">${value}</a>`;
        },
      },
      { title: '내용', field: 'content', type: 'text', width: 500 },
      {
        title: '생성일시',
        field: 'created_at',
        type: 'datetime',
        sort: true,
        width: 120,
        textAlign: 'center',
      },
      {
        title: '수정일시',
        field: 'updated_at',
        type: 'datetime',
        sort: true,
        width: 120,
        textAlign: 'center',
      },
    ],
    data: postStore.postList,
  };
  incosheet = new Incosheet(options);
}

onMounted(async () => {
  await postStore.getPostList();
  setIncosheet();
});
onUnmounted(() => {
  postStore.$reset();
  incosheet.destroy();
});
</script>
