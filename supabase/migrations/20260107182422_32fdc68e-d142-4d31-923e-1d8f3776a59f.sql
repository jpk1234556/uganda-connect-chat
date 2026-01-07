-- Add status_message column to profiles
ALTER TABLE public.profiles ADD COLUMN status_message TEXT DEFAULT 'Hey there! I am using FriendChat';