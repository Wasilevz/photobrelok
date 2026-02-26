"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import getCroppedImg from "../utils/cropImage"; // Подключаем наши ножницы!

interface ImageCropperProps {
  imageSrc: string;
  onCropDone: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropDone, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Эта функция срабатывает при нажатии "Обрезать"
  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      // 1. Вырезаем кусок
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageBlob) {
        // 2. Превращаем файл в ссылку и отдаем на главную страницу
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        onCropDone(croppedImageUrl);
      }
    } catch (e) {
      console.error("Ошибка при обрезке:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 w-full h-full">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>

      <div className="bg-zinc-900 p-6 flex flex-col items-center gap-4">
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full max-w-md accent-white"
        />
        
        <div className="flex gap-4 w-full max-w-md">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-zinc-800 text-white rounded-lg font-medium"
          >
            Отмена
          </button>
          <button 
            onClick={handleCrop} // Запускаем обрезку вместо надоедливого алерта
            className="flex-1 py-3 px-4 bg-white text-black rounded-lg font-bold"
          >
            Обрезать
          </button>
        </div>
      </div>
    </div>
  );
}