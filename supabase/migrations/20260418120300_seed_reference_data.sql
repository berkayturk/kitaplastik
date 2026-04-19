-- supabase/migrations/20260418120300_seed_reference_data.sql

insert into public.sectors (slug, name, description, hero_color, display_order, active) values
  ('cam-yikama',
   jsonb_build_object('tr','Cam Yıkama','en','Glass Washing','ru','Мойка стекла','ar','غسيل الزجاج'),
   jsonb_build_object('tr','Endüstriyel cam yıkama makineleri için plastik bileşenler','en','Plastic components for industrial glass washing machines','ru','Пластиковые компоненты для промышленных моечных машин','ar','مكونات بلاستيكية لآلات غسيل الزجاج الصناعية'),
   '#5b8fc7', 10, true),
  ('kapak',
   jsonb_build_object('tr','Kapak','en','Caps & Closures','ru','Крышки','ar','الأغطية والسدادات'),
   jsonb_build_object('tr','Endüstriyel ve ambalaj kapakları','en','Industrial and packaging closures','ru','Промышленные и упаковочные крышки','ar','أغطية صناعية وأغطية التعبئة والتغليف'),
   '#b8a040', 20, true),
  ('tekstil',
   jsonb_build_object('tr','Tekstil','en','Textile','ru','Текстиль','ar','النسيج'),
   jsonb_build_object('tr','Tekstil sektörü için plastik aksesuarlar','en','Plastic accessories for the textile industry','ru','Пластиковые аксессуары для текстильной промышленности','ar','إكسسوارات بلاستيكية لصناعة النسيج'),
   '#8a5fb8', 30, true)
on conflict (slug) do nothing;

insert into public.clients (key, logo_path, sector_key, display_order, active) values
  ('c1', '/references/c1.svg', 'camYikama', 10, true),
  ('c2', '/references/c2.svg', 'kapak',     20, true),
  ('c3', '/references/c3.svg', 'tekstil',   30, true),
  ('c4', '/references/c4.svg', 'camYikama', 40, true),
  ('c5', '/references/c5.svg', 'kapak',     50, true),
  ('c6', '/references/c6.svg', 'tekstil',   60, true),
  ('c7', '/references/c7.svg', 'camYikama', 70, true),
  ('c8', '/references/c8.svg', 'kapak',     80, true)
on conflict (key) do nothing;

insert into public.notification_recipients (email, rfq_types, active) values
  ('berkaytrk6@gmail.com', array['custom','standart']::rfq_type[], true);
