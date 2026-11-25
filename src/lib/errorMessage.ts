/** Best human-readable message from an axios/Nest error (handles class-validator arrays). */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as any;
  const m = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message;
  if (Array.isArray(m)) return m.join(', ');
  return typeof m === 'string' && m ? m : fallback;
}
