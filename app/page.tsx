"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import ImageCropper from "@/components/ImageCropper";
import OrderModal from "@/components/OrderModal";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>(Array(10).fill(null));
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokeOldUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCropping(true);
      setImageToCrop(URL.createObjectURL(e.target.files[0]));
      e.target.value = "";
    }
  };

  const handleCropDone = (croppedImageUrl: string) => {
    if (activeSlotIndex !== null) {
      const newSlots = [...slots];
      revokeOldUrl(newSlots[activeSlotIndex]);
      newSlots[activeSlotIndex] = croppedImageUrl;
      setSlots(newSlots);
    }
    setImageToCrop(null);
    setIsCropping(false);
  };

  const handleRemoveSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...slots];
    revokeOldUrl(newSlots[index]);
    newSlots[index] = null;
    setSlots(newSlots);
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

        if (!cloudRes.ok) throw new Error("Ошибка Cloudinary. Проверьте настройки Upload Preset.");
        photoUrls.push(data.secure_url);
      }

      const apiRes = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userData.name, phone: userData.phone, photoUrls }),
      });

      if (!apiRes.ok) throw new Error("Сбой отправки в Telegram (api/order)");

      const { orderId } = await apiRes.json();

      slots.forEach(revokeOldUrl);
      setSlots(Array(10).fill(null));
      setIsModalOpen(false);
      router.push(`/thanks?orderId=${orderId}`);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      alert("ОШИБКА: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 py-10 font-sans selection:bg-orange-200 overflow-x-hidden">
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="max-w-xl mx-auto text-center mb-10 px-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl mb-3">
          Фото-брелок своими руками
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
          Загрузите от 6 до 10 любимых фото — мы напечатаем их на плёнке и сделаем уникальный брелок
        </p>
      </div>

      <div className="relative w-full max-w-5xl mx-auto h-[220px] mt-8">

        {showScrollHint && (
          <div className="absolute right-4 sm:right-[8%] top-1/2 -translate-y-1/2 z-40 animate-bounce pointer-events-none">
            <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span>← скролль →</span>
            </div>
          </div>
        )}

        <div
          className="w-full h-full overflow-x-auto flex items-center pl-4 sm:pl-10 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={() => setShowScrollHint(false)}
        >
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none !important; }
          `}</style>

          <div className="relative bg-[#111] h-[150px] flex items-center rounded-l-[40px] pl-[60px] gap-[10px] shrink-0 pr-[150px] sm:pr-[200px] overflow-hidden">

            <div className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[35px] aspect-square z-10 overflow-hidden rounded-full drop-shadow-md pointer-events-none">
              <Image
                src="ring.png"
                alt="Кольцо"
                width={35}
                height={35}
                className="w-full h-full object-cover transform-gpu scale-[1.1] translate-x-[1px] translate-y-[0.5px] md:scale-[1.3] md:translate-x-[2px] md:translate-y-[1px]"
              />
            </div>

            <div className="absolute top-[8px] left-[70px] flex gap-[7px] pointer-events-none">
              {Array.from({ length: 150 }).map((_, i) => (
                <div key={`top-${i}`} className="w-[6px] h-[10px] bg-gray-100 rounded-[2px] shrink-0" />
              ))}
            </div>
            <div className="absolute bottom-[8px] left-[70px] flex gap-[7px] pointer-events-none">
              {Array.from({ length: 150 }).map((_, i) => (
                <div key={`bot-${i}`} className="w-[6px] h-[10px] bg-gray-100 rounded-[2px] shrink-0" />
              ))}
            </div>

            <div className="flex gap-[10px] z-10 ml-4 relative">
              {slots.map((url, index) => (
                <div
                  key={index}
                  onClick={() => !url && handleSlotClick(index)}
                  className={`w-[105px] h-[105px] border-2 border-dashed rounded-md flex items-center justify-center relative overflow-hidden shrink-0 group transition-all duration-300 ${
                    url
                      ? 'bg-zinc-800 border-zinc-600 cursor-pointer hover:border-gray-400'
                      : 'bg-zinc-800 border-zinc-600 cursor-pointer hover:border-gray-400 hover:bg-zinc-700'
                  }`}
                >
                  {url ? (
                    <>
                      <Image src={url} alt={`Кадр ${index + 1}`} width={105} height={105} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSlotClick(index); }}
                          className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
                        >
                          Заменить
                        </button>
                        <button
                          onClick={(e) => handleRemoveSlot(index, e)}
                          className="bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
                        >
                          Удалить
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-gray-300">
                      <span className="text-3xl mb-1">+</span>
                      <span className="text-[10px] font-medium opacity-70">нажми</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute right-0 sm:right-[5%] top-1/2 -translate-y-1/2 h-[220px] z-50 pointer-events-none flex items-center overflow-hidden">
          <div className="relative h-full flex items-center pointer-events-none -mt-2">
            <div className="absolute top-[-50px] bottom-[-50px] left-[25px] right-[-1000px] bg-gray-100 z-30 pointer-events-none" />
            <Image
              src="/kodak.png"
              alt="Брелок Kodak"
              width={379}
              height={658}
              className="h-full w-auto block relative z-40 pointer-events-none"
            />
          </div>
        </div>

      </div>

      <div className="max-w-xs sm:max-w-md mx-auto mt-12 px-4">
        <div className="text-center mb-3">
          <span className="text-xs text-gray-500 font-medium">
            {slots.filter(Boolean).length === 0
              ? `Нажмите на кадр ${String.fromCharCode(8592)} чтобы добавить фото`
              : slots.filter(Boolean).length < 6
                ? `Ещё ${6 - slots.filter(Boolean).length} фото до оформления`
                : `Отлично! Можно оформлять заказ`}
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={slots.filter(Boolean).length < 6}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg relative z-50 ${
            slots.filter(Boolean).length < 6
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-[#FF6B00] text-white hover:bg-[#E65C00] active:bg-[#CC5200] hover:-translate-y-1 shadow-orange-200'
          }`}
        >
          {slots.filter(Boolean).length < 6
            ? `Загрузите от 6 фото`
            : `Оформить заказ`}
        </button>
        {slots.filter(Boolean).length >= 6 && (
          <p className="text-center text-[11px] text-gray-400 mt-2">
            {slots.filter(Boolean).length}/10 фото · Оплата при получении
          </p>
        )}
      </div>

      <div className="relative z-[99999]">
        {isCropping && !imageToCrop && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="text-white text-lg font-medium flex items-center gap-3">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Загрузка фото...
            </div>
          </div>
        )}

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
  );
}