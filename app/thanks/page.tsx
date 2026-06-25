"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Timer, Package, ArrowRight, Sparkles } from 'lucide-react';

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || Math.floor(Math.random() * 9000) + 1000;

  const [timeLeft, setTimeLeft] = useState(600);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeLeftRef.current <= 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUpsell = async () => {
    setIsLoading(true);
    try {
      // Отправляем уведомление в Телеграм через наш новый API
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🔥 <b>АПСЕЛЛ! Заказ #${orderId}</b>\nКлиент добавил ВТОРОЙ брелок (-40%).\nПоложите 2 шт. в посылку.`
        })
      });
      setIsAdded(true);
    } catch (error) {
      console.error("Ошибка:", error);
      setIsAdded(true); // Все равно показываем успех клиенту
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center py-12 px-4 text-[#18181B] font-sans">
      
      {/* 1. Блок успеха */}
      <div className="max-w-md w-full text-center space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex justify-center relative">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
          <Sparkles className="absolute -top-2 -right-2 text-[#FF6B00] animate-pulse" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
          Заказ <span className="text-[#FF6B00]">принят!</span>
        </h1>
        <p className="text-gray-500 font-medium">
          Номер заказа: <span className="text-black bg-zinc-200 px-2 py-1 rounded font-mono">#{orderId}</span>
        </p>
        <p className="text-gray-400 text-sm">
          Мы перезвоним вам в течение 30 минут для подтверждения
        </p>
      </div>

      {/* 2. Оффер-апселл */}
      {!isAdded && timeLeft > 0 ? (
        <div className="max-w-md w-full bg-white border-[3px] border-[#FF6B00] rounded-[40px] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-700">
          <div className="absolute top-0 right-0 bg-[#FF6B00] text-white px-6 py-2 rounded-bl-3xl font-black text-xs uppercase tracking-widest">
            В ту же посылку
          </div>

          <div className="mb-4">
            <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Только сегодня
            </span>
          </div>

          <h2 className="text-2xl font-black leading-[1.1] mb-4">
            Добавьте второй брелок<br />со скидкой <span className="text-[#FF6B00]">-40%</span>
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Второй такой же брелок <span className="font-bold text-black">в ту же коробку</span> — идеально как подарок для близкого человека
          </p>

          <div className="space-y-3 mb-6 bg-orange-50 p-5 rounded-3xl border border-orange-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Обычная цена:</span>
              <span className="font-bold line-through text-gray-400">250 лей</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">Сейчас со скидкой:</span>
              <span className="text-3xl font-black text-[#FF6B00]">150 лей</span>
            </div>
            <div className="pt-2 border-t border-orange-200 flex items-center gap-2 text-xs font-bold text-green-600">
              <Package className="w-4 h-4" />
              Бесплатная доставка второго брелка
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2 text-[#FF6B00] font-mono font-bold text-2xl">
              <Timer className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-right leading-none">
              <div className="text-[10px] font-black uppercase text-gray-400">Ваша экономия</div>
              <div className="text-lg font-black text-green-600">100 леев</div>
            </div>
          </div>

          <button
            onClick={handleUpsell}
            disabled={isLoading}
            className="w-full py-5 bg-[#FF6B00] hover:bg-[#E65C00] text-white font-black rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-70 shadow-orange-200"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Добавляем...
              </span>
            ) : (
              <>
                Добавить второй брелок за 150 лей
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-4">
            Оплата при получении · Никаких предоплат
          </p>
        </div>
      ) : (
        <div className="max-w-md w-full bg-zinc-900 text-white rounded-[40px] p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-[#FF6B00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-[#FF6B00]" />
          </div>
          <h2 className="text-2xl font-black uppercase">Отличный выбор!</h2>
          <p className="text-zinc-400 mt-3">Мы добавили второй брелок в вашу посылку. <br />Сэкономили 100 леев!</p>
        </div>
      )}

      {/* Социальное доказательство */}
      <div className="max-w-md w-full mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
              {String.fromCharCode(64 + i)}
            </div>
          ))}
        </div>
        <span>уже сделали свои брелки сегодня</span>
      </div>

      {/* Инфо */}
      <div className="max-w-md w-full mt-8 space-y-3">
        <div className="bg-white p-4 rounded-2xl flex items-center gap-3 border border-zinc-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Бесплатная доставка</h4>
            <p className="text-xs text-gray-400">Привезём за 1-3 дня</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl flex items-center gap-3 border border-zinc-100 shadow-sm">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF6B00]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Оплата при получении</h4>
            <p className="text-xs text-gray-400">Никаких предоплат</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/')}
        className="mt-12 text-zinc-400 hover:text-black font-bold text-sm uppercase tracking-widest transition-colors flex items-center gap-2"
      >
        <span>←</span>
        Вернуться на сайт
      </button>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}