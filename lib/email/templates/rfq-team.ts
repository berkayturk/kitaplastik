// lib/email/templates/rfq-team.ts
//
// Team notification for new RFQs. TR-only: admin panel and team are Turkish.
// Structured HTML tables for human readability; raw JSON at bottom as
// collapsible-emulated detail for debugging.

import { formatRfqPayload, type FieldEntry } from "@/lib/admin/rfq-format";

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
  const typeLabel = i.type === "custom" ? "Özel Üretim" : "Standart Ürün";
  const subject = `[Web-RFQ-${i.type === "custom" ? "Ozel" : "Standart"}] ${i.contact.company} — ${i.contact.name}`;

  const payloadEntries = formatRfqPayload(i.type, i.payload);

  const text = renderText(i, typeLabel, payloadEntries);
  const html = renderHtml(i, typeLabel, payloadEntries);

  return { subject, html, text };
}

function renderText(i: RfqTeamInput, typeLabel: string, payloadEntries: FieldEntry[]): string {
  const lines = [
    `Yeni ${typeLabel} RFQ`,
    `Admin paneli: ${i.adminUrl}`,
    ``,
    `—— İletişim ——`,
    `Firma:     ${i.contact.company}`,
    `Ad Soyad:  ${i.contact.name}`,
    `E-posta:   ${i.contact.email}`,
    `Telefon:   ${i.contact.phone}`,
    i.contact.country ? `Ülke:      ${i.contact.country}` : null,
    ``,
    `—— Meta ——`,
    `Form dili: ${i.locale}`,
    `IP:        ${i.ip}`,
    `Ek sayısı: ${i.attachmentCount}`,
    ``,
    `—— Form Verisi ——`,
    ...payloadEntries.map((e) => {
      if (e.kind === "longtext") {
        return `${e.label}:\n${e.value}`;
      }
      return `${e.label}: ${e.value}`;
    }),
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}

function renderHtml(i: RfqTeamInput, typeLabel: string, payloadEntries: FieldEntry[]): string {
  const shortEntries = payloadEntries.filter((e) => !e.fullWidth);
  const longEntries = payloadEntries.filter((e) => e.fullWidth);

  const contactRows: ReadonlyArray<readonly [string, string]> = [
    ["Firma", esc(i.contact.company)],
    ["Ad Soyad", esc(i.contact.name)],
    [
      "E-posta",
      `<a href="mailto:${esc(i.contact.email)}" style="color:#1E4DD8;text-decoration:none">${esc(i.contact.email)}</a>`,
    ],
    [
      "Telefon",
      i.contact.phone
        ? `<a href="tel:${esc(i.contact.phone)}" style="color:#1E4DD8;text-decoration:none">${esc(i.contact.phone)}</a>`
        : "—",
    ],
    ...(i.contact.country
      ? [["Ülke", esc(i.contact.country)] as const satisfies readonly [string, string]]
      : []),
  ];

  const metaRows: ReadonlyArray<readonly [string, string]> = [
    ["Form dili", esc(i.locale)],
    ["IP adresi", esc(i.ip)],
    ["Ek sayısı", String(i.attachmentCount)],
  ];

  return `
<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${esc(subject(i.type, i.contact))}</title>
</head>
<body style="margin:0;padding:24px;background-color:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A0F1E;line-height:1.5">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background-color:#FFFFFF;border:1px solid #E5E4E0;border-radius:8px;overflow:hidden">
    <tr>
      <td style="padding:28px 32px 20px;border-bottom:1px solid #E5E4E0">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1E4DD8;font-weight:600">
          Yeni RFQ · ${esc(typeLabel)}
        </div>
        <h1 style="margin:8px 0 4px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#0A0F1E">
          ${esc(i.contact.company)}
        </h1>
        <p style="margin:0;font-size:14px;color:#56616D">${esc(i.contact.name)}</p>
      </td>
    </tr>

    <tr>
      <td style="padding:16px 32px 0">
        <a href="${esc(i.adminUrl)}" style="display:inline-block;padding:10px 18px;background-color:#1E4DD8;color:#FFFFFF;text-decoration:none;border-radius:4px;font-size:14px;font-weight:500">
          Admin panelinde aç →
        </a>
      </td>
    </tr>

    ${sectionHtml("İletişim", tableRowsHtml(contactRows))}
    ${
      shortEntries.length > 0
        ? sectionHtml(
            "Form Verisi",
            tableRowsHtml(shortEntries.map((e) => [e.label, formatHtmlValue(e)])),
          )
        : ""
    }
    ${longEntries
      .map(
        (e) => `
    <tr>
      <td style="padding:20px 32px 0">
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#56616D;font-weight:600;margin-bottom:8px">
          ${esc(e.label)}
        </div>
        <div style="padding:14px 16px;background-color:#FAFAF7;border:1px solid #E5E4E0;border-radius:4px;font-size:14px;white-space:pre-wrap;color:#0A0F1E">
          ${esc(e.value)}
        </div>
      </td>
    </tr>`,
      )
      .join("")}
    ${sectionHtml("Meta Bilgiler", tableRowsHtml(metaRows))}

    <tr>
      <td style="padding:24px 32px 28px;color:#8A95A1;font-size:11px;border-top:1px solid #E5E4E0">
        Bu e-posta Kıta Plastik web sitesi üzerinden otomatik olarak gönderildi.
        RFQ kimliği: <code style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${esc(i.id)}</code>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function subject(type: "custom" | "standart", contact: { company: string; name: string }): string {
  return `[Web-RFQ-${type === "custom" ? "Ozel" : "Standart"}] ${contact.company} — ${contact.name}`;
}

function sectionHtml(title: string, innerRows: string): string {
  return `
    <tr>
      <td style="padding:20px 32px 0">
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#1E4DD8;font-weight:600;margin-bottom:10px">
          ${esc(title)}
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse">
          ${innerRows}
        </table>
      </td>
    </tr>`;
}

function tableRowsHtml(rows: ReadonlyArray<readonly [string, string]>): string {
  return rows
    .map(
      ([label, value]) => `
          <tr>
            <td style="padding:6px 0;vertical-align:top;width:35%;color:#56616D;font-size:13px">${esc(label)}</td>
            <td style="padding:6px 0;vertical-align:top;color:#0A0F1E;font-size:14px;font-weight:500">${value}</td>
          </tr>`,
    )
    .join("");
}

function formatHtmlValue(entry: FieldEntry): string {
  if (entry.kind === "chips") {
    return entry.value
      .split(",")
      .map(
        (chip) =>
          `<span style="display:inline-block;padding:2px 8px;margin:0 4px 4px 0;background-color:#EAF0FC;color:#1E4DD8;border-radius:3px;font-size:12px;font-weight:500">${esc(chip.trim())}</span>`,
      )
      .join("");
  }
  if (entry.kind === "boolean") {
    if (entry.value === "Evet") {
      return `<span style="display:inline-block;padding:2px 8px;background-color:#E5F5EF;color:#0FA37F;border-radius:3px;font-size:12px;font-weight:600">Evet</span>`;
    }
    return `<span style="color:#56616D">${esc(entry.value)}</span>`;
  }
  return esc(entry.value);
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
