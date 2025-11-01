import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, Sparkles } from 'lucide-react';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'student') {
        navigate('/student');
      } else if (profile.role === 'teacher') {
        navigate('/teacher');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Hero section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow animate-float">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>

          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                Meet Socrates
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered learning companion that helps you master STEM subjects through guided discovery
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 py-6 rounded-2xl shadow-glow transition-smooth"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-glow transition-smooth">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Problem Solving</h3>
              <p className="text-sm text-muted-foreground">
                Upload homework images and get step-by-step guidance through the Socratic method
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-glow transition-smooth">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Personalized Learning</h3>
              <p className="text-sm text-muted-foreground">
                Upload your notes and materials for answers tailored to your curriculum
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-glow transition-smooth">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Teacher Insights</h3>
              <p className="text-sm text-muted-foreground">
                Identify common struggles across students to improve classroom focus
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 StemPal. Powered by Lovable Cloud & AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
