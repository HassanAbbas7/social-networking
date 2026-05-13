attendees table:

create table public.attendees (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  slug text not null,
  name text not null,
  company text not null,
  title text not null,
  sector text not null,
  country text not null,
  linkedin_url text not null,
  photo_url text null,
  constraint attendees_pkey primary key (id),
  constraint attendees_slug_key unique (slug)
) TABLESPACE pg_default;

create trigger set_attendee_slug BEFORE INSERT
or
update OF name on attendees for EACH row
execute FUNCTION generate_attendee_slug ();


connections table:

create table public.connections (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  scanner_id uuid not null,
  scanned_id uuid not null,
  constraint connections_pkey primary key (id),
  constraint connections_scanned_id_fkey foreign KEY (scanned_id) references attendees (id) on delete CASCADE,
  constraint connections_scanner_id_fkey foreign KEY (scanner_id) references attendees (id) on delete CASCADE,
  constraint connections_no_self_connection check ((scanner_id <> scanned_id))
) TABLESPACE pg_default;

create unique INDEX IF not exists connections_unique_pair_idx on public.connections using btree (
  LEAST(scanner_id, scanned_id),
  GREATEST(scanner_id, scanned_id)
) TABLESPACE pg_default;