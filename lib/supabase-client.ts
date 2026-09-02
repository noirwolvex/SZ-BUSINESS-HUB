import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FileRecord {
  id: string;
  file_name: string;
  tool_slug: string;
  tool_name: string;
  status: string;
  file_size: number;
  output_size: number | null;
  output_name: string | null;
  metadata: Record<string, unknown>;
  is_favorite: boolean;
  user_id: string | null;
  created_at: string;
}
