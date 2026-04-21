import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SpecBuilder } from "@/components/admin/products/SpecBuilder";

describe("SpecBuilder", () => {
  it("boş state: preset dropdown göster, satır yok", () => {
    render(<SpecBuilder value={[]} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /özellik ekle/i })).toBeInTheDocument();
    expect(screen.queryByRole("row")).not.toBeInTheDocument();
  });

  it("preset eklendikten sonra dropdown'da o preset disabled", () => {
    const onChange = vi.fn();
    render(<SpecBuilder value={[{ preset_id: "material", value: "PET" }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /özellik ekle/i }));
    const materialOpt = screen.getByRole("menuitem", { name: /malzeme/i });
    expect(materialOpt).toBeDisabled();
  });

  it("silme butonu o satırı kaldırır", () => {
    const onChange = vi.fn();
    render(<SpecBuilder value={[{ preset_id: "material", value: "PET" }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /sil/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("aşağı ok iki satırı swap eder", () => {
    const onChange = vi.fn();
    render(
      <SpecBuilder
        value={[
          { preset_id: "material", value: "PET" },
          { preset_id: "dimension", value: "28 mm" },
        ]}
        onChange={onChange}
      />,
    );
    const rows = screen.getAllByRole("row");
    const firstRow = rows[0];
    if (!firstRow) throw new Error("first row missing");
    fireEvent.click(within(firstRow).getByRole("button", { name: /aşağı/i }));
    expect(onChange).toHaveBeenCalledWith([
      { preset_id: "dimension", value: "28 mm" },
      { preset_id: "material", value: "PET" },
    ]);
  });
});
