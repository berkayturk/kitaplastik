// lib/email/templates/rfq-customer.ts
//
// RFQ customer acknowledgement. Primary paragraph in the user's locale,
// followed by a small italic English translation beneath each block.
// When locale === "en" the secondary translation is skipped (same text).

export interface RfqCustomerInput {
  name: string;
  rfqId: string;
  type: "custom" | "standart";
  locale: "tr" | "en" | "ru" | "ar";
}

interface Block {
  greeting: string;
  body: string;
  sig: string;
  subject: (id: string) => string;
}

const MSG: Record<RfqCustomerInput["locale"], Block> = {
  tr: {
    subject: (id) => `Teklif talebinizi aldık (#${id.slice(0, 8)}) — Kıta Plastik`,
    greeting: "Sayın %NAME%,",
    body: "Teklif talebiniz tarafımıza ulaşmıştır. Ekibimiz detayları inceleyip en kısa sürede dönüş yapacaktır.",
    sig: "Saygılarımızla,\nKıta Plastik Ekibi",
  },
  en: {
    subject: (id) => `Quote request received (#${id.slice(0, 8)}) — Kıta Plastik`,
    greeting: "Dear %NAME%,",
    body: "We have received your quote request. Our engineering team will review and get back to you shortly.",
    sig: "Best regards,\nKıta Plastik Team",
  },
  ru: {
    subject: (id) => `Запрос на расчёт получен (#${id.slice(0, 8)}) — Kıta Plastik`,
    greeting: "Уважаемый(ая) %NAME%,",
    body: "Мы получили ваш запрос. Наша инженерная команда рассмотрит детали и свяжется с вами в ближайшее время.",
    sig: "С уважением,\nКоманда Kıta Plastik",
  },
  ar: {
    subject: (id) => `تم استلام طلب عرض السعر (#${id.slice(0, 8)}) — Kıta Plastik`,
    greeting: "عزيزي %NAME%،",
    body: "لقد استلمنا طلب عرض السعر الخاص بك. سيقوم فريقنا الهندسي بمراجعة التفاصيل والرد عليك قريبًا.",
    sig: "مع التحية،\nفريق Kıta Plastik",
  },
};

function interpolate(template: string, name: string): string {
  return template.replace(/%NAME%/g, name);
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

export function renderRfqCustomerEmail(i: RfqCustomerInput): {
  subject: string;
  html: string;
  text: string;
} {
  const primary = MSG[i.locale];
  const english = MSG.en;
  const isEn = i.locale === "en";
  const dir = i.locale === "ar" ? "rtl" : "ltr";

  const greeting = interpolate(primary.greeting, i.name);
  const greetingEn = interpolate(english.greeting, i.name);
  const body = primary.body;
  const bodyEn = english.body;
  const sig = primary.sig;
  const sigEn = english.sig;

  // Plain-text version: primary, blank line, italic marker for EN block.
  const textParts = [greeting];
  if (!isEn) textParts.push(`(${greetingEn})`);
  textParts.push("", body);
  if (!isEn) textParts.push(`(${bodyEn})`);
  textParts.push("", sig);
  if (!isEn) textParts.push(`(${sigEn})`);
  const text = textParts.join("\n");

  // HTML: small italic muted EN translation under each paragraph.
  const enStyle = "font-size:12px;font-style:italic;color:#8A95A1;margin:4px 0 0";
  const primaryStyle = "margin:0;font-size:15px;color:#0A0F1E;line-height:1.55";
  const sigStyle = `${primaryStyle};white-space:pre-line`;
  const enSigStyle = `${enStyle};white-space:pre-line`;

  const html = `
<!doctype html>
<html lang="${i.locale}" dir="${dir}">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F3F2EF">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#F3F2EF">
    <tr><td style="padding:24px">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E4E0;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="padding:28px 32px">
          <p style="${primaryStyle}">${esc(greeting)}</p>
          ${isEn ? "" : `<p dir="ltr" style="${enStyle}">${esc(greetingEn)}</p>`}

          <p style="${primaryStyle};margin-top:16px">${esc(body)}</p>
          ${isEn ? "" : `<p dir="ltr" style="${enStyle}">${esc(bodyEn)}</p>`}

          <p style="${sigStyle};margin-top:20px">${nl2br(sig)}</p>
          ${isEn ? "" : `<p dir="ltr" style="${enSigStyle}">${nl2br(sigEn)}</p>`}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  return { subject: primary.subject(i.rfqId), html, text };
}
