/** Extracts the backend message from an axios error for toasts. */
export function apiMessage(err: any, fallback = 'Something went wrong'): string {
  const m = err?.response?.data?.message ?? err?.response?.data?.error?.message ?? err?.message;
  if (Array.isArray(m)) return m.join(', ');
  return typeof m === 'string' && m ? m : fallback;
}
