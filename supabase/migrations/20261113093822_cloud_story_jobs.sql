create table public.stories (
  id text primary key,
  label text not null unique,
  document jsonb not null,
  lease_token uuid,
  lease_until timestamptz
);
alter table public.stories enable row level security;
revoke all on public.stories from anon, authenticated;
grant all on public.stories to service_role;

create function public.claim_story(story_id text, token uuid)
returns setof public.stories language sql security invoker set search_path = '' as $$
  update public.stories set lease_token = token, lease_until = now() + interval '240 seconds'
  where id = story_id and (lease_until is null or lease_until < now()) returning *;
$$;
revoke all on function public.claim_story(text, uuid) from public, anon, authenticated;
grant execute on function public.claim_story(text, uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-media', 'story-media', false, 10485760, array['image/jpeg','audio/mpeg','audio/wav']);
