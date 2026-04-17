# Terminoloji Sözlüğü (i18n)

Bu sözlük, içerik güncellemelerinde terim tutarlılığı için referanstır. Runtime'da kullanılmaz — sadece Claude / çevirmen için.

## Neden gerekli?

- "mould" mü "mold" mü? → British English (mould) kullanıyoruz
- "tolerance" için RU karşılığı "допуск" mı "терпимость" mi? → "допуск" (teknik anlam)
- Arapça'da "plastik enjeksiyon" tek kelimeyle mi çevrilir? → "حقن البلاستيك"

## Kullanım

İçerik güncellenirken Claude session'ı `glossary.json`'u okur, çeviri yaparken bu terimleri aynen kullanır.

## Güncelleme

Yeni teknik terim eklendiğinde:
1. `glossary.json`'a 4 dil karşılığını ekle
2. Bu dosyaya örnek bağlam yaz (gerekirse)
3. Commit: `docs(i18n): add "XYZ" to glossary`
