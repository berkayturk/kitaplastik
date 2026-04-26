import { describe, it, expect } from "vitest";
import { renderContactTeamEmail } from "@/lib/email/templates/contact-team";
import { renderContactCustomerEmail } from "@/lib/email/templates/contact-customer";
import { renderCatalogDeliveryEmail } from "@/lib/email/templates/catalog-delivery";

describe("email templates", () => {
  it("contact team: escapes HTML in name/message", () => {
    const r = renderContactTeamEmail({
      name: "<img onerror=x>",
      email: "a@b.com",
      company: "",
      phone: "",
      subject: "Teklif",
      message: "<script>alert(1)</script>",
      locale: "tr",
    });
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
    expect(r.text).toContain("alert(1)");
  });

  it("contact team: omits IP entirely (Plan 5b data minimization)", () => {
    const r = renderContactTeamEmail({
      name: "Ali",
      email: "a@b.com",
      subject: "quote",
      message: "Hello world test",
      locale: "tr",
    });
    expect(r.html).not.toMatch(/<b>IP<\/b>/i);
    expect(r.text).not.toMatch(/^IP:/m);
  });

  it("contact customer: localizes subject for all 4 locales", () => {
    for (const loc of ["tr", "en", "ru", "ar"] as const) {
      const r = renderContactCustomerEmail({ name: "Ali", locale: loc });
      expect(r.subject).toBeTruthy();
      expect(r.html).toContain("Ali");
    }
  });

  it("contact customer: includes English italic secondary for non-EN locales", () => {
    const tr = renderContactCustomerEmail({ name: "Ali", locale: "tr" });
    expect(tr.html).toContain("font-style:italic");
    expect(tr.html).toContain("Dear Ali");
    const en = renderContactCustomerEmail({ name: "Ali", locale: "en" });
    // EN primary = EN secondary; no redundant italic block expected.
    expect(en.html).not.toContain("font-style:italic");
  });

  it("catalog delivery: embeds the locale-specific PDF URL", () => {
    for (const loc of ["tr", "en", "ru", "ar"] as const) {
      const r = renderCatalogDeliveryEmail({
        email: "a@b.com",
        locale: loc,
        pdfUrl: `https://kitaplastik.com/catalogs/kitaplastik-${loc}.pdf`,
      });
      expect(r.subject).toBeTruthy();
      expect(r.html).toContain(`kitaplastik-${loc}.pdf`);
      expect(r.text).toContain(`kitaplastik-${loc}.pdf`);
    }
  });

  it("catalog delivery: RTL direction for Arabic", () => {
    const ar = renderCatalogDeliveryEmail({
      email: "a@b.com",
      locale: "ar",
      pdfUrl: "https://x/a.pdf",
    });
    expect(ar.html).toContain('dir="rtl"');
  });
});
