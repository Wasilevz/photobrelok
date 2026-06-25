import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Сообщение обязательно" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Ключи Telegram не найдены' }, { status: 500 });
    }

    const plainMessage = message.replace(/<[^>]*>/g, "");

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: plainMessage,
      }),
    });

    if (!response.ok) throw new Error('Сбой на стороне Telegram');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка TG:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}