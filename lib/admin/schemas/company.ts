import { z } from "zod";

const TEL_E164 = /^\+[0-9]{10,15}$/;
const WA_RE = /^[0-9]{10,15}$/;
const ISO2_RE = /^[A-Z]{2}$/;
const HANDLE_RE = /^[a-zA-Z0-9_]+$/;

const httpsUrl = z
  .string()
  .url()
  .max(500)
  .refine(
    (u) => {
      try {
        return new URL(u).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "https required" },
  );

const mapsUrl = httpsUrl.refine(
  (u) => {
    try {
      const host = new URL(u).hostname;
      return host === "www.google.com" || host === "maps.google.com" || host === "goo.gl";
    } catch {
      return false;
    }
  },
  { message: "must be a Google Maps URL" },
);

const addressSchema = z.object({
  street: z.string().min(2).max(200),
  district: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  countryCode: z.string().regex(ISO2_RE),
  maps: mapsUrl,
});

const phoneSchema = z.object({
  display: z.string().min(10).max(30),
  tel: z.string().regex(TEL_E164),
});

const faxSchema = z.object({
  display: z.string().min(10).max(30),
});

const emailSchema = z.object({
  primary: z.string().email(),
  secondary: z.string().email(),
});

const whatsappSchema = z.object({
  display: z.string().min(10).max(30),
  wa: z.string().regex(WA_RE),
});

const telegramSchema = z.object({
  handle: z.string().min(2).max(50).regex(HANDLE_RE),
  display: z.string().min(2).max(50),
});

const webSchema = z.object({
  primary: httpsUrl,
  alt: httpsUrl,
});

export const CompanySchema = z.object({
  legalName: z.string().min(2).max(200),
  brandName: z.string().min(2).max(100),
  shortName: z.string().min(2).max(20),
  founded: z.number().int().min(1900).max(new Date().getFullYear()),
  address: addressSchema,
  phone: phoneSchema,
  cellPhone: phoneSchema,
  fax: faxSchema,
  email: emailSchema,
  whatsapp: whatsappSchema,
  telegram: telegramSchema,
  web: webSchema,
});

export type Company = z.infer<typeof CompanySchema>;
