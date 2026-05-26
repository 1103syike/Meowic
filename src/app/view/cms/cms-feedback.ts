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
