-- Create a private bucket named 'pdfs' first in Storage UI (Public: OFF)
-- Then add RLS policies on storage.objects:

-- READ: user can list/get only their folder under 'pdfs'
create policy "storage_read_own_pdfs"
on storage.objects
for select
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- WRITE (upload): user can upload only into their own folder
create policy "storage_upload_own_pdfs"
on storage.objects
for insert
with check (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Optional: DELETE their own files
create policy "storage_delete_own_pdfs"
on storage.objects
for delete
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);
