-- Someday 1.2: watchlist sync schema.
-- Source of truth is the cloud; clients hold a local cache + push optimistically.
-- `updated_at` is server-managed (trigger below), so conflicts resolve by server clock.

create table if not exists public.watchlist_items (
    id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,

    imdb_id text,
    media_type text not null check (media_type in ('movie', 'tv')),
    title text not null,
    poster_url text,
    overview text,
    release_date text,
    vote_average real,
    genres text[],
    status text not null default 'watchlist' check (status in ('watchlist', 'watched')),

    added_at bigint not null,
    watched_at bigint,
    deleted_at timestamptz,
    updated_at timestamptz not null default now(),

    manual boolean not null default false,

    director text,
    actors text,
    runtime text,
    rated text,
    writer text,
    language text,
    awards text,
    metascore text,
    imdb_rating text,
    rotten_tomatoes text,
    box_office text,

    primary key (user_id, id)
);

create or replace function public.set_watchlist_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists watchlist_items_set_updated_at on public.watchlist_items;
create trigger watchlist_items_set_updated_at
before update on public.watchlist_items
for each row execute function public.set_watchlist_updated_at();

alter table public.watchlist_items enable row level security;

drop policy if exists "users manage own watchlist" on public.watchlist_items;
create policy "users manage own watchlist"
on public.watchlist_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists watchlist_items_updated_idx
on public.watchlist_items (user_id, updated_at);
