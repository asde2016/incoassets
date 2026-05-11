export function dateFormatter(date: string | Date): string {
  const d = new Date(date);

  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
