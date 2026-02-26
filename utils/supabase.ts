import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Предохранитель: если ключей нет, мы сразу поймем, в чем дело
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ВНИМАНИЕ: Не найдены ключи Supabase! Убедись, что файл .env.local лежит в корне проекта, и перезапусти сервер.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);