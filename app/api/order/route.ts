import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(request: Request) {
  try {
    const { name, phone, photoUrls } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Имя клиента обязательно" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 });
    }
    if (!Array.isArray(photoUrls) || photoUrls.length < 1) {
      return NextResponse.json({ error: "Нужно минимум 1 фото" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Telegram token не настроен" }, { status: 500 });
    }

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    // --- ПАРАМЕТРЫ ФОТО И ЛЕНТЫ ---
    const photoSize = 25.5; 
    const gap = 1.7; 
    const numPhotos = photoUrls.length;
    
    const leftOffset = 11.3; // Начало ленты с большим отверстием
    const rightOffset = 15;  // Длинный хвост для зацепа в катушку
    const stripHeight = 35;  

    const stripWidth = leftOffset + (numPhotos * photoSize) + (Math.max(0, numPhotos - 1) * gap) + rightOffset;
    
    const startX = (297 - stripWidth) / 2;
    const startY = (210 - stripHeight) / 2;

    // 1. РИСУЕМ ЧЕРНУЮ ЛЕНТУ
    pdf.setFillColor(0, 0, 0); 
    pdf.rect(startX, startY, stripWidth, stripHeight, "F");

    // 2. ДОБАВЛЯЕМ МЕТКИ ДЛЯ РЕЗА
    pdf.setDrawColor(200, 200, 200); 
    pdf.setLineWidth(0.1); 
    pdf.line(startX - 3, startY, startX + stripWidth + 3, startY); 
    pdf.line(startX - 3, startY + stripHeight, startX + stripWidth + 3, startY + stripHeight); 
    pdf.line(startX, startY - 3, startX, startY + stripHeight + 3); 
    pdf.line(startX + stripWidth, startY - 3, startX + stripWidth, startY + stripHeight + 3); 

    // 3. РИСУЕМ БОЛЬШОЕ КРУГЛОЕ ОТВЕРСТИЕ СЛЕВА
    pdf.setFillColor(255, 255, 255); 
    const circleRadius = 5.3 / 2; 
    const circleX = startX + 2 + circleRadius; 
    const circleY = startY + (stripHeight / 2); 
    pdf.circle(circleX, circleY, circleRadius, "F");

    // ==============================================================================
    // 4. РИСУЕМ ПЕРФОРАЦИЮ (Начинаем строго ПОСЛЕ круглого отверстия)
    // ==============================================================================
    const holeW = 2;     
    const holeH = 2.5;   
    const cornerR = 0.5; 
    const step = 4.75;   
    const holeMarginY = 1.125; 

    // Пропускаем дырочки над/под круглым отверстием! 
    // Начинаем рисовать с шага 9.5 мм (это ровно 2 стандартных шага перфорации)
    const startPerfOffset = step * 2; 

    for (let i = startPerfOffset; i < stripWidth - holeW; i += step) {
        const currentX = startX + i;

        // Верхний ряд
        pdf.roundedRect(
          currentX, startY + holeMarginY, holeW, holeH, cornerR, cornerR, "F"
        );

        // Нижний ряд
        pdf.roundedRect(
          currentX, startY + stripHeight - holeMarginY - holeH, holeW, holeH, cornerR, cornerR, "F"
        );
    }
    // ==============================================================================

    // 5. ВСТАВЛЯЕМ ФОТОГРАФИИ
    for (let i = 0; i < numPhotos; i++) {
      const safeUrl = photoUrls[i].replace("/upload/", "/upload/f_jpg,q_auto:best/");
      const res = await fetch(safeUrl);
      if (!res.ok) {
        console.error(`Не удалось загрузить фото ${i + 1}: ${res.status} ${res.statusText}`);
        continue;
      }
      const buffer = await res.arrayBuffer();
      const base64Img = Buffer.from(buffer).toString('base64');
      
      const xPos = startX + leftOffset + (i * (photoSize + gap));
      const yPos = startY + ((stripHeight - photoSize) / 2); 
      
      pdf.addImage(`data:image/jpeg;base64,${base64Img}`, "JPEG", xPos, yPos, photoSize, photoSize);
    }

    // 6. ОТПРАВКА В TELEGRAM
    const pdfOutput = pdf.output("arraybuffer");
    const buffer = Buffer.from(pdfOutput);

    const chatIds = process.env.TELEGRAM_CHAT_ID?.split(",") || [];
    const safeName = name.replace(/[^\w\s]/g, "").slice(0, 50);
    const captionText = `🔥 Заказ!\n👤 Клиент: ${safeName}\n📞 Тел: ${phone}\n📸 Фотографий: ${numPhotos} шт.\n\n`;

    for (const chatId of chatIds) {
      const cleanId = chatId.trim();
      if (!cleanId) continue;

      const tgFormData = new FormData();
      tgFormData.append("chat_id", cleanId);
      tgFormData.append("document", new Blob([buffer], { type: "application/pdf" }), `Brelok_${safeName}.pdf`);
      tgFormData.append("caption", captionText);

      await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: "POST",
        body: tgFormData,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Ошибка при сборке макета:", error);
    return NextResponse.json({ error: "Генерация не удалась" }, { status: 500 });
  }
}