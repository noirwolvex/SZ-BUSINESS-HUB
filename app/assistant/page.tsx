'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain,
  Send,
  Sparkles,
  FileText,
  Upload,
  Wand2,
  GitCompare,
  Languages,
  ScanText,
  ClipboardList,
  User,
  Loader2,
  X,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chips?: string[];
  isError?: boolean;
}

interface UploadedDoc {
  name: string;
  text: string;
  base64: string;
  mimeType: string;
}

const suggestions = [
  {
    icon: Sparkles,
    label: 'Summarize',
    prompt: 'Summarize this document in 5 key points',
  },
  {
    icon: ScanText,
    label: 'Extract',
    prompt: 'Extract all names, dates, and amounts from this document',
  },
  {
    icon: GitCompare,
    label: 'Compare',
    prompt: 'What are the main differences between these two versions?',
  },
  {
    icon: Languages,
    label: 'Translate',
    prompt: 'Translate this document into Arabic',
  },
  {
    icon: ClipboardList,
    label: 'Analyze',
    prompt: 'Find any unusual or risky clauses in this contract',
  },
  {
    icon: Wand2,
    label: 'Rewrite',
    prompt: 'Rewrite this document in a more professional tone',
  },
];

const generalChatStarters = [
  { icon: Sparkles, label: 'Explain a concept', prompt: 'Can you explain how machine learning works in simple terms?' },
  { icon: Wand2, label: 'Help me write', prompt: 'Help me write a professional email to my boss requesting time off' },
  { icon: ClipboardList, label: 'Brainstorm ideas', prompt: 'Give me 5 creative ideas for a birthday gift for someone who loves technology' },
  { icon: Languages, label: 'Translate text', prompt: 'How do you say "Thank you for your help" in Japanese?' },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AssistantPage() {
  const [mode, setMode] = useState<'document' | 'general'>('document');

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'document'
                ? 'Ask anything about your documents'
                : 'Chat about anything — ask questions, get help, brainstorm'}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 flex gap-2 rounded-xl border border-border/60 bg-card p-1">
          <button
            onClick={() => setMode('document')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mode === 'document'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FileText className="h-4 w-4" />
            Document Chat
          </button>
          <button
            onClick={() => setMode('general')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mode === 'general'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MessageCircle className="h-4 w-4" />
            General Chat
          </button>
        </div>

        {mode === 'document' ? (
          <DocumentChat />
        ) : (
          <GeneralChat />
        )}
      </div>
    </AppShell>
  );
}

function DocumentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [doc, setDoc] = useState<UploadedDoc | null>(null);
  const [thinking, setThinking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setDoc(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = bufferToBase64(arrayBuffer);

      let extractedText = '';
      if (file.type === 'application/pdf') {
        extractedText = await extractPdfText(arrayBuffer);
      } else if (file.type.startsWith('text/')) {
        extractedText = new TextDecoder().decode(arrayBuffer);
      }

      setDoc({
        name: file.name,
        text: extractedText,
        base64,
        mimeType: file.type || 'application/octet-stream',
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not read this file.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const send = async (text: string) => {
    if (!text.trim() || !doc || thinking || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })) as { role: 'user' | 'assistant'; content: string }[];

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'chat',
          prompt: text,
          documentText: doc.text || undefined,
          documentBase64: doc.text ? undefined : doc.base64,
          documentMimeType: doc.text ? undefined : doc.mimeType,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        chips: ['Summarize', 'Extract key terms', 'Translate'],
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        isError: true,
      };
      setMessages((m) => [...m, aiMsg]);
    } finally {
      setThinking(false);
      sendingRef.current = false;
    }
  };

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-card p-4">
        {messages.length === 0 && !thinking ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            {!doc ? (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'group mb-4 flex h-32 w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors',
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:border-primary/40 hover:bg-primary/5',
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                      <p className="text-sm font-medium">Drop a document here</p>
                      <p className="text-xs text-muted-foreground">or click to browse — PDF, TXT</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,text/plain,text/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                {uploadError && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                  </div>
                )}
                <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                  Upload a PDF or text file and the AI assistant will help you understand, extract, and transform it.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Powered by Google Gemini
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{doc.name}</span>
                  <button
                    onClick={() => { setDoc(null); setMessages([]); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-4 font-display text-lg font-semibold">
                  What would you like to do?
                </p>
                <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
                  {suggestions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => send(s.prompt)}
                        className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-3.5 text-center transition-all hover:border-primary/30 hover:bg-primary/5"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {thinking && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Analyzing document…
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-2">
        {doc && (
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="max-w-[150px] truncate text-xs font-medium">{doc.name}</span>
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={
            doc
              ? 'Ask anything about your document…'
              : 'Upload a document to start chatting…'
          }
          disabled={!doc || thinking}
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <Button
          size="icon"
          onClick={() => send(input)}
          disabled={!doc || !input.trim() || thinking}
          className="h-9 w-9 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

function GeneralChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })) as { role: 'user' | 'assistant'; content: string }[];

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'general-chat',
          prompt: text,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        isError: true,
      };
      setMessages((m) => [...m, aiMsg]);
    } finally {
      setThinking(false);
      sendingRef.current = false;
    }
  };

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-card p-4">
        {messages.length === 0 && !thinking ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="mb-2 font-display text-lg font-semibold">
              Chat with SZ TOOLS AI about anything
            </p>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Ask questions, get explanations, brainstorm ideas, translate text, or just have a conversation.
            </p>
            <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-2">
              {generalChatStarters.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => send(s.prompt)}
                    className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.prompt}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Google Gemini
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {thinking && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Thinking…
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Ask me anything…"
          disabled={thinking}
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <Button
          size="icon"
          onClick={() => send(input)}
          disabled={!input.trim() || thinking}
          className="h-9 w-9 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-secondary' : message.isError ? 'bg-destructive/10' : 'bg-primary/10',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Brain className={cn('h-4 w-4', message.isError ? 'text-destructive' : 'text-primary')} />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : message.isError
              ? 'rounded-bl-md border border-destructive/30 bg-destructive/5 text-destructive'
              : 'rounded-bl-md bg-muted',
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.chips && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.chips.map((chip) => (
              <button
                key={chip}
                className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-background"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    const loadingTask = pdfjs.getDocument({ data: buffer.slice(0) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: { str?: string }) => item.str || '')
        .join(' ');
      textParts.push(`--- Page ${i} ---\n${pageText}`);
    }

    return textParts.join('\n\n');
  } catch {
    return '';
  }
}
