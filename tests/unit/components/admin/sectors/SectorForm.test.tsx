// tests/unit/components/admin/sectors/SectorForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// SectorHeroField imports createClient which triggers env validation at
// import time. Mock the module before any component is imported.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    storage: { from: vi.fn(() => ({ upload: vi.fn() })) },
  })),
}));

import { SectorForm } from "@/components/admin/sectors/SectorForm";

const sector = {
  id: "uuid",
  slug: "cam-yikama",
  name: { tr: "Cam Yıkama", en: "Glass Washing", ru: "", ar: "" },
  description: null,
  long_description: null,
  meta_title: null,
  meta_description: null,
  hero_image: null,
  hero_color: null,
  display_order: 10,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("SectorForm", () => {
  it("renders 4 locale tab buttons (TR/EN/RU/AR)", () => {
    render(<SectorForm sector={sector} action={async () => {}} />);
    expect(screen.getByRole("tab", { name: /TR/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /RU/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /AR/i })).toBeInTheDocument();
  });

  it("pre-fills TR name field from sector.name.tr", () => {
    render(<SectorForm sector={sector} action={async () => {}} />);
    expect(screen.getByDisplayValue("Cam Yıkama")).toBeInTheDocument();
  });

  it("renders display_order input + active checkbox", () => {
    render(<SectorForm sector={sector} action={async () => {}} />);
    expect(screen.getByLabelText(/Sıra/i)).toHaveValue(10);
    expect(screen.getByLabelText(/Aktif/i)).toBeChecked();
  });
});
