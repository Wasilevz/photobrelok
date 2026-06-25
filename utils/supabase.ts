import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ВНИМАНИЕ: Не найдены ключи Supabase! Убедись, что файл .env.local лежит в корне проекта, и перезапусти сервер.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type OrderStatus = 'new' | 'processing' | 'printing' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  photo_urls: string[];
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  processing: 'В обработке',
  printing: 'Печатается',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
};

export const STATUS_ICONS: Record<OrderStatus, string> = {
  new: '📋',
  processing: '⚙️',
  printing: '🖨️',
  shipped: '🚚',
  delivered: '✅',
};