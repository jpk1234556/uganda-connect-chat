import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { Conversation } from '@/hooks/useConversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Image as ImageIcon, MoreVertical, Phone, Video, Users } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, uploadImage } = useMessages(conversation.id);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationName = conversation.is_group 
    ? conversation.name || 'Group Chat'
    : conversation.members?.[0]?.display_name || 'Unknown';

  const isOnline = !conversation.is_group && conversation.members?.[0]?.is_online;

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    const url = await uploadImage(file);
    if (url) {
      await sendMessage('', 'image', url);
    }
    setSending(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach(msg => {
      const msgDate = formatMessageDate(new Date(msg.created_at));
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b bg-card flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.is_group ? conversation.avatar_url || undefined : conversation.members?.[0]?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {conversation.is_group ? (
              <Users className="h-5 w-5" />
            ) : (
              conversationName.charAt(0).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{conversationName}</h2>
          <p className="text-xs text-muted-foreground">
            {conversation.is_group 
              ? `${(conversation.members?.length || 0) + 1} members`
              : isOnline ? 'Online' : 'Offline'
            }
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 chat-pattern">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center">
              <span className="text-muted-foreground text-sm">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Send a message to start the conversation</p>
            </div>
          ) : (
            groupMessagesByDate().map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 rounded-full bg-card text-xs text-muted-foreground shadow-sm">
                    {group.date}
                  </span>
                </div>

                {group.messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex mb-2',
                        isMine ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
                          isMine
                            ? 'bg-chat-bubble-sent rounded-br-none'
                            : 'bg-chat-bubble-received rounded-bl-none'
                        )}
                      >
                        {conversation.is_group && !isMine && (
                          <p className="text-xs font-medium text-primary mb-1">
                            {msg.sender?.display_name}
                          </p>
                        )}

                        {msg.message_type === 'image' && msg.media_url ? (
                          <img
                            src={msg.media_url}
                            alt="Shared image"
                            className="max-w-full rounded-md mb-1"
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}

                        <p className={cn(
                          'text-[10px] mt-1',
                          isMine ? 'text-right text-muted-foreground' : 'text-muted-foreground'
                        )}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />

          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
