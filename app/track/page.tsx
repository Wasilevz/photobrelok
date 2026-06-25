"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Clock, Printer, Truck, CheckCircle2, Search } from "lucide-react";
import { supabase, OrderStatus, STATUS_ICONS } from "@/utils/supabase";

const STEPS: { key: OrderStatus; icon: React.ReactNode; label: string }[] = [
  { key: "new", icon: <Package className="w-5 h-5" />, label: "Заказ принят" },
  { key: "processing", icon: <Clock className="w-5 h-5" />, label: "В обработке" },
  { key: "printing", icon: <Printer className="w-5 h-5" />, label: "Печатается" },
  { key: "shipped", icon: <Truck className="w-5 h-5" />, label: "Отправлен" },
  { key: "delivered", icon: <CheckCircle2 className="w-5 h-5" />, label: "Доставлен" },
];

function TrackContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";

  const [searchInput, setSearchInput] = useState(initialOrderId);
  const [order, setOrder] = useState<{
    status: OrderStatus;
    customer_name: string;
    created_at: string;
    photo_urls: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchedRef = useRef(false);

  const fetchOrder = async (id: string) => {
    if (!id.trim()) {
      setError("Введите номер заказа");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    const { data, error: dbError } = await supabase
      .from("orders")
      .select("status, customer_name, created_at, photo_urls")
      .eq("order_id", id.trim().toUpperCase())
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError("Заказ не найден. Проверьте номер и попробуйте снова.");
      return;
    }

    setOrder(data);
  };

  useEffect(() => {
    if (initialOrderId && !fetchedRef.current) {
      fetchedRef.current = true;
      const loadOrder = async () => {
        setLoading(true);
        setError("");
        setOrder(null);

        const { data, error: dbError } = await supabase
          .from("orders")
          .select("status, customer_name, created_at, photo_urls")
          .eq("order_id", initialOrderId.trim().toUpperCase())
          .single();

        setLoading(false);

        if (dbError || !data) {
          setError("Заказ не найден. Проверьте номер и попробуйте снова.");
          return;
        }

        setOrder(data);
      };
      loadOrder();
    }
  }, [initialOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(searchInput);
  };

  const currentStepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center py-12 px-4 text-[#18181B] font-sans">
      {/* Header */}
      <div className="max-w-md w-full text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2">
          Отслеживание заказа
        </h1>
        <p className="text-gray-500 text-sm">
          Узнайте статус вашего фото-брелка
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="max-w-md w-full mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Номер заказа (напр. A1B2C3)"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-lg font-mono font-bold tracking-widest text-center focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] shadow-sm"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? "..." : "Найти"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="max-w-md w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-6">
          {error}
        </div>
      )}

      {/* Order status */}
      {order && (
        <div className="max-w-md w-full">
          {/* Order info card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Заказ</p>
                <p className="text-2xl font-black font-mono tracking-wider">#{searchInput.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold">Клиент</p>
                <p className="font-bold">{order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Фотографий: {order.photo_urls.length}</span>
              <span>{new Date(order.created_at).toLocaleDateString("ru-RU")}</span>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm uppercase text-gray-400 mb-6">Статус заказа</h3>

            <div className="space-y-0">
              {STEPS.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.key} className="flex items-start gap-4">
                    {/* Vertical line + circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isActive
                            ? "bg-[#FF6B00] text-white shadow-lg shadow-orange-200"
                            : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-300"
                        }`}
                      >
                        {step.icon}
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            isCompleted ? "bg-green-500" : "bg-gray-100"
                          }`}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pt-2 pb-4">
                      <p
                        className={`font-bold text-sm ${
                          isActive
                            ? "text-[#FF6B00]"
                            : isCompleted
                            ? "text-green-600"
                            : "text-gray-300"
                        }`}
                      >
                        {STATUS_ICONS[step.key]} {step.label}
                      </p>
                      {isActive && (
                        <p className="text-xs text-gray-400 mt-1 animate-pulse">
                          Текущий статус
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Вопросы по заказу?{" "}
              <a
                href="https://t.me/photobrelok"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF6B00] font-bold hover:underline"
              >
                Напишите нам в Telegram
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => window.history.back()}
        className="mt-8 text-zinc-400 hover:text-black font-bold text-sm uppercase tracking-widest transition-colors"
      >
        ← Назад
      </button>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Загрузка...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
