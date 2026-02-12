-- UniNear Supabase Schema
-- Execute in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- This is the authoritative schema for the project.
-- Last updated: 2026-02-12

-- =============================================================================
-- EVENTS TABLE
-- =============================================================================
create table if not exists public.events (
  id bigserial primary key,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  location text not null,
  capacity integer not null check (capacity >= 0),
  status text not null default 'Draft',
  organizer text not null,
  organiser_id uuid references auth.users(id),
  mood_tags text[] not null default '{}',
  energy_level text,
  attendee_count integer not null default 0 check (attendee_count >= 0),
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create index if not exists events_start_time_idx on public.events (start_time);
create index if not exists events_status_idx on public.events (status);

-- =============================================================================
-- EVENT ATTENDANCE (RSVP) TABLE
-- Covers: FR-16 (RSVP), FR-17 (Cancel RSVP), FR-21 (My Events)
-- =============================================================================
create table if not exists public.event_attendance (
  id bigserial primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- SCRUM-348: Prevents duplicate RSVPs at the database level
  constraint unique_rsvp unique (event_id, user_id)
);

create index if not exists event_attendance_event_id_idx on public.event_attendance (event_id);
create index if not exists event_attendance_user_id_idx on public.event_attendance (user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on both tables
alter table public.events enable row level security;
alter table public.event_attendance enable row level security;

-- Events: anyone can read published events
create policy "Anyone can view published events"
  on public.events for select
  using (status = 'Published');

-- Events: authenticated users can insert
create policy "Authenticated users can create events"
  on public.events for insert
  to authenticated
  with check (true);

-- Events: owners can update their own events
create policy "Owners can update own events"
  on public.events for update
  to authenticated
  using (organiser_id = auth.uid());

-- Events: owners can delete their own events
create policy "Owners can delete own events"
  on public.events for delete
  to authenticated
  using (organiser_id = auth.uid());

-- Attendance: authenticated users can RSVP
create policy "Authenticated users can RSVP"
  on public.event_attendance for insert
  to authenticated
  with check (user_id = auth.uid());

-- Attendance: users can view their own RSVPs
create policy "Users can view own RSVPs"
  on public.event_attendance for select
  to authenticated
  using (user_id = auth.uid());

-- Attendance: event organisers can view RSVPs for their events
create policy "Organisers can view event RSVPs"
  on public.event_attendance for select
  to authenticated
  using (
    event_id in (
      select id from public.events where organiser_id = auth.uid()
    )
  );

-- Attendance: users can cancel their own RSVP
create policy "Users can cancel own RSVP"
  on public.event_attendance for delete
  to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- RPC FUNCTIONS (atomic counters)
-- =============================================================================

-- Atomically increment attendee_count (prevents race conditions)
create or replace function public.increment_attendee_count(p_event_id bigint)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.events
  set attendee_count = attendee_count + 1
  where id = p_event_id
  returning attendee_count into new_count;
  return new_count;
end;
$$;

-- Atomically decrement attendee_count (floor at 0)
create or replace function public.decrement_attendee_count(p_event_id bigint)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.events
  set attendee_count = greatest(attendee_count - 1, 0)
  where id = p_event_id
  returning attendee_count into new_count;
  return new_count;
end;
$$;
