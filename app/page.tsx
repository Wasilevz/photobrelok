"use client";

import { useState, useRef } from "react";
import ImageCropper from "@/components/ImageCropper";
import OrderModal from "@/components/OrderModal";
import { supabase } from "@/utils/supabase";

export default function Home() {
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>(Array(10).fill(null));
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageToCrop(URL.createObjectURL(e.target.files[0]));
      e.target.value = ""; 
    }
  };

  const handleCropDone = (croppedImageUrl: string) => {
    if (activeSlotIndex !== null) {
      const newSlots = [...slots];
      newSlots[activeSlotIndex] = croppedImageUrl;
      setSlots(newSlots);
    }
    setImageToCrop(null);
  };

  const handleFinalSubmit = async (userData: { name: string; phone: string }) => {
    setIsSubmitting(true);
    try {
      const photoUrls: string[] = [];

      for (const blobUrl of slots) {
        if (!blobUrl) continue;
        const res = await fetch(blobUrl);
        const blob = await res.blob();
        
        const formData = new FormData();
        formData.append("file", blob, `photo_${Date.now()}.jpg`); 
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await cloudRes.json();
        
        if (!cloudRes.ok) throw new Error("Ошибка Cloudinary");
        photoUrls.push(data.secure_url);
      }

      const { error: dbError } = await supabase.from("orders").insert([
        { customer_name: userData.name, customer_phone: userData.phone, photo_urls: photoUrls }
      ]);
      if (dbError) throw dbError;

      const apiRes = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userData.name, phone: userData.phone, photoUrls }),
      });

      if (!apiRes.ok) throw new Error("Сбой генерации макета");

      alert("Ура! Заказ принят. Мы скоро свяжемся с вами.");
      setSlots(Array(10).fill(null)); 
      setIsModalOpen(false);

    } catch (err: any) {
      alert("ОШИБКА: " + err.message);
    }
      setIsSubmitting(false);
    }
  });

 return (
    <main className="min-h-screen bg-gray-100 text-gray-900 py-10 font-sans selection:bg-orange-200 overflow-x-hidden">
      
      {/* Скрытый инпут для выбора фото */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="max-w-xl mx-auto text-center mb-10 px-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl mb-3">
          Твоя история на пленке
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Свайпай ленту влево-вправо и нажимай на пустые кадры, чтобы добавить свои фото.
        </p>
      </div>

      <div className="relative w-full max-w-5xl mx-auto h-[220px] mt-8">
        
        {/* СКРОЛЛ КОНТЕЙНЕР */}
        <div 
          // УБРАЛ pb-4 отсюда, чтобы лента опустилась строго в математический центр
          className="w-full h-full overflow-x-auto flex items-center pl-4 sm:pl-10 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none !important; }
          `}</style>

          {/* ЧЕРНАЯ ЛЕНТА */}
          <div className="relative bg-[#111] h-[150px] flex items-center rounded-l-[40px] pl-[60px] gap-[10px] shrink-0 pr-[150px] sm:pr-[200px] overflow-hidden">
            
           {/* Окошко-контейнер остается прежнего размера для сохранения верстки */}
<div className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[35px] aspect-square z-10 overflow-hidden rounded-full drop-shadow-md pointer-events-none">
  
  {/* Само кольцо с адаптивным увеличением */}
  <img 
    src="ring.png" 
    alt="Кольцо" 
    className="w-full h-full object-cover transform-gpu 
               {/* --- 📱 НАСТРОЙКИ ДЛЯ ТЕЛЕФОНОВ (по умолчанию) --- */}
               {/* Кольцо почти не увеличено, сдвиг минимальный */}
               scale-[1.1] translate-x-[1px] translate-y-[0.5px]
               
               {/* --- 💻 НАСТРОЙКИ ДЛЯ ПК (начиная от md: 768px) --- */}
               {/* Возвращаем сильное увеличение и сдвиг, как раньше */}
               md:scale-[1.3] md:translate-x-[2px] md:translate-y-[1px]" 
  />
  
</div>
            <div className="absolute top-[8px] left-[70px] flex gap-[7px] pointer-events-none">
              {Array.from({ length: 150 }).map((_, i) => (
                <div key={`top-${i}`} className="w-[6px] h-[10px] bg-gray-100 rounded-[2px] shrink-0 shadow-inner" />
              ))}
            </div>
            <div className="absolute bottom-[8px] left-[70px] flex gap-[7px] pointer-events-none">
              {Array.from({ length: 150 }).map((_, i) => (
                <div key={`bot-${i}`} className="w-[6px] h-[10px] bg-gray-100 rounded-[2px] shrink-0 shadow-inner" />
              ))}
            </div>

            <div className="flex gap-[10px] z-10 ml-4 relative">
              {slots.map((url, index) => (
                <div 
                  key={index} 
                  onClick={() => handleSlotClick(index)} 
                  className="w-[105px] h-[105px] bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-zinc-700 transition-all duration-300 relative overflow-hidden shrink-0 group"
                >
                  {url ? (
                    <>
                      <img src={url} alt={`Кадр ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-sm font-medium">Заменить</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-gray-300">
                      <span className="text-3xl mb-1">+</span>
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* БРЕЛОК KODAK */}
        {/* ========================================================= */}
        <div className="absolute right-[-10px] sm:right-[5%] top-1/2 -translate-y-1/2 h-[220px] z-50 pointer-events-none flex items-center">
          
          {/* 🕹️ ТВОЙ ДЖОЙСТИК ВЫРАВНИВАНИЯ ТУТ: 
              Сейчас стоит "-mt-2" (сдвигает брелок чуть вверх).
              Если брелок все еще ниже ленты -> поставь "-mt-4" или "-mt-6"
              Если брелок стал слишком высоко -> убери минус и поставь "mt-2" или "mt-4" 
          */}
          <div className="relative h-full flex items-center pointer-events-none -mt-2">
            
            <div className="absolute top-[-50px] bottom-[-50px] left-[25px] right-[-1000px] bg-gray-100 z-30 pointer-events-none" />

            <img 
              src="/kodak.png" 
              alt="Брелок Kodak" 
              className="h-full w-auto block relative z-40 pointer-events-none" 
            />
          </div>
        </div>

      </div>

      {/* КНОПКА ЗАКАЗА */}
      <div className="max-w-xs sm:max-w-md mx-auto mt-12 px-4">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={slots.filter(Boolean).length < 6}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg 
            ${slots.filter(Boolean).length < 6 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
              : 'bg-[#ff8800] text-black hover:bg-[#e67a00] active:bg-[#cc6c00] hover:-translate-y-1' 
            }`}
        >
          {slots.filter(Boolean).length < 6 
            ? `ЗАГРУЗИТЕ МИНИМУМ 6 ФОТО (${slots.filter(Boolean).length}/6)` 
            : `ОФОРМИТЬ ЗАКАЗ (${slots.filter(Boolean).length}/10)`}
        </button>
      </div>

      {/* ЗОНА МОДАЛЬНЫХ ОКОН */}
      <div className="relative z-[99999]">
        {imageToCrop && (
          <ImageCropper
            imageSrc={imageToCrop}
            onCropDone={handleCropDone}
            onCancel={() => setImageToCrop(null)}
          />
        )}

        {isModalOpen && (
          <OrderModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleFinalSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

    </main>
  );}
