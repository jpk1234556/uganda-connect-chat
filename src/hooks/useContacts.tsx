import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  nickname: string | null;
  created_at: string;
  profile?: {
    id: string;
    phone_number: string;
    display_name: string;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
  };
}

export const useContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    if (!user) return;

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);

    if (!contactsData || contactsData.length === 0) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const contactIds = contactsData.map(c => c.contact_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', contactIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const enrichedContacts = contactsData.map(contact => ({
      ...contact,
      profile: profileMap.get(contact.contact_id),
    }));

    setContacts(enrichedContacts);
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();

    // Subscribe to profile online status changes
    const channel = supabase
      .channel('contacts-online-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addContact = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Format phone for Uganda
    const formattedPhone = phoneNumber.startsWith('+256') 
      ? phoneNumber 
      : `+256${phoneNumber.replace(/^0/, '')}`;

    // Find user by phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', formattedPhone)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User not found with this phone number' };
    }

    if (profile.id === user.id) {
      return { success: false, error: "You can't add yourself as a contact" };
    }

    // Check if already a contact
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('contact_id', profile.id)
      .single();

    if (existing) {
      return { success: false, error: 'Contact already exists' };
    }

    const { error } = await supabase.from('contacts').insert({
      user_id: user.id,
      contact_id: profile.id,
    });

    if (error) {
      return { success: false, error: 'Failed to add contact' };
    }

    fetchContacts();
    return { success: true };
  };

  const removeContact = async (contactId: string) => {
    if (!user) return;

    await supabase
      .from('contacts')
      .delete()
      .eq('user_id', user.id)
      .eq('contact_id', contactId);

    fetchContacts();
  };

  const searchUsers = async (query: string) => {
    if (!user || !query) return [];

    const formattedQuery = query.startsWith('+256') 
      ? query 
      : `+256${query.replace(/^0/, '')}`;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('phone_number', `%${formattedQuery}%`)
      .neq('id', user.id)
      .limit(10);

    return data || [];
  };

  return {
    contacts,
    loading,
    addContact,
    removeContact,
    searchUsers,
    refetch: fetchContacts,
  };
};
