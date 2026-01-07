import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat: (userId: string) => void;
}

export const NewChatDialog = ({ open, onOpenChange, onStartChat }: NewChatDialogProps) => {
  const { contacts, addContact, searchUsers } = useContacts();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingPhone, setAddingPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const results = await searchUsers(query);
    setSearchResults(results);
    setSearching(false);
  };

  const handleAddContact = async () => {
    if (!addingPhone) return;

    setAdding(true);
    const { success, error } = await addContact(addingPhone);
    
    if (success) {
      toast.success('Contact added!');
      setAddingPhone('');
    } else {
      toast.error(error || 'Failed to add contact');
    }
    setAdding(false);
  };

  const filteredContacts = contacts.filter(c => 
    c.profile?.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.profile?.phone_number.includes(search)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts or phone number..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add new contact */}
          <div className="flex gap-2">
            <Input
              placeholder="Add by phone (e.g., 0700123456)"
              value={addingPhone}
              onChange={(e) => setAddingPhone(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddContact} disabled={!addingPhone || adding} size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            {/* Contacts */}
            {filteredContacts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">YOUR CONTACTS</p>
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => contact.profile && onStartChat(contact.profile.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={contact.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {contact.profile?.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {contact.profile?.is_online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{contact.profile?.display_name}</p>
                        <p className="text-xs text-muted-foreground">{contact.profile?.phone_number}</p>
                      </div>
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">SEARCH RESULTS</p>
                <div className="space-y-1">
                  {searchResults.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => onStartChat(profile.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{profile.display_name}</p>
                        <p className="text-xs text-muted-foreground">{profile.phone_number}</p>
                      </div>
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty states */}
            {filteredContacts.length === 0 && searchResults.length === 0 && !searching && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <UserPlus className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No contacts yet</p>
                <p className="text-xs">Add a friend using their phone number</p>
              </div>
            )}

            {searching && (
              <div className="flex justify-center py-8">
                <span className="text-muted-foreground text-sm">Searching...</span>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
