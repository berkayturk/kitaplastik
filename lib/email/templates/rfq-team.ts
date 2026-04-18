export interface RfqTeamInput {
  id: string;
  type: "custom" | "standart";
  locale: string;
  contact: { name: string; email: string; company: string; phone: string; country?: string };
  payload: Record<string, unknown>;
  attachmentCount: number;
  ip: string;
  adminUrl: string;
}

export function renderRfqTeamEmail(i: RfqTeamInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Web-RFQ-${i.type === "custom" ? "Ozel" : "Standart"}] ${i.contact.company} — ${i.contact.name}`;
  const payloadJson = JSON.stringify(i.payload, null, 2);
  const text = [
    `Yeni ${i.type} RFQ`,
    `Admin: ${i.adminUrl}`,
    ``,
    `Firma: ${i.contact.company}`,
    `İletişim: ${i.contact.name} <${i.contact.email}>`,
    `Telefon: ${i.contact.phone}`,
    i.contact.country ? `Ülke: ${i.contact.country}` : null,
    `Dil: ${i.locale}`,
    `IP: ${i.ip}`,
    `Ek sayısı: ${i.attachmentCount}`,
    ``,
    `Payload:`,
    payloadJson,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
  const html = `
<!doctype html><meta charset="utf-8">
<h2 style="font-family:system-ui">Yeni ${i.type === "custom" ? "Özel Üretim" : "Standart Ürün"} RFQ</h2>
<p><a href="${esc(i.adminUrl)}">Admin panelinde aç →</a></p>
<table style="font-family:system-ui;font-size:14px">
  <tr><td><b>Firma</b></td><td>${esc(i.contact.company)}</td></tr>
  <tr><td><b>İletişim</b></td><td>${esc(i.contact.name)} &lt;${esc(i.contact.email)}&gt;</td></tr>
  <tr><td><b>Telefon</b></td><td>${esc(i.contact.phone)}</td></tr>
  ${i.contact.country ? `<tr><td><b>Ülke</b></td><td>${esc(i.contact.country)}</td></tr>` : ""}
  <tr><td><b>Dil</b></td><td>${esc(i.locale)}</td></tr>
  <tr><td><b>IP</b></td><td>${esc(i.ip)}</td></tr>
  <tr><td><b>Ek</b></td><td>${i.attachmentCount}</td></tr>
</table>
<pre style="font-family:ui-monospace;font-size:12px;background:#f4f5f8;padding:12px;white-space:pre-wrap">${esc(payloadJson)}</pre>`.trim();
  return { subject, html, text };
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
