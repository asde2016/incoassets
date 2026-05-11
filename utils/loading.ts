/**
 * Start Loading
 */
export function startLoading() {
  if (import.meta.server) return;

  let wrapElmnt = document.querySelector('.spinner-wrap') as HTMLElement | null;
  const htmlElmnt = document.querySelector('html') as HTMLElement | null;

  if (wrapElmnt) {
    wrapElmnt.dataset.task = String(Number(wrapElmnt.dataset.task) + 1);
  } else {
    const body = document.querySelector('body');
    if (body) body.classList.add('modal-open');

    wrapElmnt = document.createElement('div');
    wrapElmnt.classList.add('spinner-wrap');
    wrapElmnt.dataset.task = '1';
    const loadingElmnt = document.createElement('div');
    loadingElmnt.classList.add('spinner-border');
    loadingElmnt.setAttribute('role', 'status');
    const span = document.createElement('span');
    span.classList.add('sr-only');
    span.innerHTML = 'Loading...';
    loadingElmnt.appendChild(span);
    wrapElmnt.appendChild(loadingElmnt);

    if (htmlElmnt) {
      htmlElmnt.appendChild(wrapElmnt);
    }
  }
}

/**
 * End Loading
 */
export function endLoading() {
  if (import.meta.server) return;

  setTimeout(() => {
    const wrapElmnt = document.querySelector('.spinner-wrap') as HTMLElement | null;

    if (wrapElmnt) {
      const taskCount = Number(wrapElmnt.dataset.task);

      if (taskCount > 1) {
        wrapElmnt.dataset.task = String(taskCount - 1);
      } else {
        const body = document.querySelector('body');
        if (body) body.classList.remove('modal-open');

        wrapElmnt.style.opacity = '0';

        setTimeout(() => {
          wrapElmnt && wrapElmnt.remove();
        }, 300);
      }
    }
  }, 300);
}
