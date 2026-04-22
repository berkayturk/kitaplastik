// Intentional empty stub for the `server-only` module so vitest (jsdom)
// can import pure utilities that live inside RSC-marked files. The real
// package throws at import time to enforce server-only boundaries; our
// tests run in Node and do not rely on that enforcement.
export {};
