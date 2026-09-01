-- Seeds one restaurant with a demo menu. Run this in the Supabase SQL editor after schema.sql.
--
-- Migrating an existing multi-branch project? Drop the old tables/type first (this discards all
-- existing data — only do this if there's nothing real to keep):
--
-- drop table if exists public.branch_prices cascade;
-- drop table if exists public.branch_items cascade;
-- drop table if exists public.audit_log cascade;
-- drop table if exists public.staff cascade;
-- drop table if exists public.item_translations cascade;
-- drop table if exists public.category_translations cascade;
-- drop table if exists public.variants cascade;
-- drop table if exists public.items cascade;
-- drop table if exists public.categories cascade;
-- drop table if exists public.branches cascade;
-- drop function if exists public.current_role();
-- drop function if exists public.current_branch_id();
-- drop type if exists public.app_role;
--
-- Then run schema.sql, then this file.

do $$
declare
  v_cat_breakfast uuid;
  v_cat_mains uuid;
  v_cat_coffee uuid;
  v_cat_dessert uuid;
  v_item_id uuid;
begin
  insert into public.restaurant (slug, name, theme_color, logo_url, video_url)
  values ('peshwazi', '{"ar":"بيشوازي","ckb":"پێشوازی","en":"Peshwazi"}', '#c9a45c', '/peshwazi-logo.png', 'https://cdn.coverr.co/videos/coverr-a-waiter-serving-food-1577/1080p.mp4');

  insert into public.categories (sort_order) values (0) returning id into v_cat_breakfast;
  insert into public.category_translations (category_id, lang, name) values
    (v_cat_breakfast, 'ar', 'فطور'), (v_cat_breakfast, 'ckb', 'نانی بەیانی'), (v_cat_breakfast, 'en', 'Breakfast');

  insert into public.categories (sort_order) values (1) returning id into v_cat_mains;
  insert into public.category_translations (category_id, lang, name) values
    (v_cat_mains, 'ar', 'الأطباق الرئيسية'), (v_cat_mains, 'ckb', 'خواردنە سەرەکییەکان'), (v_cat_mains, 'en', 'Mains');

  insert into public.categories (sort_order) values (2) returning id into v_cat_coffee;
  insert into public.category_translations (category_id, lang, name) values
    (v_cat_coffee, 'ar', 'قهوة'), (v_cat_coffee, 'ckb', 'قاوە'), (v_cat_coffee, 'en', 'Coffee');

  insert into public.categories (sort_order) values (3) returning id into v_cat_dessert;
  insert into public.category_translations (category_id, lang, name) values
    (v_cat_dessert, 'ar', 'حلويات'), (v_cat_dessert, 'ckb', 'شیرینی'), (v_cat_dessert, 'en', 'Desserts');

  -- Shakshuka
  insert into public.items (category_id, image_url, tags, sort_order) values
    (v_cat_breakfast, 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=1200&q=85', '{"Chef pick"}', 0)
    returning id into v_item_id;
  insert into public.item_translations (item_id, lang, name, description) values
    (v_item_id, 'ar', 'شكشوكة بيشوازي', 'بيض طازج، طماطم مشوية، فلفل حلو وخبز تنور'),
    (v_item_id, 'ckb', 'شەکشووکەی پێشوازی', 'هێلکەی تازە، تەماتەی برژاوە و نانی تەنوور'),
    (v_item_id, 'en', 'Peshwazi Shakshuka', 'Farm eggs, charred tomato, sweet pepper & tandoor bread');
  insert into public.variants (item_id, label_key, sort_order, price, currency) values (v_item_id, 'regular', 0, 8500, 'IQD');

  -- Charcoal Kebab
  insert into public.items (category_id, image_url, tags, sort_order) values
    (v_cat_mains, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85', '{"Signature"}', 0)
    returning id into v_item_id;
  insert into public.item_translations (item_id, lang, name, description) values
    (v_item_id, 'ar', 'كباب على الفحم', 'لحم عراقي متبّل، بصل مشوي، سماق ونان ساخن'),
    (v_item_id, 'ckb', 'کەبابی سەر گەرماو', 'گۆشتی عێراقی، پیازی برژاوە و نانی گەرم'),
    (v_item_id, 'en', 'Charcoal Kebab', 'Seasoned Iraqi beef, grilled onion, sumac & warm bread');
  insert into public.variants (item_id, label_key, sort_order, price, currency) values (v_item_id, 'regular', 0, 18000, 'IQD');

  -- Wild Mushroom Risotto
  insert into public.items (category_id, image_url, tags, sort_order) values
    (v_cat_mains, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=85', '{"New"}', 1)
    returning id into v_item_id;
  insert into public.item_translations (item_id, lang, name, description) values
    (v_item_id, 'ar', 'ريزوتو الفطر', 'أرز أربوريو، فطر بري، بارميزان وزيت أعشاب'),
    (v_item_id, 'ckb', 'ڕیزۆتۆی قەرچک', 'برنجی ئەربۆریۆ، قەرچکی کێویی و پەنیر'),
    (v_item_id, 'en', 'Wild Mushroom Risotto', 'Arborio rice, wild mushrooms, parmesan & herb oil');
  insert into public.variants (item_id, label_key, sort_order, price, currency) values (v_item_id, 'regular', 0, 16000, 'IQD');

  -- Cardamom Latte
  insert into public.items (category_id, image_url, tags, sort_order) values
    (v_cat_coffee, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=85', '{"Favourite"}', 0)
    returning id into v_item_id;
  insert into public.item_translations (item_id, lang, name, description) values
    (v_item_id, 'ar', 'لاتيه الهيل', 'إسبريسو محمّص، حليب مخملي وهيل عراقي'),
    (v_item_id, 'ckb', 'لاتێی هەڵ', 'ئێسپریسۆ، شیری نەرم و هەڵی عێراقی'),
    (v_item_id, 'en', 'Cardamom Latte', 'Roasted espresso, velvet milk & Iraqi cardamom');
  insert into public.variants (item_id, label_key, sort_order, price, currency) values (v_item_id, 'regular', 0, 6500, 'IQD');

  -- Date Tiramisu
  insert into public.items (category_id, image_url, tags, sort_order) values
    (v_cat_dessert, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=85', '{"Sweet"}', 0)
    returning id into v_item_id;
  insert into public.item_translations (item_id, lang, name, description) values
    (v_item_id, 'ar', 'تيراميسو التمر', 'كريمة ماسكربوني، تمر بصراوي، كاكاو وقهوة'),
    (v_item_id, 'ckb', 'تیرامیسۆی خورما', 'کریمەی ماسکارپۆن، خورمای بەسرە و کاکاو'),
    (v_item_id, 'en', 'Date Tiramisu', 'Mascarpone cream, Basrawi dates, cacao & coffee');
  insert into public.variants (item_id, label_key, sort_order, price, currency) values (v_item_id, 'regular', 0, 9000, 'IQD');

  -- Saffron Tea
  insert into public.items (category_id, image_url, tags, sort_order) values
    (v_cat_coffee, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=85', '{"Warm"}', 1)
    returning id into v_item_id;
  insert into public.item_translations (item_id, lang, name, description) values
    (v_item_id, 'ar', 'شاي الزعفران', 'شاي أسود، زعفران، هيل ولمسة ورد'),
    (v_item_id, 'ckb', 'چاى زەعفەران', 'چاى ڕەش، زەعفەران، هەڵ و گوڵ'),
    (v_item_id, 'en', 'Saffron Tea', 'Black tea, saffron, cardamom & rose');
  insert into public.variants (item_id, label_key, sort_order, price, currency) values (v_item_id, 'regular', 0, 4500, 'IQD');
end $$;

-- After running this, create your OWNER staff PIN (no Supabase Auth account needed — staff sign
-- in with a PIN, see src/lib/pin.ts). is_owner=true gives unconditional access to everything,
-- including granting the two delegable permissions to up to 2 more staff rows from
-- /admin/settings (src/lib/actions.ts enforces a hard cap of 3 total active staff rows, and only
-- one row may have is_owner=true — see the partial unique index in schema.sql).
--
-- Substitute your real STAFF_CODE_PEPPER (the same value you put in .env.local) below so the
-- hash matches what the app computes:
--
-- create extension if not exists pgcrypto;
-- insert into public.staff (is_owner, display_name, code_hash)
-- values (
--   true,
--   'المالك',
--   encode(hmac('1234', '<paste your STAFF_CODE_PEPPER value here>', 'sha256'), 'hex')
-- );
--
-- Then sign in at /admin with PIN 1234. Pick a real PIN (and keep the pepper secret) before going live.
