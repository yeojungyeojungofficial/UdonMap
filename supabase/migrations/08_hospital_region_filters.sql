alter table public.hospitals
add column if not exists region_filter text;

create or replace function public.get_hospital_region_filter(
  p_region text,
  p_street_address text default ''
)
returns text
language sql
immutable
as $$
  select case
    when concat_ws(' ', p_region, p_street_address) ~ '(서울특별시|서울시|서울)' then '서울'
    when concat_ws(' ', p_region, p_street_address) ~ '(경기도|경기)' then '경기'
    when concat_ws(' ', p_region, p_street_address) ~ '(인천광역시|인천)' then '인천'
    when concat_ws(' ', p_region, p_street_address) ~ '(강원특별자치도|강원도|강원)' then '강원'
    when concat_ws(' ', p_region, p_street_address) ~ '(대전광역시|대전)' then '대전'
    when concat_ws(' ', p_region, p_street_address) ~ '(세종특별자치시|세종시|세종)' then '세종'
    when concat_ws(' ', p_region, p_street_address) ~ '(충청북도|충북)' then '충북'
    when concat_ws(' ', p_region, p_street_address) ~ '(충청남도|충남)' then '충남'
    when concat_ws(' ', p_region, p_street_address) ~ '(광주광역시|광주)' then '광주'
    when concat_ws(' ', p_region, p_street_address) ~ '(전북특별자치도|전라북도|전북)' then '전북'
    when concat_ws(' ', p_region, p_street_address) ~ '(전라남도|전남)' then '전남'
    when concat_ws(' ', p_region, p_street_address) ~ '(부산광역시|부산)' then '부산'
    when concat_ws(' ', p_region, p_street_address) ~ '(대구광역시|대구)' then '대구'
    when concat_ws(' ', p_region, p_street_address) ~ '(울산광역시|울산)' then '울산'
    when concat_ws(' ', p_region, p_street_address) ~ '(경상북도|경북)' then '경북'
    when concat_ws(' ', p_region, p_street_address) ~ '(경상남도|경남)' then '경남'
    when concat_ws(' ', p_region, p_street_address) ~ '(제주특별자치도|제주도|제주)' then '제주'
    else '기타'
  end
$$;

update public.hospitals
set region_filter = public.get_hospital_region_filter(region, street_address)
where region_filter is distinct from public.get_hospital_region_filter(region, street_address);

alter table public.hospitals
alter column region_filter set default '기타';

alter table public.hospitals
alter column region_filter set not null;

alter table public.hospitals
drop constraint if exists hospitals_region_filter_check;

alter table public.hospitals
add constraint hospitals_region_filter_check
check (
  region_filter in (
    '서울',
    '경기',
    '인천',
    '강원',
    '대전',
    '세종',
    '충북',
    '충남',
    '광주',
    '전북',
    '전남',
    '부산',
    '대구',
    '울산',
    '경북',
    '경남',
    '제주',
  )
);

create or replace function public.set_hospital_region_filter()
returns trigger
language plpgsql
as $$
begin
  new.region_filter := public.get_hospital_region_filter(new.region, new.street_address);
  return new;
end;
$$;

drop trigger if exists set_hospitals_region_filter on public.hospitals;

create trigger set_hospitals_region_filter
before insert or update of region, street_address
on public.hospitals
for each row
execute function public.set_hospital_region_filter();

create index if not exists hospitals_region_filter_idx
on public.hospitals (region_filter);
