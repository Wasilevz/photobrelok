import React, { useState, useEffect, useRef } from 'react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string }) => void;
  isSubmitting: boolean;
  price: number;
}

export default function OrderModal({ isOpen, onClose, onSubmit, isSubmitting, price }: OrderModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      nameRef.current?.focus();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    if (!/^\d{8,12}$/.test(cleaned)) {
      setPhoneError('Введите номер телефона без кода страны');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!validatePhone(phone)) return;
    onSubmit({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
          aria-label="Закрыть"
        >
          ✕
        </button>

        <h2 id="order-modal-title" className="text-2xl font-bold text-white mb-2">Почти готово!</h2>
        <p className="text-zinc-400 mb-1 text-sm">Оставьте контакт — перезвоним для подтверждения в течение 30 минут</p>
        <p className="text-[#FF6B00] font-bold mb-6 text-sm">К оплате при получении: {price} лей</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="customer-name" className="block text-zinc-400 text-sm mb-1">Как к вам обращаться?</label>
            <input
              id="customer-name"
              ref={nameRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              placeholder="Николай Гергич"
            />
          </div>

          <div>
            <label htmlFor="customer-phone" className="block text-zinc-400 text-sm mb-1">Номер телефона</label>
            <input
              id="customer-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
              onBlur={() => phone && validatePhone(phone)}
              className={`w-full bg-zinc-950 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 ${
                phoneError
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-zinc-700 focus:border-[#FF6B00] focus:ring-[#FF6B00]'
              }`}
              placeholder="60 123 456"
            />
            {phoneError && (
              <p className="text-red-400 text-xs mt-1">{phoneError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !phone.trim()}
              className={`mt-4 w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isSubmitting || !name.trim() || !phone.trim()
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-[#FF6B00] text-white hover:bg-[#E65C00] active:scale-[0.98] shadow-lg shadow-orange-200"
              }`}
          >
            {isSubmitting ? "Отправка..." : "Подтвердить заказ"}
          </button>
        </form>
      </div>
    </div>
  );
}