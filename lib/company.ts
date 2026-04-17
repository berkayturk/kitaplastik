// Single source of truth for Kıta Plastik's real-world contact information.
// Source: official business card (captured 2026-04-18).
// When dedicated channels (mobile phone, WhatsApp Business) are activated,
// update the `whatsapp.wa` and `whatsapp.display` fields accordingly.

export const COMPANY = {
  legalName: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
  brandName: "Kıta Plastik",
  shortName: "KITA",
  founded: 1989,
  address: {
    street: "Eski Gemlik Yolu Kadem Sk. No: 37-40",
    district: "Osmangazi",
    city: "Bursa",
    countryCode: "TR",
    maps: "https://www.google.com/maps/search/?api=1&query=K%C4%B1ta+Plastik%2C+Eski+Gemlik+Yolu+Kadem+Sk.+No%3A+37-40%2C+Osmangazi%2C+Bursa",
  },
  phone: {
    display: "+90 224 216 16 94",
    tel: "+902242161694",
  },
  cellPhone: {
    display: "+90 532 237 13 24",
    tel: "+905322371324",
  },
  fax: {
    display: "+90 224 215 05 25",
  },
  email: {
    primary: "info@kitaplastik.com",
    secondary: "kitaplastik@hotmail.com",
  },
  whatsapp: {
    // Placeholder: landline while dedicated WhatsApp Business line is being activated.
    display: "+90 224 216 16 94",
    wa: "905322371324",
  },
  telegram: {
    // Placeholder handle — update once Telegram account is registered.
    // t.me/<handle> (no leading @). Can also be a phone form "+905322371324".
    handle: "kitaplastik",
    display: "@kitaplastik",
  },
  web: {
    primary: "https://www.kitaplastik.com",
    alt: "https://www.kitaplastik.com.tr",
  },
} as const;
