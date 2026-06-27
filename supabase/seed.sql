-- Catalog from the AWS Student Builder Groups Swag Shop (Kotis Design).
-- Idempotent: only inserts items whose name isn't already present.
-- Run automatically by `supabase db reset`, or paste into the SQL editor.

insert into items (name, points, has_sizes, sizes, image_url)
select v.name, v.points, v.has_sizes, v.sizes, v.image_url
from (values
  ('Tablecloth',                  25, false, null::text[],     '/items/tablecloth.png'),
  ('24oz Owala Bottle',           20, false, null,             '/items/24oz-owala-bottle.png'),
  ('Owala Bottle 32 oz',          20, false, null,             '/items/owala-bottle-32oz.png'),
  ('Flag',                        20, false, null,             '/items/flag.png'),
  ('Cotton Twill Cap',            20, false, null,             '/items/cotton-twill-cap.png'),
  ('T-Shirt',                     10, true,  '{S,M,L,XL,XXL}'::text[], '/items/t-shirt.png'),
  ('Pencil Pouch',                10, false, null,             '/items/pencil-pouch.png'),
  ('Clear Belt Bag',              10, false, null,             '/items/clear-belt-bag.png'),
  ('Cotton Crew Sock',             8, false, null,             '/items/cotton-crew-sock.png'),
  ('Magnetic Phone Accessory',     5, false, null,             '/items/magnetic-phone-accessory.png'),
  ('AWS BuilderCards',             5, false, null,             '/items/aws-buildercards.png'),
  ('Push Pop Fidget Cube',         4, false, null,             '/items/push-pop-fidget-cube.png'),
  ('Pop Socket Phone Accessory',   4, false, null,             '/items/pop-socket-phone-accessory.png'),
  ('Lanyard',                      3, false, null,             '/items/lanyard.png'),
  ('KIRO Logo Sticker',            1, false, null,             '/items/kiro-logo-sticker.png'),
  ('KIRO Holographic Sticker',     1, false, null,             '/items/kiro-holographic-sticker.png'),
  ('KIRO Ghost Sticker',           1, false, null,             '/items/kiro-ghost-sticker.png'),
  ('AWS Sticker',                  1, false, null,             '/items/aws-sticker.png'),
  ('Core Team Kit',                1, false, null,             '/items/core-team-kit.png')
) as v(name, points, has_sizes, sizes, image_url)
where not exists (select 1 from items where items.name = v.name);
