-- Enable RLS on profiles if not active
alter table profiles enable row level security;

-- Drop existing policy if it exists (to avoid conflicts)
drop policy if exists "Admins can view all profiles" on profiles;

-- Create policy to allow admins and super admins to view all profiles
create policy "Admins can view all profiles"
on profiles for select
to authenticated
using (
    (select role from profiles where id = auth.uid()) = 'admin'
    or
    (select is_super_admin from profiles where id = auth.uid()) = true
);

-- Ensure users can still view their own profile (usually exists, but good to ensure)
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
on profiles for select
to authenticated
using (
    auth.uid() = id
);
