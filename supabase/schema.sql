-- Uninear Supabase schema
-- Execute in Supabase SQL editor to create required tables.

-- Events table
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
  organiser_id text,
  mood_tags text[] not null default '{}',
  energy_level text,
  latitude double precision,
  longitude double precision,
  friends_attending text[] not null default '{}',
  rating numeric(3,2),
  created_at timestamptz not null default now()
);

create index if not exists events_start_time_idx on public.events (start_time);
create index if not exists events_status_idx on public.events (status);

-- Event attendance table
create table if not exists public.event_attendance (
  id bigserial primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  user_id text,
  created_at timestamptz not null default now()
);

create index if not exists event_attendance_event_id_idx on public.event_attendance (event_id);
create index if not exists event_attendance_user_id_idx on public.event_attendance (user_id);
