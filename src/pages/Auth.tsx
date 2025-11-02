import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'Data Structures and Algorithm',
  'Computational Structures',
  'Problem Solving using Python',
  'Operating System',
  'Technical English',
  'Engineering Physics',
  'Applied Chemistry'
];

const TEACHER_SECRET_KEY = 'Qp2$z9Xv#6YcR7t@L4Jf';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [teacherSecretKey, setTeacherSecretKey] = useState('');
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const toggleSubject = (subject: string) => {
    if (role === 'teacher') {
      // Teachers can only select one subject
      setSelectedSubjects([subject]);
      setSubjectsOpen(false);
    } else {
      // Students can select multiple subjects
      setSelectedSubjects(prev => 
        prev.includes(subject) 
          ? prev.filter(s => s !== subject)
          : [...prev, subject]
      );
    }
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

    if (isSignUp && role === 'teacher' && teacherSecretKey !== TEACHER_SECRET_KEY) {
      toast({
        title: 'Access Denied',
        description: 'Invalid teacher secret key. Please contact your administrator.',
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
                  <Label htmlFor="class-number">
                    {role === 'teacher' ? 'Class Number(s) *' : 'Class Number *'}
                  </Label>
                  <Input
                    id="class-number"
                    type="text"
                    placeholder={role === 'teacher' ? 'e.g., 10A, 10B, 11C' : '10A'}
                    value={classNumber}
                    onChange={(e) => setClassNumber(e.target.value)}
                    className="transition-smooth focus:ring-primary"
                    required
                  />
                  {role === 'teacher' && (
                    <p className="text-xs text-muted-foreground">
                      You can manage multiple classes with one account
                    </p>
                  )}
                </div>

                {role === 'teacher' && (
                  <div className="space-y-2">
                    <Label htmlFor="secret-key">Teacher Secret Key *</Label>
                    <Input
                      id="secret-key"
                      type="password"
                      placeholder="Enter teacher secret key"
                      value={teacherSecretKey}
                      onChange={(e) => setTeacherSecretKey(e.target.value)}
                      className="transition-smooth focus:ring-primary"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact your administrator for the secret key
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    {role === 'student' 
                      ? 'Subjects * (Select multiple - you can take up to 5 courses)' 
                      : 'Subject * (Select one subject you teach)'}
                  </Label>
                  <Popover open={subjectsOpen} onOpenChange={setSubjectsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={subjectsOpen}
                        className="w-full justify-between"
                      >
                        {selectedSubjects.length > 0
                          ? role === 'teacher' 
                            ? selectedSubjects[0]
                            : `${selectedSubjects.length} subject${selectedSubjects.length > 1 ? 's' : ''} selected`
                          : role === 'teacher' ? "Select subject..." : "Select subjects..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                      <Command className="bg-popover">
                        <CommandInput placeholder="Search subjects..." />
                        <CommandList>
                          <CommandEmpty>No subject found.</CommandEmpty>
                          <CommandGroup>
                            {AVAILABLE_SUBJECTS.map((subject) => (
                              <CommandItem
                                key={subject}
                                value={subject}
                                onSelect={() => {
                                  toggleSubject(subject);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSubjects.includes(subject) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {subject}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSubjects.map(subject => (
                        <div
                          key={subject}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md flex items-center gap-1"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => toggleSubject(subject)}
                            className="hover:text-primary/80"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
