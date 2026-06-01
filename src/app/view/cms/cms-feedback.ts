import Swal from 'sweetalert2';

export async function showCmsSuccess(title: string): Promise<void> {
  await Swal.fire({
    icon: 'success',
    title,
    timer: 1400,
    showConfirmButton: false,
  });
}

export async function showCmsError(title: string, text: string): Promise<void> {
  await Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: '我知道了',
  });
}

export function getCmsErrorMessage(err: unknown, fallback = '請稍後再試。'): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message?: unknown }).message ?? fallback);
  }
  return fallback;
}

export function formatMissingFields(fields: string[], labels: Record<string, string>, fallback: string): string {
  const names = fields.map((field) => labels[field] ?? field);
  return `請補齊：${names.join('、') || fallback}`;
}

export async function confirmCmsAction(options: {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  requireTypedConfirm?: string;
  icon?: 'warning' | 'question' | 'error';
}): Promise<boolean> {
  if (options.requireTypedConfirm) {
    const expected = options.requireTypedConfirm;
    const result = await Swal.fire({
      icon: options.icon ?? 'warning',
      title: options.title,
      text: options.text,
      input: 'text',
      inputPlaceholder: `請輸入「${expected}」以確認`,
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText ?? '確認刪除',
      cancelButtonText: options.cancelButtonText ?? '取消',
      preConfirm: (value) => {
        if (value?.trim() !== expected) {
          return `請輸入「${expected}」`;
        }
        return undefined;
      },
    });
    return result.isConfirmed;
  }

  const result = await Swal.fire({
    icon: options.icon ?? 'warning',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? '確認',
    cancelButtonText: options.cancelButtonText ?? '取消',
  });
  return result.isConfirmed;
}
