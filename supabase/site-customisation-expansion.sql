-- Site customisation expansion: social links, SEO, footer, featured objects

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS social_instagram  text,
  ADD COLUMN IF NOT EXISTS social_twitter    text,
  ADD COLUMN IF NOT EXISTS social_facebook   text,
  ADD COLUMN IF NOT EXISTS social_website    text,
  ADD COLUMN IF NOT EXISTS seo_description   text,
  ADD COLUMN IF NOT EXISTS footer_text       text;

ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS is_featured    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order integer;
