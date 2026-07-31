import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Сообщение обязательно" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatIdsRaw = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatIdsRaw) {
      return NextResponse.json({ error: 'Ключи Telegram не найдены' }, { status: 500 });
    }

    // Поддержка нескольких получателей через запятую — как в /api/order
    const chatIds = chatIdsRaw.split(",").map((id) => id.trim()).filter(Boolean);

    const results = await Promise.all(
      chatIds.map((chatId) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        })
      )
    );

    const allFailed = results.every((r) => !r.ok);
    if (allFailed) {
      throw new Error('Сбой на стороне Telegram: ни один получатель не подтвердил доставку');
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка TG:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
