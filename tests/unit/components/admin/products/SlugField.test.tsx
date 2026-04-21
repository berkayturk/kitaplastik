import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlugField } from "@/components/admin/products/SlugField";

describe("SlugField", () => {
  it("create mode'da readonly canlı preview gösterir", () => {
    render(<SlugField mode="create" initialSlug="" previewFromName="PET Kapak 28 mm" />);
    const input = screen.getByLabelText(/URL/i) as HTMLInputElement;
    expect(input.value).toBe("pet-kapak-28-mm");
    expect(input.readOnly).toBe(true);
  });

  it("edit mode default kilitli (readonly) + toggle kapalı", () => {
    render(<SlugField mode="edit" initialSlug="pet-kapak" />);
    const input = screen.getByLabelText(/URL/i) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(screen.queryByText(/URL değişir/i)).not.toBeInTheDocument();
  });

  it("edit mode'da toggle açılınca input editable + uyarı gösterilir", () => {
    render(<SlugField mode="edit" initialSlug="pet-kapak" />);
    fireEvent.click(screen.getByRole("button", { name: /slug'ı düzenle/i }));
    const input = screen.getByLabelText(/URL/i) as HTMLInputElement;
    expect(input.readOnly).toBe(false);
    expect(screen.getByText(/URL değişir/i)).toBeInTheDocument();
  });
});
