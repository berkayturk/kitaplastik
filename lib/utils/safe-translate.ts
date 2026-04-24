// lib/utils/safe-translate.ts
type Translator = (key: string) => string | undefined;

export function safeTranslate(t: Translator, key: string): string | null {
  try {
    const value = t(key);
    if (!value) return null;
    if (value === key) return null; // echo fallback — next-intl returns key when missing
    return value;
  } catch {
    return null;
  }
}
