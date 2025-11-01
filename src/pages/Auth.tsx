import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users } from 'lucide-react';

const AVAILABLE_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 
  'Computer Science', 'English', 'History', 'Geography'
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (isSignUp && (!fullName || !classNumber || selectedSubjects.length === 0)) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields including name, class number, and at least one subject',
        variant: 'destructive',
      });
      return;
    }

    const { error } = isSignUp 
      ? await signUp(email, password, role, fullName, classNumber, selectedSubjects)
      : await signIn(email, password);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: isSignUp ? 'Account created!' : 'Welcome back!',
        description: isSignUp 
          ? 'You can now sign in with your credentials.'
          : 'Successfully signed in.',
      });
      if (!isSignUp) {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-soft border-border/50">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to StemPal
          </CardTitle>
          <CardDescription>
            Your AI learning companion powered by Socrates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full" onValueChange={(v) => setIsSignUp(v === 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-smooth shadow-soft">
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={role === 'student' ? 'default' : 'outline'}
                      onClick={() => setRole('student')}
                      className={`h-20 flex flex-col gap-2 ${role === 'student' ? 'bg-primary hover:bg-primary/90' : ''}`}
                    >
                      <GraduationCap className="h-6 w-6" />
                      <span>Student</span>
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'teacher' ? 'default' : 'outline'}
                      onClick={() => setRole('teacher')}
                      className={`h-20 flex flex-col gap-2 ${role === 'teacher' ? 'bg-primary hover:bg-primary/90' : ''}`}
                    >
                      <Users className="h-6 w-6" />
                      <span>Teacher</span>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-number">Class Number *</Label>
                  <Input
                    id="class-number"
                    type="text"
                    placeholder="10A"
                    value={classNumber}
                    onChange={(e) => setClassNumber(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subjects * (Select at least one)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {AVAILABLE_SUBJECTS.map(subject => (
                      <Button
                        key={subject}
                        type="button"
                        variant={selectedSubjects.includes(subject) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleSubject(subject)}
                        className="justify-start"
                      >
                        {subject}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-smooth shadow-soft">
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
