import { vi } from "vitest";

export const createClient = vi.fn(() => ({
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
    })),
  },
}));
