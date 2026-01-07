import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string | null;
    created_at: string;
    sender_name: string;
  };
  members?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_online: boolean;
  }[];
  unread_count?: number;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: memberData } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!memberData || memberData.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = memberData.map(m => m.conversation_id);

    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (!convData) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch members and last messages for each conversation
    const enrichedConversations = await Promise.all(
      convData.map(async (conv) => {
        // Get members
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conv.id);

        const memberIds = members?.map(m => m.user_id) || [];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, is_online')
          .in('id', memberIds);

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = lastMessages?.[0];
        let senderName = '';
        if (lastMessage) {
          const sender = profiles?.find(p => p.id === lastMessage.sender_id);
          senderName = sender?.display_name || 'Unknown';
        }

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return {
          ...conv,
          members: profiles?.filter(p => p.id !== user.id) || [],
          last_message: lastMessage ? {
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            sender_name: senderName,
          } : undefined,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enrichedConversations);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchConversations();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createPrivateConversation = async (otherUserId: string) => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: existingMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    for (const member of existingMembers || []) {
      const { data: otherMember } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('conversation_id', member.conversation_id)
        .eq('user_id', otherUserId)
        .single();

      if (otherMember) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', member.conversation_id)
          .eq('is_group', false)
          .single();

        if (conv) return conv.id;
      }
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ is_group: false, created_by: user.id })
      .select()
      .single();

    if (error || !newConv) return null;

    // Add both members
    await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      { conversation_id: newConv.id, user_id: otherUserId, role: 'member' },
    ]);

    fetchConversations();
    return newConv.id;
  };

  const createGroupConversation = async (name: string, memberIds: string[]) => {
    if (!user) return null;

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ name, is_group: true, created_by: user.id })
      .select()
      .single();

    if (error || !newConv) return null;

    const members = [user.id, ...memberIds].map(id => ({
      conversation_id: newConv.id,
      user_id: id,
      role: id === user.id ? 'admin' : 'member',
    }));

    await supabase.from('conversation_members').insert(members);

    fetchConversations();
    return newConv.id;
  };

  return {
    conversations,
    loading,
    createPrivateConversation,
    createGroupConversation,
    refetch: fetchConversations,
  };
};
