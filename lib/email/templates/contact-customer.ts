export interface ContactCustomerInput {
  name: string;
  locale: "tr" | "en" | "ru" | "ar";
}

const MESSAGES = {
  tr: {
    subject: "Mesajınızı aldık — Kıta Plastik",
    greeting: (n: string) => `Sayın ${n},`,
    body: "Mesajınız için teşekkür ederiz. Ekibimiz en kısa sürede (1-2 iş günü içinde) size dönüş yapacaktır.",
    sig: "Saygılarımızla,\nKıta Plastik Ekibi",
  },
  en: {
    subject: "We received your message — Kıta Plastik",
    greeting: (n: string) => `Dear ${n},`,
    body: "Thank you for your message. Our team will get back to you shortly (within 1-2 business days).",
    sig: "Best regards,\nKıta Plastik Team",
  },
  ru: {
    subject: "Мы получили ваше сообщение — Kıta Plastik",
    greeting: (n: string) => `Уважаемый(ая) ${n},`,
    body: "Спасибо за ваше сообщение. Наша команда свяжется с вами в ближайшее время (в течение 1-2 рабочих дней).",
    sig: "С уважением,\nКоманда Kıta Plastik",
  },
  ar: {
    subject: "تم استلام رسالتك — Kıta Plastik",
    greeting: (n: string) => `عزيزي ${n}،`,
    body: "شكرًا لرسالتك. سيتواصل معك فريقنا قريبًا (خلال 1-2 أيام عمل).",
    sig: "مع التحية،\nفريق Kıta Plastik",
  },
} as const;

export function renderContactCustomerEmail(input: ContactCustomerInput): {
  subject: string;
  html: string;
  text: string;
} {
  const m = MESSAGES[input.locale];
  const text = `${m.greeting(input.name)}\n\n${m.body}\n\n${m.sig}`;
  const html = `
<!doctype html><meta charset="utf-8">
<div style="font-family:system-ui;font-size:15px;color:#0a1628;line-height:1.55;max-width:560px">
  <p>${m.greeting(input.name)}</p>
  <p>${m.body}</p>
  <p style="white-space:pre-line">${m.sig}</p>
</div>`.trim();
  return { subject: m.subject, html, text };
}
