/** 將帳號／信箱轉成 Firebase Auth 可用的 email 格式 */
export function toAuthEmail(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  if (!value) {
    return '';
  }
  return value.includes('@') ? value : `${value}@meowic.app`;
}

export function displayLoginId(email: string | null | undefined, phone?: string | null): string {
  if (phone?.trim()) {
    return phone.trim();
  }
  const raw = (email ?? '').trim();
  if (raw.endsWith('@meowic.app')) {
    return raw.replace(/@meowic\.app$/i, '');
  }
  return raw;
}
