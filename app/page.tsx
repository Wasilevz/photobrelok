"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import ImageCropper from "@/components/ImageCropper";
import OrderModal from "@/components/OrderModal";
import { useRouter } from 'next/navigation';
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { lang, setLang, dict } = useLanguage();
  // TODO: уточните цену — сейчас взята из блока "Обычная цена" на /thanks
  const PRICE_MDL = 250;
  const [slots, setSlots] = useState<(string | null)[]>(Array(10).fill(null));
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showError, setShowError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Батч-загрузка: очередь фото, ожидающих обрезки, каждое привязано к своему слоту
  const [cropQueue, setCropQueue] = useState<{ url: string; slotIndex: number }[]>([]);
  const [totalInBatch, setTotalInBatch] = useState(0);
  const imageToCrop = cropQueue[0]?.url ?? null;

  const revokeOldUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    handleCarouselScroll();
  }, []);

  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Слот, на который кликнули, заполняется первым (даже если уже занят — это "заменить")
    const targetIndices: number[] = [];
    if (activeSlotIndex !== null) targetIndices.push(activeSlotIndex);

    // Остальные фото уходят в следующие свободные слоты по порядку
    for (let i = 0; i < slots.length && targetIndices.length < fileArray.length; i++) {
      if (i === activeSlotIndex) continue;
      if (!slots[i]) targetIndices.push(i);
    }

    const queue = fileArray.slice(0, targetIndices.length).map((file, i) => ({
      url: URL.createObjectURL(file),
      slotIndex: targetIndices[i],
    }));

    if (fileArray.length > targetIndices.length) {
      setShowError(dict.home.uploadTruncated(queue.length, fileArray.length));
    }

    setCropQueue(queue);
    setTotalInBatch(queue.length);
    e.target.value = "";
  };

  const handleCropDone = (croppedImageUrl: string) => {
    const current = cropQueue[0];
    if (current) {
      setSlots((prev) => {
        const newSlots = [...prev];
        revokeOldUrl(newSlots[current.slotIndex]);
        newSlots[current.slotIndex] = croppedImageUrl;
        return newSlots;
      });
    }
    const rest = cropQueue.slice(1);
    setCropQueue(rest);
    if (rest.length === 0) setTotalInBatch(0);
  };

  const handleCropCancel = () => {
    const current = cropQueue[0];
    if (current) revokeOldUrl(current.url);
    const rest = cropQueue.slice(1);
    setCropQueue(rest);
    if (rest.length === 0) setTotalInBatch(0);
  };

  const handleCarouselScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
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

        if (!cloudRes.ok) throw new Error(dict.errors.uploadFailed);
        photoUrls.push(data.secure_url);
      }

      const apiRes = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userData.name, phone: userData.phone, photoUrls, lang }),
      });

      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(() => null);
        throw new Error(errData?.error || dict.errors.genericSubmit);
      }

      const { orderId } = await apiRes.json();

      slots.forEach(revokeOldUrl);
      setSlots(Array(10).fill(null));
      setIsModalOpen(false);
      router.push(`/thanks?orderId=${orderId}`);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.errors.unknown;
      setShowError(msg);
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
        multiple
        className="hidden" 
      />

      <button
        onClick={() => setLang(lang === 'ru' ? 'ro' : 'ru')}
        aria-label="Schimbă limba / Сменить язык"
        className="fixed top-4 right-4 z-[70] bg-white border border-gray-200 shadow-md rounded-full px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
      >
        {lang === 'ru' ? '🇷🇴 RO' : '🇲🇩 RU'}
      </button>

      <div className="max-w-xl mx-auto text-center mb-10 px-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl mb-3">
          {dict.home.title}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
          {dict.home.subtitle}
        </p>
        <p className="mt-2 text-[#FF6B00] font-bold text-lg">
          {dict.home.priceLine(PRICE_MDL)}
        </p>
      </div>

      <div className="relative w-full max-w-5xl mx-auto h-[220px] mt-8">

        {canScrollLeft && (
          <button
            onClick={() => scrollCarousel('left')}
            aria-label={lang === 'ru' ? 'Прокрутить влево' : 'Derulează la stânga'}
            className="absolute left-2 sm:left-4 top-3 z-[60] w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white text-lg flex items-center justify-center shadow-lg transition-colors"
          >
            ‹
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scrollCarousel('right')}
            aria-label={lang === 'ru' ? 'Прокрутить вправо' : 'Derulează la dreapta'}
            className="absolute right-2 sm:right-4 top-3 z-[60] w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white text-lg flex items-center justify-center shadow-lg transition-colors animate-pulse"
          >
            ›
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-x-auto flex items-center pl-4 sm:pl-10 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleCarouselScroll}
        >
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none !important; }
          `}</style>

          <div className="relative bg-[#111] h-[150px] flex items-center rounded-l-[40px] pl-[60px] gap-[10px] shrink-0 pr-[150px] sm:pr-[200px] overflow-hidden">

            <div className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[35px] aspect-square z-10 overflow-hidden rounded-full drop-shadow-md pointer-events-none">
              <Image
                src="/ring.png"
                alt=""
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
                      <Image src={url} alt={`${index + 1}`} width={105} height={105} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSlotClick(index); }}
                          className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
                        >
                          {dict.home.replace}
                        </button>
                        <button
                          onClick={(e) => handleRemoveSlot(index, e)}
                          className="bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
                        >
                          {dict.home.remove}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-gray-300">
                      <span className="text-3xl mb-1">+</span>
                      <span className="text-[10px] font-medium opacity-70">{dict.home.slotHint}</span>
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
              alt=""
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
              ? dict.home.helperEmpty
              : slots.filter(Boolean).length < 6
                ? dict.home.helperMore(6 - slots.filter(Boolean).length)
                : dict.home.helperReady}
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
            ? dict.home.ctaUpload
            : dict.home.ctaOrder}
        </button>
        {slots.filter(Boolean).length >= 6 && (
          <p className="text-center text-[11px] text-gray-400 mt-2">
            {dict.home.photoCount(slots.filter(Boolean).length)}
          </p>
        )}
      </div>

      <div className="relative z-[99999]">
        {imageToCrop && (
          <ImageCropper
            key={imageToCrop}
            imageSrc={imageToCrop}
            onCropDone={handleCropDone}
            onCancel={handleCropCancel}
            currentIndex={totalInBatch - cropQueue.length + 1}
            total={totalInBatch}
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

      {showError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] max-w-md w-[90%]">
          <div className="bg-red-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{showError}</span>
            <button onClick={() => setShowError(null)} className="text-white/70 hover:text-white text-lg font-bold shrink-0">
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}