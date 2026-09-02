import {
  FileStack,
  Scissors,
  Archive,
  RotateCw,
  FileOutput,
  ImageDown,
  FileImage,
  Sparkles,
  Brain,
  ScanText,
  Languages,
  Sticker,
  Hash,
  FileLock,
  Unlock,
  PenLine,
  ShieldCheck,
  Eye,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileType,
  Layers,
  FilePlus2,
  LayoutTemplate,
  Wand2,
  GitCompare,
  Search,
  FileSearch,
  Eraser,
  Stamp,
  FileCheck2,
  ClipboardList,
  ImagePlus,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory =
  | 'create'
  | 'convert'
  | 'organize'
  | 'enhance'
  | 'protect'
  | 'understand';

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  keywords: string[];
  badge?: 'new' | 'ai' | 'beta' | 'pro';
  acceptTypes: string[];
  multiple?: boolean;
  estimatedTime: string;
}

export interface CategoryMeta {
  id: ToolCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

export const categories: CategoryMeta[] = [
  {
    id: 'create',
    label: 'Create',
    description: 'Build documents from scratch or templates',
    icon: FilePlus2,
    accent: 'text-primary',
  },
  {
    id: 'convert',
    label: 'Convert',
    description: 'Transform between formats',
    icon: FileOutput,
    accent: 'text-chart-2',
  },
  {
    id: 'organize',
    label: 'Organize',
    description: 'Merge, split, reorder, and extract pages',
    icon: Layers,
    accent: 'text-chart-3',
  },
  {
    id: 'enhance',
    label: 'Enhance',
    description: 'Compress, OCR, watermark, and improve',
    icon: Sparkles,
    accent: 'text-chart-4',
  },
  {
    id: 'protect',
    label: 'Protect',
    description: 'Passwords, encryption, and signatures',
    icon: ShieldCheck,
    accent: 'text-chart-5',
  },
  {
    id: 'understand',
    label: 'Understand',
    description: 'AI-powered analysis and intelligence',
    icon: Brain,
    accent: 'text-primary',
  },
];

export const tools: Tool[] = [
  // CREATE
  {
    slug: 'create-pdf',
    name: 'Create PDF',
    description: 'Start a new PDF from a blank canvas or existing file.',
    category: 'create',
    icon: FilePlus2,
    keywords: ['new', 'blank', 'start', 'create', 'make'],
    acceptTypes: ['application/pdf'],
    estimatedTime: 'Instant',
  },
  {
    slug: 'ai-document-generator',
    name: 'AI Document Generator',
    description: 'Generate documents from a natural-language prompt.',
    category: 'create',
    icon: Wand2,
    keywords: ['ai', 'generate', 'write', 'create', 'draft', 'assistant'],
    badge: 'ai',
    acceptTypes: [],
    estimatedTime: '~10s',
  },
  {
    slug: 'templates',
    name: 'Templates',
    description: 'Start from professionally designed document templates.',
    category: 'create',
    icon: LayoutTemplate,
    keywords: ['template', 'invoice', 'contract', 'resume', 'letter'],
    acceptTypes: [],
    estimatedTime: 'Instant',
  },
  {
    slug: 'images-to-pdf',
    name: 'Images to PDF',
    description: 'Combine JPG, PNG, and other images into a single PDF.',
    category: 'create',
    icon: FileImage,
    keywords: ['image', 'jpg', 'png', 'picture', 'photo', 'combine'],
    acceptTypes: ['image/jpeg', 'image/png', 'image/webp'],
    multiple: true,
    estimatedTime: '~5s',
  },

  // CONVERT
  {
    slug: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF into an editable Word document.',
    category: 'convert',
    icon: FileText,
    keywords: ['word', 'docx', 'convert', 'edit', 'office'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~15s',
  },
  {
    slug: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables and data into a spreadsheet.',
    category: 'convert',
    icon: FileSpreadsheet,
    keywords: ['excel', 'xlsx', 'spreadsheet', 'table', 'data', 'convert'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~20s',
  },
  {
    slug: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF slides into an editable presentation.',
    category: 'convert',
    icon: Presentation,
    keywords: ['powerpoint', 'pptx', 'slides', 'presentation', 'convert'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~20s',
  },
  {
    slug: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert Word documents into clean PDF files.',
    category: 'convert',
    icon: FileType,
    keywords: ['word', 'docx', 'convert', 'office'],
    acceptTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
    estimatedTime: '~10s',
  },
  {
    slug: 'pdf-to-images',
    name: 'PDF to Images',
    description: 'Export each PDF page as a high-quality image.',
    category: 'convert',
    icon: ImageDown,
    keywords: ['image', 'jpg', 'png', 'export', 'extract', 'picture'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~10s',
  },

  // ORGANIZE
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one document.',
    category: 'organize',
    icon: FileStack,
    keywords: ['merge', 'combine', 'join', 'concatenate'],
    acceptTypes: ['application/pdf'],
    multiple: true,
    estimatedTime: '~8s',
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    description: 'Extract ranges or split into individual pages.',
    category: 'organize',
    icon: Scissors,
    keywords: ['split', 'extract', 'range', 'divide', 'separate'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~5s',
  },
  {
    slug: 'organize-pages',
    name: 'Organize Pages',
    description: 'Drag, reorder, rotate, and delete pages visually.',
    category: 'organize',
    icon: Layers,
    keywords: ['organize', 'reorder', 'rearrange', 'sort', 'pages'],
    acceptTypes: ['application/pdf'],
    estimatedTime: 'Interactive',
  },
  {
    slug: 'rotate-pdf',
    name: 'Rotate Pages',
    description: 'Rotate all or selected pages to the right orientation.',
    category: 'organize',
    icon: RotateCw,
    keywords: ['rotate', 'turn', 'orientation', 'landscape', 'portrait'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~3s',
  },
  {
    slug: 'extract-pages',
    name: 'Extract Pages',
    description: 'Pull specific pages into a new PDF.',
    category: 'organize',
    icon: FileOutput,
    keywords: ['extract', 'pull', 'select', 'pages'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~5s',
  },
  {
    slug: 'delete-pages',
    name: 'Delete Pages',
    description: 'Remove unwanted pages from your document.',
    category: 'organize',
    icon: Eraser,
    keywords: ['delete', 'remove', 'cut', 'pages'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~3s',
  },

  // ENHANCE
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce file size with smart quality controls.',
    category: 'enhance',
    icon: Archive,
    keywords: ['compress', 'reduce', 'optimize', 'shrink', 'smaller', 'size'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~12s',
  },
  {
    slug: 'watermark',
    name: 'Add Watermark',
    description: 'Stamp text or image watermarks across pages.',
    category: 'enhance',
    icon: Sticker,
    keywords: ['watermark', 'stamp', 'logo', 'text', 'overlay'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~5s',
  },
  {
    slug: 'page-numbers',
    name: 'Add Page Numbers',
    description: 'Insert customizable page numbers anywhere.',
    category: 'enhance',
    icon: Hash,
    keywords: ['number', 'pages', 'paginate', 'count'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~3s',
  },
  {
    slug: 'edit-metadata',
    name: 'Edit Metadata',
    description: 'View and modify title, author, and document properties.',
    category: 'enhance',
    icon: FileSearch,
    keywords: ['metadata', 'properties', 'title', 'author', 'info'],
    acceptTypes: ['application/pdf'],
    estimatedTime: 'Instant',
  },
  {
    slug: 'redaction',
    name: 'Auto Redaction',
    description: 'Detect and redact emails, phone numbers, and IDs.',
    category: 'enhance',
    icon: Eraser,
    keywords: ['redact', 'blackout', 'hide', 'sensitive', 'pii', 'privacy'],
    badge: 'beta',
    acceptTypes: ['application/pdf'],
    estimatedTime: '~15s',
  },
  {
    slug: 'image-enhancer',
    name: 'Image Enhancer',
    description: 'Edit, adjust, and AI-enhance images with a professional editor.',
    category: 'enhance',
    icon: ImagePlus,
    keywords: ['image', 'photo', 'editor', 'enhance', 'upscale', 'filter', 'adjust', 'crop', 'rotate'],
    badge: 'new',
    acceptTypes: ['image/png', 'image/jpeg', 'image/webp'],
    estimatedTime: 'Interactive',
  },

  // PROTECT
  {
    slug: 'protect-pdf',
    name: 'Password Protect',
    description: 'Add a password and encrypt your PDF.',
    category: 'protect',
    icon: FileLock,
    keywords: ['password', 'protect', 'encrypt', 'secure', 'lock'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~3s',
  },
  {
    slug: 'unlock-pdf',
    name: 'Unlock PDF',
    description: 'Remove a password from a PDF you own.',
    category: 'protect',
    icon: Unlock,
    keywords: ['unlock', 'remove', 'password', 'decrypt'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~3s',
  },
  {
    slug: 'sign-pdf',
    name: 'Sign PDF',
    description: 'Add your signature or request e-signatures.',
    category: 'protect',
    icon: PenLine,
    keywords: ['sign', 'signature', 'esign', 'initial', 'draw'],
    acceptTypes: ['application/pdf'],
    estimatedTime: 'Interactive',
  },
  {
    slug: 'permissions',
    name: 'Set Permissions',
    description: 'Control printing, copying, and editing rights.',
    category: 'protect',
    icon: ShieldCheck,
    keywords: ['permissions', 'restrict', 'rights', 'allow', 'deny'],
    acceptTypes: ['application/pdf'],
    estimatedTime: '~3s',
  },

  // UNDERSTAND
  {
    slug: 'summarize-pdf',
    name: 'AI Summary',
    description: 'Get a concise summary of any document.',
    category: 'understand',
    icon: Sparkles,
    keywords: ['summarize', 'summary', 'tldr', 'overview', 'ai'],
    badge: 'ai',
    acceptTypes: ['application/pdf'],
    estimatedTime: '~15s',
  },
  {
    slug: 'ask-document',
    name: 'Ask Document',
    description: 'Chat with your document and get instant answers.',
    category: 'understand',
    icon: Brain,
    keywords: ['ask', 'chat', 'question', 'q&a', 'ai', 'assistant'],
    badge: 'ai',
    acceptTypes: ['application/pdf'],
    estimatedTime: 'Real-time',
  },
  {
    slug: 'extract-info',
    name: 'Extract Information',
    description: 'Pull names, dates, prices, emails, and more.',
    category: 'understand',
    icon: ClipboardList,
    keywords: ['extract', 'information', 'data', 'entities', 'names', 'emails'],
    badge: 'ai',
    acceptTypes: ['application/pdf'],
    estimatedTime: '~15s',
  },
  {
    slug: 'translate',
    name: 'Translate Document',
    description: 'Translate document content while preserving layout.',
    category: 'understand',
    icon: Languages,
    keywords: ['translate', 'language', 'arabic', 'french', 'spanish'],
    badge: 'ai',
    acceptTypes: ['application/pdf'],
    estimatedTime: '~20s',
  },
  {
    slug: 'analyze-document',
    name: 'Analyze Document',
    description: 'Detect clauses, risks, and unusual language.',
    category: 'understand',
    icon: FileCheck2,
    keywords: ['analyze', 'clause', 'risk', 'contract', 'review'],
    badge: 'ai',
    acceptTypes: ['application/pdf'],
    estimatedTime: '~20s',
  },
  {
    slug: 'smart-search',
    name: 'Smart Search',
    description: 'Search your documents with natural language.',
    category: 'understand',
    icon: Search,
    keywords: ['search', 'find', 'semantic', 'query', 'content'],
    badge: 'new',
    acceptTypes: [],
    estimatedTime: 'Real-time',
  },
];

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase().trim();
  if (!q) return tools;
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.includes(q) || q.includes(k)),
  );
}
