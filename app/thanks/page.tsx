"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Timer, Package, ArrowRight, Sparkles } from 'lucide-react';

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || Math.floor(Math.random() * 9000) + 1000;
  
  const [timeLeft, setTimeLeft] = useState(600);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

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
      <div className="max-w-md w-full text-center space-y-4 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex justify-center relative">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
          <Sparkles className="absolute -top-2 -right-2 text-[#FF8800] animate-pulse" />
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
          Заказ <span className="text-[#FF8800]">оформлен!</span>
        </h1>
        <p className="text-gray-500 font-medium">
          Номер заказа: <span className="text-black bg-zinc-200 px-2 py-1 rounded">#{orderId}</span>
        </p>
      </div>

      {/* 2. Оффер-апселл */}
      {!isAdded && timeLeft > 0 ? (
        <div className="max-w-md w-full bg-white border-[3px] border-[#FF8800] rounded-[40px] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-700">
          <div className="absolute top-0 right-0 bg-[#FF8800] text-white px-6 py-2 rounded-bl-3xl font-black text-xs uppercase tracking-widest">
            В ту же посылку
          </div>

          <h2 className="text-2xl font-black leading-[1.1] mb-4 uppercase italic">
            Забери второй <br />со скидкой -40%
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Вы уже оплачиваете доставку. Добавьте <span className="font-bold text-black">второй такой же брелок</span> прямо сейчас — мы положим его в ту же коробку.
          </p>

          <div className="space-y-3 mb-8 bg-orange-50 p-5 rounded-3xl border border-orange-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Цена второго брелка:</span>
              <span className="font-bold line-through text-gray-400">500 лей</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">По акции сегодня:</span>
              <span className="text-3xl font-black text-[#FF8800]">150 лей</span>
            </div>
            <div className="pt-2 border-t border-orange-200 flex items-center gap-2 text-[11px] font-bold text-orange-600 uppercase tracking-tighter">
              <Package className="w-4 h-4" />
              Доставка второго брелка — 0 леев
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2 text-[#FF8800] font-mono font-bold text-2xl">
              <Timer className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-right leading-none">
              <div className="text-[10px] font-black uppercase text-gray-400">Экономия</div>
              <div className="text-lg font-black text-green-600">100 леев</div>
            </div>
          </div>

          <button 
            onClick={handleUpsell}
            disabled={isLoading}
            className="w-full py-6 bg-black hover:bg-[#FF8800] text-white font-black rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-70"
          >
            {isLoading ? 'ОБНОВЛЯЕМ...' : 'ДОБАВИТЬ В МОЙ ЗАКАЗ'}
            {!isLoading && <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />}
          </button>
          
          <p className="text-[10px] text-gray-400 text-center mt-4 uppercase font-bold">
            * Оплата при получении заказа
          </p>
        </div>
      ) : (
        <div className="max-w-md w-full bg-zinc-900 text-white rounded-[40px] p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-[#FF8800]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-[#FF8800]" />
          </div>
          <h2 className="text-2xl font-black uppercase italic">Супер-выбор!</h2>
          <p className="text-zinc-400 mt-3">Мы обновили макет и добавили <br />второй брелок в твою посылку.</p>
        </div>
      )}

      {/* Инфо */}
      <div className="max-w-md w-full mt-12 space-y-4">
        <div className="bg-white p-5 rounded-3xl flex items-center gap-4 border border-zinc-100 shadow-sm">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF8800]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Надежная доставка</h4>
            <p className="text-xs text-gray-400">Свяжемся с вами для подтверждения</p>
          </div>
        </div>
      </div>

      <button onClick={() => router.push('/')} className="mt-12 text-zinc-400 hover:text-black font-bold text-sm uppercase tracking-widest transition-colors">
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