-- Explicit Data API grants for every table in public
--
-- From 30 October 2026 Supabase stops granting Data API access automatically
-- to tables created in "public" on existing projects. Tables that already
-- exist keep their grants, so production is unaffected. But a table created
-- after that date, by a new SQL file here or by rebuilding the schema from
-- these files, gets no grants, and supabase-js answers "permission denied".
--
-- This file records what every table had on 20 October 2026: full privileges
-- for anon, authenticated and service_role, with row-level security (enabled
-- on every table) doing the actual access control. Running it against
-- production changes nothing. It exists so a rebuilt database matches the one
-- the app was written against.
--
-- For a NEW table, put the grants in the same file that creates it. Supabase's
-- recommended shape, narrowed to what the table needs:
--
--   GRANT SELECT ON public.your_table TO anon;            -- only if the public site reads it
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO service_role;
--
-- __tests__/lib/tableGrants.test.ts fails if a table created in any file here
-- has no grant to authenticated and service_role.

GRANT ALL ON TABLE public.account_email_opt_outs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.account_emails TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.activity_log TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_exercises TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.blog_posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cancellation_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.collection_group_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.collection_groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.collection_reviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.collection_use_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.condition_assessments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.conservation_treatments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversation_reads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.damage_reports TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.deletion_log TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.disposal_record_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.disposal_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.documentation_plan_backlogs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.documentation_plan_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.documentation_plans TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.emergency_event_objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.emergency_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.emergency_plan_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.emergency_plans TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.emergency_salvage_priorities TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.entry_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.event_time_slots TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.fx_rates TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.insurance_policies TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.insurance_policy_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.insurance_policy_objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.loans TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.location_history TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.locations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.message_attachments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.museums TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.object_components TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.object_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.object_duplicates TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.object_exits TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.object_images TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.object_share_links TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.page_views TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.personal_loans TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.refunds TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reproduction_requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.rights_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.risk_register TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.staff TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.staff_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.stripe_webhook_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.subscription_notices TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.subscriptions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ticket_orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tickets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.valuations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.wanted_items TO anon, authenticated, service_role;
