import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

function generateOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export async function POST(request: Request) {
  try {
    const { name, phone, photoUrls, lang, delivery } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Имя клиента обязательно" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 });
    }
    if (!Array.isArray(photoUrls) || photoUrls.length < 1) {
      return NextResponse.json({ error: "Нужно минимум 1 фото" }, { status: 400 });
    }
    if (!delivery || typeof delivery !== "object" || typeof delivery.method !== "string") {
      return NextResponse.json({ error: "Не выбран способ получения" }, { status: 400 });
    }
    if (delivery.method === "posta") {
      if (!delivery.postalCode?.trim() || !delivery.city?.trim() || !delivery.district?.trim()) {
        return NextResponse.json({ error: "Заполните адрес для Poșta Moldovei (индекс, город/село, район)" }, { status: 400 });
      }
    } else if (delivery.method === "novapost") {
      if (!delivery.novaPostBranch?.trim()) {
        return NextResponse.json({ error: "Укажите номер отделения Nova Poshta" }, { status: 400 });
      }
    } else if (delivery.method !== "pickup") {
      return NextResponse.json({ error: "Некорректный способ получения" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Telegram token не настроен" }, { status: 500 });
    }

    const orderId = generateOrderId();
    const safeName = name.replace(/[^\p{L}\p{N}\s]/gu, "").slice(0, 50);

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const photoSize = 25.5;
    const gap = 1.7;
    const numPhotos = photoUrls.length;

    const leftOffset = 11.3;
    const rightOffset = 15;
    const stripHeight = 35;

    const stripWidth = leftOffset + (numPhotos * photoSize) + (Math.max(0, numPhotos - 1) * gap) + rightOffset;

    const startX = (297 - stripWidth) / 2;
    const startY = (210 - stripHeight) / 2;

    pdf.setFillColor(0, 0, 0);
    pdf.rect(startX, startY, stripWidth, stripHeight, "F");

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);
    pdf.line(startX - 3, startY, startX + stripWidth + 3, startY);
    pdf.line(startX - 3, startY + stripHeight, startX + stripWidth + 3, startY + stripHeight);
    pdf.line(startX, startY - 3, startX, startY + stripHeight + 3);
    pdf.line(startX + stripWidth, startY - 3, startX + stripWidth, startY + stripHeight + 3);

    pdf.setFillColor(255, 255, 255);
    const circleRadius = 5.3 / 2;
    const circleX = startX + 2 + circleRadius;
    const circleY = startY + (stripHeight / 2);
    pdf.circle(circleX, circleY, circleRadius, "F");

    const holeW = 2;
    const holeH = 2.5;
    const cornerR = 0.5;
    const step = 4.75;
    const holeMarginY = 1.125;
    const startPerfOffset = step * 2;

    for (let i = startPerfOffset; i < stripWidth - holeW; i += step) {
        const currentX = startX + i;
        pdf.roundedRect(currentX, startY + holeMarginY, holeW, holeH, cornerR, cornerR, "F");
        pdf.roundedRect(currentX, startY + stripHeight - holeMarginY - holeH, holeW, holeH, cornerR, cornerR, "F");
    }

    let failedPhotos = 0;

    // --- НАЧАЛО БЛОКА ПАРАЛЛЕЛЬНОЙ ЗАГРУЗКИ ---
    const photoPromises = photoUrls.map(async (url: string, index: number) => {
      try {
        const safeUrl = url.replace("/upload/", "/upload/f_jpg,q_auto:best/");
        const res = await fetch(safeUrl);
        if (!res.ok) {
          console.error(`Не удалось загрузить фото ${index + 1}: ${res.status} ${res.statusText}`);
          return null;
        }
        const buffer = await res.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
      } catch (err) {
        console.error(`Сбой fetch для URL: ${url}`, err);
        return null;
      }
    });

    const fetchedImages = await Promise.all(photoPromises);

    fetchedImages.forEach((base64Img, i) => {
      if (!base64Img) {
        failedPhotos++;
        return;
      }
      const xPos = startX + leftOffset + (i * (photoSize + gap));
      const yPos = startY + ((stripHeight - photoSize) / 2);
      pdf.addImage(`data:image/jpeg;base64,${base64Img}`, "JPEG", xPos, yPos, photoSize, photoSize);
    });
    // --- КОНЕЦ БЛОКА ПАРАЛЛЕЛЬНОЙ ЗАГРУЗКИ ---

    const pdfOutput = pdf.output("arraybuffer");
    const buffer = Buffer.from(pdfOutput);

    const chatIds = process.env.TELEGRAM_CHAT_ID?.split(",") || [];
    const langNote = lang === "ro" ? `\n🌐 Клиент оформлял на румынском (говорите по-румынски при звонке)` : '';

    const clean = (v: unknown) => (typeof v === "string" ? v.replace(/[^\p{L}\p{N}\s\-.,/]/gu, "").slice(0, 100).trim() : "");

    let deliveryText: string;
    if (delivery.method === "posta") {
      const postalCode = clean(delivery.postalCode);
      const city = clean(delivery.city);
      const district = clean(delivery.district);
      const street = clean(delivery.street);
      deliveryText = `🚚 Способ получения: Poșta Moldovei — 30 лей\n📮 Индекс: ${postalCode}\n🏘 ${city}, р-н ${district}${street ? `\n🏠 Улица: ${street}` : ''}`;
    } else if (delivery.method === "novapost") {
      const branch = clean(delivery.novaPostBranch);
      deliveryText = `🚚 Способ получения: Nova Poshta — 55 лей\n📦 Отделение №${branch}`;
    } else {
      deliveryText = `🚚 Способ получения: Самовывоз — бесплатно\n📍 A. Bernardazzi 64, Кишинёв (12:00–22:00)`;
    }

    const captionText = `🔥 Новый заказ #${orderId}\n👤 Клиент: ${safeName}\n📞 Тел: ${phone}\n📸 Фотографий: ${numPhotos} шт.\n${deliveryText}${failedPhotos > 0 ? `\n⚠️ НЕ загрузилось фото: ${failedPhotos} — проверьте макет перед печатью!` : ''}${langNote}`;

    let deliveredToAtLeastOne = false;

    for (const chatId of chatIds) {
      const cleanId = chatId.trim();
      if (!cleanId) continue;

      const tgFormData = new FormData();
      tgFormData.append("chat_id", cleanId);
      tgFormData.append("document", new Blob([buffer], { type: "application/pdf" }), `Brelok_${orderId}_${safeName}.pdf`);
      tgFormData.append("caption", captionText);

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: "POST",
        body: tgFormData,
      });

      if (tgRes.ok) {
        deliveredToAtLeastOne = true;
      } else {
        console.error(`Не удалось отправить заказ #${orderId} в чат ${cleanId}: ${tgRes.status}`);
      }
    }

    if (!deliveredToAtLeastOne) {
      return NextResponse.json(
        { error: "Заказ создан, но не удалось уведомить менеджера. Свяжитесь с нами напрямую." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, orderId });

  } catch (error) {
    console.error("Ошибка при сборке макета:", error);
    return NextResponse.json({ error: "Генерация не удалась" }, { status: 500 });
  }
}
