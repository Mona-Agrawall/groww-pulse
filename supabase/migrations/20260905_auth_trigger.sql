create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
