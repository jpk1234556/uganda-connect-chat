import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Conversation } from '@/hooks/useConversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageCircle, Search, MoreVertical, Users, UserPlus, LogOut, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatSidebarProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
}

export const ChatSidebar = ({
  conversations,
  loading,
  selectedId,
  onSelect,
  onNewChat,
  onNewGroup,
}: ChatSidebarProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter(conv => {
    const name = conv.is_group 
      ? conv.name 
      : conv.members?.[0]?.display_name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.is_group) return conv.name || 'Group Chat';
    return conv.members?.[0]?.display_name || 'Unknown';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.is_group) return conv.avatar_url;
    return conv.members?.[0]?.avatar_url;
  };

  const isOnline = (conv: Conversation) => {
    if (conv.is_group) return false;
    return conv.members?.[0]?.is_online || false;
  };

  return (
    <div className="w-full md:w-96 h-full flex flex-col border-r bg-card">
      {/* Header */}
      <div className="p-4 border-b bg-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-primary-foreground">FriendChat</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onNewChat}>
                <UserPlus className="mr-2 h-4 w-4" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewGroup}>
                <Users className="mr-2 h-4 w-4" />
                New Group
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <Button
              variant="link"
              className="mt-2 text-primary"
              onClick={onNewChat}
            >
              Start a new chat
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left ${
                  selectedId === conv.id ? 'bg-accent' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getConversationAvatar(conv) || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {conv.is_group ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        getConversationName(conv).charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline(conv) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{getConversationName(conv)}</span>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                    {conv.unread_count && conv.unread_count > 0 ? (
                      <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Quick action buttons */}
      <div className="p-3 border-t flex gap-2">
        <Button onClick={onNewChat} className="flex-1" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button onClick={onNewGroup} variant="outline" className="flex-1" size="sm">
          <Users className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>
    </div>
  );
};
