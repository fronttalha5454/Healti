/** Tarihi cihazın yerel saat dilimine göre YYYY-MM-DD olarak döndürür (toISOString UTC kullanır). */
export function toLocalDateString(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
