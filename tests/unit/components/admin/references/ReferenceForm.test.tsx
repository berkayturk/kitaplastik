import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Stub supabase/client to avoid jsdom env validation errors (Wave 6a pattern)
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
      }),
    },
  }),
}));

import { ReferenceForm } from "@/components/admin/references/ReferenceForm";

const sectors = [
  {
    id: "s1",
    slug: "cam-yikama",
    name: { tr: "Cam Yıkama" },
    description: null,
    long_description: null,
    meta_title: null,
    meta_description: null,
    hero_image: null,
    hero_color: "#fff",
    display_order: 10,
    active: true,
    created_at: "",
    updated_at: "",
  },
];

describe("ReferenceForm", () => {
  it("create mode: key field editable", () => {
    render(
      <ReferenceForm
        mode="create"
        sectors={sectors as any}
        initial={null}
        defaultDisplayOrder={100}
        action={async () => {}}
      />,
    );
    const keyInput = screen.getByLabelText(/Anahtar/i);
    expect(keyInput).not.toBeDisabled();
  });

  it("edit mode: key field disabled", () => {
    render(
      <ReferenceForm
        mode="edit"
        sectors={sectors as any}
        initial={
          {
            id: "r1",
            key: "c1",
            display_name: null,
            logo_path: "/references/c1.svg",
            sector_id: "s1",
            sector_key: "camYikama",
            display_order: 10,
            active: true,
            created_at: "",
          } as any
        }
        defaultDisplayOrder={0}
        action={async () => {}}
      />,
    );
    const keyInput = screen.getByLabelText(/Anahtar/i);
    expect(keyInput).toBeDisabled();
  });

  it("renders 4 locale tabs for display_name", () => {
    render(
      <ReferenceForm
        mode="create"
        sectors={sectors as any}
        initial={null}
        defaultDisplayOrder={0}
        action={async () => {}}
      />,
    );
    expect(screen.getByRole("tab", { name: /TR/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /RU/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /AR/i })).toBeInTheDocument();
  });
});
