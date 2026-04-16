import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectorGrid } from "@/components/home/SectorGrid";

describe("SectorGrid", () => {
  it("3 sektör kartını render eder", () => {
    render(<SectorGrid />);
    expect(screen.getByText(/^cam yıkama$/i)).toBeInTheDocument();
    expect(screen.getByText(/^kapak$/i)).toBeInTheDocument();
    expect(screen.getByText(/^tekstil$/i)).toBeInTheDocument();
  });

  it("her kart bir Link içerir", () => {
    render(<SectorGrid />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
  });
});
