# Resume Guide — Kıta Plastik MVP

> Bu dosya context-clear sonrası yeni Claude session'ın hızlıca devam etmesi için. **Read this first.**

---

## 🛡️ GLOBAL PROTOCOL — Cross-AI Review Gates (ZORUNLU)

Kullanıcı 2026-04-23 oturumunda belirledi. Tüm yeni yazılan specler ve tüm yeni açılan PR'lar için uygulanır. Detay: `memory/feedback_codex_dual_review_gate.md`.

- **Gate 1 — Spec-level:** Brainstorm → spec yaz → self-review → **`/codex-review-spec <path>`** → critical/high inline fix → user review → writing-plans.
- **Gate 2 — PR-level:** Execution complete → CI yeşil → **`/codex-review-pr`** → critical/high fix + tekrar CI → medium/low PR body'de "Known differences" → merge.
- **Failure mode:** Codex offline → Review Log/PR body'e "SKIPPED" notu, tech-debt flag, **hard block yok**.
- **Convergence:** Tek round. User = ikinci insan arbiter.
- **Retroactive:** Mevcut merge edilmiş specler backfill edilmez.
- **Slash commands:** `.claude/commands/codex-review-spec.md` + `codex-review-pr.md` (project-level)
- **PR attribution:** `🔍 Reviewed by: Claude + Codex (GPT-5.4)`

---

## 👉 NEXT SESSION KICKOFF (2026-04-26 sonrası — cleanup #8 + admin hard-delete #9 LIVE)

**Site tam-MVP state achieved (GWS + B placeholder hariç) + admin hard-delete option canlıda + doğrulandı.** Cleanup #8 smoke PASS 2026-04-26 19:27 TRT. Hard-delete #9 merged 2026-04-26 ~20:05 TRT, deploy + manual UI smoke PASS (admin → soft-delete → Silinmiş tab → Kalıcı sil + token type → row gone, Storage clean, Sentry quiet).

### Kalan minor follow-up (önerilen sıra)

#### B. staticFacts 5 alan net değerleri (~5 dk + user input)
- **USER ACTION REQUIRED:** Şu 6 değeri net olarak ver:
  1. **Vergi dairesi + Vergi no** (örn: "Osmangazi VD - 1234567890")
  2. **Ticaret sicil no** (Bursa, örn: "12345-6") veya MERSİS varsa o yeterli
  3. **MERSİS no** (16 hane)
  4. **KEP adresi** (varsa örn: "kitaplastik@hs01.kep.tr"; yoksa "Kayıt mevcut değil")
  5. **VERBIS sicil no** (kayıtlıysa örn: "VBS123456"; muafiyetse "Şirketimiz VERBIS kayıt zorunluluğu kapsamında değildir")
  6. **DPO** (atanmışsa "Ad Soyad - email"; değilse "Veri Koruma Görevlisi atanmamıştır")
- 4 messages JSON (`messages/{tr,en,ru,ar}/legal.json` `privacy.staticFacts`) — 5 alan × 4 locale = 20 string update
- Şu an 4 locale × 5 alan "Bilgi güncelleniyor" placeholder canlıda — release blocker değil

#### Codex Gate 2 retroactive #8 (~5 dk)
- Combined cleanup PR #8 (`7c6a644`) Codex Gate 2 review **SKIPPED** edildi (CLI usage limit, 2026-04-26 ~20:29 PT'ye kadar bloklanmıştı)
- Sonraki oturumda CLI quota refresh sonrası retroactive review tetikle (`codex-review-pr` skill, PR #8 diff)
- HIGH issue çıkarsa ayrı patch PR; çıkmazsa "post-merge clean" not düş

#### Faz 3 (GWS) — maddi karar bekliyor (DEFERRED)
- info@kitaplastik.com gerçek inbox için Google Workspace ($6/user/ay)
- Geçici: CF Email Routing forward (ücretsiz, kullanıcının kişisel mailine route)
- Karar bekleyince hiçbir teknik iş yok

### Site tam-MVP state özeti

| Alan | Durum |
|---|---|
| Frontend (4-locale, RTL Arabic, redesign) | ✅ canlı |
| RFQ + Catalog Request + Admin panel | ✅ canlı |
| Auth (password) + RLS + Turnstile + rate limit | ✅ canlı |
| Email (Resend) + Audit log + KVKK | ✅ canlı |
| KVKK gizlilik + çerez politikası 4 locale | ✅ canlı (#7) |
| SEO canonical 12/12 doğru localized URL | ✅ canlı (#8) |
| Contact + Catalog data minimization (IP min) | ✅ canlı (#8 + #6) |
| Sentry + Plausible same-origin proxy | ✅ canlı |
| CF orange + DNS-01 + Full strict + SSL Labs A+ | ✅ canlı (Plan 5a F4) |
| CI parallel sharding + paths-ignore + GHA workflow_run deploy | ✅ aktif |
| Supabase + Coolify token rotate | ✅ 2026-04-26 |
| **Admin hard-delete (products + references)** | ✅ canlı (#9, 6a5395b) |
| **Admin hard-delete atomicity fix (active guard + DB-first)** | ✅ canlı (#10, b7b411f) |
| **HardDeleteDialog server-side confirmation token** | ✅ canlı (#11, 2f3743d) |
| **GWS (Faz 3)** | 🟡 maddi karar |
| **B staticFacts net değer** | 🟡 user input bekler |
| **Tier 2 Dockerfile** | ❌ ABANDONED 2026-04-26 (Nixpacks kalıcı tercih) |
| **Codex Gate 2 retroactive #8** | ✅ done 2026-04-26 (concerns medium 3M/1L — patch yok) |
| **Codex Gate 2 retroactive #9** | ✅ done 2026-04-26 (4 HIGH+3M → #10 atomicity + #11 token tam kapandı) |

---

## Patch PR #11 ✅ CANLIDA (2026-04-26 bu oturum) — HardDeleteDialog server-side confirmation token

- Squash commit: `2f3743d fix(admin): server-side confirmation token validation for hard-delete (#11)` (CI 10/10 ✓ + Deploy ✓)
- Codex Gate 2 #9 retroactive medium 5 fix — defense-in-depth
- Saldırı modeli kapatıldı: cookie hijack + curl direct call (modal bypass) artık server-side token validation'da fail
- Server actions: `hardDeleteProduct(id, confirmToken)` + `hardDeleteReference(id, confirmToken)` — token DB'deki `existing.slug`/`existing.key` ile karşılaştırılır, mismatch → throw "Onay kelimesi eşleşmiyor — kalıcı silme iptal edildi."
- HardDeleteDialog action signature: `() => Promise<void>` → `(typedToken: string) => Promise<void>` — typed token server'a gider
- Plumbing: ProductRow/ProductList/ReferenceList/2 page.tsx tüm chain `(token: string)` accept eder, type system tüm call site'ları yakalar
- TDD: 16/16 GREEN (was 14/14 in #10) — +1 mismatch contract test/entity asserts bad token → throws + zero side effects (no delete, no storage, no audit)
- `pnpm verify`: 277 unit / 76 e2e / build / lint / format / audit ✓
- Codex Gate 2 forward SKIPPED — bu PR Codex'in spesifik medium 5 suggestion'ının fix'i, tautolojik review olur
- Notlar: dialog UX değişmedi (operatör hâlâ slug yazıyor, button hâlâ disabled until match); sadece backend katmanı eklendi

---

## Patch PR #10 ✅ CANLIDA (2026-04-26 bu oturum) — admin hard-delete atomicity fix

- Squash commit: `b7b411f fix(admin): atomic hard-delete + DB-first storage ordering (#10)` (CI 10/10 ✓ + Deploy ✓ + manual UI smoke PASS 2026-04-26)
- Codex Gate 2 #9 retroactive 4 HIGH bulgu için direkt patch
- Atomicity (HIGH 1+2): `.delete({count:"exact"}).eq("id",id).eq("active",false)` + count===0 race throw "Ürün/Referans silinemedi: kayıt bulunamadı veya bu sırada tekrar aktifleştirildi" — TOCTOU race window kapanır
- Order swap (HIGH 3+4): DB delete → audit → storage cleanup; DB fail asla orphan storage objects yaratmaz
- TDD: 14/14 GREEN incl 4 yeni assertion (race scenario count=0 + DB-fail-no-storage × 2 entity + invocation order — DB delete must precede storage remove)
- Mock pattern güncellendi: `eqIdSpy` + `eqActiveSpy` (chained) — supabase-js dual `.eq` chain
- `pnpm verify`: 277 unit / 76 e2e / build / lint / format / audit ✓
- **Out of scope:** confirmation token server-side validation (medium 5, defense-in-depth, opsiyonel follow-up)
- Codex Gate 2 forward SKIPPED — bu patch zaten retroactive bulguların direct fix'i (tautolojik review olur)
- Manual UI smoke 2026-04-26 user-confirmed: products + references "Pasifleştir → Silinmiş tab → Kalıcı Sil → token type → row gone + Storage clean" akışı PASS

---

## Admin hard-delete PR #9 ✅ CANLIDA (2026-04-26 bu oturum)

- Squash commit: `6a5395b feat(admin): hard-delete option for products + references (#9)` (CI 10/10 ✓ + Deploy ✓ + manual UI smoke PASS 2026-04-26)
- Pattern: PR önceki soft-delete kalıyor (`active=false` + restore), yanına irreversible `hardDelete*` action eklendi
- 2 yeni server action:
  - `app/admin/products/actions.ts:hardDeleteProduct` — `delete().eq("id",id)` + `storage.from("product-images").remove(paths)` + audit `product_hard_deleted` (snapshot + irreversible:true)
  - `app/admin/references/actions.ts:hardDeleteReference` — `delete().eq("id",id)` + `storage.from("client-logos").remove([key])` + audit `reference_hard_deleted`
- Safety guards:
  - **Two-step flow:** hard-delete sadece `active=false` rows için (`existing.active` check throws "Önce ürünü/referansı pasifleştirin"). Aktif row'lar önce soft-delete edilmeli — kazara prod data kaybı önlenir
  - **Confirmation token:** UI'da entity slug/key text input ile yazılmadan destructive button disabled
  - **Best-effort storage:** Storage cleanup non-fatal (Sentry warning, DB delete devam eder)
  - **Audit trail:** `*_hard_deleted` action + `diff.snapshot` (pre-delete state) + `diff.irreversible:true` marker
- Yeni `components/admin/HardDeleteDialog.tsx` shared component — text-input confirmation modal + red destructive button
- TDD: 10 yeni contract assertion (5 per entity)
  - active guard → throws
  - not-found guard → throws
  - happy-path: DB delete + Storage remove + audit (entity_type + user_id + ip:null + diff.irreversible:true + diff.snapshot)
  - non-fatal storage failure → DB delete still proceeds
  - skip storage when no images / external URL
- `pnpm verify`: 277 unit / 76 e2e / build / lint / format / audit ✅
- **Codex Gate 2 SKIPPED** — CLI usage limit hâlâ bloklu (PR #8 ile aynı 8:29 PM PT refresh). PR body'de belgelendi. Risk düşük (mekanik pattern + TDD + safety guards)
- **No FK cascade impact** — `products` + `clients` tablolarına FK referans veren tablo yok (verified via grep)

**Manual UI smoke ✅ PASS (2026-04-26 user-confirmed):** admin login → soft-delete → Silinmiş tab → Kalıcı sil + token type → row gone + Storage clean + Sentry quiet (no `hard_delete_storage` warning)

---

## Combined cleanup PR #8 ✅ CANLIDA (2026-04-26 bu oturum)

- Squash commit: `7c6a644 chore(cleanup): canonical URLs (9 routes) + contact route IP minimization (#8)` (CI 10/10 ✓ + Deploy ✓ ~14 dk)
- 2 commit (atomic):
  - `244f9b0 fix(seo): canonical URL uses next-intl pathname for 9 routes` — about/contact + sectors hub + 3 sector children + products + references + request-quote pattern direct-string `${origin}/${locale}/<route>` → `alternates.languages[locale]` (PR B'den copy)
  - `5c5e4a8 refactor(contact): minimize IP for end-user contact submissions` — IP in-memory rate-limit + Turnstile only, audit `ip:null`, `ContactTeamInput.ip` field drop, team email HTML/text IP omit, privacy copy 4 locale revert "IP kaydedilmez/not stored/не сохраняется/لا يتم حفظ" (PR A catalog'dan copy)
- TDD: 3 yeni assertion `tests/unit/app/api/contact/route.test.ts` (RED proven before GREEN; vi.hoisted pattern) + 1 yeni assertion `tests/unit/lib/email/templates.test.ts` (IP omit)
- `pnpm verify` CI mirror: 267 unit / 76 e2e (28 skip) / build / lint / format / audit ✅
- **Codex Gate 2 SKIPPED** — CLI usage limit (2026-04-26 ~20:29 PT'ye kadar bloklanmıştı). PR body'de belgelendi. Risk değerlendirmesi: low (PR A/B pattern mekanik kopya, TDD GREEN, CI tüm yeşil). Retroactive review sonraki oturumda
- Live smoke 2026-04-26 19:27 TRT: 12/12 canonical (`/tr/hakkimizda`, `/en/about`, `/tr/iletisim`, `/en/contact`, `/tr/sektorler`, `/en/sectors`, `/tr/sektorler/{cam-yikama,kapak,tekstil}`, `/tr/urunler`, `/tr/referanslar`, `/tr/katalog` — hepsi 200 + canonical = self) + 4/4 privacy copy ("kaydedilmez/not stored/не сохраняется/لا يتم حفظ") ALL GREEN

**E. Supabase token rotate ✅ 2026-04-26 (bu oturum)**
- `~/.zshenv` line 1 yeni token (`sbp_…` 44 char). CLI test `supabase projects list` PASS — kitaplastik-prod (Frankfurt) LINKED ●. Eski token dashboard'da revoke edildi.
- MCP variant test SKIPPED — `mcp__supabase__authenticate` ve plugin variant her ikisi de OAuth-based (env-var ile bağlantısız, ek değer yok)

---

## Plan 5b PR B ✅ CANLIDA (2026-04-26 önceki oturum)

- Squash commit: `dde1ee2 feat(legal): Plan 5b PR B — KVKK gizlilik + çerez politikası 4 dil (#7)` (CI ✓ + Deploy ✓)
- 8 yeni SSG route: `/legal/{privacy,cookies}` × {tr/en/ru/ar} (TR canonical pathnames `/yasal/gizlilik` + `/yasal/cerezler`, RU `/pravovaya/*`, AR `/qanuni/*`)
- 5 reusable component: `LegalLayout` / `LegalSection` / `LegalTable` / `LegalDisclaimer` (5-prop locale-translated labels) / `LegalControllerBlock` (getCompany SOT + staticFacts merge)
- Footer bottom-bar 3-element (copyright / legal links / tagline), Catalog + Contact form altı consent notice
- Cookie consent banner GEREKMEZ — strict-necessary only (NEXT_LOCALE + cf_chl_* + __cf_bm), Plausible cookieless, Sentry no-cookie → ePrivacy 5(3) muafiyet
- Codex Gate 1 (spec) + Gate 2 (PR diff): Gate 1 6 high inline fix, Gate 2 round 1 = 2 high (privacy copy IP retention accuracy), Gate 2 round 2 = APPROVE 0 issues
- 12 yeni unit test (i18n pathnames 8 + LegalDisclaimer 2 + LegalTable 3 + LegalLayout 4 + Footer 1) + 10 E2E case (8 smoke + 2 round-trip), 263 unit + 76 e2e (28 skip) yeşil
- staticFacts placeholder pattern: 5 alan "Bilgi güncelleniyor" / "Information being updated" / "Информация обновляется" / "المعلومات قيد التحديث" — release blocker değil, 7-gün içinde patch PR

**Out of scope follow-up'lar (RESUME kickoff'ta listeli):**
- 5dk patch PR — staticFacts net değerleri (vergi dairesi/sicil/MERSİS/KEP/VERBIS/DPO 4 messages JSON)
- `app/api/contact/route.ts` IP minimization (catalog gibi `email + locale + created_at` minimization, Codex Gate 2 round 1 HIGH yerine privacy copy honest fix uygulandı)
- About/Contact `canonical` bug — `${origin}/${locale}/about` yerine PR B pattern `alternates.languages[locale]` (next-intl pathnames-based, TR'de `/hakkimizda` → /about mismatch)

---

## Plan 5b PR A ✅ CANLIDA (2026-04-25 bu oturum)

- Squash commit: `1958e7b feat(catalog): Plan 5b PR A — data minimization for catalog_requests (#6)` (CI ✓ + Deploy ✓)
- DB migration **uygulandı** Supabase plugin MCP ile (Studio-manual bypass) — `enable_pg_cron_extension` + `catalog_requests_data_min`
- Yeni `catalog_requests` schema: `(id, email, locale, created_at)` — `ip_address` + `user_agent` drop edildi, eski rows amnesia
- pg_cron job `catalog_requests_purge_30d` active=true, schedule=`0 3 * * *` (her gün 03:00 UTC, >30 gün satırları siler)
- API route + admin page + types.ts uyumlu (typed, `as any` cast'lerden temizlendi)
- audit_log için `action='catalog_requested'` IP de null geçer artık (admin action audit'leri etkilenmez)
- Yeni unit test: `tests/unit/app/api/catalog/route.test.ts` — 2 contract assertion (insert payload + audit ip:null)
- Codex Gate 2: approve · 0 critical · 0 high · 2 low (admin UI rollout pencere notu + types.ts regen drift uyarısı, ikisi PR body'de "Known differences")
- Hijyen: `.prettierignore` `.claude/` ignore (committed `commands/` whitelist) — local verify == CI verify

**Out of scope follow-up'lar (PR A body'sinde flagged):**
- `app/api/contact/route.ts` aynı IP-in-audit-log + IP-in-team-email pattern'ini taşıyor; ayrı PR konusu
- `lib/supabase/types.ts` manual patch — sonraki `supabase gen types typescript --linked` regen ile remote schema doğrudan eşleşmeli (artık hizalı; regen safe)

---

**Plan 5a Faz 4 ✅ CANLIDA (zaten tamamlanmıştı, 2026-04-25 mini-session ile doğrulandı):**
- DNS proxy orange (`@` + `www`) — CF dashboard "4 days ago"
- SSL/TLS Full (strict) — CF dashboard "2 days ago"
- Wildcard Let's Encrypt cert (`*.kitaplastik.com` SAN) — DNS-01 ile alınmış, expiry 19 Jul 2026
- SSL Labs A+ — 4/4 endpoint READY (2× IPv4 + 2× IPv6, cached query)
- Coolify Traefik `/data/coolify/proxy/.env` `CF_DNS_API_TOKEN` setli + container env pickup OK
- Önceki RESUME note "Faz 4 yapılmadı" YANLIŞ bilgiymiş — memory description doğru bilgiyi taşıyordu (feedback_resume_vs_memory_infra.md).

---

---

**Plan 5c Part 2 ✅ CANLIDA (2026-04-24 bu session):**
- Squash commit: `d7c5f1c feat: Plan 5c Part 2 — DB-backed /admin/settings/company editor (#4)`
- Main HEAD: `d7c5f1c` (pushed + Coolify deploy ✓ via workflow_dispatch sonrası)
- Migration `20260424170000_settings_company` — tablo + singleton + RLS (public SELECT + admin INSERT/UPDATE `is_admin_role()`) + RPC `update_company(jsonb)` SECURITY DEFINER + seed
- `lib/company.ts` static COMPANY → `getCompany()` async + React.cache + test-env fallback
- Admin editör `/admin/settings/company`: RHF + zod + 4 Card section (native `<form action={serverAction}>` + hidden JSON inputs) + `recordAudit` + `revalidatePath("/", "layout")`
- 5 consumer async migrate: layout + contact page/API + Footer + WhatsAppButton + WhatsAppFab (client prop drill)
- Gate 1 Codex: 1 critical + 3 high + 4 medium + 1 low — inline fix
- Gate 2 Codex: 1 high + 3 medium + 1 low — HIGH (native form) + 2 MEDIUM (field errors, contact API side-effect) inline fix; MEDIUM (unauthorized/invalid FormData E2E) + LOW (TEST_FALLBACK_COMPANY DRY) follow-up
- 244 unit test yeşil, Tier 3 paralel CI ~3m25s (hedefi tutar)
- Canlı smoke: /admin/settings/company 307 ✓, /admin/login form ✓, homepage 200 0.7s ✓, footer render ✓

**Tier 3 ✅ CANLIDA (aynı session, squash `1f86229`):**
- 10 paralel job (lint, typecheck, format, unit-tests, audit, build, e2e-shard-1..3, ci-success)
- CI wall time ~8dk → **~3m25s** (62% kısalma)
- Codex Gate 2: approve, no critical/high; LOW DRY/redundant noted
- Playwright cache key @playwright/test version'a bağlı (pnpm-lock değil)

**Secret rotate durumu:**
- COOLIFY_TOKEN ✅ rotate (2026-04-24 bu session, `6|InJvZg...` yeni scope=deploy)
- SUPABASE_ACCESS_TOKEN ⏸ PENDING — user dashboard'dan rotate + `~/.zshenv` update gerek
- Supabase plugin MCP hâlâ 401 — post-rotate `supabase login` veya env update

---

**Plan 5c Part 1 ✅ CANLIDA (2026-04-24):**
- Squash commit: `e5030bb feat: Plan 5c Part 1 — sectors edit + references CRUD`
- 31 commit (28 task + hotfix + 3 Gate 2 fix) squashed → main
- Migration `20260424090000` + RPC migration `20260424100000_client_display_order_swap_rpc` remote'a uygulandı
- Phase B logo migration ✅ — 8/8 client logosu `client-logos/<uuid>.svg` storage path'ine taşındı
- Canlı smoke ✓ — homepage `client-logos/` URL'lerini serve ediyor, `/admin/sectors` + `/admin/references` auth guard çalışıyor
- Gate 1 Codex: 4 HIGH + 4 MEDIUM inline fix (spec Review Log)
- Gate 2 Codex: 2 HIGH + 1 MEDIUM fix (swap RPC + tsx devDep + storage.remove error capture); 1 MEDIUM (E2E coverage) + 1 LOW (edit inline soft-delete, Shell nav order) follow-up
- 236 unit test yeşil, typecheck + lint + build + E2E CI temiz

### Session snapshot bileşenleri
- `/admin/sectors` — 3 sabit sektör edit-only, 4-dil LocaleTabs + hero image + SEO meta + active toggle
- `/admin/references` — full CRUD (create/edit/softDelete/restore/arrow reorder), 4-dil display_name + logo upload + sector dropdown
- Migration: `sectors` 4 yeni kolon (hero_image, long_description, meta_title, meta_description), `clients` 2 yeni kolon (display_name, sector_id FK), `client-logos` bucket (1MB, SVG/PNG/JPG/WEBP), `sector-images` hardened (5MB, raster only)
- RPC: `swap_client_display_order(a_id, b_id)` — atomic reorder, service_role grant
- Public UI fallback chain: `displayName?.[locale] ?? safeTranslate(tClients, key+'.name') ?? ref.key`
- `lib/admin/sector-route-mapping.ts` — DB TR → canonical EN (cam-yikama → bottle-washing)
- `lib/admin/sector-key-mapping.ts` — DB slug → camelCase sector_key dual-write helper
- `scripts/migrate-client-logos-to-storage.ts` — Phase B tsx script, `pnpm migrate:logos`
- Shell nav'a "Sektörler" + "Referanslar" eklendi
- ESLint `@next/next/no-html-link-for-pages` sebebiyle `<a>` → `<Link>` refactor (form cancel/back butonları)

### Deviations from Gate 1 plan (belgeli, onaylı)
- **T10 no-op**: `ReferenceCard` prop API korundu (logo + h3 başlık + sektör eyebrow); fallback chain T11 caller'da uygulandı (UX preservation — plan card'ı logo-only yapıyordu)
- **T11**: Sektör etiketleri + `SECTOR_NS_KEY` korundu (plan siliyordu)
- **T5 UUID regex**: zod v4 `z.string().uuid()` Postgres UUID'leri RFC 4122 sebebiyle reddediyor; custom `UUID_RE` (product.ts pattern'ı) kullanıldı
- **Shell.tsx nav pattern**: Horizontal `<NavLink>` (plan sidebar varsayıyordu)
- **Test fixtures**: `hero_color`, `created_at`, `updated_at` eklendi (strict Sector/Client Row type için)

### Known differences (Gate 2 follow-up)
- **MEDIUM — E2E coverage**: Mevcut specs smoke niteliğinde; gerçek form submit + upload + reorder swap assertion + revalidation freshness Plan 5c Part 2'de veya ayrı bir hygiene PR'da kapatılacak
- **LOW — Edit sayfası inline soft-delete**: Spec Section 4.4 inline soft-delete önermişti; şu an sadece liste sayfasında mevcut. User UX tercihi — follow-up

### Git state
- Main HEAD: `e5030bb` (pushed to origin)
- Local feature branch deleted (remote pruned)
- `SUPABASE_ACCESS_TOKEN` `~/.zshenv`'de persistent (bu session'da eklendi — ileride rotate etmek istersen `supabase login` veya dashboard)

---

### Session +1 preview (heads-up)
- **Plan 5c Part 2** (~3-4 sa): `/admin/settings/company` (`lib/company.ts` editöre) + catalog request analytics dashboard (Plausible + Supabase)
- **Gate 2 Medium follow-up** (~1-2 sa): E2E coverage genişletmesi — gerçek submit + upload + reorder swap assertion
- **Pipeline Tier 3** (~45-60 dk): CI parallel jobs + Playwright browsers cache → CI 9dk → 4-5dk
- **Secret rotate** (~30 dk): Coolify API token rotate + session'da transcriptte geçen `SUPABASE_ACCESS_TOKEN` rotate
- **Redis rate limit** (yalnızca trigger'lı): multi-instance'a geçiş + trafik 10x artış sonrası yeniden değerlendir
- **Plan 5b** (hukuk onayı sonrası): KVKK + cookie consent
- **Plan 5a Faz 3** (maddi hazır sonrası): GWS email
- **uuid moderate advisory** (opsiyonel): resend@6 → svix → uuid@10 transitive; resend major upgrade gerekebilir

**İlk sorusu:** "Plan 5c Part 1 canlıda (2026-04-24, squash e5030bb). Sıradaki: Plan 5c Part 2 — `/admin/settings/company` editör + catalog request analytics dashboard. Brainstorm'a başlayalım mı yoksa başka bir önceliğe mi dalalım (secret rotate, E2E hygiene)?"

---

## Proje Özeti

- **Şirket:** Kıta Plastik ve Tekstil San. Tic. Ltd. Şti. (Bursa, 1989'dan beri)
- **Hedef:** 4-dilli (TR/EN/RU/AR) hibrit B2B kurumsal site (vitrin + RFQ funnel + admin paneli)
- **Sektörler:** Cam yıkama · Kapak · Tekstil · Custom mühendislik
- **Repo:** https://github.com/berkayturk/kitaplastik (public, main branch, ~65 commit)
- **Domain:** kitaplastik.com (henüz Vercel'e bağlanmadı)
- **Working dir:** `/Users/bt/claude/kitaplastik`

## Planlama Dökümanları

| Dosya | Durum |
|---|---|
| `docs/superpowers/specs/2026-04-16-kitaplastik-website-design.md` | ✅ Onaylanmış spec (1081 satır, 20 bölüm) |
| `docs/superpowers/plans/2026-04-17-faz1-plan1-foundation.md` | ✅ Plan 1 tamamlandı (28 commit) |
| `docs/superpowers/plans/2026-04-17-faz1-plan2-i18n-3d-pages.md` | ✅ Plan 2 tamamlandı (35 task, ~38 commit) |

## Plan 1 ✅ — Foundation + Design System + Anasayfa İskelet

- Next.js 15.5.15 + React 19 + TS 5.9.3 strict + Tailwind 4.2.2 + shadcn/ui 4.3.0
- Industrial Precision design tokens, self-hosted Inter + JetBrains Mono
- Layout: Container + Header + Footer · Anasayfa: Hero + SectorGrid · 404 sayfası
- Supabase client/server + zod env validation
- Vitest + Playwright + ESLint + Prettier + Husky + lint-staged + GitHub Actions CI
- Vercel config, README

## Plan 2 ✅ — i18n + 3D Hero + Referanslar + 12 Public Sayfa

- **i18n:** next-intl 3.26.5, `[locale]` route segment, middleware, 4 dil (TR/EN/RU/AR, AR RTL), LocaleSwitcher, hreflang sitemap (48 URL), glossary.json (50+ teknik terim)
- **3D Hero:** R3F v9 + custom GLSL shader (perlin + flow + sparkle), lazy-loaded, prefers-reduced-motion/saveData/WebGL fallback → HeroFallback CSS gradient
- **Referanslar:** anasayfada above-the-fold ReferencesStrip (8 müşteri logosu, fold içinde görünür) + `/referanslar` detay sayfası
- **12 public sayfa × 4 dil = 48 statik route:** anasayfa, sektörler hub + 3 alt (cam-yikama, kapak, tekstil), urunler (placeholder notice), muhendislik, atolye, kalite, hakkimizda, iletisim, referanslar
- **Cilalı KitaLogo** inline SVG (placeholder değil)
- **Test:** 41 unit (Vitest) + 62 E2E (Playwright), CI yeşil

**Önemli runtime/version kararları:**
- next-intl **3.26.5** (v4 değil — v4 API breaking changes, plan v3'te kaldı). `hasLocale` v4-only → v3'te inline `isValidLocale` type guard.
- R3F **v9.6** (v8 React 19 ile uyumsuz). `@react-three/fiber@^9.6`, `drei@^10.7`, `three@^0.184`. Drei şu an kullanılmıyor — Plan 3'te veya sonra kaldırılabilir (~50-80 KB bundle tasarrufu).
- Hero `min-h-[72dvh]` (ReferencesStrip fold içinde görünür).
- `vitest.setup.ts`'ye matchMedia stub eklendi (useShouldReduceMotion için).

## Plan 3 ✅ — RFQ + Supabase + Admin Paneli (~35 commit, 2026-04-18 oturumu)

Kod tamamlandı. İki küçük manuel adım kullanıcıya bırakıldı (bkz. "Release — kullanıcı görevleri" alt başlığı).

**Kod özet:**
- **Supabase:** 4 migration (tablolar, RLS + `is_admin`/`is_admin_role` helpers, storage buckets, seed). `supabase/config.toml` + `supabase/README.md` eklendi. Hand-written `lib/supabase/types.ts` (uzak proje link olunca `supabase gen types` ile override edilecek).
- **Env:** `lib/env.ts` artık `env` (PublicEnv) + `serverEnv` (ServerEnv) iki ayrı export — browser bundle leak'i önleniyor. Yeni alanlar: `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_*`, `RESEND_*`. Ayrı iki export implementer adaptasyonu; plan `env.X` yazmıştı.
- **Primitives:** `lib/rate-limit.ts` (in-memory sliding-window), `lib/turnstile.ts` (siteverify), `lib/audit.ts` (error-swallowing), `lib/email/client.ts` (Resend), 4 template (contact/RFQ × team/customer, 4 dil customer).
- **Validation:** `lib/validation/contact.ts`, `lib/validation/rfq.ts` (zod v4, `customRfqSchema` + `standartRfqSchema`).
- **References migration:** `lib/references/data.ts` sync mock → async Supabase `clients` fetch. Interface sabit; `ReferencesStrip` artık async. Test file (`tests/unit/components/ReferencesStrip.test.tsx`) async pattern ile güncellendi; legacy `tests/unit/lib/references.test.ts` silindi.
- **Middleware:** `lib/supabase/middleware.ts` (session refresh) + root `middleware.ts` next-intl + Supabase + `/admin` guard kompozisyonu. `isAdminPublicPath` `/admin/login` ve `/admin/auth/callback` hariç.
- **Contact migration:** `/api/contact/route.ts` + `ContactForm.tsx` mailto → fetch. `TurnstileWidget.tsx` paylaşıldı (`components/rfq/`). i18n'den `fallbackNotice` kaldırıldı, 5 yeni key eklendi (4 dil).
- **RFQ:** `/api/rfq/route.ts` (kind discriminator), `FileUploader` (client-side Storage, UUID rename, 5×10MB), `CustomRfqForm` + `StandartRfqForm` + `ProductPicker` (free-text MVP), `/teklif-iste/*` 3 sayfa, `rfq.json` 4 dil, Header nav link + `nav.json` 4 dil.
- **Admin:** `lib/admin/auth.ts` (`requireAdmin`, `requireAdminRole`), `/admin/login` + server action, `/admin/auth/callback` route, `/admin` TR-only layout + Shell, `/admin/inbox` list + `/admin/inbox/[id]` detail (status change, notes, signed URL ekler), `/admin/ayarlar/bildirimler` CRUD. `/api/rfq` dinamik recipient routing (fallback `serverEnv.RESEND_TEAM_EMAIL`).
- **E2E:** 4 Playwright spec (contact, RFQ custom, RFQ standart, admin login gate); admin authenticated flow `test.skip` (Plan 4'te programatik login hook).
- **CI:** build + E2E job'larına Plan 3 env placeholder'ları eklendi (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, vs.).

**Test özeti:** 73 unit test geçiyor (22 dosya). Typecheck temiz. Build temiz; `/admin`, `/admin/login`, `/admin/auth/callback`, `/admin/inbox`, `/admin/inbox/[id]`, `/admin/ayarlar/bildirimler`, `/api/contact`, `/api/rfq`, `/[locale]/teklif-iste(/ozel-uretim|/standart)` route'ları derlendi.

**Önemli kararlar & caveats:**
- Rate limit in-memory (MVP); Vercel multi-instance'ta kısmi → Plan 4 Upstash Redis upgrade.
- Admin TR-only (`NextIntlClientProvider` manuel TR locale).
- File upload client-side direct Storage; path validation yok (Turnstile + rate limit + audit ile katmanlı).
- `products`/`sectors` tablolar Plan 3'te **oluşturuldu ama CRUD yok** (Plan 4). Şu an public `/urunler` placeholder, içerik Supabase Studio ile manuel eklenebilir.
- Standart RFQ `ProductPicker` free-text MVP; Plan 4'te catalog-backed picker.
- Login page `useSearchParams` → `<Suspense fallback={null}>` wrap edildi (Next 15 static rendering gereksinimi).
- `tests/e2e/*` ve `tests/unit/components/ReferencesStrip.test.tsx` güncellendi/yeniden yazıldı.

### Release — kullanıcı görevleri (manuel)

1. **Supabase uzak proje oluştur** (Plan Task 6):
   - dashboard.supabase.com → new project (region `eu-central-1`, kuvvetli şifre → 1Password)
   - `pnpm exec supabase login`
   - `pnpm exec supabase link --project-ref <ref>`
   - `pnpm exec supabase db push` (4 migration → remote)
   - `pnpm exec supabase gen types typescript --linked > lib/supabase/types.ts` (hand-written dosyayı override eder)
   - `.env.local`'e gerçek `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` yaz
2. **İlk admin kullanıcı** (Plan Task 26):
   - Supabase Dashboard → Authentication → Users → `berkayturk6@gmail.com` ekle (auto-confirm)
   - UUID kopyala, `pnpm exec supabase db psql --linked -c "insert into public.admin_users (user_id, role, display_name) values ('<uuid>', 'admin', 'Berkay') on conflict (user_id) do update set role='admin';"`
   - Dashboard → Auth → Email provider **enable**, Sign ups **disable**
   - Email templates → Magic Link template → `{{ .SiteURL }}/admin/auth/callback?code={{ .TokenHash }}&type=magiclink`
3. **Cloudflare Turnstile prod key'leri** (Plan Task 39):
   - cloudflare.com → Turnstile → new site (domain: kitaplastik.com)
   - Site key + secret key
4. **Resend domain verify** (Plan Task 39):
   - resend.com → Domains → kitaplastik.com (DNS kayıtlarını DNS'e ekle)
   - API key oluştur
5. **Vercel env** (Plan Task 39): Production + Preview'a tüm env'leri gir (gerçek Supabase + Turnstile + Resend değerleri, `RESEND_FROM_EMAIL=noreply@kitaplastik.com`, `RESEND_TEAM_EMAIL=info@kitaplastik.com`).
6. **Supabase Auth Site URL & Redirect URLs:** Settings → Auth → Site URL: `https://kitaplastik.com`; Redirect URLs: `https://kitaplastik.com/admin/auth/callback` + Vercel preview pattern.
7. **Manuel smoke** (Plan Task 41): dev veya preview'da 4 akışı gerçek e-posta ile test et — contact form submit, custom RFQ + file upload, standart RFQ, admin magic link → inbox → status update.

## Redesign: Light "Refined Industrial" ✅ (2026-04-18 aynı oturum, feature branch `redesign/light-refined`)

Dark "Industrial Precision" palette terk edildi. `v0.2-dark-industrial` tag'inde son görüntüsü mevcut.

- **Phase 0** — 5-site WebFetch araştırması (`.planning/research/redesign-inspiration.md`): Hermle AG production template olarak belirlendi; "specificity over emotion" kopya patterni; hero strategy flip (photo-first, Spline ikincil progressive enhancement).
- **Phase 1** — `app/globals.css` v2: 22 token (bg-primary #FAFAF7 warm paper, ink #0A0F1E, cobalt #1E4DD8, jade #0FA37F). Self-hosted `next/font/local` → `next/font/google` variable fonts: **Fraunces (display, opsz axis)** + **Hanken Grotesk (body)** + **JetBrains Mono (mono)**. `/design-debug` internal render-test sayfası (`noindex,nofollow`; 10 bölüm). Cyrillic sınırı: Fraunces next/font types'ta yok → RU locale display serif system fallback.
- **Phase 2** — 8 token-driven primitive (`components/ui/`): Button (4 variant × 3 size + asChild + loading spinner), Badge, Card + CardEyebrow/Title/Body/Footer, Divider, Field helpers + TextField + TextArea + SelectField, Checkbox. Modal/FileUploader/Dropdown/Radio Phase 5+'da.
- **Phase 3** — Shell yeniden tasarımı: `<SiteBackground />` FBM canvas silindi, yerine Tier 1 static CSS mesh gradient + 2% SVG grain (body::before/::after). Header 72px bg-primary hairline bottom; Footer bg-ink 4 kolon Fraunces başlıklar; LocaleSwitcher mono code dot-separated (TR · EN · RU · AR) cobalt underline on active; WhatsAppFab hover:scale kaldırıldı.
- **Phase 4** — Hero Fraunces serif headline + italic cobalt accent + 4-KPI mono tabular figure stack (36 yıl · 3 sektör · 4 dil · ±0.02 mm). SectorGrid `<Card interactive>` ile numbered eyebrow + spec row. ReferencesStrip bg-subtle + grayscale logos + hover-to-color.
- **Phase 5** — `/admin/login` Card + TextField + Button primitive ile; admin `Shell` bg-secondary main, Fraunces lockup, cobalt active nav, mono user strip.
- **Phase 7 cleanup** — `components/three/*` tamamen silindi (6 dosya), `public/fonts/*.woff2` (self-hosted Inter + JBMono) silindi, R3F + drei + three + @types/three pnpm'den kaldırıldı. Bundle `-3 major` (~300KB).

**Regex feedback validated** — Hero test'inde Turkish `İ` için regex `/i` flag kullanılamadığından pattern'e direkt `İ` yazıldı (memory feedback).

**`/design-debug` route hâlâ korunuyor** — internal tool; noindex; ileride istenirse silinir.

**Kalan iş — Plan 4 (backend CRUD + SEO + Analytics) ayrı çalışma:**
- `/admin/urunler` + `/admin/sektorler` CRUD (4-dil tab, görsel upload)
- `/admin/ayarlar/sirket` + `/admin/ayarlar/sablonlar`
- Müşteri RFQ tracking sayfası `/[locale]/rfq/[uuid]/`
- Upstash Redis rate limit upgrade
- SEO: Schema.org Organization/Product, OG image generator
- Plausible analytics, Sentry, Lighthouse audit
- Admin authenticated E2E programatik login hook
- (İsteğe bağlı) Spline frosted polymer cap Tier 2 hero object
- (İsteğe bağlı) Fraunces Cyrillic için Noto Serif / IBM Plex Serif RU fallback

## Stratejik Kararlar (sürdürülecek)

- **Pragmatic batch mode subagent-driven-development:**
  - Mekanik task'lar (config, install, static content): tek implementer batch (birden fazla task) + self-review by controller
  - Medium task'lar (components, pages, integration): tek implementer + combined review (tek reviewer subagent)
  - Logic-heavy task'lar (TDD component, shader, migration): tam 3-stage review (implementer + spec reviewer + quality reviewer)
  - Plan 2'de 35 task ~8 subagent dispatch ile tamamlandı (batch'ler verimli oldu)
- **Her task için:** Context7/latest docs check + best practices + security awareness + TDD discipline + conventional commits
- **Türkçe regex caveat:** JS `/i` flag `İ ↔ i`, `I ↔ ı` case-fold YAPAMAZ. Pattern ve text aynı case'de tutun.
- **Design tokens:** Industrial Precision palette → `bg-bg-primary`, `text-text-primary`, `text-text-secondary`, `border-[var(--color-border-subtle-dark)]`, `bg-[var(--color-accent-red)]`. Generic Tailwind isimleri (`bg-background`, `text-foreground`) KULLANMA.
- **Plan sapmaları:** Implementer plan'dan saparsa (örn. version pin, framework constraint), implementer kendi raporunda flag eder; orchestrator plan dokümanını veya memory'yi günceller.

## Post-Plan-2 Polish (2026-04-18 oturumu)

Plan 2 ve Plan 3 arasında yapıldı:
- **i18n sızıntıları temizlendi:** Footer legal name satırı, Header home aria-label, LocaleSwitcher aria-label, `[locale]/not-found.tsx`, RU/AR iletisim adresleri → tümü 4 dilde
- **Yeni anahtarlar:** `common.footer.legalName`, `nav.home`, `pages.contact.details.cellPhoneLabel`, `pages.contact.whatsapp.*`, `pages.contact.telegram.*`, `pages.contact.form.*`
- **İletişim sayfası komple yeniden yazıldı** (`/iletisim`):
  - Kartvizitten gerçek şirket bilgileri → `lib/company.ts` (single source): adres, sabit tel, cep tel, faks, 2 e-posta, web, WhatsApp, Telegram
  - Layout: 2-col split (5/12 + 7/12), scroll-free tek viewport
  - Sol: 2 messaging kart (WA + TG, yan yana her ekranda) + kompakt ikonlu info listesi (renkli paletle: red/emerald/violet/blue/amber/cyan)
  - Sağ: Compact form (`components/contact/ContactForm.tsx`, mailto tabanlı, Ad+Firma/E-posta+Tel 2-col rows, textarea rows=4)
  - Linkler: 📍 Google Maps, 📞 tel: (phone + cellPhone slash-separated tek satırda), ✉️ mailto:
  - WhatsApp FAB tüm sayfalarda (`components/contact/WhatsAppFab.tsx`, layout'a eklendi, RTL'de sol alt)
  - WhatsApp handle: `905322371324`, Telegram handle: `kitaplastik` (placeholder — gerçek değerlerle güncellenecek)
- **Hero title değişti:** "Projenizi konuşalım" → "Bizimle iletişime geçin" (4 dil)

**Önemli:** Contact form şu an mailto tabanlı — Plan 3'te Resend/SMTP API endpoint'e upgrade olacak. `COMPANY.email.primary = info@kitaplastik.com` form destination.

## Konum: Redesign ✅ + Ambient 3D ✅ + LocaleSwitcher fix ✅ (2026-04-18 son oturum)

**Nerede kaldık:**

- Light Refined Industrial redesign tamamen merge edildi main'e (52 commit origin/main önünde, push yok).
- Tag: `v0.2-dark-industrial` (rollback için dark snapshot).
- 72/72 unit test ✓, typecheck temiz, `/design-debug` canlı internal tool olarak duruyor.
- Ambient 3D şu an 3 orb (cobalt/jade/amber wash) 60sn/tur, görünür ama sakin.
- LocaleSwitcher plain `<a>` ile full-page navigation — root path bug fix.

**Kullanıcının test etmediği / henüz bakmadığı şeyler (yeni session'da geri dönebilir):**

- Gerçek tarayıcıda mobile + tablet + desktop breakpoint'leri
- 4 locale (TR/EN/RU/AR) tam walk-through, özellikle AR RTL
- Tab/keyboard navigation focus ring'leri
- `prefers-reduced-motion` açık → ambient canvas mount olmuyor fallback çalışıyor mu
- `pnpm build` (production build) — lokalde henüz çalıştırılmadı
- `pnpm exec playwright test` — Plan 3 E2E spec'leri redesign sonrası regression var mı belirsiz (text/selector değişmiş olabilir)

**Şu an bloklayan (gerçek creds lazım):** contact submit, RFQ submit, file upload, admin magic-link, admin inbox gerçek data, ReferencesStrip logoları Supabase fetch.

## 2026-04-19 — Config session follow-up (bu oturum)

Admin login aşaması tamamlandı, 5 commit atıldı, branch origin'den 58 commit önde (push yok).

**Yapıldı:**

- **Supabase uzak proje** (Release task 1) — `kitaplastik-prod` ref `sthwxiqtpafyjbevzkiq`, eu-central-1, **free tier**. 4 orijinal migration + 2 identity fix migration uygulandı. TS tipleri `lib/supabase/types.ts` regen edildi. Credentials `.env.local`'da. Dashboard: https://supabase.com/dashboard/project/sthwxiqtpafyjbevzkiq
- **İlk admin kullanıcı** (Release task 2) — `berkaytrk6@gmail.com` (u SUZ — doğru adres; eski RESUME `berkayturk6` yazıyordu, hatalıydı). Admin_users satırı seeded, identity.email_verified=true. Password login'e geçildi (aşağı bkz).
- **Auth config** (Release task 6) — site_url, uri_allow_list (localhost + `*.vercel.app` + prod), disable_signup=true, magic link template custom. Password flow bunlarla çakışmıyor.

**Magic link → password login switch:**

- Sebep: Supabase built-in SMTP free tier 2 mail/saat limit, `admin.createUser({email_confirm:true})` SDK quirk (`identities.identity_data.email_verified` false kalıyor), GoTrue 2.163+ bu flag false ise OTP reddediyor. Tek-kullanıcı admin için password daha pratik.
- Yeni flow: `app/admin/login/{page.tsx,actions.ts}` — `signInWithPassword` + server-side `redirect('/admin/inbox')`. `app/admin/auth/callback/route.ts` hem PKCE `code` hem non-PKCE `token_hash+type` handle ediyor (unused fallback).
- Credentials `.env.local` → `ADMIN_EMAIL`, `ADMIN_PASSWORD` (sadece referans, hash Supabase'de).
- Admin login test edildi, `/admin/inbox` + `/admin/ayarlar/bildirimler` çalışıyor.

**Idempotent Supabase fix migration'ları (proje reset edilse de doğru duruma geliyor):**

- `20260419080000_fix_email_identity_verified.sql` — `identity.email_verified` false satırlarını true yapar.
- `20260419150000_fix_admin_email_and_identity.sql` — `identity.email`'i `users.email` ile sync eder + `notification_recipients` typo fix.

**Diğer fix'ler:**

- `components/layout/KitaLogo.tsx` — SVG `direction="ltr"` (AR RTL'de Latin text flip fix).
- `components/admin/InboxTable.tsx` — empty state'te de kolon başlıkları görünür.
- `messages/{tr,en,ru,ar}/nav.json` + `components/layout/Footer.tsx` — silinmiş `muhendislik/atolye/kalite` ref'leri temizlendi.
- `app/admin/login/actions.ts` — error code-specific Türkçe mesajlar (429 rate limit, invalid_credentials, vb.).

**Test edilmeyen / senin manuel yapacakların:**

- Public site walkthrough (4 locale, AR RTL, responsive, ambient 3D, keyboard nav) — önceki oturum listesi geçerli.
- Release task 3 Cloudflare Turnstile (bloklar contact/RFQ submit'i)
- Release task 4 Resend domain verify (bloklar tüm email gönderimini, Supabase built-in SMTP de zaten yetmez)
- Release task 5 **host seçimi + deploy (Vercel KULLANILMAYACAK — güven sorunu; alternatifler: Cloudflare Pages, self-host VPS, Netlify vs.)** + env transfer
- Release task 7 Manuel smoke (contact form, custom RFQ + file upload, standart RFQ)

## 2026-04-20 — İlk production deploy ✅

**Site CANLI:** `https://kitaplastik.com` + `https://www.kitaplastik.com` (307 → `/tr`, HTTP/2 + h3, Let's Encrypt SSL).

- **Domain:** CF Registrar, Berkay hesabında (abi hesabından "Move domain" ile transfer). NS: `denver` + `irma`. A @ + www → `188.245.42.178` (DNS only).
- **Host:** Hetzner cx33 (`188.245.42.178`) + Coolify (`https://coolify.brtapps.dev/`). Nixpacks auto (Node 24 kurdu, 22'ye pin Plan 4).
- **Deploy commit:** `7eadaf1`. `cbc8874` (design-debug prod guard + favicon + robots update) push edildi ama **redeploy bekliyor**.
- **Turnstile prod key:** site + secret CF'de oluşturuldu; Coolify env'de. Secret chat'te paylaşıldı — Plan 4'te rotate.
- **Resend:** şimdiki FROM ile çalışıyor; `noreply@kitaplastik.com` için domain verify sonraki iş.
- **Memory güncellendi:** `project_kitaplastik.md` + 2 yeni feedback (`cf_registrar_same_account`, `coolify_nixpacks_env`).

## 2026-04-21 — Plan 4a URL migration ✅ + Auto-deploy kuruldu

**Durum:** Plan 4a MERGED, canlıda aktif (PR #1 squash → `d01f1bc`). 10 commit + 1 baseline fix + 1 auto-deploy workflow. Coolify auto-deploy GitHub Actions webhook ile kuruldu.

### Plan 4a sonucu (canlıda doğrulandı)

- TR public route'lar → İngilizce slug'lar: `/urunler → /products`, `/sektorler → /sectors`, `/referanslar → /references`, `/hakkimizda → /about`, `/iletisim → /contact`, `/teklif-iste → /request-quote` (+ 3 sektör alt + 2 teklif-iste alt)
- 12 public + 1 admin 308 redirect'i `next.config.ts`'de (eski TR URL'ler → yeni EN slug'lara permanent redirect)
- Admin: `/admin/ayarlar/bildirimler → /admin/settings/notifications`
- `lib/seo/routes.ts` PUBLIC_ROUTES EN slug'lar → sitemap + hreflang otomatik güncel
- Internal `<Link>` tamamen migrated (Header, Footer, LocaleSwitcher, home, teklif-iste, admin Shell, actions.ts)
- E2E `url-redirects.spec.ts` (45 test, GREEN)
- Baseline CI fix: `smoke.spec.ts` `/` → `/tr` explicit, Supabase placeholder koşullu `test.skip` (references/rfq specs)

**Canlı smoke 10/10 geçti** (commit `d01f1bc` deploy sonrası): 6× TR→EN 308, 5× EN 200, admin redirect, sitemap EN slug'lar.

### Auto-deploy kurulumu (bu oturum yeniliği)

**Sorun:** Coolify UI'de "Automatically deploy new commits based on Git webhooks" toggle AÇIK olmasına rağmen `gh api repos/.../hooks` boş dönüyor — Coolify self-hosted, public repo source tipinde **webhook'u GitHub'a fiilen kurmamış**. Toggle effektif değildi.

**Çözüm:** GitHub Actions `workflow_run` → Coolify `/api/v1/deploy` webhook. `.github/workflows/deploy.yml` (commit `e096896`):
- `workflow_run: CI completed on main` → CI success ise Coolify'a curl
- **CI-gated deploy**: kırık commit canlıya gitmez (baseline CI fiyaskosu tekrar etmez)
- GitHub Secrets: `COOLIFY_TOKEN`, `COOLIFY_DEPLOY_URL`
- Coolify webhook URL: `https://coolify.brtapps.dev/api/v1/deploy?uuid=hmvzgaqgqy4ctrjog20laymu&force=false`

**Güvenlik borcu:** Coolify API token chat'e yazıldı (`1|D5aQv8w4...`). **Rotate edilmeli**: Coolify → Keys & Tokens → eski token'ı delete, yeni oluştur → `gh secret set COOLIFY_TOKEN --body '<yeni>'`.

### 2026-04-21 (devam) — Admin login fix + Node pin + Turnstile/Resend + Supabase plugin MCP

**Admin login debug + fix** (SQL reset):
- Canlıda login 400 `invalid_credentials` dönüyordu (berkaytrk6@gmail.com, referer `https://kitaplastik.com`, auth logs'tan teyit)
- Teşhis: user state tamamen sağlıklı (email_confirmed, identity_email sync, admin role) → sadece password hash mismatch (user şifreyi yanlış hatırlıyor/stale not)
- Fix: Dashboard SQL Editor → `UPDATE auth.users SET encrypted_password = crypt('<yeni-şifre>', gen_salt('bf')), updated_at=now() WHERE id = '<uuid>' RETURNING email, updated_at;`
- User şifreyi **kendi** query'de yazdı (chat'e düşmedi), 1Password'e kaydetti, login ✅
- **Öğrenme:** `auth.admin.updateUserById({password})` yerine direct SQL UPDATE + bcrypt `crypt('<pw>', gen_salt('bf'))` pattern hızlı ve chat'e düşmeden uygulanabilir.

**Supabase MCP auth çökmesi** (resolved):
- Default Supabase MCP (Claude Code'un kurduğu) 401 döndü, `mcp-health-check` cooldown ile bloklandı (standard,strict mode)
- CLI `supabase login --linked` da 401 — access token expire
- Non-TTY ortamda `supabase login` interactive OAuth desteklemez
- **Çözüm:** `/plugin` ile `supabase` plugin MCP kuruldu (claude-plugins-official). Plugin'in kendi OAuth akışı sağlıklı çalıştı (localhost callback pattern, user browser onay). Default MCP yerine plugin artık kullanılıyor.
- Pattern: default MCP 401 veriyorsa önce plugin'e geç, OAuth yenile, default MCP'yi silmek opsiyonel.

**Node 22.22.2 pin** (commit `2af9273`):
- `.nvmrc`: `22` → `22.22.2` (tam semver)
- `package.json` engines.node: `>=22` → `>=22.22.2 <23`
- Coolify env: `NIXPACKS_NODE_VERSION=22.22.2` eklendi (redundant safety, primary control)
- Nixpacks artık 24 fallback yerine 22.22.2 indirir; canlıda ETag değişimi doğrulandı

**Turnstile secret rotate** (Coolify env sadece — kod değişikliği yok):
- CF Turnstile dashboard → Rotate → yeni secret → Coolify `TURNSTILE_SECRET_KEY` update → auto-deploy redeploy ile aktif
- Eski (chat'te leak olan) secret CF rotate ile invalidate oldu

**Resend domain verify + branded FROM**:
- Resend → `kitaplastik.com` eklendi, region EU West (Dublin)
- CF DNS: MX `send` → `feedback-smtp.eu-west-1.amazonses.com` (pri 10), TXT `send` SPF (`v=spf1 include:amazonses.com ~all`), TXT `resend._domainkey` DKIM public key
- Resend Verified ✅
- Coolify env `RESEND_FROM_EMAIL` = `noreply@kitaplastik.com`
- Canlıda auto-deploy ile aktif; contact/RFQ mail artık branded sender kullanıyor
- **Not:** Root `@` için SPF TXT EKLENMEDİ — Google Workspace gelince birleşik SPF string olarak (google + amazonses include'ları) root'a eklenecek. Şu an sadece `send.` subdomain için SPF var.

### CF proxy + Let's Encrypt DNS-01 (ERTELENEN İŞ, ~20-25 dk)

Orange cloud + SSL Full (strict) açmak için **önce** Coolify Traefik cert challenge'ını DNS-01'e migrate etmek lazım, yoksa 60-90 gün sonra Let's Encrypt HTTP-01/TLS-ALPN-01 CF proxy tarafından intercept edilir → renewal fail → site HTTPS down.

**Güvenli sıra:**
1. CF → My Profile → API Tokens → "Create" → scope: `Zone:DNS:Edit`, zone: `kitaplastik.com` → token al
2. Coolify Server Settings → Traefik env: `CF_API_TOKEN` + DNS-01 challenge config (Coolify v4 dokümanı: `traefik.acme.dnschallenge.provider=cloudflare`)
3. Traefik'i restart + manuel cert renewal trigger → DNS-01 ile başarılı olduğunu doğrula
4. **Sonra** CF DNS → A records (@ + www) Proxy ON (orange cloud)
5. CF SSL/TLS → Overview → Full (strict)
6. Test: `curl -sI https://kitaplastik.com` → `server: cloudflare`, Next.js 200

Bu bir ayrı "infra session" olarak ele alınacak. Ayrı oturumda ~20-25 dk.

### Next session — Plan 4b başlar

Spec: `docs/superpowers/specs/2026-04-21-plan4b-admin-products-crud-design.md`. `superpowers:writing-plans` → PLAN.md → `superpowers:subagent-driven-development`.

Kapsam: `/admin/products` CRUD (liste + yeni + düzenle + sil/geri yükle) + 4 dil tab (TR zorunlu, EN/RU/AR opsiyonel "boşsa gösterme") + 10 preset özellik + ana görsel + galeri upload + public `/products` grid + `/products/[slug]` detay + RFQ picker catalog-backed. **Auto-translate yok** (user: Türkçe elle yaz, diğer dilleri manuel yapıştır).

## 2026-04-21 (devam 2) — Plan 4b spec + PLAN.md hazır, execution bekliyor

Bu oturumda brainstorm + planlama tamamlandı. Kod değişikliği yok — 2 docs commit.

### Brainstorm (6 soru → 6 karar)

Spec'in "Brainstorm Kararları" bölümü full tabloya sahip. Kısaca:

1. **Slug:** ilk kayıtta TR'den auto, sonra kilitli + opt-in "Slug'ı düzenle" toggle
2. **Spec builder:** preset unique (dropdown'da eklenmiş disabled), çoklu değer tek hücrede virgülle
3. **Alt text:** admin girmez; runtime fallback `name[locale]` + `common.productImageLabel` (4 dilde)
4. **"Benzer ürün ekle":** metin + görseller Storage.copy() yeni UUID path'lere; edit mode'da açılır
5. **Sıralama:** yukarı/aşağı ok butonları (görsel + spec)
6. **RFQ ProductPicker:** katalog-only + empty state → özel üretim formu linki

### Dosyalar

- Spec: `docs/superpowers/specs/2026-04-21-plan4b-admin-products-crud-design.md` (commit `d7f9e62` — brainstorm kararları inline işlendi + consolidation tablosu eklendi)
- **Plan:** `docs/superpowers/plans/2026-04-21-faz1-plan4b-admin-products-crud.md` (commit `84e01b0`, 3202 satır, 28 bite-sized task TDD-per-task)

### Plan task özeti (28 task, ~3-5 gün)

- **Foundations (T1-6):** i18n key + alt-text helper, XSS-safe json-ld helper, slugify (TR-aware), uniqueSlug helper, 10 preset, Zod schemas
- **Server actions (T7-10):** create/update/softDelete/restore/cloneProduct (Storage.copy + rollback)
- **Admin components (T11-17):** SlugField, SpecBuilder, ImageUploader, LocaleTabs, ProductForm, Delete/Restore/Clone buttons, ProductList
- **Admin pages (T18-19):** list + Shell nav update, new + edit
- **Public (T20-23):** ProductCard/Grid, Gallery/SpecTable/Detail, /products grid, /products/[slug] detay
- **RFQ (T24):** ProductPicker catalog autocomplete + empty state
- **E2E (T25-27):** programmatic login helper + 7 spec
- **Deploy (T28):** CI → Coolify auto-deploy → canlı smoke

Her task self-contained: exact file paths, full code blocks, TDD cycle (failing test → implement → passing test → commit), dependency map plan sonunda.

### Kritik bulgular

1. **Coolify "Public Repository" source tipinde webhook otomatik kurulmaz.** Toggle UI'de açık gözükebilir ama GitHub'a gerçek webhook inject etmez. Debug: `gh api repos/<owner>/<repo>/hooks` → boşsa toggle çalışmıyor demek.
2. **GitHub Actions `workflow_run` → Coolify `/api/v1/deploy` pattern'ı** daha iyi: git history'de görünür, CI-gated, secret'lar managed.
3. **Baseline E2E fail'leri** env koşullu `test.skip(!hasRealSupabase)` pattern ile yumuşatıldı. Kalıcı fix CI config'ine gerçek Supabase anon key + public env eklemek (ayrı iş).

### Dosyalar
- PR #1 MERGED (squash `d01f1bc`); feat branch silindi
- Auto-deploy workflow: `.github/workflows/deploy.yml` (commit `e096896`)
- Spec + plan dosyaları: merge içinde (Plan 4a PR)
- Memory: `feedback_basit_scope_split.md` (önceki oturum) + bu oturum yeni: `feedback_coolify_autodeploy_via_gha.md`

## 2026-04-21 (devam 3) — Plan 4b kod canlıda, smoke + security audit aşaması

**Durum:** Plan 4b execute tamamlandı. 38 commit main'e push edildi (`8b64d53..eb2de24`). GHA → Coolify auto-deploy tetiklendi.

### Ne bitti

- 28 task (T1-T28) subagent-driven pattern ile: implementer → spec review → code quality review → fix
- 38 commit: 28 feat/test + 10 fix (code-review bulguları)
- Local green: typecheck ✓, vitest 108/108 ✓, lint clean ✓, build ✓ (4 locale products SSG + dynamic slug + 3 admin routes)
- 5 ürün route'u derlendi: `/[locale]/products` (4 locale SSG), `/[locale]/products/[slug]` (dynamic), `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`
- 10 code-review fix inline: security/a11y/TS strict/i18n/UX düzeltmeleri

### Final fix turu (user: "her şeyi fixle öyle pushla")

4 ek commit (Plan 4b review'larda yakalanan):
- SpecBuilder `role="option"` → `role="menuitem"` (jsx-a11y + ARIA ownership düzeldi)
- `listProducts` search param drop (UI filter client-side zaten yapıyor — dead code temizlik)
- `ProductDetail` "Teknik Özellikler" → `specsLabel` prop + 4 locale translation
- RFQ `ProductPicker` i18n restore (10 yeni key × 4 locale, eskiden hardcoded TR idi)

### Şu an nerede (WIP — smoke bekliyor)

- Deploy ~2-3dk içinde Coolify'da canlı olur
- T28 canlı smoke kalan (plan'da Step 3-4 listesi var — admin CRUD 4 locale × clone × delete/restore × RFQ picker empty state × Schema.org JSON-LD kontrolü)
- RESUME "Plan 4b ✅" entry smoke sonrası (plan'da T28 Step 6 template hazır)

## 2026-04-22 — Plan 4b ✅ TAMAMLANDI — canlıda, smoke geçti

**Durum:** 11 smoke adımı geçti, 2 canlı-tespit bug fix'lendi, 49 commit canlıda + migration prod DB'de.

### Final commit count (Plan 4b tüm saga)

`8b64d53..HEAD` = **49 commit** — 28 task + 10 code-review fix inline + 4 polish + 7 security/CI fix.

### Canlı-tespit bug'lar (user smoke sırasında buldu)

1. **URL 404** (`/tr/request-quote/ozel-uretim` "Sayfa bulunamadı"): ProductPicker empty-state link'inde + ProductDetail CTA'sında locale-aware olmayan hardcoded path. Fix `9f31176`: locale === "tr" ? TR pretty path : EN canonical. next.config Plan 4a redirect'i TR pretty → canonical dönüştürüyor.
2. **Slug edit'te tire girilemiyor**: `slugify()` onChange'te trailing dash'i hemen silerek kullanıcıyı input'a karakter yazdırmaz etmişti. Fix `9f31176`: `slugifyDraft()` yeni export — tire preserve, onChange'te permissive; `slugify()` sadece onBlur'da tam temizlik.

### Coolify deploy saga (aksaklık + workaround)

Deploy webhook URL `force=false` ile kuruluydu (`feedback_coolify_autodeploy_via_gha.md` ref). İlk iki yeni deploy (`9f31176` + `417acf6`) build cache'e çarpıp prod container'ı güncellemedi. Son deploy manuel trigger (veya Coolify cache expire) sonrası oturdu. **TODO (follow-up):** GHA secret `COOLIFY_DEPLOY_URL`'i `force=true` ile güncelle — yoksa her deploy'da bu yaşanabilir.

### Prod DB (migration 20260421200000 applied)

`pnpm exec supabase db push` ile uygulandı:
- Param-less `is_admin()` / `is_admin_role()` — SECURITY DEFINER + `(select auth.uid())` + search_path locked
- 11 RLS policy yeniden kuruldu (memoization)
- `authenticated insert audit_log` dead+dangerous policy drop
- 3 bucket için `file_size_limit` + `allowed_mime_types` (product-images / rfq-attachments / sector-images)
- rfq-attachments path traversal regex (UUID prefix + whitelisted ext)
- 4 perf index (`(active, display_order)`, `sector_id`, `assigned_to`, `notification_recipients(active)`)

### Programmatic smoke sonuçları (anon RLS)

- 4 locale `/products` → 200 ✓
- Security headers aktif (CSP, HSTS, X-Frame, Permissions, Referrer, X-Content-Type) ✓
- Anon sectors read → 200 content-range `0-0/3` ✓
- Anon rfqs/audit_log/admin_users SELECT → `[]` (RLS filter) ✓
- Anon POST audit_log → **401** ✓ (spoof kapandı)
- rfq-attachments badpath.txt → **400** ✓
- rfq-attachments UUID/test.txt (bad ext) → **400** ✓

### Browser smoke sonuçları (user yaptı)

Adım 1-11 hepsi geçti: admin login + Ürünler nav + yeni ürün (TR spec görsel) + liste görünür + JSON-LD var + EN tab + boşsa gösterme (ru/ar'da görünmez) + clone (-kopya suffix) + slug toggle uyarı + sil/restore + autocomplete + empty-state → özel üretim link ✓

### Plan 4b kapsam DIŞI (Plan 4c / follow-up adayları)

1. **Custom RFQ form (özel üretim)** end-to-end re-smoke — Plan 3 feature, theoretically migration'dan etkilenmedi ama end-to-end validation yapılmadı
2. **next-intl v3 → v4** breaking upgrade (GHSA-8f24-v5vv-gm5j open redirect). Mevcut CSP + auth callback fix attack surface'i büyük ölçüde kapattı. Defer.
3. **Structured logger** (Sentry SDK) — `console.error` yerine prod'da. NEXT_PUBLIC_SENTRY_DSN schema'da var, kod tarafı bağlanmadı.
4. **next-intl pathnames mapping** — TR kullanıcısı URL'de İngilizce slug görmesin diye (`/tr/request-quote/custom` → `/tr/teklif-iste/ozel-uretim`). Şu an redirect sayesinde çalışıyor ama canonical URL İngilizce. SEO-pretty-URL fix.
5. **`exactOptionalPropertyTypes`** tsconfig strictness
6. **Notification page** `as unknown as Recipient[]` cast — Supabase generated types sync edilince temizlenir (`supabase gen types typescript --linked > lib/supabase/types.ts`)
7. **Coolify webhook `force=true`** — yukarıdaki deploy saga'yı önler
8. **Smoke test ürünü** — admin panelinden hard-delete (Silinmiş → DB row). Storage path'leri `product-images/smoke-test-*` da silinebilir.
9. **Admin `id` middleware admin_role check** — defense-in-depth (H4-db). Şu an page-level `requireAdmin()` yeterli, ama edge middleware'de check eklemek brief expose window'unu kapatır.
10. **Tire sonrası whitespace/strip UX** — SlugField onBlur'da `slugify()` trailing tire temizliyor, ama user typing flow'unda görülebilir bir glitch olmayacak.

### Security audit kararı

Smoke test ÖNCESİ user'ın talebiyle comprehensive security audit başlatıldı:
- `security-review` skill (branch diff)
- `security-reviewer` agent (OWASP)
- `database-reviewer` agent (Supabase RLS)
- `typescript-reviewer` agent (TS-specific)
- `pnpm audit` (dep vulns)
- Grep for hardcoded secrets

Bulgular (synthesized ve fix edildi — 6 commit):

- **CRITICAL (2)**: public pages anon client'a geçti (C1 — RLS bypass kapandı); rfq-attachments path traversal regex constraint ile kapandı (C2 — migration'da UUID prefix + whitelisted extension).
- **HIGH (9)**: open redirect auth/callback `next` fix; UUID assertion tüm admin action'lara eklendi (`updateProduct` / `softDeleteProduct` / `restoreProduct` / `cloneProduct` / `updateStatus` / `saveNotes` / `toggleRecipient` / `removeRecipient`); audit_log INSERT policy drop (service client yazar, policy attack surface); `insertedId!` definite-assignment narrow edildi; error boundaries (public + admin); RLS memoization — param-less `is_admin()` / `is_admin_role()` helpers + `(select auth.uid())` + SECURITY DEFINER + search_path locked.
- **MEDIUM (12)**: env server/client split + `"server-only"` pragma (`lib/env.client.ts` yeni, `lib/env.ts` server-only); CSP + HSTS headers vercel.json; `app/design-debug/` silindi + middleware bypass temizlendi; bucket limits (file_size + allowed_mime_types: product-images 10MB jpeg/png/webp, rfq-attachments 10MB pdf+images+office+step+iges, sector-images 10MB image); ilike wildcard escape (%, _, \\); clone storage copy hata mesajı sanitize; password trim kaldırıldı; softDeleteProduct/restoreProduct existence check; addRecipient `z.string().email()` validate; redundant `as AdminUser["role"]` cast silindi; ProductPicker stable React keys (`crypto.randomUUID()` + payload'tan strip); button error handling (DeleteDialog/CloneButton/RestoreButton try/catch + inline error state).
- **LOW (8)**: `is_admin` SECURITY DEFINER; perf indexes (products(active,display_order), products(sector_id), rfqs(assigned_to), notification_recipients(active) WHERE active); env test dosyaları env.client'a yönlendirildi.

**Deferred (gerekçeli)**:

- next-intl v3→v4 upgrade (H2-sec): breaking change, ayrı task. CSP + open-redirect fix'ler attack surface'i zaten kapattı.
- `console.error` → structured logger (M5-ts): Sentry SDK wiring lazım, ayrı plan.
- `exactOptionalPropertyTypes` (L3-ts): tsconfig change, orthogonal.
- Seed email cleanup (M2-db): git history immutable; yeni seed'lerde env substitution.
- Middleware admin_role DB lookup (H4-db): page-level `requireAdmin` / `requireAdminRole` yeterli defense-in-depth; edge runtime'da ek DB roundtrip ağır.
- admin_users policy docs (H2-db): service-only pattern zaten etkili; `self read admin_users` memoized güncellemesi yapıldı.

**Yeni migration**: `supabase/migrations/20260421200000_plan4b_security_hardening.sql` (henüz push edilmedi — user `supabase db push` ile uygulayacak).

**Son durum**: 44 commit toplam, hepsi push-hazır. Local green: typecheck ✓, vitest 108/108 ✓, lint ✓, build ✓. Smoke test + migration push bekliyor.

## 2026-04-22 (devam 2) — Catalog pivot + CI optimize + E2E parity

**Durum:** 5 commit canlıda (`7389b43..a19ef7d`), 2 migration uygulandı, 1 bucket silindi, tüm CI/deploy yeşil.

### Bu oturumun saga'sı (özet)

Plan 4c mini-batch ile başladı, büyük pivot'la bitti:

1. **Coolify webhook `force=true`** (`gh secret set COOLIFY_DEPLOY_URL`) — build cache bypass aktif
2. **Custom RFQ smoke** → 3 UX sorunu çıktı (team email raw JSON, admin detail raw JSON, file uploader native ugly)
3. **Form UI premium overhaul** (`8102f75` deployed): FileUploader drop-zone redesign, CustomRfqForm Card wrap + 01/02/03 section headers + cobalt accents, admin inbox structured `<dl>` + JSON details collapsible, team email branded HTML table + chips/badges + mailto/tel links
4. **Country picker + phone dial code + bilingual customer emails** (`4de8204`): `i18n-iso-countries` 250+ ülke TR/EN/RU/AR native + popüler optgroup (TR/DE/US/GB/FR/IT/ES/NL/RU/SA/AE/AZ/IR/QA/SY/IQ), flag emoji derived from ISO-2, 240+ dial code static map, 2-col dial+number layout, hidden input combined "+90 5551234567". ISO-2 regex validation. rfq-customer + contact-customer bilingual (locale primary + EN italic küçük + RTL for AR).
5. **CI cache + concurrency** (`7389b43` deployed): workflow-level `concurrency.cancel-in-progress` + Next.js `.next/cache` persist + Playwright browsers cache (conditional install-deps). Push-to-live ~10-15 → ~7-9 dk (cache-hit ile).
6. **BÜYÜK PIVOT: RFQ → Catalog PDF email flow** (`353b393`): Tüm RFQ sistemi kaldırıldı. Yeni: email + locale select → `/api/catalog` → locale-specific PDF link branded bilingual mail. 15 dosya silindi (custom/standart form, ProductPicker, FileUploader, RFQ API, rfq validation, rfq email templates, admin/inbox, rfq.json 4 dil, rfq unit + 3 E2E spec). 9 dosya eklendi (`lib/validation/catalog.ts`, `lib/email/templates/catalog-delivery.ts` bilingual + cobalt download button + RTL, `app/api/catalog/route.ts` rate-limit 3/hr per IP, `components/catalog/CatalogRequestForm.tsx` premium form + success state, `app/[locale]/request-quote/page.tsx` landing rewrite, `app/admin/catalog-requests/page.tsx` log listesi, `messages/*/catalog.json` × 4 dil, `public/catalogs/kitaplastik-{tr,en,ru,ar}.pdf` 705-byte valid placeholder, migration `20260422100000`). Nav label "Teklif İste" → "Katalog İndir" 4 dil. `next.config` collapse: `/teklif-iste/{ozel-uretim,standart}` + `/request-quote/{custom,standard}` → `/request-quote`. ProductDetail CTA → `/request-quote`. `/admin/inbox` → `/admin/catalog-requests`. RLS (service-only insert + is_admin select).
7. **CI fail saga**: forms + catalog push'ları E2E'de **contact spec `input[name="phone"]` timeout** ile fail. PhoneField hidden carrier pattern — visible input name yok. Fix (`773eee3`): selector `input[type="tel"]`. Her iki commit deploy skipped olmuş, 3. fix sonrası HEAD canlıya indi.
8. **Bucket cleanup**: `rfq-attachments` bucket + 7 obje silindi. Supabase `storage.objects` direct DELETE blocked → Node service-role script (list + remove recursive + deleteBucket) ile yapıldı. Script one-off, silindi.
9. **Local/CI E2E parity** (`a19ef7d`): `playwright.config.ts` webServer env override (CI'daki placeholder Supabase + test Turnstile keys + test Resend). Test port 3001 (dev 3000 collision önleme). `pnpm verify` script eklendi = full CI pipeline (typecheck + lint + format:check + test + audit + build + test:e2e). Lokalde 104 passed, 0 failed — CI %100 parity.

### Git state (son 5 commit)

- `a19ef7d` test(e2e): local/CI parity + verify script
- `773eee3` fix(e2e): visible tel input for contact phone
- `353b393` feat(catalog): RFQ → catalog PDF download pivot
- `4de8204` feat(forms): country + phone dial + bilingual emails
- `7389b43` ci: concurrency cancel + Playwright + Next caches

### Supabase state

- Migration `20260422100000_drop_rfq_add_catalog_requests` applied ✅
- `rfqs` table dropped
- `catalog_requests` table created (RLS + 2 policy + 3 index: PK + created_at desc + email)
- `rfq-attachments` bucket + 7 obje silindi

### Coolify state

- `COOLIFY_DEPLOY_URL` GHA secret'ında `?force=true` aktif (build cache bypass)
- `COOLIFY_TOKEN` hâlâ rotate edilmedi (chat-leak borç — önceki oturumlarda not edildi)

### Canlı doğrulama (curl)

- `/tr/teklif-iste` → 308 → `/tr/request-quote` ✓
- `/catalogs/kitaplastik-tr.pdf` → 200 (placeholder PDF) ✓
- `/admin/catalog-requests` → authed admin sayfası ✓

### Kritik bulgular (bu oturum)

1. **CI ile local E2E parity şarttır** — `.env.local` prod Turnstile key + gerçek Supabase URL local'de E2E'yi false-negative yapar. playwright webServer env override çözüm.
2. **`pnpm verify` her push öncesi** — unit test + typecheck + build yeterli değil. E2E atlanırsa PhoneField hidden carrier gibi regression 2 deploy sonra farkedilir.
3. **Supabase `storage.objects` direct DELETE BLOCKED** — migration'da storage cleanup yapılamaz (`protect_delete()` trigger). Service-role JS client (Storage API) ile walk + remove + deleteBucket.
4. **Playwright `reuseExistingServer: !CI` riskli** — developer dev server 3000'de açıksa Playwright reuse eder, webServer env override atlanır. Test port 3001 ile collision önle.

## Yeni Session Başlangıç Komutları

### ✅ Plan 4b + Plan 4c pivot TAMAM (canlıda, kapanış notu — geçmişten)

Plan 4b spec/plan commit'leri: `d7f9e62` (spec) + `84e01b0` (plan). 50 commit execute + security audit + bug fix'ler (`8b64d53..e32cfe7`). Migration `20260421200000` prod DB'de. **Plan 4c RFQ → Catalog pivot** tamamlandı (`7389b43..a19ef7d`). Detay: 2026-04-22 entry'leri yukarıda.

### 🚀 P0 — Gerçek katalog PDF'leri (SONRAKİ OTURUMA PASTE EDİLECEK)

```
Kitaplastik Catalog pivot canlıda ✅ (docs/superpowers/RESUME.md 2026-04-22
"devam 2" entry'de full durum). Şu an public/catalogs/kitaplastik-{tr,en,ru,ar}.pdf
705-byte placeholder PDF'ler — kullanıcılar mail'de bunu alıyor. Gerçek
katalog PDF'leri (4 dil) hazırlansa veya sağlansa 4 dosyayı replace + commit
+ push edelim. Coolify auto-deploy ile ~7-9 dk canlıda.

Adımlar:
1. Gerçek PDF'ler sağlansın (TR/EN/RU/AR — aynı içerik, ayrı dosya adları)
2. public/catalogs/ altına dosya adlarını koru (kitaplastik-tr.pdf vb.)
3. `pnpm verify` koş (CI mirror — 3-5 dk)
4. Commit: "feat(catalog): upload real catalog PDFs"
5. Push → CI → Coolify
6. Canlı test: /tr/teklif-iste form submit → mail'e real PDF link

Ek: /admin/catalog-requests'ten ilk gerçek submit'leri izle (spam/test).
Bucket yok (rfq-attachments silindi). catalog_requests table'da hepsi.

ultrathink
```

### 🗺️ Kalan follow-up'lar (priority order)

**P1 — SEO + i18n**
1. **next-intl pathnames mapping** (1-2sa): TR kullanıcı `/tr/request-quote` yerine `/tr/teklif-iste` canonical URL görsün (şu an redirect ile gidiyor, URL EN). `i18n/routing.ts` pathnames config. Canvas: artık sadece root `/request-quote`, `/products/[slug]`, sector path'leri. Katalog pivot sonrası scope küçüldü.
2. **next-intl v3 → v4 upgrade** (2-4sa): Breaking change, GHSA-8f24-v5vv-gm5j open redirect fix. Mevcut CSP + auth callback fix attack surface'i büyük ölçüde kapatmış.

**P2 — Observability + deliverability**
3. **Sentry SDK wiring** (30dk): `NEXT_PUBLIC_SENTRY_DSN` env'de var, kod bağlı değil. `instrumentation.ts` + `@sentry/nextjs` install. `console.error` yerine structured logger.
4. **Google Workspace** `info@kitaplastik.com` inbox + MX/SPF/DKIM CF DNS. Birleşik SPF (google + amazonses) root `@` TXT'e eklenecek — mevcut sadece `send.` subdomain'de SPF var.

**P3 — Infra + polish**
5. **CF proxy + SSL Full (strict)** (~20-25dk): Let's Encrypt cert renewal'ı DNS-01'e migrate (HTTP-01 CF proxy ile çakışır). Ön gerekli: CF API token `Zone:DNS:Edit`.
6. **Coolify token rotate**: chat'te leak olan `COOLIFY_TOKEN` hâlâ aktif. Coolify → Keys & Tokens → eski sil + yeni `gh secret set`.
7. **`exactOptionalPropertyTypes` tsconfig strictness** — orthogonal polish.
8. **middleware admin_role DB check** — defense-in-depth; page-level `requireAdminRole` zaten yeterli ama edge'de check ek brief expose window kapatır.
9. **SlugField onBlur trailing-tire strip UX** — `slugify()` onBlur'da tire temizliyor, user typing flow'u minor glitch.
10. **Smoke test ürünü cleanup** (2dk): Admin panel → Silinmiş tab → hard-delete. `product-images/smoke-test-*` path'leri Supabase Studio'dan temizle.

### 🌐 CF proxy + Let's Encrypt DNS-01 migration (infra, ~20-25 dk)

```
Kitaplastik CF proxy + SSL Full (strict) için Let's Encrypt cert renewal'ı
DNS-01'e geçirmek lazım (HTTP-01/TLS-ALPN-01 CF proxy ile çakışır).
docs/superpowers/RESUME.md "CF proxy + Let's Encrypt DNS-01 (ERTELENEN İŞ)"
bölümünü oku, 6 adımı uygula.

Ön gerekli: CF API token (Zone:DNS:Edit scope, kitaplastik.com zone).
```

### 📧 Google Workspace inbox + birleşik SPF

```
Kitaplastik için info@kitaplastik.com mail kutusu kuralım (Google Workspace).
Resend zaten domain verified ve noreply@kitaplastik.com branded sender ile
mail atıyor — şu an sadece `send.` subdomain'de SPF var, root @ boş.

Plan:
1. Google Workspace kurulum + MX kayıtları (CF DNS)
2. Birleşik SPF string root @ TXT'e: v=spf1 include:_spf.google.com include:amazonses.com ~all
3. DKIM public key GWS'ten CF DNS'e ekle
4. info@ alias/inbox test mail gönder/al
5. Contact form reply-to noreply@ yerine info@ olabilir mi düşün

Başla: GWS hesabı var mı, yoksa workspace.google.com'dan mı açıyoruz?

ultrathink
```

### 🌐 CF proxy + Let's Encrypt DNS-01 migration (infra)

```
Kitaplastik CF proxy + SSL Full (strict) için Let's Encrypt cert renewal'ı
DNS-01'e geçirmek lazım (HTTP-01/TLS-ALPN-01 CF proxy ile çakışır).
docs/superpowers/RESUME.md "CF proxy + Let's Encrypt DNS-01 (ERTELENEN İŞ)"
bölümünü oku, 6 adımı uygula.

Ön gerekli: CF API token (Zone:DNS:Edit scope, kitaplastik.com zone).

ultrathink
```

### 🗺️ Gelecek büyük iş (öneri)

Büyük bir sonraki faz planlarsan:
- `/admin/sectors` + `/admin/settings/company` CRUD (sektör içerik admin'den yönetilsin)
- Upstash Redis rate limit upgrade (multi-instance ready)
- SEO ileri: Schema.org Organization, OG image generator, apple-icon
- KVKK + Gizlilik Politikası sayfaları (TR legal)
- Plausible analytics integration
- Admin authenticated E2E programatik login hook
- Catalog request analytics (per-locale split, daily trend)
- Catalog version tracking (PDF update'de log)

## 2026-04-22 (devam 3) — Plan 4d pathnames canlıda

Per-locale native URL slug'lar: TR `/urunler` · EN `/products` · RU `/produktsiya` · AR `/al-muntajat` (10 canonical route × 4 locale). next-intl v3 `pathnames` config ile. Eski EN-canonical URL'ler 308 → native.

### Commit serisi (`5ae1b57..e3718bd`, 9 commit, subagent-driven)

| # | SHA | Task |
|---|---|---|
| T1 | `5ae1b57` | feat(slugify): RU (BGN/PCGN) + AR (consonant-only) + `locale` option |
| T2 | `40c451a` | feat(i18n): pathnames config (10 canonical × 4 locale) + Footer/Header/SectorGrid/sectors-page/ProductCard/ProductDetail tsc-gate migration |
| T3 | `2e2fccf` | feat(seo): buildAlternates uses getPathname (latent double-prefix bug fix) |
| T3+fix | `b97c8d3` | fix(seo): buildProductAlternates for dynamic `[slug]` alternates (SEO regresyon fix) |
| T4 | `f48f588` | test(sitemap): 40 URL native slug coverage |
| T6 | `8340dfd` | feat(redirects): 36 rule legacy EN-canonical → per-locale native matrix |
| T7 | `4ccc219` | test(e2e): pathname-mapping canonical + legacy 308 + sitemap |
| T8.1 | `d538240` | test(e2e): delete obsolete url-redirects spec (Plan 4a ters yönü) |
| T8.2 | `e3718bd` | test(e2e): migrate hardcoded paths to per-locale native canonical |

### Kritik bulgular

- **`getPathname` `localePrefix:"always"` prefix içerir** — `getPathname({href:"/about", locale:"tr"})` → `"/tr/hakkimizda"` (sadece `/hakkimizda` değil). Plan T3 code bloğu manuel `/${locale}${pathname}` prefix ekliyordu → double-prefix bug. T3 implementer catch etti, fix `${origin}${pathname}`. Gelecek next-intl iş: pathnames kullanırken URL concat yaparken her zaman bu davranışı akılda tut.
- **T2 scope expansion build-gate için zorunlu** — pathnames config `<Link href>` type'ını daraltıyor, `string` → literal union. 6 ek dosya fix edilmeden `tsc --noEmit` geçmezdi (Footer, Header, SectorGrid, sectors/page, ProductCard, ProductDetail). Tüm fix minimal + behavior-preserving. T5 planı böylece no-op; audit-only.
- **T3 product detail alternates SEO regresyon** — T3 ilk commit `buildAlternates("/products", ...)` ile tsc'yi geçirdi ama ürün detay sayfası alternates LIST page'e döndü (slug kaybı). Fix commit `b97c8d3` `buildProductAlternates(slug, origin)` helper eklediği için canonical + languages dynamic slug ile doğru.
- **AR `ة` taa marbuta `"h"` mapping** — spec dokuman `"a"` yazmıştı ama test assertion `alrbyh` için `"h"` gerekli (pause form fonetik olarak /h/). Linguistik doğru. Plan 4d static AR slug tablosu taa marbuta içermiyor → zero downstream impact.
- **Plan 3 teklif-iste 1-hop korundu** — `/tr/teklif-iste{/alt}*` → `/tr/katalog` direct 308. Plan 4c collapse pattern'i bozulmadı (2-hop teklif-iste → request-quote → katalog dance yok).

### Verify + deploy

- `pnpm verify` lokalde yeşil: typecheck + lint + format:check + 139 unit + audit + build (55 static page) + 60 E2E / 13 skipped / 0 failed
- İlk `pnpm verify` run'da `/tr/katalog` + `/en/catalog` 500 döndü (Playwright dev-compile race, parallel workers). Retest'te yeşil — flaky, fix gerekmedi.
- GHA CI 6m14s, Coolify webhook → deploy ~5 dk
- Canlı geçiş: `/tr/urunler` 308 (eski container) → 200 (yeni container)

### Canlı smoke sonuçları

- **Canonical 200:** 36/36 (4 locale × 9 URL)
- **Legacy redirect 308→200:** 22/22 (TR 9 + RU 5 + AR 5 + Plan 3 teklif-iste 3 variant)
- **sitemap.xml:** 40 URL, native slug'lar mevcut (`/tr/urunler`, `/tr/katalog`, `/ru/produktsiya`, `/ar/al-muntajat`, `/ar/al-qitaat/ghasil-zujajat`, `/en/products`, `/en/catalog`)
- **Browser walk-through (user):** LocaleSwitcher 4 locale geçiş ✓, SectorGrid → `/tr/sektorler/cam-yikama` ✓, Katalog İndir → `/tr/katalog` ✓, form submit regresyon yok ✓

### Açık follow-up

- **Google Search Console sitemap resubmit** (opsiyonel one-shot): GSC → Sitemaps → `https://kitaplastik.com/sitemap.xml` resubmit. Google 1-2 hafta içinde native URL'leri ranking transfer ile reindex eder.
- Kalan polish / upgrade / legal / admin genişletme işleri **Plan 5 roadmap'e konsolide edildi**: `docs/superpowers/specs/2026-04-22-plan5-post-mvp-polish-roadmap.md`

## 2026-04-23+ — Plan 5 kickoff (multi-session, ~15-22 saat)

Catalog PDF replace user tarafında (içerik). Geri kalan tüm operasyonel olgunluk işleri Plan 5 altında 4 batch. Roadmap: `docs/superpowers/specs/2026-04-22-plan5-post-mvp-polish-roadmap.md`.

### Batch sırası (önerilen)

| Batch | İsim | Süre | Prereq (user prep) |
|---|---|---|---|
| 5a | Observability + infra config | ~4sa | CF API token (Zone:DNS:Edit), GWS hesap kararı, Plausible self-host vs SaaS, Sentry DSN |
| 5d | Upgrade borcu (next-intl v4 + Upstash) | ~3-4sa | Upstash hesap + Redis DB create |
| 5c | Admin CRUD (sectors + settings + analytics) | ~5-7sa | Sektör görselleri yüksek çöz, şirket bilgileri tam |
| 5b | Legal pages (KVKK + Gizlilik) | ~3-4sa | Tüzel kişilik, VERBIS, Mersis, DPO iletişim, **hukuk müşaviri onayı (kritik)** |

5b user prereq topladığı sürece 5a/5d/5c paralel ilerleyebilir.

### User prep checklist (Plan 5'e başlamadan önce)

**5a için:**
- [ ] CF API token oluştur (Zone:DNS:Edit scope, `kitaplastik.com` only)
- [ ] Google Workspace hesap kararı: yeni Business Starter ($7.2/user/ay) mı, mevcut hesap mı?
- [ ] Plausible tercihi: Hetzner VPS self-host (ücretsiz) mı, plausible.io ($9/ay) mı?
- [ ] Sentry hesabı (ücretsiz 5K err/ay) + project create + DSN

**5d için:**
- [ ] Upstash Redis DB create (free tier: 10K req/gün, 256MB)
- [ ] REST URL + token değerleri 1Password'e kaydet

**5c için:**
- [ ] Cam yıkama, kapak, tekstil 3 sektör için yüksek çöz görseller (1920×1080 min)
- [ ] Şirket bilgileri doğrula: tam ünvan, adres (4 dilde?), telefon, social URL'ler

**5b için (en kritik):**
- [ ] Tüzel kişilik tam ünvan: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti." doğru mu?
- [ ] VERBIS kayıt numarası (varsa veya kayıt başlat)
- [ ] Mersis numarası
- [ ] Veri sorumlusu/DPO email + telefon
- [ ] **Hukuk müşaviri ile KVKK + Gizlilik metni review** — placeholder yerine gerçek legal text ile canlıya git

### Kick-off prompts (user hangi batch ile başlamak istediğini seçer)

**5a resume (Faz 1 + Faz 2 code canlıda — Faz 2 infra + Faz 3 + Faz 4 kaldı):**
```
Plan 5a resume. Faz 1 (Sentry) canlıda commit d9e26c8. Faz 2 code (Plausible wrapper + 4 event)
push commit ce37fc4. Plausible runtime (Coolify deploy) + Faz 3 (GWS) + Faz 4 (CF proxy DNS-01)
henüz yapılmadı.

Plan: docs/superpowers/plans/2026-04-22-faz1-plan5a-observability-infra.md
Runbook: docs/runbooks/plan5a-infra.md (Faz 2/3/4 section'ları dolu, user checkbox takibi)
Memory: reference_sentry_project.md

Kalan işler:
1. Task 12-14 (Plausible runtime) ~20dk user UI — Coolify template deploy + CF DNS A + SSL + admin wizard
2. Faz 3 Task 23-25 (GWS) ~60dk — trial start, MX, info@ user + MFA, reply-to E2E
3. Faz 4 Task 26-29 (RISKY) ~60dk — CF API token + Traefik DNS-01 + Proxied + Full strict
4. Task 30 final (runbook Done stamps + MEMORY.md entries: plausible + gws + cf-proxy)

Ek bilgi: Sentry v10 kullanıldı (plan v8 demişti, forward-compat). sentry.client.config.ts →
instrumentation-client.ts rename (Turbopack + v10 filename convention).

ultrathink
```

**5d ile başla:**
```
Plan 5d — Upgrade borcu: next-intl v3→v4 + Upstash Redis. Roadmap dosyası "5d" bölümü.
next-intl changelog + Upstash SDK docs research'ten başla (context7 MCP + WebFetch).
Spec yaz, plan yaz, subagent-driven execute. next-intl v4 migration TDD kritik — pathnames
config + alternates + LocaleSwitcher davranışları unit test + E2E ile assert et.

ultrathink
```

**5c ile başla:**
```
Plan 5c.1 — /admin/sectors CRUD. Roadmap "5c.1" bölümü. Plan 4b /admin/products pattern'i
birebir örnek. Migration + RLS + seed + admin pages + public dynamic route + Storage bucket.
Brainstorm skill ile belirsiz karar topla, ardından spec + plan + subagent-driven execute.

ultrathink
```

**5b ile başla (legal content hazırsa):**
```
Plan 5b — KVKK + Gizlilik Politikası + Çerez Politikası, 4 dilde. Roadmap "5b" bölümü.
Legal text hazır: [user paste etsin ya da dosya yolu verir].
TR legal text base, EN/RU/AR çeviri Claude session'da doğrudan (script yok, Plan 2 pattern).
pathnames config'e 3 yeni canonical ekle, native slug'lar belirle (brainstorm bu kararları).
Subagent-driven execute.

ultrathink
```

## 2026-04-22 (devam 5) — Plan 5a Faz 1 + Faz 2 code ✅

**Session commit'leri (5):**

- `5c52c95` docs(runbook): add Plan 5a infra runbook skeleton
- `d9e26c8` feat(observability): wire Sentry SDK with errors-only scope
- `ce37fc4` feat(analytics): wire Plausible with 4 event tracking points
- `af27546` docs(runbook): Plan 5a Faz 1 complete, Faz 2 code done, Faz 2 infra + Faz 3/4 deferred
- (bu commit) docs(resume): Plan 5a partial + next session resume prompt

**Canlıda:**

- Faz 1 — Sentry `@sentry/nextjs` v10 tri-runtime (instrumentation-client for Turbopack, server, edge), 6 file console.error/warn → Sentry.captureException/captureMessage, Playwright + CI env Sentry/Plausible placeholder
- Faz 1.3 — SPF birleşik root `@` TXT `v=spf1 include:_spf.google.com include:amazonses.com ~all` (CREATE, önce yoktu)
- Faz 1.1 — Coolify token rotate `gha-autodeploy-v2`, GHA secret `COOLIFY_TOKEN` update
- Faz 2.4 kod — `components/PlausibleScript.tsx` env-guarded script, `lib/analytics/plausible.ts` type-safe wrapper (discriminated union, 4 TDD unit test), `layout.tsx` `<head>` inject, 4 event (Contact / Catalog + locale / Locale + to / Sector + slug), `components/home/SectorCardLink.tsx` client wrapper

**Pending (next session, ~2–2.5 saat):**

- Task 12-14 Plausible runtime — Coolify CE template deploy + CF DNS A plausible → 188.245.42.178 (grey cloud) + Let's Encrypt SSL + admin wizard (user berkaytrk6@gmail.com + site add) + Coolify env `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` + `NEXT_PUBLIC_PLAUSIBLE_HOST` — **~20dk user UI**
- Faz 3 (Task 23-25) GWS — Business Starter trial + domain verify TXT + 5 Google MX + info@ user + MFA + reply-to E2E — **~60dk user UI**
- Faz 4 (Task 26-29, RISKY) — CF API token (Zone:DNS:Edit) + VPS SSH Traefik DNS-01 YAML edit + cert renewal smoke + CF A Proxied + SSL Full (strict) + 4-locale E2E smoke + cf-ray check — **~60dk**
- Task 30 final — runbook Done stamps + memory entries (plausible + gws + cf-proxy-dns01)

**Deviations from plan:**

- `@sentry/nextjs` v10 install (plan targeted v8; API forward-compat accepted)
- `sentry.client.config.ts` → `instrumentation-client.ts` rename (Turbopack + v10 filename convention required)

**Known non-blocking warnings (deferred to Plan 5d or cleanup batch):**

- Sentry v10→v11 deprecation: `disableLogger`, `automaticVercelMonitors` → `webpack.*` rename
- `[@sentry/nextjs] ACTION REQUIRED: onRouterTransitionStart` navigation hook (tracesSampleRate 0 olduğu için skip)
- OpenTelemetry peer deps `import-in-the-middle` + `require-in-the-middle` external resolution advisory (server tracing disabled)
- `next lint` deprecated Next.js 16 → ESLint CLI migrate

**Paralel akış kararı (ultrathink):** Faz 2 code push Plausible runtime'a BAĞIMSIZ (no-op guard: env boşsa PlausibleScript null render, `window.plausible` yoksa trackPlausible silent return). User Task 12-14 yapmadan bile kod canlıda safe. Gece 23:30 kesim — Faz 3/4 (concentration-heavy + RISKY) fresh session'a bırakıldı.

Runbook: `docs/runbooks/plan5a-infra.md` (Faz 2/3/4 sections dolu checkbox takibine hazır)
Plan: `docs/superpowers/plans/2026-04-22-faz1-plan5a-observability-infra.md`
Memory: `reference_sentry_project.md`

## Ortam Notları

- Node 22.22.2 + pnpm 9.15.9 + corepack aktif
- Yerel git: `user.email=berkaytrk6@gmail.com user.name=Berkay` (repo-local)
- `.env.local` lokalde placeholder değerlerle (Plan 3 başında Supabase project oluşturulup gerçek değerler yazılacak)
- `.env.example` güncel — `ANTHROPIC_API_KEY` satırı KALDIRILDI (Plan 2'de çeviriler Claude session'da elle yapıldı, script/CI yok)
- GitHub Actions CI: yeşil (https://github.com/berkayturk/kitaplastik/actions)
- Vercel deploy: henüz yapılmadı

## Dev Server

Lokalde çalıştırma:
```bash
pnpm dev                 # Turbopack
# http://localhost:3000 → 307 /tr
# Diller: /tr, /en, /ru, /ar
# Her dilde 12 route
```

## Memory Hatırlatması

Yeni session açıldığında memory dizini boş — burayı oku, projeye ait kararları öğren. Memory'de `project_kitaplastik.md` + `feedback_subagent_mode.md` + `feedback_turkish_regex.md` dosyaları var.
