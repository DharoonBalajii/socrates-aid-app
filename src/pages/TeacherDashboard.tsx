import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, TrendingUp, AlertCircle, Upload, FileText, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface Struggle {
  id: string;
  topic: string;
  question_summary: string;
  student_count: number;
  last_asked: string;
}

interface Resource {
  id: string;
  subject: string;
  title: string;
  description: string | null;
  document_url: string;
  document_name: string;
  created_at: string;
}

const SUBJECTS = [
  "Data Structures and Algorithm",
  "Computational Structures",
  "Problem Solving using Python",
  "Operating System",
  "Technical English",
  "Engineering Physics",
  "Applied Chemistry"
];

const TeacherDashboard = () => {
  const { signOut, profile } = useAuth();
  const [struggles, setStruggles] = useState<Struggle[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadStruggles();
    loadResources();
  }, []);

  const loadStruggles = async () => {
    const { data } = await supabase
      .from('student_struggles')
      .select('*')
      .order('student_count', { ascending: false })
      .limit(10);
    
    if (data) setStruggles(data);
  };

  const loadResources = async () => {
    const { data } = await supabase
      .from('teacher_resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setResources(data);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFile({
          url: reader.result as string,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  });

  const handleUploadResource = async () => {
    if (!subject || !title || !uploadedFile || !profile) {
      toast.error('Please fill all required fields and upload a document');
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('teacher_resources')
        .insert({
          teacher_id: profile.id,
          subject,
          title,
          description: description || null,
          document_url: uploadedFile.url,
          document_name: uploadedFile.name
        });

      if (error) throw error;

      toast.success('Resource uploaded successfully!');
      setSubject('');
      setTitle('');
      setDescription('');
      setUploadedFile(null);
      loadResources();
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teacher_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Resource deleted');
      loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
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

      <main className="container mx-auto px-6 py-8 space-y-8">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Upload Learning Resources</CardTitle>
            <CardDescription>
              Upload PDFs and documents that students can reference. The AI will use these to guide students.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chapter 3 - Binary Trees"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this resource covers..."
                rows={3}
              />
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary'
              }`}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{uploadedFile.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a document, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleUploadResource} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Uploaded Resources ({resources.length})</CardTitle>
            <CardDescription>
              These materials are available to the AI when helping students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No resources uploaded yet</p>
                </div>
              ) : (
                resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-smooth"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{resource.title}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                            {resource.subject}
                          </span>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{resource.document_name}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteResource(resource.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
