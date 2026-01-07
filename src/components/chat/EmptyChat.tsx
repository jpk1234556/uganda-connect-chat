import { MessageCircle } from 'lucide-react';

export const EmptyChat = () => {
  return (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-secondary/30">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <MessageCircle className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">FriendChat</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        Select a conversation from the list or start a new chat with your friends
      </p>
    </div>
  );
};
