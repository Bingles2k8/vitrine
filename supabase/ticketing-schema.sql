-- =============================================================
-- Ticketing & Events Schema
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
-- Adds event management and ticket sales tables.
-- =============================================================


-- -------------------------------------------------------------
-- ADD STRIPE CONNECT FIELDS TO MUSEUMS
-- -------------------------------------------------------------
ALTER TABLE museums ADD COLUMN IF NOT EXISTS stripe_connect_id text;
ALTER TABLE museums ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean DEFAULT false;


-- -------------------------------------------------------------
-- EVENTS
-- Named events: exhibitions, workshops, talks, tours
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id       uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  event_type      text        NOT NULL DEFAULT 'exhibition',
  location        text,
  image_url       text,
  start_date      date        NOT NULL,
  end_date        date        NOT NULL,
  price_cents     integer     NOT NULL DEFAULT 0,
  currency        text        NOT NULL DEFAULT 'gbp',
  status          text        NOT NULL DEFAULT 'draft',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_museum_idx ON events (museum_id, start_date DESC);
CREATE INDEX IF NOT EXISTS events_status_idx ON events (museum_id, status);


-- -------------------------------------------------------------
-- EVENT TIME SLOTS
-- Timed entry with per-slot capacity
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_time_slots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  capacity      integer     NOT NULL DEFAULT 50,
  booked_count  integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS slots_event_idx ON event_time_slots (event_id, start_time);


-- -------------------------------------------------------------
-- TICKET ORDERS
-- One order per purchase (may contain multiple tickets)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_orders (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                    uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slot_id                     uuid        NOT NULL REFERENCES event_time_slots(id) ON DELETE CASCADE,
  museum_id                   uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  buyer_name                  text        NOT NULL,
  buyer_email                 text        NOT NULL,
  quantity                    integer     NOT NULL DEFAULT 1,
  amount_cents                integer     NOT NULL DEFAULT 0,
  platform_fee_cents          integer     NOT NULL DEFAULT 0,
  currency                    text        NOT NULL DEFAULT 'gbp',
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  status                      text        NOT NULL DEFAULT 'pending',
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_museum_idx   ON ticket_orders (museum_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_event_idx    ON ticket_orders (event_id);
CREATE INDEX IF NOT EXISTS orders_slot_idx     ON ticket_orders (slot_id);
CREATE INDEX IF NOT EXISTS orders_session_idx  ON ticket_orders (stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS orders_intent_idx   ON ticket_orders (stripe_payment_intent_id);


-- -------------------------------------------------------------
-- TICKETS
-- Individual tickets within an order
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid        NOT NULL REFERENCES ticket_orders(id) ON DELETE CASCADE,
  ticket_code   text        NOT NULL UNIQUE,
  status        text        NOT NULL DEFAULT 'valid',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_order_idx ON tickets (order_id);
CREATE INDEX IF NOT EXISTS tickets_code_idx  ON tickets (ticket_code);


-- -------------------------------------------------------------
-- CHECK CONSTRAINTS
-- Enforce valid status values and non-negative numerics at the database level.
-- -------------------------------------------------------------
ALTER TABLE events
  ADD CONSTRAINT events_status_check CHECK (status IN ('draft', 'published', 'cancelled')),
  ADD CONSTRAINT events_price_check  CHECK (price_cents >= 0);

ALTER TABLE event_time_slots
  ADD CONSTRAINT slots_capacity_check CHECK (capacity > 0 AND booked_count >= 0 AND booked_count <= capacity);

ALTER TABLE ticket_orders
  ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'completed', 'cancelled'));

ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_check CHECK (status IN ('valid', 'used', 'refunded'));


-- -------------------------------------------------------------
-- ATOMIC SLOT BOOKING FUNCTION
-- Prevents overselling via database-level capacity check
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_slot_bookings(slot_uuid uuid, qty integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE event_time_slots
  SET booked_count = booked_count + qty
  WHERE id = slot_uuid AND booked_count + qty <= capacity;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;


-- -------------------------------------------------------------
-- ATOMIC SLOT RELEASE FUNCTION
-- Used on refunds to safely decrement booked_count (floor 0)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION decrement_slot_bookings(slot_uuid uuid, qty integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE event_time_slots
  SET booked_count = GREATEST(0, booked_count - qty)
  WHERE id = slot_uuid;
END;
$$;
