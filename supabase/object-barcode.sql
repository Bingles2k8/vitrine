-- #2 Barcode / ISBN / UPC scanner — remember scanned code per object so we
-- can detect "you already have this" on re-scan.

alter table objects
  add column if not exists barcode text;

create index if not exists objects_museum_barcode_idx
  on objects (museum_id, barcode)
  where barcode is not null;
