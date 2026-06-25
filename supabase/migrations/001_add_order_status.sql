-- Добавляем поле status в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';

-- Создаём индекс для быстрого поиска по статусу
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Создаём индекс по order_id для быстрого отслеживания
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
