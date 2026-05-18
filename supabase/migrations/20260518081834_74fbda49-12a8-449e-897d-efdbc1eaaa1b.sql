drop policy if exists "Exam PDFs are publicly readable" on storage.objects;

create policy "Exam PDF files are publicly readable"
on storage.objects
for select
using (
  bucket_id = 'exam-materials'
  and lower(name) like '%.pdf'
);