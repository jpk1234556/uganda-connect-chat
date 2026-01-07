-- Ensure required extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure status_message exists (idempotent)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS status_message TEXT DEFAULT 'Hey there! I am using FriendChat';

-- Performance indexes
-- Profiles lookup by phone number
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles (phone_number);

-- Contacts queries by owner and reverse lookup
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON public.contacts (contact_id);

-- Conversation members fast membership checks
CREATE INDEX IF NOT EXISTS idx_conv_members_conversation_id ON public.conversation_members (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_user_id ON public.conversation_members (user_id);

-- Messages list and sender filters
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
