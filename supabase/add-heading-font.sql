-- Add heading_font column to museums table for per-museum font selection
ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS heading_font text DEFAULT 'playfair';
