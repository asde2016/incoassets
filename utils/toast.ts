export function showToast({ type = 'info', message = '', delay = 3000 } = {}) {
  if (import.meta.server) return;

  // Tailwind 색상 클래스 매핑
  const typeClasses: any = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-600 text-white',
  };

  // toast container가 없으면 생성 (app.vue에 이미 id="toastContainer"가 있을 수 있음)
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  } else {
    // 기존 컨테이너가 있으면 Tailwind 클래스 추가 (Bootstrap 클래스 호환성 유지/교체)
    container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
  }

  // Toast DOM 생성
  const toast = document.createElement('div');
  toast.className = `flex items-center min-w-[250px] p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out opacity-0 translate-y-2 ${
    typeClasses[type] || typeClasses.info
  }`;
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <div class="flex-1 text-sm font-medium">${message}</div>
    <button type="button" class="ml-4 text-white hover:text-gray-200 focus:outline-none">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  // 애니메이션 효과
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');
  }, 10);

  const hideToast = () => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      toast.remove();
    }, 300);
  };

  // 닫기 버튼 이벤트
  const closeBtn = toast.querySelector('button');
  closeBtn?.addEventListener('click', hideToast);

  // 자동 제거
  if (delay > 0) {
    setTimeout(hideToast, delay);
  }
}
