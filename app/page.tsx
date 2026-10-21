"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import ImageCropper from "@/components/ImageCropper";
import OrderModal from "@/components/OrderModal";
import type { DeliveryData } from "@/components/OrderModal";
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

  // --- ОБНОВЛЕННАЯ ФУНКЦИЯ ОТМЕНЫ (Очистка памяти) ---
  const handleCropCancel = () => {
    const current = cropQueue[0];
    if (current) revokeOldUrl(current.url);
    
    const rest = cropQueue.slice(1);
    
    // Если пользователь отменяет, очищаем ссылки для всей оставшейся очереди
    if (rest.length > 0) {
      rest.forEach((item) => revokeOldUrl(item.url));
      setCropQueue([]);
      setTotalInBatch(0);
    } else {
      setCropQueue([]);
      setTotalInBatch(0);
    }
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

  const handleFinalSubmit = async (userData: { name: string; phone: string; delivery: DeliveryData }) => {
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
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          photoUrls,
          lang,
          delivery: userData.delivery,
        }),
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
    <main className="site-shell min-h-screen text-gray-900 font-sans selection:bg-amber-200 overflow-x-hidden">
      
      <header className="site-header content-section">
        <a href="#" className="brand-mark" aria-label="Photobrelok — главная">
          <span className="brand-symbol">P.</span>
          <span className="brand-word">PHOTO<span>BRELOK</span></span>
        </a>
        <nav className="site-nav" aria-label={lang === 'ru' ? 'Основная навигация' : 'Navigare principală'}>
          <a href="#about">{lang === 'ru' ? 'История' : 'Povestea'}</a>
          <a href="#details">{lang === 'ru' ? 'О брелоке' : 'Despre breloc'}</a>
          <a href="#faq">{lang === 'ru' ? 'Вопросы' : 'Întrebări'}</a>
        </nav>
        <button onClick={() => setLang(lang === 'ru' ? 'ro' : 'ru')} aria-label="Schimbă limba / Сменить язык" className="language-switch border rounded-full px-3 py-2 text-xs font-bold active:scale-95 transition-all">{lang === 'ru' ? 'RO' : 'RU'}</button>
        <a className="header-cta" href="#constructor">{lang === 'ru' ? 'Создать свой ↗' : 'Creează-l ↗'}</a>
      </header>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept="image/*" 
        multiple
        className="hidden" 
      />

      <section className="hero-section content-section">
        <div className="hero-layout">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span className="hero-dot" />{lang === 'ru' ? 'ПОДАРОК, КОТОРЫЙ ХРАНИТ ВАШУ ИСТОРИЮ' : 'UN CADOU CARE PĂSTREAZĂ POVESTEA TA'}</div>
            <h1>{lang === 'ru' ? 'Пять кадров вашей истории. Всегда с вами.' : 'Cinci cadre din povestea ta. Mereu cu tine.'}</h1>
            <p>{lang === 'ru' ? 'Персональный ретро-брелок с вашими фотографиями — маленькая вещь, в которой помещается что-то большое.' : 'Un breloc retro personalizat cu fotografiile tale — un obiect mic care păstrează ceva important.'}</p>
            <div className="hero-price">{dict.home.priceLine(PRICE_MDL)}</div>
            <div className="hero-actions">
              <a className="primary-button" href="#constructor">{lang === 'ru' ? 'Создать свой брелок' : 'Creează brelocul'} <span>↗</span></a>
              <span>{lang === 'ru' ? 'Изготовление за 1–2 дня · Подарочная коробка' : 'Realizat în 1–2 zile · Cutie cadou inclusă'}</span>
            </div>
          </div>
          <div className="hero-product" aria-label={lang === 'ru' ? 'Ретро-брелок с фотографиями' : 'Breloc retro cu fotografii'}>
            <div className="hero-product-label">{lang === 'ru' ? 'ВАША ИСТОРИЯ ВНУТРИ' : 'POVESTEA TA ÎN INTERIOR'}</div>
            <Image src="/kodak.png" alt={lang === 'ru' ? 'Ретро-брелок Photobrelok' : 'Breloc retro Photobrelok'} width={379} height={658} priority className="hero-product-image" />
            <div className="hero-product-note"><span>01—10</span>{lang === 'ru' ? 'Ваши фотографии. Ваши моменты.' : 'Fotografiile tale. Momentele tale.'}</div>
          </div>
        </div>
      </section>

      <section className="trust-strip content-section" aria-label={lang === 'ru' ? 'Преимущества' : 'Avantaje'}>
        <div><span className="trust-icon">01</span><p>{lang === 'ru' ? '10 личных фотографий' : '10 fotografii personale'}</p></div>
        <div><span className="trust-icon">02</span><p>{lang === 'ru' ? 'Подарочная коробка' : 'Cutie cadou inclusă'}</p></div>
        <div><span className="trust-icon">03</span><p>{lang === 'ru' ? 'Изготовление за 1–2 дня' : 'Realizat în 1–2 zile'}</p></div>
      </section>
      <section id="about" className="content-section story-section">
        <div className="section-eyebrow">{lang === 'ru' ? 'НЕ ПРОСТО БРЕЛОК' : 'MAI MULT DECÂT UN BRELOC'}</div>
        <div className="story-grid"><div><h2>{lang === 'ru' ? 'Важные моменты заслуживают быть рядом.' : 'Momentele importante merită să fie aproape.'}</h2></div>
          <div className="story-copy"><p>{lang === 'ru' ? 'Внутри ретро-брелока — ваши фотографии, маленькие напоминания о людях и моментах, которые хочется хранить с собой.' : 'În interiorul brelocului retro sunt fotografiile tale — mici amintiri despre oamenii și momentele pe care vrei să le porți cu tine.'}</p><p>{lang === 'ru' ? 'Это личный подарок, который не заканчивается на красивой упаковке: снимки можно достать и рассматривать снова и снова.' : 'Este un cadou personal, dincolo de ambalaj: fotografiile pot fi scoase și privite iar și iar.'}</p><a href="#constructor" className="text-link">{lang === 'ru' ? 'Создать свой брелок' : 'Creează brelocul tău'} <span>↗</span></a></div>
        </div>
      </section>
      <section id="details" className="content-section details-section">
        <div className="section-heading"><div className="section-eyebrow">{lang === 'ru' ? 'ПРОДУМАНО ДО МЕЛОЧЕЙ' : 'FIECARE DETALIU CONTEAZĂ'}</div><h2>{lang === 'ru' ? 'Маленький предмет. Большая история.' : 'Un obiect mic. O poveste mare.'}</h2></div>
        <div className="detail-grid">
          <article className="detail-card detail-card-dark"><span className="detail-number">01 / MEMORY</span><h3>{lang === 'ru' ? 'Ваши фотографии внутри' : 'Fotografiile tale în interior'}</h3><p>{lang === 'ru' ? 'Выберите до 10 любимых снимков и настройте кадрирование каждого прямо на сайте.' : 'Alege până la 10 fotografii preferate și ajustează fiecare cadru direct pe site.'}</p></article>
          <article className="detail-card"><span className="detail-number">02 / GIFT</span><h3>{lang === 'ru' ? 'Готов к вручению' : 'Pregătit pentru a fi oferit'}</h3><p>{lang === 'ru' ? 'Брелок упакован в деревянную подарочную коробку — отдельная упаковка не нужна.' : 'Brelocul vine într-o cutie cadou din lemn — nu ai nevoie de ambalaj suplimentar.'}</p></article>
          <article className="detail-card detail-card-accent"><span className="detail-number">03 / PERSONAL</span><h3>{lang === 'ru' ? 'Создан именно для вас' : 'Creat special pentru tine'}</h3><p>{lang === 'ru' ? 'Каждый брелок собирается из выбранных вами фотографий, поэтому второго такого не будет.' : 'Fiecare breloc este realizat din fotografiile alese de tine, așa că nu va exista unul identic.'}</p></article>
        </div>
      </section>
      <section className="content-section steps-section">
        <div className="section-heading"><div className="section-eyebrow">{lang === 'ru' ? 'ВСЁ ПРОСТО' : 'SIMPLU ȘI UȘOR'}</div><h2>{lang === 'ru' ? 'От фотографий до подарка — несколько шагов.' : 'De la fotografii la cadou — doar câțiva pași.'}</h2></div>
        <div className="steps-grid">
          <div className="step"><span>1</span><h3>{lang === 'ru' ? 'Выберите фото' : 'Alege fotografiile'}</h3><p>{lang === 'ru' ? 'Загрузите от 6 до 10 снимков и настройте каждый кадр.' : 'Încarcă între 6 și 10 fotografii și ajustează fiecare cadru.'}</p></div>
          <div className="step"><span>2</span><h3>{lang === 'ru' ? 'Оставьте заявку' : 'Trimite comanda'}</h3><p>{lang === 'ru' ? 'Укажите контакт и удобный способ получения.' : 'Lasă datele de contact și alege metoda de livrare.'}</p></div>
          <div className="step"><span>3</span><h3>{lang === 'ru' ? 'Получите подарок' : 'Primește cadoul'}</h3><p>{lang === 'ru' ? 'Подготовим брелок за 1–2 дня и передадим выбранным способом.' : 'Pregătim brelocul în 1–2 zile și îl livrăm prin metoda aleasă.'}</p></div>
        </div>
        <button onClick={() => document.getElementById('constructor')?.scrollIntoView({ behavior: 'smooth' })} className="primary-button">{lang === 'ru' ? 'Собрать свой брелок' : 'Personalizează brelocul'} <span>↗</span></button>
      </section>
      <section className="content-section occasions-section">
        <div className="occasion-copy"><div className="section-eyebrow">{lang === 'ru' ? 'ПОДАРОК С ЛИЧНЫМ СМЫСЛОМ' : 'UN CADOU CU SENS PERSONAL'}</div><h2>{lang === 'ru' ? 'Для тех, кому хочется сказать больше, чем словами.' : 'Pentru cei cărora vrei să le spui mai mult decât prin cuvinte.'}</h2><p>{lang === 'ru' ? 'День рождения, годовщина, отношения на расстоянии или просто желание напомнить о себе. Выберите фотографии, которые рассказывают вашу общую историю.' : 'Zi de naștere, aniversare, relație la distanță sau pur și simplu dorința de a-i aminti cuiva că îți pasă. Alege fotografiile care spun povestea voastră.'}</p><a href="#constructor" className="text-link">{lang === 'ru' ? 'Начать создание' : 'Începe personalizarea'} <span>↗</span></a></div>
        <div className="occasion-list"><div><span>01</span>{lang === 'ru' ? 'Для любимого человека' : 'Pentru persoana iubită'}</div><div><span>02</span>{lang === 'ru' ? 'Для близкого друга' : 'Pentru un prieten apropiat'}</div><div><span>03</span>{lang === 'ru' ? 'Для семьи' : 'Pentru familie'}</div><div><span>04</span>{lang === 'ru' ? 'Без повода — просто так' : 'Fără un motiv special'}</div></div>
      </section>
      <section id="faq" className="content-section faq-section">
        <div className="section-heading"><div className="section-eyebrow">{lang === 'ru' ? 'ПЕРЕД ЗАКАЗОМ' : 'ÎNAINTE DE COMANDĂ'}</div><h2>{lang === 'ru' ? 'Коротко о главном.' : 'Răspunsuri la întrebări.'}</h2></div>
        <div className="faq-list">
          <details><summary>{lang === 'ru' ? 'Сколько фотографий помещается в брелок?' : 'Câte fotografii încap în breloc?'}</summary><p>{lang === 'ru' ? 'В конструкторе можно добавить от 6 до 10 фотографий. Вы сами кадрируете каждый снимок перед заказом.' : 'Poți adăuga între 6 și 10 fotografii. Ajustezi fiecare fotografie înainte de a trimite comanda.'}</p></details>
          <details><summary>{lang === 'ru' ? 'Сколько времени занимает изготовление?' : 'Cât durează realizarea?'}</summary><p>{lang === 'ru' ? 'Обычно изготовление занимает 1–2 дня. Срок доставки зависит от выбранного способа получения.' : 'Realizarea durează de obicei 1–2 zile. Timpul de livrare depinde de metoda aleasă.'}</p></details>
          <details><summary>{lang === 'ru' ? 'Как я получу заказ?' : 'Cum primesc comanda?'}</summary><p>{lang === 'ru' ? 'При оформлении можно выбрать доступный способ получения: почту, Nova Post или самовывоз.' : 'La comandă poți alege metoda disponibilă: poștă, Nova Post sau ridicare personală.'}</p></details>
          <details><summary>{lang === 'ru' ? 'Это готовый подарок?' : 'Este gata de oferit cadou?'}</summary><p>{lang === 'ru' ? 'Да, брелок комплектуется деревянной подарочной коробкой.' : 'Da, brelocul include o cutie cadou din lemn.'}</p></details>
        </div>
      </section>
      <section className="constructor-section content-section">
        <div className="constructor-intro">
          <div className="section-eyebrow">{lang === 'ru' ? 'СОЗДАЙТЕ СВОЙ БРЕЛОК' : 'CREEAZĂ BRELOCUL TĂU'}</div>
          <h2>{lang === 'ru' ? 'Выберите фотографии, которые хочется сохранить рядом.' : 'Alege fotografiile pe care vrei să le păstrezi aproape.'}</h2>
          <p>{lang === 'ru' ? 'Добавьте от 6 до 10 снимков. Каждый можно кадрировать перед оформлением заказа.' : 'Adaugă între 6 și 10 fotografii. Poți ajusta fiecare cadru înainte de comandă.'}</p>
        </div>
      <div id="constructor" className="constructor-stage relative w-full max-w-5xl mx-auto h-[220px] mt-8">

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
            <div className="absolute top-[-50px] bottom-[-50px] left-[25px] right-[-1000px] bg-[#F3F3F0] z-30 pointer-events-none" />
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

      <div className="order-cta max-w-xs sm:max-w-md mx-auto mt-12 px-4">
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
              : 'bg-[#FFC400] text-[#0D0D0D] hover:bg-[#E8B300] active:bg-[#D9A700] hover:-translate-y-1 shadow-amber-200'
          }`}
        >
          {slots.filter(Boolean).length < 6
            ? dict.home.ctaUpload
            : dict.home.ctaOrder}
        </button>
        {slots.filter(Boolean).length >= 6 && (
          <p className="text-center text-[11px] text-gray-500 mt-2">
            {dict.home.photoCount(slots.filter(Boolean).length)}
          </p>
        )}
      </div>
      <section className="final-cta content-section"><div className="section-eyebrow">{lang === 'ru' ? 'СОХРАНИТЕ СВОЮ ИСТОРИЮ' : 'PĂSTREAZĂ POVESTEA TA'}</div><h2>{lang === 'ru' ? 'Ваши любимые моменты — всегда с собой.' : 'Momentele tale preferate, mereu cu tine.'}</h2><button onClick={() => document.getElementById('constructor')?.scrollIntoView({ behavior: 'smooth' })} className="primary-button">{lang === 'ru' ? 'Создать брелок за 250 MDL' : 'Creează brelocul — 250 MDL'} <span>↗</span></button><p>{lang === 'ru' ? 'Персональный подарок · Деревянная коробка · Изготовление 1–2 дня' : 'Cadou personalizat · Cutie din lemn · Realizat în 1–2 zile'}</p></section>

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
