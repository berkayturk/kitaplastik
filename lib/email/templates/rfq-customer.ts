export interface RfqCustomerInput {
  name: string;
  rfqId: string;
  type: "custom" | "standart";
  locale: "tr" | "en" | "ru" | "ar";
}

const MSG = {
  tr: {
    subject: (id: string) => `Teklif talebinizi aldık (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `Sayın ${n},`,
    body: "Teklif talebiniz tarafımıza ulaşmıştır. Ekibimiz detayları inceleyip en kısa sürede dönüş yapacaktır.",
    sig: "Saygılarımızla,\nKıta Plastik Ekibi",
  },
  en: {
    subject: (id: string) => `Quote request received (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `Dear ${n},`,
    body: "We have received your quote request. Our engineering team will review and get back to you shortly.",
    sig: "Best regards,\nKıta Plastik Team",
  },
  ru: {
    subject: (id: string) => `Запрос на расчёт получен (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `Уважаемый(ая) ${n},`,
    body: "Мы получили ваш запрос. Наша инженерная команда рассмотрит детали и свяжется с вами в ближайшее время.",
    sig: "С уважением,\nКоманда Kıta Plastik",
  },
  ar: {
    subject: (id: string) => `تم استلام طلب عرض السعر (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `عزيزي ${n}،`,
    body: "لقد استلمنا طلب عرض السعر الخاص بك. سيقوم فريقنا الهندسي بمراجعة التفاصيل والرد عليك قريبًا.",
    sig: "مع التحية،\nفريق Kıta Plastik",
  },
} as const;

export function renderRfqCustomerEmail(i: RfqCustomerInput): {
  subject: string;
  html: string;
  text: string;
} {
  const m = MSG[i.locale];
  const text = `${m.g(i.name)}\n\n${m.body}\n\n${m.sig}`;
  const html = `
<!doctype html><meta charset="utf-8">
<div style="font-family:system-ui;font-size:15px;color:#0a1628;line-height:1.55;max-width:560px">
  <p>${m.g(i.name)}</p>
  <p>${m.body}</p>
  <p style="white-space:pre-line">${m.sig}</p>
</div>`.trim();
  return { subject: m.subject(i.rfqId), html, text };
}
