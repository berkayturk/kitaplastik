export interface ContactTeamInput {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  locale: string;
  ip: string;
}

export function renderContactTeamEmail(input: ContactTeamInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Web-Contact] ${input.subject} — ${input.name}`;
  const text = [
    `Yeni iletişim formu mesajı`,
    ``,
    `Ad: ${input.name}`,
    input.company ? `Firma: ${input.company}` : null,
    `E-posta: ${input.email}`,
    input.phone ? `Telefon: ${input.phone}` : null,
    `Konu: ${input.subject}`,
    `Dil: ${input.locale}`,
    `IP: ${input.ip}`,
    ``,
    `Mesaj:`,
    input.message,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const html = `
<!doctype html><meta charset="utf-8">
<h2 style="font-family:system-ui;color:#0a1628">Yeni iletişim formu mesajı</h2>
<table style="font-family:system-ui;font-size:14px;color:#0a1628">
  <tr><td><b>Ad</b></td><td>${escapeHtml(input.name)}</td></tr>
  ${input.company ? `<tr><td><b>Firma</b></td><td>${escapeHtml(input.company)}</td></tr>` : ""}
  <tr><td><b>E-posta</b></td><td><a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></td></tr>
  ${input.phone ? `<tr><td><b>Telefon</b></td><td>${escapeHtml(input.phone)}</td></tr>` : ""}
  <tr><td><b>Konu</b></td><td>${escapeHtml(input.subject)}</td></tr>
  <tr><td><b>Dil</b></td><td>${escapeHtml(input.locale)}</td></tr>
  <tr><td><b>IP</b></td><td>${escapeHtml(input.ip)}</td></tr>
</table>
<hr>
<pre style="white-space:pre-wrap;font-family:system-ui;font-size:14px">${escapeHtml(input.message)}</pre>`.trim();

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
