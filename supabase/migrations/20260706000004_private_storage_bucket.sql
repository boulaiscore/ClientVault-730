insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do update set public = false;
