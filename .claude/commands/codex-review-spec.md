---
description: Gate 1 — Codex ile spec-level review (karar öncesi kontrol)
argument-hint: <spec-dosya-yolu>
---

# Codex Spec Review (Gate 1)

Aşağıdaki prompt'u `codex:codex-rescue` subagent'ına ilet ve bulguları hedef spec dosyasının sonundaki "## Review Log" başlığına append et.

## Adımlar

1. Spec dosyasının varlığını doğrula: `ls $1`. Yoksa hata ver.
2. Spec içeriğini oku.
3. `sha256sum $1` hesapla, Review Log header'ına yaz.
4. `codex:codex-rescue` subagent'ını çağır (aşağıdaki prompt ile).
5. Subagent çıktısını spec dosyasının sonundaki "## Review Log" başlığının altına, placeholder HTML yorumunu KALDIRARAK append et. Header format:

   ```
   ## Review Log — YYYY-MM-DD (Codex)
   **Spec hash:** `sha256:...`
   **Review round:** 1
   **Status:** completed | skipped (reason)

   ### Özet (3 satır)
   ...

   ### Bulgular
   | Severity | Section | Issue | Suggestion |
   | ...
   ```

6. Commit: `docs(spec): codex review gate 1 (<spec-basename>)`

## Codex'e iletilecek prompt

```
Sen bir senior software architect'sin. Aşağıdaki spec dosyasını review ediyorsun.

Spec: <absolute-path>
Repo: /Users/bt/claude/kitaplastik
Mevcut pattern referansı: app/admin/products/, supabase/migrations/, lib/admin/

Şu 7 boyutta review yap:

1. **Internal coherence** — section'lar arası çelişki, isim tutarsızlığı, akış kopukluğu
2. **Migration safety** — schema değişikliği, data migration, reversibility, lock riski
3. **Security** — RLS yeterli mi, storage policy doğru mu, input validation kapsamı, CSRF/XSS/injection riski
4. **Edge cases** — concurrent admin, empty state, rollback path, race condition (örn. reorder swap), storage orphan
5. **Architecture fit** — mevcut pattern'a (products CRUD, audit log, revalidatePath, next-intl i18n) uyum, sapma varsa gerekçesi var mı
6. **Scope creep** — YAGNI ihlali, gereksiz soyutlama, MVP dışı feature
7. **Placeholder/TBD** — eksik spec noktası, "sonra karar vereceğim" kokusu, belirsiz validation kuralı

## Output formatı

### Özet
3 satır — en önemli bulgu, genel risk seviyesi, öneri.

### Bulgular
| Severity | Section | Issue | Suggestion |
|----------|---------|-------|------------|
| critical | 3.1     | ...   | ...        |
| high     | 5.2     | ...   | ...        |
| medium   | ...     | ...   | ...        |

Severity skalası:
- **critical** — production hatası veya veri kaybı riski
- **high** — spec belirsizliği implementation'ı bloklayacak
- **medium** — iyileştirme önerisi (user decision için)
- **low** — stilistik, opsiyonel

Sadece markdown döndür, ek metin veya disclaimer ekleme.
```

## Failure mode

Codex subagent başarısız olursa (auth, offline, timeout):

1. Review Log'a `**Status:** skipped (<neden>)` yaz
2. Commit mesajında `[SKIP]` prefix: `docs(spec): codex gate 1 SKIP — <neden>`
3. Kullanıcıyı bilgilendir, devam et (hard block yok)

## Convergence

Tek round. Claude bulguları kendi self-review'ı ile birleştirir, critical/high inline fix, medium user'a sorar, low/divergent Review Log'a kayıt. Re-review yok.
