-- =============================================================
-- Messaging / Inbox — schema
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor.
-- Adds the museum opt-out flag and the conversation/message tables that back
-- the /discover → museum contact feature and the /dashboard/inbox shared inbox.
--
-- A conversation always has two museum sides (sender + recipient); both sides
-- are shared inboxes visible to every member (owner + staff) of that museum.
-- Display names are denormalised onto rows at write time so the inbox never has
-- to resolve auth users at render time (owners have no staff_members row).
-- =============================================================

-- Opt-out flag — mirrors the existing `discoverable` pattern. Controls whether
-- other users can START a new conversation with this museum. It never blocks
-- sending, and never blocks replies within an existing conversation.
ALTER TABLE museums ADD COLUMN IF NOT EXISTS accept_messages boolean NOT NULL DEFAULT true;


CREATE TABLE IF NOT EXISTS conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_museum_id uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  sender_museum_id    uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  started_by_user_id  uuid NOT NULL,                                   -- auth.users.id
  started_by_name     text NOT NULL,                                   -- denormalised person name
  object_id           uuid REFERENCES objects(id) ON DELETE SET NULL,  -- null = general enquiry
  subject             text NOT NULL,
  assigned_to_user_id uuid,                                            -- recipient-side owner, nullable
  assigned_to_name    text,                                            -- denormalised assignee name
  last_message_at     timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversations_recipient_idx ON conversations (recipient_museum_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_sender_idx    ON conversations (sender_museum_id, last_message_at DESC);


CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id  uuid NOT NULL,
  sender_museum_id uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,  -- which side sent it
  sender_name     text NOT NULL,                                            -- denormalised person name
  body            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at);


CREATE TABLE IF NOT EXISTS message_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url          text NOT NULL,        -- R2 public URL (object-documents bucket)
  filename     text NOT NULL,
  mime_type    text NOT NULL,
  size_bytes   bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS message_attachments_message_idx ON message_attachments (message_id);


-- Per-user read state → correct unread counts in a shared inbox.
CREATE TABLE IF NOT EXISTS conversation_reads (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  last_read_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
