import { describe, it, expect } from "vitest";
import { renderContactTeamEmail } from "@/lib/email/templates/contact-team";
import { renderContactCustomerEmail } from "@/lib/email/templates/contact-customer";
import { renderRfqTeamEmail } from "@/lib/email/templates/rfq-team";
import { renderRfqCustomerEmail } from "@/lib/email/templates/rfq-customer";

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
      ip: "1.1.1.1",
    });
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
    expect(r.text).toContain("alert(1)");
  });

  it("contact customer: localizes subject for all 4 locales", () => {
    for (const loc of ["tr", "en", "ru", "ar"] as const) {
      const r = renderContactCustomerEmail({ name: "Ali", locale: loc });
      expect(r.subject).toBeTruthy();
      expect(r.html).toContain("Ali");
    }
  });

  it("rfq team: includes admin URL as anchor", () => {
    const r = renderRfqTeamEmail({
      id: "abc",
      type: "custom",
      locale: "tr",
      contact: { name: "N", email: "n@x.com", company: "C", phone: "+90" },
      payload: { description: "test" },
      attachmentCount: 2,
      ip: "0",
      adminUrl: "https://site/admin/inbox/abc",
    });
    expect(r.html).toContain("https://site/admin/inbox/abc");
    expect(r.subject).toContain("Ozel");
  });

  it("rfq customer: subject includes short id", () => {
    const r = renderRfqCustomerEmail({
      name: "Ali",
      rfqId: "11111111-aaaa-bbbb-cccc-222222222222",
      type: "custom",
      locale: "en",
    });
    expect(r.subject).toContain("11111111");
  });
});
