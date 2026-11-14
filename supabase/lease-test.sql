-- Run against the dedicated project; all test rows are rolled back.
begin;
do $$
declare n int;
begin
  insert into public.stories(id,label,document) values ('lease-test','lease-test','{}');
  select count(*) into n from public.claim_story('lease-test','11111111-1111-4111-8111-111111111111');
  assert n=1, 'first claim failed';
  select count(*) into n from public.claim_story('lease-test','22222222-2222-4222-8222-222222222222');
  assert n=0, 'duplicate claim';
  update public.stories set lease_until=now()-interval '1 second' where id='lease-test';
  select count(*) into n from public.claim_story('lease-test','22222222-2222-4222-8222-222222222222');
  assert n=1, 'lease recovery failed';
  update public.stories set document='{"stale":true}'
    where id='lease-test' and lease_token='11111111-1111-4111-8111-111111111111';
  get diagnostics n = row_count;
  assert n=0, 'stale write';
end $$;
rollback;
