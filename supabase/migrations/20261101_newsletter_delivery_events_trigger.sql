-- Registra transicoes no banco; toda insercao/alteracao ocorre na mesma transacao.
begin;
create or replace function public.editorial_record_newsletter_delivery_event()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
 if tg_op = 'INSERT' or new.status is distinct from old.status then
  insert into public.editorial_newsletter_delivery_events(delivery_id,event_type)
   values(new.id,new.status);
 end if;
 return new;
end;
$$;
revoke all on function public.editorial_record_newsletter_delivery_event() from public,anon,authenticated;
drop trigger if exists editorial_record_newsletter_delivery_event on public.editorial_newsletter_delivery_queue;
create trigger editorial_record_newsletter_delivery_event
after insert or update of status on public.editorial_newsletter_delivery_queue
for each row execute function public.editorial_record_newsletter_delivery_event();
commit;
