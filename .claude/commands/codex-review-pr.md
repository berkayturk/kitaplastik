---
description: Gate 2 — Codex ile PR-diff review (merge öncesi kontrol)
argument-hint: (argümansız — current branch vs main diff)
---

# Codex PR-Diff Review (Gate 2)

Execution tamamlanıp CI yeşil olunca, merge öncesi çalıştırılır.

## Adımlar

1. Current branch'i doğrula: `git branch --show-current`. `main` ise hata ver.
2. PR URL'sini al: `gh pr view --json url,number,body` (branch push edilmemişse hata ver ve push iste).
3. Spec path'ini PR body'den parse et (ilk `docs/superpowers/specs/.*.md` referansı).
4. `git diff main...HEAD` al, 5000 satır üzerindeyse dosya gruplarına böl.
5. `codex:codex-rescue` subagent'ını çağır (aşağıdaki prompt ile).
6. Çıktıyı PR body'e "## Codex Review — YYYY-MM-DD" başlığı altında `gh pr edit --body-file` ile append et.
7. Critical/high bulgu varsa Claude'a apply talimatı ver, commit + push + tekrar CI bekle.
8. Medium/low bulguları PR body'sinde "Known differences" başlığında belgele.
9. PR body'sinin sonuna `🔍 Reviewed by: Claude + Codex (GPT-5.4)` satırı ekle.

## Codex'e iletilecek prompt

```
Sen bir senior code reviewer'sın. Aşağıdaki PR diff'ini review ediyorsun.

PR: <pr-url>
Spec: <spec-path> (ground truth olarak kullan — implementation buna uymalı)
Repo: /Users/bt/claude/kitaplastik

Diff context: git diff main...HEAD (aşağıda)

<diff-content>

## Review dimensions

1. **Implementation ↔ spec uyumu** — spec'te yazılan ile kod uyumlu mu, sapma varsa gerekçeli mi
2. **Regression riski** — mevcut test'lerin göremediği, etkilenen akış var mı (örn. ReferencesStrip, products CRUD)
3. **Test adequacy** — unit + E2E coverage kritik path'leri karşılıyor mu, edge case eksik mi
4. **Security** — secret leak (env, log), SQL injection, XSS (json-ld, markdown render), auth bypass, RLS kapsamı
5. **Performance** — N+1 query, unbounded loop, bundle bloat, client-side storage upload güvenliği
6. **Unidiomatic code** — Turkish regex case-fold hataları (İ/I), mutation, type safety (any/unknown), error swallowing

## Output formatı

### Özet
3 satır — en kritik bulgu, overall risk, merge recommendation (approve/request-changes/block).

### Bulgular
| Severity | File:Line | Category | Issue | Suggestion |
|----------|-----------|----------|-------|------------|
| critical | ...       | security | ...   | ...        |

### Spec uyum kontrolü
Spec section X vs implementation: ✓ | ✗ (açıklama)

Severity skalası:
- **critical** — merge blocker (prod down, veri kaybı, auth bypass)
- **high** — merge öncesi fix zorunlu (test eksik kritik path, type bypass)
- **medium** — iyileştirme önerisi (follow-up issue acılabilir)
- **low** — stilistik, opsiyonel

Sadece markdown döndür.
```

## Failure mode

Codex başarısız olursa:

1. PR body'e `**Codex review:** SKIPPED (<neden>)` satırı ekle
2. Tech-debt flag — follow-up issue açma önerisi user'a
3. PR merge'e devam edebilir (hard block yok, user onayı lazım)

## Convergence

Critical/high fix → tekrar CI → tekrar Gate 2 (1-2 round maks).
Medium/low belgelenir, düzeltilmez (follow-up).
