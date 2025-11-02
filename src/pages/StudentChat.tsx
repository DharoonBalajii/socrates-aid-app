import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MessageSquare, Send, Image as ImageIcon, LogOut, Upload, Plus, FileText, X, BookOpen, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  document_url?: string;
  document_name?: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  document_name: string;
  document_url: string;
  created_at: string;
}

const StudentChat = () => {
  const { user, signOut, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<{ url: string; name: string } | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result as string);
          toast({ title: 'Image uploaded', description: 'Your image is ready to send!' });
        };
        reader.readAsDataURL(file);
      }
    },
  });

  const { getRootProps: getDocRootProps, getInputProps: getDocInputProps, isDragActive: isDocDragActive } = useDropzone({
    accept: { 
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedDocument({ url: reader.result as string, name: file.name });
          toast({ title: 'Document uploaded', description: `${file.name} is ready to send!` });
        };
        reader.readAsDataURL(file);
      }
    },
  });

  useEffect(() => {
    loadChats();
    loadUserSubjects();
    loadResources();
  }, [user]);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat);
      subscribeToMessages(currentChat);
    }
  }, [currentChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUserSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('name')
      .eq('user_id', user?.id);
    
    console.log('User subjects loaded:', data, 'Error:', error);
    
    if (data) {
      setUserSubjects(data.map(s => s.name));
    }
  };

  const loadResources = async () => {
    const { data, error } = await supabase
      .from('teacher_resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Resources loaded:', data, 'Error:', error);
    
    if (data) {
      setResources(data);
    }
  };

  const loadChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false });
    
    if (data) {
      setChats(data);
      if (data.length > 0 && !currentChat) {
        setCurrentChat(data[0].id);
      }
    }
  };

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data as Message[]);
  };

  const subscribeToMessages = (chatId: string) => {
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createNewChat = async () => {
    const { data } = await supabase
      .from('chats')
      .insert({ user_id: user?.id, title: 'New Chat' })
      .select()
      .single();
    
    if (data) {
      setChats([data, ...chats]);
      setCurrentChat(data.id);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !uploadedImage && !uploadedDocument) return;
    if (!currentChat) {
      await createNewChat();
      return;
    }

    setIsLoading(true);

    // Insert user message
    const { data: userMessage } = await supabase
      .from('messages')
      .insert({
        chat_id: currentChat,
        user_id: user?.id,
        role: 'user',
        content: input,
        image_url: uploadedImage,
        document_url: uploadedDocument?.url,
        document_name: uploadedDocument?.name,
      })
      .select()
      .single();

    const messageContent = input;
    const imageData = uploadedImage;
    const docData = uploadedDocument;

    setInput('');
    setUploadedImage(null);
    setUploadedDocument(null);

    // Call Socrates AI
    try {
      const { data, error } = await supabase.functions.invoke('socrates-chat', {
        body: { 
          message: messageContent, 
          imageUrl: imageData,
          documentUrl: docData?.url,
          documentName: docData?.name,
          chatId: currentChat 
        },
      });

      if (error) throw error;

      // AI response will be added via realtime subscription
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResources = selectedSubject === 'all' 
    ? resources.filter(r => userSubjects.includes(r.subject))
    : resources.filter(r => r.subject === selectedSubject);

  console.log('Filtered resources:', filteredResources, 'All resources:', resources, 'User subjects:', userSubjects, 'Selected subject:', selectedSubject);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border/50">
          <div className="p-4 border-b border-border/50 space-y-2">
            <Button 
              onClick={createNewChat} 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
            <Button 
              onClick={() => setShowResources(!showResources)} 
              variant="outline"
              className="w-full"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Resources
            </Button>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Chat History</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        onClick={() => {
                          setCurrentChat(chat.id);
                          setShowResources(false);
                        }}
                        className={currentChat === chat.id && !showResources ? 'bg-accent' : ''}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="truncate">{chat.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="p-4 border-t border-border/50">
            <Button variant="outline" onClick={signOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border/50 flex items-center px-6">
            <SidebarTrigger />
            <div className="ml-4 flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {showResources ? 'R' : 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{showResources ? 'Learning Resources' : 'Socrates'}</h2>
                <p className="text-xs text-muted-foreground">
                  {showResources ? 'Study materials from your teachers' : 'Your AI Learning Assistant'}
                </p>
              </div>
            </div>
          </header>

          {showResources ? (
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Learning Resources</h1>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-2 rounded-md border border-border bg-background"
                  >
                    <option value="all">All Subjects</option>
                    {userSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {filteredResources.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No resources available</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your teachers haven't uploaded any resources yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredResources.map((resource) => (
                      <Card key={resource.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{resource.title}</CardTitle>
                              <CardDescription className="mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  {resource.subject}
                                </span>
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = resource.document_url;
                                link.download = resource.document_name;
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </CardHeader>
                        {resource.description && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{resource.document_name}</span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <>
              <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-8 w-8 border-2 border-primary flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        S
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'text-right'
                        : 'rounded-2xl px-4 py-3 shadow-soft bg-card border border-border/50'
                    }`}
                  >
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="Uploaded"
                        className={`rounded-lg mb-2 max-w-full ${msg.role === 'user' ? 'ml-auto' : ''}`}
                      />
                    )}
                    {msg.document_url && (
                      <div className={`flex items-center gap-2 mb-2 p-3 rounded-lg bg-accent/20 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{msg.document_name}</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">S</AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 shadow-soft">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border/50 p-4">
            <div className="max-w-3xl mx-auto">
              <div 
                {...getDocRootProps()} 
                className={`mb-3 p-6 border-2 border-dashed rounded-lg transition-colors ${
                  isDocDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getDocInputProps()} />
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    {isDocDragActive ? 'Drop your document here' : 'Drag & drop a document here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse (PDF, DOC, DOCX)
                  </p>
                </div>
              </div>

              {(uploadedImage || uploadedDocument) && (
                <div className="mb-3 flex gap-2 flex-wrap">
                  {uploadedImage && (
                    <div className="relative inline-block">
                      <img src={uploadedImage} alt="Upload preview" className="h-20 rounded-lg" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => setUploadedImage(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {uploadedDocument && (
                    <div className="relative inline-flex items-center gap-2 bg-accent/20 px-3 py-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{uploadedDocument.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => setUploadedDocument(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <div {...getImageRootProps()} className="relative">
                  <input {...getImageInputProps()} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={`transition-smooth ${isImageDragActive ? 'bg-accent' : ''}`}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                </div>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask Socrates anything..."
                  className="flex-1 transition-smooth focus:ring-primary"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || (!input.trim() && !uploadedImage && !uploadedDocument)}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-smooth shadow-soft"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default StudentChat;
