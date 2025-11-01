import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Sparkles, 
  Brain, 
  Upload, 
  MessageSquare, 
  Target,
  Zap,
  Shield,
  TrendingUp,
  FileText,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StemPal
            </span>
          </div>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-smooth"
          >
            Sign In
          </Button>
        </div>
      </nav>
      
      {/* Hero section */}
      <section className="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 animate-fade-in">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow animate-float">
                <GraduationCap className="h-14 w-14 text-primary-foreground" />
              </div>
            </div>

            {/* Main heading */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  Meet Socrates
                </span>
              </h1>
              <p className="text-xl md:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Your AI-powered learning companion that transforms STEM education through{' '}
                <span className="text-primary font-semibold">guided discovery</span> and{' '}
                <span className="text-accent font-semibold">intelligent tutoring</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-10 py-7 rounded-2xl shadow-glow transition-smooth hover-scale"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Learning Free
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 rounded-2xl border-primary/30 hover:bg-primary/10 transition-smooth"
              >
                <Users className="mr-2 h-5 w-5" />
                For Teachers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Why Choose StemPal?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by advanced AI to make learning engaging, effective, and personalized
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Socratic Method',
                description: 'Learn through guided questions that build deep understanding, not just answers',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Upload,
                title: 'Upload & Learn',
                description: 'Submit homework images, PDFs, or documents and get instant, personalized help',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: MessageSquare,
                title: 'Interactive Chat',
                description: 'Have natural conversations with your AI tutor available 24/7',
                gradient: 'from-green-500 to-emerald-500'
              },
              {
                icon: FileText,
                title: 'Custom Resources',
                description: 'Upload your notes and textbooks for answers tailored to your curriculum',
                gradient: 'from-orange-500 to-red-500'
              },
              {
                icon: Target,
                title: 'Teacher Dashboard',
                description: 'Track student progress and identify common learning challenges',
                gradient: 'from-indigo-500 to-purple-500'
              },
              {
                icon: TrendingUp,
                title: 'Adaptive Learning',
                description: 'AI adjusts to your learning pace and references teacher materials',
                gradient: 'from-pink-500 to-rose-500'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 container mx-auto px-6 py-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Upload Your Question',
                description: 'Take a photo of your homework, upload a PDF, or type your question directly',
                icon: Upload
              },
              {
                step: '02',
                title: 'Get Guided Help',
                description: 'Socrates analyzes your question and guides you through the solution with questions',
                icon: MessageSquare
              },
              {
                step: '03',
                title: 'Master the Concept',
                description: 'Understand the underlying principles and learn to solve similar problems independently',
                icon: CheckCircle2
              }
            ].map((step, index) => (
              <div 
                key={index}
                className="flex gap-6 items-start p-8 rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {step.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <step.icon className="h-6 w-6 text-primary" />
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8 animate-fade-in text-center">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Built for Students & Teachers
                </span>
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: 'Instant Help',
                    description: 'Get help whenever you need it, no waiting for tutors'
                  },
                  {
                    icon: Shield,
                    title: 'Safe & Secure',
                    description: 'Your data is protected with enterprise-grade security'
                  },
                  {
                    icon: Brain,
                    title: 'Deep Understanding',
                    description: 'Focus on learning concepts, not just getting answers'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4 items-start text-left max-w-xl mx-auto">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 p-12 md:p-16 text-center backdrop-blur-sm shadow-glow animate-fade-in">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Ready to Transform Your Learning?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of students already learning smarter with AI-powered guidance
              </p>
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-10 py-7 rounded-2xl shadow-glow transition-smooth hover-scale"
              >
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12 mt-20 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                StemPal
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 StemPal. Powered by Lovable Cloud & AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
