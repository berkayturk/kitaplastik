// app/design-debug/page.tsx
// Internal render verification for the Refined Industrial (Light) design system.
// Production-guarded: returns 404 in production, renders in dev/preview.

import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Button,
  Badge,
  Card,
  CardEyebrow,
  CardTitle,
  CardBody,
  CardFooter,
  Divider,
  TextField,
  TextArea,
  SelectField,
  Checkbox,
} from "@/components/ui";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DesignDebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <main className="px-8 py-20">
      <div className="mx-auto max-w-6xl">
        <PageHeader />
        <ColorsSection />
        <TypographySection />
        <DiacriticsSection />
        <RadiiSection />
        <ShadowsSection />
        <ButtonsSection />
        <BadgesSection />
        <CardsSection />
        <FormsSection />
        <ContrastSection />
      </div>
    </main>
  );
}

/* -------------------------------- Header -------------------------------- */

function PageHeader() {
  return (
    <header className="pb-16">
      <p className="eyebrow">2026-04-18 · Phase 1 · Refined Industrial (Light)</p>
      <h1
        className="font-display text-text-primary mt-6 text-[72px] leading-[1.05] font-medium tracking-[-0.02em]"
        style={{ fontOpticalSizing: "auto" }}
      >
        Design debug
      </h1>
      <p className="text-text-secondary mt-6 max-w-2xl text-[18px] leading-[1.6]">
        Internal render verification for the new design system. Shows every token, font scale, and
        interaction state.{" "}
        <strong className="text-text-primary">Not part of the production site</strong> — delete this
        route before the redesign branch merges to main.
      </p>
    </header>
  );
}

/* -------------------------------- Layout helpers ------------------------ */

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--color-border-hairline)] py-16">
      <header className="mb-10 flex items-baseline gap-8">
        <span className="eyebrow shrink-0">{number}</span>
        <h2
          className="font-display text-[32px] leading-[1.2] font-medium tracking-[-0.01em]"
          style={{ fontOpticalSizing: "auto" }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function SubHead({ children }: { children: ReactNode }) {
  return (
    <h3
      className="font-display mb-4 text-[20px] leading-[1.3] font-semibold"
      style={{ fontOpticalSizing: "auto" }}
    >
      {children}
    </h3>
  );
}

/* -------------------------------- 01. Colors ---------------------------- */

function ColorsSection() {
  return (
    <Section number="01" title="Color tokens">
      <div className="space-y-12">
        <SwatchGroup
          heading="Surfaces"
          swatches={[
            { name: "bg-primary", hex: "#FAFAF7" },
            { name: "bg-subtle", hex: "#F9F7F1" },
            { name: "bg-secondary", hex: "#F4F4EF" },
            { name: "bg-elevated", hex: "#FFFFFF" },
            { name: "bg-ink", hex: "#0A0F1E", isDark: true },
          ]}
        />
        <SwatchGroup
          heading="Ink (text)"
          swatches={[
            { name: "text-primary", hex: "#0A0F1E", isDark: true },
            { name: "text-secondary", hex: "#525A6B", isDark: true },
            { name: "text-tertiary", hex: "#8B94A5", isDark: true },
            { name: "text-inverse", hex: "#FAFAF7" },
          ]}
        />
        <SwatchGroup
          heading="Borders / hairlines"
          swatches={[
            { name: "border-hairline", hex: "#E7E5E0" },
            { name: "border-default", hex: "#D9D6CF" },
            { name: "border-strong", hex: "#A8A59E" },
          ]}
        />
        <SwatchGroup
          heading="Cobalt — primary action"
          swatches={[
            { name: "accent-cobalt", hex: "#1E4DD8", isDark: true },
            { name: "accent-cobalt-hover", hex: "#1740B8", isDark: true },
            { name: "accent-cobalt-tint", hex: "#EEF2FE" },
          ]}
        />
        <SwatchGroup
          heading="Jade — secondary action / success"
          swatches={[
            { name: "accent-jade", hex: "#0FA37F", isDark: true },
            { name: "accent-jade-hover", hex: "#0C8A6A", isDark: true },
            { name: "accent-jade-tint", hex: "#E8F6F1" },
          ]}
        />
        <SwatchGroup
          heading="Alerts"
          swatches={[
            { name: "alert-amber", hex: "#D97706", isDark: true },
            { name: "alert-red", hex: "#B91C1C", isDark: true },
          ]}
        />
      </div>
    </Section>
  );
}

function SwatchGroup({
  heading,
  swatches,
}: {
  heading: string;
  swatches: { name: string; hex: string; isDark?: boolean }[];
}) {
  return (
    <div>
      <SubHead>{heading}</SubHead>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
        {swatches.map((s) => (
          <Swatch key={s.name} {...s} />
        ))}
      </div>
    </div>
  );
}

function Swatch({ name, hex, isDark }: { name: string; hex: string; isDark?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 w-full rounded-[var(--radius-md)]"
        style={{
          background: hex,
          border: isDark ? "none" : "1px solid var(--color-border-hairline)",
        }}
      />
      <div>
        <p className="text-text-primary text-[14px] font-medium">{name}</p>
        <p className="text-text-tertiary font-mono text-[12px] tabular-nums">{hex.toUpperCase()}</p>
      </div>
    </div>
  );
}

/* -------------------------------- 02. Typography ------------------------ */

function TypographySection() {
  return (
    <Section number="02" title="Typography scale">
      <div>
        <ScaleRow
          token="display-xl / 72"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 72,
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontOpticalSizing: "auto",
          }}
        >
          Plastik enjeksiyonun
        </ScaleRow>
        <ScaleRow
          token="display-lg / 56"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 56,
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            fontOpticalSizing: "auto",
          }}
        >
          Mühendislik partneri
        </ScaleRow>
        <ScaleRow
          token="display-md / 44"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 44,
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontOpticalSizing: "auto",
          }}
        >
          Cam yıkama sektörü
        </ScaleRow>
        <ScaleRow
          token="heading-xl / 32"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontOpticalSizing: "auto",
          }}
        >
          Süreç ve üretim
        </ScaleRow>
        <ScaleRow
          token="heading-lg / 26"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1.25,
          }}
        >
          Kapak aileleri
        </ScaleRow>
        <ScaleRow
          token="heading-md / 20"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 20,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          Teknik özellikler
        </ScaleRow>
        <ScaleRow
          token="body-lg / 18"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 18,
            lineHeight: 1.6,
          }}
        >
          36 yıldır Bursa OSB&apos;deki atölyemizde cam yıkama, kapak ve tekstil sektörlerine yıllık
          48 milyon adet özel üretim.
        </ScaleRow>
        <ScaleRow
          token="body / 16"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Teklif sürecimiz 3 adımdan oluşur: gereksinim toplama, DFM analizi ve örnekli teklif. İlk
          geri dönüş 24 saat içinde.
        </ScaleRow>
        <ScaleRow
          token="body-sm / 14"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          Kalıp tasarımından teslimat lojistiğine kadar tüm süreç Kıta Plastik bünyesindedir.
        </ScaleRow>
        <ScaleRow
          token="caption / 12"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--color-text-secondary)",
          }}
        >
          Kıta Plastik ve Tekstil San. Tic. Ltd. Şti. — Bursa OSB — 1989
        </ScaleRow>
        <ScaleRow token="eyebrow / mono 12" className="eyebrow">
          Est. 1989 · Bursa · ISO 9001:2015
        </ScaleRow>
        <ScaleRow
          token="mono figure / 32"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          48,000,000
        </ScaleRow>
      </div>
    </Section>
  );
}

function ScaleRow({
  token,
  children,
  style,
  className,
}: {
  token: string;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-baseline gap-8 border-b border-[var(--color-border-hairline)] py-6">
      <span className="eyebrow">{token}</span>
      <div style={style} className={className}>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------- 03. Diacritics ------------------------ */

function DiacriticsSection() {
  const turkish = "İĞÜŞÖÇığüşöç — Kıta Plastik 1989 — Bursa, Türkiye";
  const cyrillic = "Жщъю фывапролд — Москва 2026";
  const arabic = "كيتا بلاستيك — بورصة، تركيا ١٩٨٩";

  return (
    <Section number="03" title="Diacritics render — Fraunces + Hanken">
      <div className="space-y-10">
        <SubHead>Turkish / Fraunces display</SubHead>
        <div className="space-y-5">
          {[72, 48, 32, 20].map((size) => (
            <div key={size}>
              <p className="eyebrow mb-2">Fraunces / {size}px</p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: size,
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  fontOpticalSizing: "auto",
                }}
              >
                {turkish}
              </p>
            </div>
          ))}
        </div>

        <SubHead>Turkish / Hanken Grotesk body</SubHead>
        <div className="space-y-5">
          {[24, 16, 14].map((size) => (
            <div key={size}>
              <p className="eyebrow mb-2">Hanken / {size}px</p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: size,
                  fontWeight: 400,
                  lineHeight: 1.55,
                }}
              >
                {turkish}
              </p>
            </div>
          ))}
        </div>

        <SubHead>Cyrillic / Fraunces</SubHead>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 48,
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontOpticalSizing: "auto",
          }}
        >
          {cyrillic}
        </p>

        <SubHead>Arabic fallback / Noto Sans Arabic (Fraunces lacks Arabic)</SubHead>
        <p
          dir="rtl"
          className="font-arabic"
          style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.4 }}
        >
          {arabic}
        </p>
      </div>
    </Section>
  );
}

/* -------------------------------- 04. Radii ----------------------------- */

function RadiiSection() {
  return (
    <Section number="04" title="Radii">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <RadiusBox label="xs / 2px" radius="var(--radius-xs)" />
        <RadiusBox label="sm / 4px" radius="var(--radius-sm)" />
        <RadiusBox label="md / 8px" radius="var(--radius-md)" />
        <RadiusBox label="lg / 16px" radius="var(--radius-lg)" />
      </div>
    </Section>
  );
}

function RadiusBox({ label, radius }: { label: string; radius: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-24 w-full border"
        style={{
          background: "var(--color-bg-elevated)",
          borderColor: "var(--color-border-default)",
          borderRadius: radius,
        }}
      />
      <span className="eyebrow">{label}</span>
    </div>
  );
}

/* -------------------------------- 05. Shadows --------------------------- */

function ShadowsSection() {
  return (
    <Section number="05" title="Elevation">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <ElevationBox label="shadow-hairline" shadow="var(--shadow-hairline)" />
        <ElevationBox label="shadow-card" shadow="var(--shadow-card)" />
        <ElevationBox label="shadow-float" shadow="var(--shadow-float)" />
      </div>
    </Section>
  );
}

function ElevationBox({ label, shadow }: { label: string; shadow: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="h-32 w-full"
        style={{
          background: "var(--color-bg-elevated)",
          borderRadius: "var(--radius-md)",
          boxShadow: shadow,
        }}
      />
      <span className="eyebrow">{label}</span>
    </div>
  );
}

/* -------------------------------- 06. Buttons -------------------------- */

function ButtonsSection() {
  return (
    <Section number="06" title="Button — 4 variants × 3 sizes">
      <div className="space-y-10">
        <div>
          <SubHead>Primary · cobalt solid</SubHead>
          <div className="flex flex-wrap items-end gap-4">
            <Button variant="primary" size="sm">
              Teklif
            </Button>
            <Button variant="primary" size="md">
              Teklif İste
            </Button>
            <Button variant="primary" size="lg">
              Teklif İste →
            </Button>
            <Button variant="primary" size="lg" isLoading>
              Gönderiliyor
            </Button>
            <Button variant="primary" size="lg" disabled>
              Devre dışı
            </Button>
          </div>
        </div>

        <div>
          <SubHead>Secondary · jade ghost</SubHead>
          <div className="flex flex-wrap items-end gap-4">
            <Button variant="secondary" size="sm">
              Detay
            </Button>
            <Button variant="secondary" size="md">
              Sektörleri Keşfet
            </Button>
            <Button variant="secondary" size="lg">
              Ürün Kataloğu
            </Button>
          </div>
        </div>

        <div>
          <SubHead>Tertiary · ghost</SubHead>
          <div className="flex flex-wrap items-end gap-4">
            <Button variant="tertiary" size="sm">
              İptal
            </Button>
            <Button variant="tertiary" size="md">
              Detaylara git →
            </Button>
            <Button variant="tertiary" size="lg">
              Geri dön
            </Button>
          </div>
        </div>

        <div>
          <SubHead>Destructive · alert-red</SubHead>
          <div className="flex flex-wrap items-end gap-4">
            <Button variant="destructive" size="sm">
              Sil
            </Button>
            <Button variant="destructive" size="md">
              Kaydı Sil
            </Button>
          </div>
        </div>

        <div>
          <SubHead>Focus ring · Tab buraya</SubHead>
          <div className="flex gap-4">
            <Button variant="primary">Tab hedefi 1</Button>
            <Button variant="secondary">Tab hedefi 2</Button>
            <Button variant="tertiary">Tab hedefi 3</Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------- 07. Badges -------------------------- */

function BadgesSection() {
  return (
    <Section number="07" title="Badge — status pills">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="neutral">New</Badge>
        <Badge variant="info">Reviewing</Badge>
        <Badge variant="success">Quoted</Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="danger">Closed</Badge>
      </div>
      <p className="mt-6 max-w-2xl text-[14px] text-[var(--color-text-secondary)]">
        Used in admin inbox rows and spec metadata. Never the primary visual element. Mono uppercase
        for tabular legibility and to signal &ldquo;metadata, not content&rdquo;.
      </p>
    </Section>
  );
}

/* -------------------------------- 08. Cards -------------------------- */

function CardsSection() {
  return (
    <Section number="08" title="Card — hairline default, interactive, elevated">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardEyebrow>Sektör 01</CardEyebrow>
          <CardTitle>Cam Yıkama</CardTitle>
          <CardBody>
            Cam yıkama makinesi bileşenleri. 14 aktif kalıp, aylık 480.000 adet kapasite.
          </CardBody>
          <CardFooter>
            <span className="font-mono text-[12px] text-[var(--color-text-tertiary)]">
              Ø 80–320 mm · 12–480 g
            </span>
          </CardFooter>
        </Card>

        <Card interactive>
          <CardEyebrow>Sektör 02</CardEyebrow>
          <CardTitle>Kapak Aileleri</CardTitle>
          <CardBody>
            Hassas ölçülü şişe, kavanoz ve depo kapakları. DFM analizi ile mold-flow optimizasyonu.
          </CardBody>
          <CardFooter>
            <Divider orientation="vertical" className="h-4" />
            <span className="text-[13px] text-[var(--color-accent-cobalt)]">Detaylara git →</span>
          </CardFooter>
        </Card>

        <Card elevated>
          <CardEyebrow>Sektör 03</CardEyebrow>
          <CardTitle>Tekstil Bileşenleri</CardTitle>
          <CardBody>
            Dokuma, örme ve finishing hatları için precision-molded bileşenler — iplik
            kılavuzlarından bobin parçalarına.
          </CardBody>
          <CardFooter>
            <span className="font-mono text-[12px] text-[var(--color-text-tertiary)]">
              ±0.02 mm tolerans
            </span>
          </CardFooter>
        </Card>
      </div>
    </Section>
  );
}

/* -------------------------------- 09. Forms -------------------------- */

function FormsSection() {
  return (
    <Section number="09" title="Form primitives — Field system">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <TextField
          label="Ad Soyad"
          placeholder="Berkay Türk"
          helperText="Resmi kimlikteki ad soyad — teklif formu için."
          required
        />
        <TextField
          label="E-posta"
          type="email"
          placeholder="berkay@kitaplastik.com"
          errorText="Geçerli bir e-posta adresi girin."
          required
          defaultValue="berkay@"
        />
        <TextField label="Telefon" type="tel" placeholder="+90 322 ..." optionalText="opsiyonel" />
        <SelectField
          label="Sektör"
          placeholder="Seçin"
          options={[
            { value: "cam", label: "Cam yıkama" },
            { value: "kapak", label: "Kapak aileleri" },
            { value: "tekstil", label: "Tekstil bileşenleri" },
            { value: "ozel", label: "Özel üretim" },
          ]}
          required
        />
        <div className="md:col-span-2">
          <TextArea
            label="Proje açıklaması"
            placeholder="Üretilmesi istenen parça hakkında kısa bilgi; varsa adet, tolerans, teslim tarihi…"
            helperText="0 / 1000 karakter. CAD dosyaları teklif talebinde ayrıca eklenir."
            optionalText="opsiyonel"
            rows={5}
          />
        </div>
        <div className="flex flex-col gap-3 md:col-span-2">
          <Checkbox
            label="KVKK aydınlatma metnini okudum ve onaylıyorum."
            helperText="Kişisel verileriniz yalnızca teklif süreci için işlenir."
            required
          />
          <Checkbox
            label="Pazarlama iletişimi almak istiyorum"
            helperText="Yeni ürün bildirimleri ve fuar davetiyeleri — yılda en fazla 4 e-posta."
          />
          <Checkbox label="Devre dışı örnek" disabled />
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------- 07. Contrast -------------------------- */

function ContrastSection() {
  const rows = [
    { fg: "#0A0F1E", bg: "#FAFAF7", label: "text-primary on bg-primary", ratio: "≈15.9:1" },
    { fg: "#525A6B", bg: "#FAFAF7", label: "text-secondary on bg-primary", ratio: "≈6.8:1" },
    { fg: "#8B94A5", bg: "#FAFAF7", label: "text-tertiary on bg-primary", ratio: "≈4.2:1 (AA)" },
    { fg: "#FAFAF7", bg: "#1E4DD8", label: "text-inverse on cobalt", ratio: "≈6.5:1" },
    { fg: "#FAFAF7", bg: "#0FA37F", label: "text-inverse on jade", ratio: "≈3.4:1 (L only)" },
    { fg: "#FAFAF7", bg: "#0A0F1E", label: "text-inverse on ink", ratio: "≈15.9:1" },
    { fg: "#0A0F1E", bg: "#EEF2FE", label: "text-primary on cobalt-tint", ratio: "≈15.0:1" },
    { fg: "#0A0F1E", bg: "#E8F6F1", label: "text-primary on jade-tint", ratio: "≈15.4:1" },
  ];
  return (
    <Section number="10" title="Accessibility contrast (AA ≥ 4.5 · AAA ≥ 7.0)">
      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-4 rounded-[var(--radius-sm)] px-5 py-4"
            style={{ background: r.bg, color: r.fg }}
          >
            <span className="flex-1 text-[15px]">
              {r.label}: &ldquo;Kıta Plastik — İzmir, 2026&rdquo;
            </span>
            <span className="font-mono text-[12px] tabular-nums opacity-70" style={{ color: r.fg }}>
              {r.ratio}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
