import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, TrendingUp, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Struggle {
  id: string;
  topic: string;
  question_summary: string;
  student_count: number;
  last_asked: string;
}

const TeacherDashboard = () => {
  const { signOut, profile } = useAuth();
  const [struggles, setStruggles] = useState<Struggle[]>([]);

  useEffect(() => {
    loadStruggles();
  }, []);

  const loadStruggles = async () => {
    const { data } = await supabase
      .from('student_struggles')
      .select('*')
      .order('student_count', { ascending: false })
      .limit(10);
    
    if (data) setStruggles(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {profile?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Teacher Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Total Topics Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{struggles.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                High Priority Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {struggles.filter(s => s.student_count >= 3).length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Student Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {struggles.reduce((acc, s) => acc + s.student_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Common Student Struggles</CardTitle>
            <CardDescription>
              Topics where multiple students need help - prioritize these in class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {struggles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No student struggles tracked yet</p>
                  <p className="text-sm">Data will appear as students ask questions</p>
                </div>
              ) : (
                struggles.map((struggle) => (
                  <div
                    key={struggle.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-smooth"
                  >
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        struggle.student_count >= 5
                          ? 'bg-destructive text-destructive-foreground'
                          : struggle.student_count >= 3
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {struggle.student_count}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{struggle.topic}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {struggle.question_summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last asked: {new Date(struggle.last_asked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeacherDashboard;
