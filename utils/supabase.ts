import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ВНИМАНИЕ: Не найдены ключи Supabase! Убедись, что файл .env.local лежит в корне проекта, и перезапусти сервер.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
