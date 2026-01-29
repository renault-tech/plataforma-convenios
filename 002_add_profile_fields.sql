-- Add new columns to profiles if they don't exist
alter table public.profiles 
add column if not exists secretaria text,
add column if not exists setor text;

-- Update the handle_new_user function to include these fields
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, secretaria, setor)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'secretaria',
    new.raw_user_meta_data->>'setor'
  );
  return new;
end;
$$ language plpgsql security definer;
