-- =============================================================
-- Messaging / Inbox — Row Level Security
-- =============================================================
-- Run AFTER messaging-schema.sql, in Supabase Dashboard → SQL Editor.
--
-- Like the rest of Vitrine, staff-aware authorisation for the inbox is enforced
-- in application code via the service-role client (see lib/messaging.ts and the
-- /api/messages routes). These policies are a deny-by-default backstop so that
-- the anon/cookie client can never read another museum's conversations. The
-- service role bypasses RLS entirely.
--
-- Attachments reuse the existing `object-documents` R2 bucket, so no new storage
-- policies are required.
-- =============================================================

ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_reads  ENABLE ROW LEVEL SECURITY;

-- Owner-scoped read backstop: an owner may read conversations on either side.
DROP POLICY IF EXISTS "Owners can view their conversations" ON conversations;
CREATE POLICY "Owners can view their conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE (museums.id = conversations.recipient_museum_id
             OR museums.id = conversations.sender_museum_id)
        AND museums.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can view their messages" ON messages;
CREATE POLICY "Owners can view their messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN museums m
        ON (m.id = c.recipient_museum_id OR m.id = c.sender_museum_id)
      WHERE c.id = messages.conversation_id
        AND m.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can view their message attachments" ON message_attachments;
CREATE POLICY "Owners can view their message attachments"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages msg
      JOIN conversations c ON c.id = msg.conversation_id
      JOIN museums m
        ON (m.id = c.recipient_museum_id OR m.id = c.sender_museum_id)
      WHERE msg.id = message_attachments.message_id
        AND m.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own read state" ON conversation_reads;
CREATE POLICY "Users can view their own read state"
  ON conversation_reads FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: all writes go through the service-role
-- client in the API routes, which bypasses RLS. Non-service clients are denied.
