/**
 * Serialize a value to JSON that is safe to embed inside
 * `<script type="application/ld+json">` for Schema.org metadata.
 *
 * Escapes characters that could:
 *  - Break out of a <script> tag (`<`, `>`, `&`).
 *  - Be valid in JSON but invalid as JavaScript source (U+2028 line separator,
 *    U+2029 paragraph separator) — these crash inline scripts if not escaped.
 *
 * The output is still valid JSON; `JSON.parse(toSafeLdJson(x))` round-trips to `x`.
 *
 * Intended as the sanitizer for inline JSON-LD <script> blocks — callers pass
 * its output to React's raw HTML injection prop for the <script> element only.
 */
export function toSafeLdJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
