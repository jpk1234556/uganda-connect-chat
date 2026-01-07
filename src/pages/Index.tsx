import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Phone, Video, Shield, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/chat');
    }
  }, [user, loading, navigate]);

  const features = [
    { icon: MessageCircle, title: 'Text Messaging', description: 'Send instant messages to friends and groups' },
    { icon: Users, title: 'Group Chats', description: 'Create groups with up to 50 friends' },
    { icon: Phone, title: 'Voice Calls', description: 'Crystal clear voice calls (coming soon)' },
    { icon: Video, title: 'Video Calls', description: 'Face-to-face video chats (coming soon)' },
    { icon: Shield, title: 'Secure', description: 'Your messages are private and protected' },
    { icon: Zap, title: 'Real-time', description: 'See when friends are online and typing' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">FriendChat</span>
        </div>
        {user ? (
          <Button onClick={() => navigate('/chat')}>
            Go to Chat
          </Button>
        ) : (
          <Button onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        )}
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Connect with Friends in Uganda
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            A simple and fast messaging app for you and your friends. 
            Text, share photos, and stay connected using your Uganda phone number.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Chatting
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8">
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t mt-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">FriendChat - Made for Uganda</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect with friends using your +256 phone number
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
