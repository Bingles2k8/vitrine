-- =============================================================
-- Row Level Security (RLS) Policies for Ticketing
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- EVENTS
-- Owners can CRUD. Public can read published events.
-- -------------------------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their museums"
  ON events FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = events.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create events in their museums"
  ON events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = events.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update events in their museums"
  ON events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = events.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = events.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete events in their museums"
  ON events FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = events.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Public can read published events"
  ON events FOR SELECT TO anon
  USING (status = 'published');


-- -------------------------------------------------------------
-- EVENT TIME SLOTS
-- Owners can CRUD via event→museum join. Public can read for published events.
-- -------------------------------------------------------------
ALTER TABLE event_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view time slots in their museums"
  ON event_time_slots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events JOIN museums ON museums.id = events.museum_id
    WHERE events.id = event_time_slots.event_id AND museums.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create time slots in their museums"
  ON event_time_slots FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events JOIN museums ON museums.id = events.museum_id
    WHERE events.id = event_time_slots.event_id AND museums.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update time slots in their museums"
  ON event_time_slots FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events JOIN museums ON museums.id = events.museum_id
    WHERE events.id = event_time_slots.event_id AND museums.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events JOIN museums ON museums.id = events.museum_id
    WHERE events.id = event_time_slots.event_id AND museums.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete time slots in their museums"
  ON event_time_slots FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events JOIN museums ON museums.id = events.museum_id
    WHERE events.id = event_time_slots.event_id AND museums.owner_id = auth.uid()
  ));

CREATE POLICY "Public can read slots for published events"
  ON event_time_slots FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_time_slots.event_id AND events.status = 'published'
  ));


-- -------------------------------------------------------------
-- TICKET ORDERS
-- Owners can read/update. Service role inserts during checkout.
-- -------------------------------------------------------------
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders in their museums"
  ON ticket_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = ticket_orders.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update orders in their museums"
  ON ticket_orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = ticket_orders.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = ticket_orders.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- TICKETS
-- Owners can read/update. Public can look up by ticket code.
-- -------------------------------------------------------------
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets in their museums"
  ON tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ticket_orders JOIN museums ON museums.id = ticket_orders.museum_id
    WHERE ticket_orders.id = tickets.order_id AND museums.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update tickets in their museums"
  ON tickets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM ticket_orders JOIN museums ON museums.id = ticket_orders.museum_id
    WHERE ticket_orders.id = tickets.order_id AND museums.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ticket_orders JOIN museums ON museums.id = ticket_orders.museum_id
    WHERE ticket_orders.id = tickets.order_id AND museums.owner_id = auth.uid()
  ));

CREATE POLICY "Public can look up tickets by code"
  ON tickets FOR SELECT TO anon
  USING (true);
