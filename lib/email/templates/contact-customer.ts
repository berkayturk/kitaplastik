// lib/email/templates/contact-customer.ts
//
// Contact form acknowledgement. Primary paragraph in the user's locale,
// followed by a small italic English translation beneath each block.
// When locale === "en" the secondary translation is skipped.

export interface ContactCustomerInput {
  name: string;
  locale: "tr" | "en" | "ru" | "ar";
}

interface Block {
  subject: string;
  greeting: string; // uses %NAME%
  body: string;
  sig: string;
}

const MSG: Record<ContactCustomerInput["locale"], Block> = {
  tr: {
    subject: "Mesajınızı aldık — Kıta Plastik",
    greeting: "Sayın %NAME%,",
    body: "Mesajınız için teşekkür ederiz. Ekibimiz en kısa sürede (1-2 iş günü içinde) size dönüş yapacaktır.",
    sig: "Saygılarımızla,\nKıta Plastik Ekibi",
  },
  en: {
    subject: "We received your message — Kıta Plastik",
    greeting: "Dear %NAME%,",
    body: "Thank you for your message. Our team will get back to you shortly (within 1-2 business days).",
    sig: "Best regards,\nKıta Plastik Team",
  },
  ru: {
    subject: "Мы получили ваше сообщение — Kıta Plastik",
    greeting: "Уважаемый(ая) %NAME%,",
    body: "Спасибо за ваше сообщение. Наша команда свяжется с вами в ближайшее время (в течение 1-2 рабочих дней).",
    sig: "С уважением,\nКоманда Kıta Plastik",
  },
  ar: {
    subject: "تم استلام رسالتك — Kıta Plastik",
    greeting: "عزيزي %NAME%،",
    body: "شكرًا لرسالتك. سيتواصل معك فريقنا قريبًا (خلال 1-2 أيام عمل).",
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

export function renderContactCustomerEmail(input: ContactCustomerInput): {
  subject: string;
  html: string;
  text: string;
} {
  const primary = MSG[input.locale];
  const english = MSG.en;
  const isEn = input.locale === "en";
  const dir = input.locale === "ar" ? "rtl" : "ltr";

  const greeting = interpolate(primary.greeting, input.name);
  const greetingEn = interpolate(english.greeting, input.name);
  const body = primary.body;
  const bodyEn = english.body;
  const sig = primary.sig;
  const sigEn = english.sig;

  const textParts = [greeting];
  if (!isEn) textParts.push(`(${greetingEn})`);
  textParts.push("", body);
  if (!isEn) textParts.push(`(${bodyEn})`);
  textParts.push("", sig);
  if (!isEn) textParts.push(`(${sigEn})`);
  const text = textParts.join("\n");

  const enStyle = "font-size:12px;font-style:italic;color:#8A95A1;margin:4px 0 0";
  const primaryStyle = "margin:0;font-size:15px;color:#0A0F1E;line-height:1.55";
  const sigStyle = `${primaryStyle};white-space:pre-line`;
  const enSigStyle = `${enStyle};white-space:pre-line`;

  const html = `
<!doctype html>
<html lang="${input.locale}" dir="${dir}">
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

  return { subject: primary.subject, html, text };
}
