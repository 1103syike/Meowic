const LOCAL_DEV_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i;

/** 將舊 json-server 的 localhost URL 轉成可從 Vercel / ng serve 讀取的相對路徑 */
export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (LOCAL_DEV_ORIGIN.test(trimmed)) {
    return trimmed.replace(LOCAL_DEV_ORIGIN, '') || './mock/unnamed.png';
  }

  return trimmed;
}

export function normalizeRecordMedia<T extends Record<string, unknown>>(record: T): T {
  const mediaFields = ['imgPath', 'audioPath', 'imagePath'] as const;
  const next: Record<string, unknown> = { ...record };

  for (const field of mediaFields) {
    const value = next[field];
    if (typeof value === 'string') {
      next[field] = normalizeMediaUrl(value);
    }
  }

  return next as T;
}
