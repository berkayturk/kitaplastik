// lib/email/templates/catalog-delivery.ts
//
// Deliver the catalog PDF to the user by email. Primary text in the user's
// chosen locale; small italic English translation beneath each paragraph
// (skipped when locale === "en"). Includes a cobalt download button.

export interface CatalogDeliveryInput {
  email: string;
  locale: "tr" | "en" | "ru" | "ar";
  pdfUrl: string;
}

interface Block {
  subject: string;
  greeting: string;
  body: string;
  button: string;
  fallback: string; // "If the button doesn't work, copy this link:"
  sig: string;
}

const MSG: Record<CatalogDeliveryInput["locale"], Block> = {
  tr: {
    subject: "Kıta Plastik katalogu — indirme bağlantınız",
    greeting: "Merhaba,",
    body: "Talep ettiğiniz Kıta Plastik katalogunu aşağıdaki bağlantıdan indirebilirsiniz.",
    button: "Katalogu İndir (PDF)",
    fallback: "Buton çalışmazsa aşağıdaki bağlantıyı kopyalayın:",
    sig: "Saygılarımızla,\nKıta Plastik Ekibi",
  },
  en: {
    subject: "Kıta Plastik catalog — your download link",
    greeting: "Hello,",
    body: "You can download the Kıta Plastik catalog you requested using the link below.",
    button: "Download Catalog (PDF)",
    fallback: "If the button doesn't work, copy the link below:",
    sig: "Best regards,\nKıta Plastik Team",
  },
  ru: {
    subject: "Каталог Kıta Plastik — ваша ссылка для скачивания",
    greeting: "Здравствуйте,",
    body: "Вы можете скачать каталог Kıta Plastik по ссылке ниже.",
    button: "Скачать каталог (PDF)",
    fallback: "Если кнопка не работает, скопируйте ссылку ниже:",
    sig: "С уважением,\nКоманда Kıta Plastik",
  },
  ar: {
    subject: "كتالوج Kıta Plastik — رابط التنزيل الخاص بك",
    greeting: "مرحباً،",
    body: "يمكنك تنزيل كتالوج Kıta Plastik الذي طلبته من الرابط أدناه.",
    button: "تنزيل الكتالوج (PDF)",
    fallback: "إذا لم يعمل الزر، انسخ الرابط أدناه:",
    sig: "مع التحية،\nفريق Kıta Plastik",
  },
};

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

export function renderCatalogDeliveryEmail(i: CatalogDeliveryInput): {
  subject: string;
  html: string;
  text: string;
} {
  const primary = MSG[i.locale];
  const english = MSG.en;
  const isEn = i.locale === "en";
  const dir = i.locale === "ar" ? "rtl" : "ltr";

  const textParts = [
    primary.greeting,
    ...(isEn ? [] : [`(${english.greeting})`]),
    "",
    primary.body,
    ...(isEn ? [] : [`(${english.body})`]),
    "",
    i.pdfUrl,
    "",
    primary.sig,
    ...(isEn ? [] : [`(${english.sig})`]),
  ];
  const text = textParts.join("\n");

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
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1E4DD8;font-weight:600;margin-bottom:20px">
            Kıta Plastik
          </div>

          <p style="${primaryStyle}">${esc(primary.greeting)}</p>
          ${isEn ? "" : `<p dir="ltr" style="${enStyle}">${esc(english.greeting)}</p>`}

          <p style="${primaryStyle};margin-top:16px">${esc(primary.body)}</p>
          ${isEn ? "" : `<p dir="ltr" style="${enStyle}">${esc(english.body)}</p>`}

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0">
            <tr><td style="background:#1E4DD8;border-radius:4px">
              <a href="${esc(i.pdfUrl)}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px">
                ${esc(primary.button)}
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:12px;color:#56616D">${esc(primary.fallback)}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#1E4DD8;word-break:break-all">
            <a href="${esc(i.pdfUrl)}" style="color:#1E4DD8;text-decoration:underline">${esc(i.pdfUrl)}</a>
          </p>

          <p style="${sigStyle};margin-top:28px">${nl2br(primary.sig)}</p>
          ${isEn ? "" : `<p dir="ltr" style="${enSigStyle}">${nl2br(english.sig)}</p>`}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  return { subject: primary.subject, html, text };
}
