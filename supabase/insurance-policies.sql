-- =============================================================
-- Insurance Policies — Insurance & Indemnity
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_policies (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id         uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  policy_number     text        NOT NULL,
  provider          text        NOT NULL,
  coverage_type     text        NOT NULL DEFAULT 'All Risks', -- All Risks | Named Perils | Government Indemnity | Transit | Exhibition
  coverage_amount   numeric,
  currency          text        NOT NULL DEFAULT 'GBP',       -- GBP | USD | EUR | CHF | AUD | CAD | JPY
  deductible        numeric,
  start_date        date        NOT NULL,
  end_date          date,
  renewal_date      date,
  covers_loans      boolean     NOT NULL DEFAULT false,
  covers_transit    boolean     NOT NULL DEFAULT false,
  covers_exhibition boolean     NOT NULL DEFAULT false,
  exclusions        text,
  claims_procedure  text,
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  status            text        NOT NULL DEFAULT 'Active', -- Active | Expired | Pending Renewal | Cancelled
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insurance_policies_museum_idx ON insurance_policies (museum_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insurance_policies in their museums"
  ON insurance_policies FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = insurance_policies.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create insurance_policies in their museums"
  ON insurance_policies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = insurance_policies.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update insurance_policies in their museums"
  ON insurance_policies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = insurance_policies.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = insurance_policies.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete insurance_policies in their museums"
  ON insurance_policies FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = insurance_policies.museum_id AND museums.owner_id = auth.uid()));
