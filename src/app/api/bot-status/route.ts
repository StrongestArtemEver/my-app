import { NextRequest, NextResponse } from 'next/server';

// Define a type for the expected status, for better type-safety.
type BotStatus = 1 | 2 | 3 | 4 | 5;

// Define a mapping from status code to a human-readable message.
const statusMessages: { [key in BotStatus]: string } = {
  1: "Уже звоню",
  2: "Дозвонился",
  3: "Звонок успешно завершен",
  4: "Не дозвонился",
  5: "Ошибка",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const status: BotStatus = body.status;
    const callId: string = body.callId;  

    if (!status || !statusMessages[status]) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    if (!callId) {
        return NextResponse.json({ error: 'callId is required' }, { status: 400 });
    }


    const message = statusMessages[status];
    console.log(`Получен статус от бота для звонка ${callId}: ${status} - ${message}`);

    // Отправляем статус на WebSocket сервер для трансляции клиентам
    try {
      await fetch('http://localhost:3001/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId, status, message }),
      });
    } catch (wsError) {
      console.error('Ошибка при отправке статуса на WebSocket сервер:', wsError);
      // Не прерываем основной процесс, просто логируем ошибку
    }

    // Here you would typically handle the status update,
    // for example, by saving it to a database,
    // sending a notification via websockets, etc.

    return NextResponse.json({ success: true, receivedStatus: status, message: message });
  } catch (error) {
    console.error('Ошибка при обработке запроса от бота:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 