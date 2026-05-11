export function setComponentPage(): void {
  if (import.meta.server) return;

  // Set Code Style
  const componentCodeList = document.querySelectorAll<HTMLElement>('.component-code code');

  componentCodeList.forEach(el => {
    let html: string = el.innerHTML;

    html = html
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll("'", '&#x27;')
      .replaceAll('"', '&quot;')
      .replaceAll('(', '&#40;')
      .replaceAll(')', '&#41;')
      .replaceAll('/', '&#x2F;');

    el.innerHTML = html;
  });

  // Search Components
  document.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.matches('#searchComponent')) return;

    const componentList = document.querySelector<HTMLElement>('.component-list');
    const componentLinkList = document.querySelectorAll<HTMLElement>(
      '.component-list .component-link'
    );

    if (!componentList) return;

    const searchKeyword: string = target.value.trim().toLowerCase();
    let isEmpty: boolean = true;

    const emptyItem = componentList.querySelector('.component-item.empty');
    if (emptyItem) emptyItem.remove();

    if (searchKeyword !== '') {
      componentLinkList.forEach(link => {
        if (link.textContent?.toLowerCase().includes(searchKeyword)) {
          link.classList.remove('d-none');
          isEmpty = false;
        } else {
          link.classList.add('d-none');
        }
      });

      if (isEmpty) {
        componentList.insertAdjacentHTML(
          'beforeend',
          '<div class="component-item empty">검색 결과가 없습니다.</div>'
        );
      }
    } else {
      componentLinkList.forEach(link => link.classList.remove('d-none'));
    }
  });

  // Sidebar Click
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (!target.matches('.sidebar .component-list .component-link')) return;

    const componentLinkList = document.querySelectorAll<HTMLElement>(
      '.component-list .component-link'
    );

    componentLinkList.forEach(link => link.classList.remove('active'));
    target.classList.add('active');
  });
}
