interface Opts {
  maxAttempts?: number;
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  opts: Opts = {},
): Promise<string> {
  const max = opts.maxAttempts ?? 50;
  if (!(await exists(base))) return base;
  for (let i = 2; i <= max; i++) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`Could not generate unique slug for base "${base}" in ${max} attempts`);
}
