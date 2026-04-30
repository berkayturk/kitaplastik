import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferenceList } from "@/components/admin/references/ReferenceList";

const active = [
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
  },
];
const deleted = [
  {
    id: "r2",
    key: "c2",
    display_name: null,
    logo_path: "/references/c2.svg",
    sector_id: "s1",
    sector_key: "otomotiv",
    display_order: 20,
    active: false,
    created_at: "",
  },
];
const sectors: Record<string, string> = { s1: "Cam Yıkama" };

describe("ReferenceList", () => {
  it("shows Aktif + Silinmiş tab counts", () => {
    render(
      <ReferenceList
        activeRefs={active as any}
        deletedRefs={deleted as any}
        sectors={sectors}
        actions={{
          softDelete: async () => {},
          restore: async () => {},
          hardDelete: async () => {},
          moveUp: async () => {},
          moveDown: async () => {},
        }}
      />,
    );
    expect(screen.getByText(/Aktif \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Silinmiş \(1\)/)).toBeInTheDocument();
  });

  it("renders + Yeni button", () => {
    render(
      <ReferenceList
        activeRefs={[]}
        deletedRefs={[]}
        sectors={sectors}
        actions={{
          softDelete: async () => {},
          restore: async () => {},
          hardDelete: async () => {},
          moveUp: async () => {},
          moveDown: async () => {},
        }}
      />,
    );
    expect(screen.getByRole("link", { name: /Yeni/i })).toHaveAttribute(
      "href",
      "/admin/references/new",
    );
  });

  it("empty active state: shows helpful message", () => {
    render(
      <ReferenceList
        activeRefs={[]}
        deletedRefs={[]}
        sectors={sectors}
        actions={{
          softDelete: async () => {},
          restore: async () => {},
          hardDelete: async () => {},
          moveUp: async () => {},
          moveDown: async () => {},
        }}
      />,
    );
    expect(screen.getByText(/Henüz referans yok/i)).toBeInTheDocument();
  });
});
