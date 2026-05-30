export function toAuthEmail(identifier) {
  const value = String(identifier ?? '').trim().toLowerCase();
  if (!value) return '';
  return value.includes('@') ? value : `${value}@meowic.app`;
}
