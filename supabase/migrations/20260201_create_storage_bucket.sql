-- Create storage bucket for attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Set up security policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'attachments' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

create policy "Users can update their own items"
  on storage.objects for update
  using ( bucket_id = 'attachments' and auth.uid() = owner );

create policy "Users can delete their own items"
  on storage.objects for delete
  using ( bucket_id = 'attachments' and auth.uid() = owner );
