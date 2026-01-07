-- Chat app schema and policies
-- Safe to run multiple times: uses IF NOT EXISTS where supported

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone_number text unique not null,
  avatar_url text,
  is_online boolean not null default false,
  last_seen timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  nickname text,
  created_at timestamptz not null default now(),
  unique(user_id, contact_id)
);

-- conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  name text,
  is_group boolean not null default false,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- conversation members
create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member', -- 'admin' | 'member'
  created_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

-- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  message_type text not null default 'text', -- 'text' | 'image'
  media_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- updated_at trigger for conversations
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute procedure public.set_updated_at();

-- also bump conversation updated_at when a message is inserted
create or replace function public.bump_conversation_updated_at()
returns trigger as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_messages_bump_conv on public.messages;
create trigger trg_messages_bump_conv
after insert on public.messages
for each row execute procedure public.bump_conversation_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Policies
-- profiles: users can select public fields of all profiles
create policy if not exists profiles_select on public.profiles
for select using (true);

-- profiles: users can update their own profile
create policy if not exists profiles_update_own on public.profiles
for update using (auth.uid() = id);

-- contacts: owner can manage their contacts; readable by owner only
create policy if not exists contacts_owner_select on public.contacts
for select using (auth.uid() = user_id);

create policy if not exists contacts_owner_insert on public.contacts
for insert with check (auth.uid() = user_id);

create policy if not exists contacts_owner_delete on public.contacts
for delete using (auth.uid() = user_id);

-- conversations: members can select
create policy if not exists conversations_member_select on public.conversations
for select using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conversations.id and m.user_id = auth.uid()
  )
);

-- conversations: creator can insert
create policy if not exists conversations_insert_creator on public.conversations
for insert with check (created_by = auth.uid());

-- conversation_members: members can select; admin/creator can insert
create policy if not exists conversation_members_select on public.conversation_members
for select using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conversation_members.conversation_id and m.user_id = auth.uid()
  )
);

create policy if not exists conversation_members_insert on public.conversation_members
for insert with check (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conversation_members.conversation_id
      and m.user_id = auth.uid()
      and (m.role = 'admin')
  ) or auth.uid() = (select created_by from public.conversations c where c.id = conversation_members.conversation_id)
);

-- messages: members can read/insert in their conversations; update only to mark read on own received messages
create policy if not exists messages_member_select on public.messages
for select using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  )
);

create policy if not exists messages_member_insert on public.messages
for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  )
);

create policy if not exists messages_mark_read on public.messages
for update using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  )
) with check (true);

-- Storage bucket for chat images
insert into storage.buckets (id, name, public)
select 'chat-media', 'chat-media', true
where not exists (select 1 from storage.buckets where id = 'chat-media');

-- Policy: allow public read on chat-media; authenticated upload to their path
create policy if not exists chat_media_public_read on storage.objects
for select using (bucket_id = 'chat-media');

create policy if not exists chat_media_authenticated_insert on storage.objects
for insert with check (
  bucket_id = 'chat-media' and auth.role() = 'authenticated'
);

create policy if not exists chat_media_authenticated_update on storage.objects
for update using (
  bucket_id = 'chat-media' and auth.role() = 'authenticated'
) with check (
  bucket_id = 'chat-media' and auth.role() = 'authenticated'
);
