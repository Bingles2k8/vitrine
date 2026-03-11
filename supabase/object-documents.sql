-- =============================================================
-- Object Documents — file attachments for compliance records
-- =============================================================
-- Allows documents (PDFs, Word files, images, etc.) to be
-- attached to specific sub-records:
--   acquisition  → object-level (related_to_id = null)
--   loan         → loans.id
--   conservation → conservation_treatments.id
--   condition    → condition_assessments.id
--   entry_record → entry_records.id
-- =============================================================

CREATE TABLE IF NOT EXISTS object_documents (
  id               uuid primary key default gen_random_uuid(),
  object_id      uuid references objects(id) on delete cascade not null,
  related_to_type  text not null,   -- 'acquisition' | 'loan' | 'conservation_treatment' | 'condition_assessment' | 'entry_record'
  related_to_id    uuid,             -- FK to specific sub-record; null for 'acquisition'
  label            text not null,    -- free-text user label
  document_type    text,             -- controlled vocab (Deed of Gift, Loan Agreement, etc.)
  file_url         text not null,
  file_name        text not null,
  file_size        bigint,
  mime_type        text,
  uploaded_by      uuid references auth.users(id),
  museum_id        uuid references museums(id) on delete cascade not null,
  created_at       timestamptz default now() not null,
  deleted_at       timestamptz       -- soft delete
);

CREATE INDEX IF NOT EXISTS artifact_documents_artifact_idx ON object_documents(object_id);
CREATE INDEX IF NOT EXISTS artifact_documents_museum_idx   ON object_documents(museum_id);
CREATE INDEX IF NOT EXISTS artifact_documents_related_idx  ON object_documents(related_to_type, related_to_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE object_documents ENABLE ROW LEVEL SECURITY;

-- Museum owner or any staff member can view
CREATE POLICY "Museum members can view documents"
  ON object_documents FOR SELECT
  USING (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION
      SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
  );

-- Museum owner or Admin/Editor staff can insert/update/delete
CREATE POLICY "Museum editors can manage documents"
  ON object_documents FOR ALL
  USING (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION
      SELECT museum_id FROM staff_members WHERE user_id = auth.uid() AND access IN ('Admin', 'Editor')
    )
  );
