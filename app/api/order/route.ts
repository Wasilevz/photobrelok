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
    const { name, phone, photoUrls, lang } = await request.json();

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

    for (let i = 0; i < numPhotos; i++) {
      const safeUrl = photoUrls[i].replace("/upload/", "/upload/f_jpg,q_auto:best/");
      const res = await fetch(safeUrl);
      if (!res.ok) {
        console.error(`Не удалось загрузить фото ${i + 1}: ${res.status} ${res.statusText}`);
        failedPhotos++;
        continue;
      }
      const buffer = await res.arrayBuffer();
      const base64Img = Buffer.from(buffer).toString('base64');

      const xPos = startX + leftOffset + (i * (photoSize + gap));
      const yPos = startY + ((stripHeight - photoSize) / 2);

      pdf.addImage(`data:image/jpeg;base64,${base64Img}`, "JPEG", xPos, yPos, photoSize, photoSize);
    }

    const pdfOutput = pdf.output("arraybuffer");
    const buffer = Buffer.from(pdfOutput);

    const chatIds = process.env.TELEGRAM_CHAT_ID?.split(",") || [];
    const langNote = lang === "ro" ? `\n🌐 Клиент оформлял на румынском (говорите по-румынски при звонке)` : '';
    const captionText = `🔥 Новый заказ #${orderId}\n👤 Клиент: ${safeName}\n📞 Тел: ${phone}\n📸 Фотографий: ${numPhotos} шт.${failedPhotos > 0 ? `\n⚠️ НЕ загрузилось фото: ${failedPhotos} — проверьте макет перед печатью!` : ''}${langNote}`;

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
      // Ни один получатель не получил заказ — клиенту нельзя показывать "успех"
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
