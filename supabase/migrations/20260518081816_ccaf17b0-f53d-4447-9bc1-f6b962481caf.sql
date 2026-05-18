insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exam-materials', 'exam-materials', true, 104857600, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Exam PDFs are publicly readable"
on storage.objects
for select
using (bucket_id = 'exam-materials');