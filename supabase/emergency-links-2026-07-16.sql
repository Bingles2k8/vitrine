-- Link emergency events to the damage and risk they involve.
--
-- An event records damage as free text in emergency_events.damage_summary. So a
-- flood hitting twelve objects is prose in one column, plus twelve damage
-- reports with no connection to the flood, while the "flood" risk sits Open in
-- the risk register never learning it happened.
--
-- Nothing required is missing here, unlike disposal -> exit. This is
-- traceability: being able to ask "what did the flood actually cost us" and
-- "which of our risks have materialised".
--
-- damage_summary stays. It is the narrative of the incident; the linked reports
-- are the itemised record. They are not the same thing and one should not be
-- migrated into the other.
--
-- ON DELETE SET NULL on both, not CASCADE: a damage report is a real historical
-- record that must outlive the event row, same reasoning as
-- object_exits.related_disposal_id.
--
-- Additive and nullable. Safe to apply live.

ALTER TABLE damage_reports
  ADD COLUMN IF NOT EXISTS emergency_event_id uuid REFERENCES emergency_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS damage_reports_emergency_event_id_idx
  ON damage_reports (emergency_event_id) WHERE emergency_event_id IS NOT NULL;

COMMENT ON COLUMN damage_reports.emergency_event_id IS
  'The emergency event this damage came from, if any. Set when the report is logged from an event.';

ALTER TABLE emergency_events
  ADD COLUMN IF NOT EXISTS risk_id uuid REFERENCES risk_register(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS emergency_events_risk_id_idx
  ON emergency_events (risk_id) WHERE risk_id IS NOT NULL;

COMMENT ON COLUMN emergency_events.risk_id IS
  'The register risk this event is the materialisation of, if one was identified in advance.';
