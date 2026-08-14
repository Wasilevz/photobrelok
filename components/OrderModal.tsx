import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from "@/context/LanguageContext";
import { DeliveryMethod } from "@/lib/i18n";

export interface DeliveryData {
  method: DeliveryMethod;
  postalCode?: string;
  street?: string;
  city?: string;
  district?: string;
  novaPostBranch?: string;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; delivery: DeliveryData }) => void;
  isSubmitting: boolean;
}

export default function OrderModal({ isOpen, onClose, onSubmit, isSubmitting }: OrderModalProps) {
  const { dict } = useLanguage();
  const d = dict.orderModal.delivery;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [method, setMethod] = useState<DeliveryMethod | null>(null);
  const [surname, setSurname] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [novaPostBranch, setNovaPostBranch] = useState('');
  const [deliveryTouched, setDeliveryTouched] = useState(false);

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
      setPhoneError(dict.orderModal.phoneError);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const selectMethod = (m: DeliveryMethod) => {
    setMethod(m);
    setDeliveryTouched(true);
  };

  const isDeliveryValid = (): boolean => {
    if (method === 'posta') return surname.trim() !== '' && postalCode.trim() !== '' && city.trim() !== '' && district.trim() !== '';
    if (method === 'novapost') return novaPostBranch.trim() !== '';
    if (method === 'pickup') return true;
    return false;
  };

  const canSubmit =
    !isSubmitting && name.trim() !== '' && phone.trim() !== '' && isDeliveryValid();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryTouched(true);
    if (!name.trim()) return;
    if (!validatePhone(phone)) return;
    if (!method || !isDeliveryValid()) return;

    const delivery: DeliveryData =
      method === 'posta'
        ? { method, postalCode: postalCode.trim(), street: street.trim(), city: city.trim(), district: district.trim() }
        : method === 'novapost'
          ? { method, novaPostBranch: novaPostBranch.trim() }
          : { method };

    const fullName = method === 'posta' && surname.trim()
      ? `${name.trim()} ${surname.trim()}`
      : name.trim();

    onSubmit({ name: fullName, phone: phone.trim(), delivery });
  };

  const methodCardClass = (m: DeliveryMethod) =>
    `w-full text-left px-4 py-3 rounded-xl border-2 transition-colors flex items-center justify-between gap-3 ${
      method === m
        ? 'border-[#FF6B00] bg-[#FF6B00]/10'
        : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
          aria-label={dict.orderModal.close}
        >
          ✕
        </button>

        <h2 id="order-modal-title" className="text-2xl font-bold text-white mb-2">{dict.orderModal.title}</h2>
        <p className="text-zinc-400 mb-6 text-sm">{dict.orderModal.subtitle}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="customer-name" className="block text-zinc-400 text-sm mb-1">{dict.orderModal.nameLabel}</label>
            <input
              id="customer-name"
              ref={nameRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              placeholder={dict.orderModal.namePlaceholder}
            />
          </div>

          <div>
            <label htmlFor="customer-phone" className="block text-zinc-400 text-sm mb-1">{dict.orderModal.phoneLabel}</label>
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
              placeholder={dict.orderModal.phonePlaceholder}
            />
            {phoneError && (
              <p className="text-red-400 text-xs mt-1">{phoneError}</p>
            )}
          </div>

          {/* Способ получения */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">{d.label}</label>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => selectMethod('posta')} className={methodCardClass('posta')}>
                <span className="text-white font-medium text-sm">{d.posta}</span>
                <span className="text-zinc-400 text-xs whitespace-nowrap">{d.postaPrice}</span>
              </button>

              {method === 'posta' && (
                <div className="pl-1 pr-1 pt-1 pb-2 flex flex-col gap-3 animate-in fade-in duration-200">
                  <div>
                    <label htmlFor="surname" className="block text-zinc-500 text-xs mb-1">{d.surnameLabel}</label>
                    <input
                      id="surname"
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder={d.surnamePlaceholder}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="postal-code" className="block text-zinc-500 text-xs mb-1">{d.postalCodeLabel}</label>
                      <input
                        id="postal-code"
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={d.postalCodePlaceholder}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                      />
                    </div>
                    <div>
                      <label htmlFor="district" className="block text-zinc-500 text-xs mb-1">{d.districtLabel}</label>
                      <input
                        id="district"
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder={d.districtPlaceholder}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-zinc-500 text-xs mb-1">{d.cityLabel}</label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={d.cityPlaceholder}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                  <div>
                    <label htmlFor="street" className="block text-zinc-500 text-xs mb-1">{d.streetLabel}</label>
                    <input
                      id="street"
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder={d.streetPlaceholder}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                </div>
              )}

              <button type="button" onClick={() => selectMethod('novapost')} className={methodCardClass('novapost')}>
                <span className="text-white font-medium text-sm">{d.novapost}</span>
                <span className="text-zinc-400 text-xs whitespace-nowrap">{d.novapostPrice}</span>
              </button>

              {method === 'novapost' && (
                <div className="pl-1 pr-1 pt-1 pb-2 animate-in fade-in duration-200">
                  <label htmlFor="novapost-branch" className="block text-zinc-500 text-xs mb-1">{d.branchLabel}</label>
                  <input
                    id="novapost-branch"
                    type="text"
                    value={novaPostBranch}
                    onChange={(e) => setNovaPostBranch(e.target.value)}
                    placeholder={d.branchPlaceholder}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
              )}

              <button type="button" onClick={() => selectMethod('pickup')} className={methodCardClass('pickup')}>
                <span className="text-white font-medium text-sm">{d.pickup}</span>
                <span className="text-green-500 text-xs whitespace-nowrap font-semibold">{d.pickupPrice}</span>
              </button>

              {method === 'pickup' && (
                <div className="pl-1 pr-1 pt-1 pb-2 text-xs text-zinc-400 leading-relaxed animate-in fade-in duration-200">
                  📍 {d.pickupAddress}<br />
                  🕒 {d.pickupHours}
                </div>
              )}
            </div>
            {deliveryTouched && !method && (
              <p className="text-red-400 text-xs mt-2">{d.chooseMethod}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
              className={`mt-2 w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !canSubmit
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-[#FF6B00] text-white hover:bg-[#E65C00] active:scale-[0.98] shadow-lg shadow-orange-200"
              }`}
          >
            {isSubmitting ? dict.orderModal.submitting : dict.orderModal.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
