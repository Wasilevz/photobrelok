import React, { useState } from 'react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string }) => void;
  isSubmitting: boolean;
}

export default function OrderModal({ isOpen, onClose, onSubmit, isSubmitting }: OrderModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onSubmit({ name, phone });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-2">Оформление заказа</h2>
        <p className="text-zinc-400 mb-6 text-sm">Оставьте данные, и мы свяжемся с вами для подтверждения.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Как к вам обращаться?</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="Николай Гергич"
            />
          </div>
          
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Номер телефона</label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="+373..."
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`mt-4 w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isSubmitting 
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" 
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {isSubmitting ? "ОТПРАВКА..." : "ПОДТВЕРДИТЬ ЗАКАЗ"}
          </button>
        </form>
      </div>
    </div>
  );
}