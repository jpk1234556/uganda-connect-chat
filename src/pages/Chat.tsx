import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { NewGroupDialog } from '@/components/chat/NewGroupDialog';

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: convsLoading, createPrivateConversation, createGroupConversation } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    if (isMobileView) {
      setShowChatOnMobile(true);
    }
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
  };

  const handleNewPrivateChat = async (userId: string) => {
    const convId = await createPrivateConversation(userId);
    if (convId) {
      const conv = conversations.find(c => c.id === convId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
    setShowNewChat(false);
  };

  const handleNewGroupChat = async (name: string, memberIds: string[]) => {
    const convId = await createGroupConversation(name, memberIds);
    if (convId) {
      // Wait a bit for the conversation to be fetched
      setTimeout(() => {
        const conv = conversations.find(c => c.id === convId);
        if (conv) handleSelectConversation(conv);
      }, 500);
    }
    setShowNewGroup(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar - hide on mobile when chat is open */}
      {(!isMobileView || !showChatOnMobile) && (
        <ChatSidebar
          conversations={conversations}
          loading={convsLoading}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          onNewChat={() => setShowNewChat(true)}
          onNewGroup={() => setShowNewGroup(true)}
        />
      )}

      {/* Chat window or empty state */}
      {(!isMobileView || showChatOnMobile) && (
        selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={isMobileView ? handleBackToList : undefined}
          />
        ) : (
          <EmptyChat />
        )
      )}

      {/* Dialogs */}
      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        onStartChat={handleNewPrivateChat}
      />

      <NewGroupDialog
        open={showNewGroup}
        onOpenChange={setShowNewGroup}
        onCreate={handleNewGroupChat}
      />
    </div>
  );
};

export default Chat;
