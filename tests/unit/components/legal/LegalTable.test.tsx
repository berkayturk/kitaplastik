import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalTable } from "@/components/legal/LegalTable";

describe("LegalTable", () => {
  const cols = { name: "İsim", purpose: "Amaç", duration: "Süre" };
  const rows = [
    { name: "NEXT_LOCALE", purpose: "Locale tercihi", duration: "1 yıl" },
    { name: "__cf_bm", purpose: "Bot mgmt", duration: "30 dk" },
  ];

  it("renders <caption> sr-only with provided text", () => {
    render(<LegalTable caption="Çerez Envanteri" cols={cols} rows={rows} />);
    const caption = screen.getByText("Çerez Envanteri");
    expect(caption.tagName.toLowerCase()).toBe("caption");
    expect(caption).toHaveClass("sr-only");
  });

  it("renders all column headers as <th scope='col'>", () => {
    render(<LegalTable caption="x" cols={cols} rows={rows} />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    for (const h of screen.getAllByRole("columnheader")) {
      expect(h.getAttribute("scope")).toBe("col");
    }
  });

  it("renders all row cells in document order matching cols keys", () => {
    render(<LegalTable caption="x" cols={cols} rows={rows} />);
    expect(screen.getByText("NEXT_LOCALE")).toBeInTheDocument();
    expect(screen.getByText("Locale tercihi")).toBeInTheDocument();
    expect(screen.getByText("1 yıl")).toBeInTheDocument();
    expect(screen.getByText("__cf_bm")).toBeInTheDocument();
  });
});
