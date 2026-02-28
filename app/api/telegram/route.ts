import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Получаем текст сообщения от страницы "Спасибо"
    const { message } = await req.json();
    
    // Берем твои ключи из файла .env (или из настроек Vercel)
    // ВАЖНО: Убедись, что переменные называются именно так, 
    // или замени их на те названия, что ты используешь в /api/order
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Ключи Telegram не найдены' }, { status: 500 });
    }

    // Отправляем запрос на сервера Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Это позволит нам делать текст жирным (теги <b>)
      }),
    });

    if (!response.ok) throw new Error('Сбой на стороне Telegram');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ошибка TG:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}