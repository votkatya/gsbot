// Cloudflare Worker — Telegram Bot для Город Спорта
// Деплоится на Cloudflare Workers

const BOT_TOKEN = '8091797199:AAHAhjl7ooj4ajYdoxZwl-B4AtRlrj_WZqI';
const WEBAPP_URL = 'https://gorodsporta.pages.dev';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Bot is running', { status: 200 });
    }

    try {
      const update = await request.json();

      // Обработка команды /start
      if (update.message?.text) {
        const text = update.message.text;
        const chatId = update.message.chat.id;
        const firstName = update.message.from.first_name || 'Друг';

        if (text.startsWith('/start')) {
          const param = text.split(' ')[1] || '';

          // Если есть QR параметр — открываем Mini App с ним
          if (param.startsWith('qr_')) {
            await sendMessage(chatId,
              `🎉 Отлично, ${firstName}!\n\nТы нашёл QR-код! Открой приложение, чтобы получить награду:`,
              {
                inline_keyboard: [[
                  {
                    text: '🎁 Получить награду',
                    web_app: { url: `${WEBAPP_URL}?tgWebAppStartParam=${param}` }
                  }
                ]]
              }
            );
          } else {
            // Обычный старт
            await sendMessage(chatId,
              `Привет, ${firstName}! 👋\n\n` +
              `Добро пожаловать в онбординг-квест по клубу Город Спорта!\n\n` +
              `🏋️ Выполняй задания\n` +
              `📱 Сканируй QR-коды в клубе\n` +
              `💰 Зарабатывай спортики\n` +
              `🎁 Обменивай на призы\n\n` +
              `Нажми кнопку ниже, чтобы начать:`,
              {
                inline_keyboard: [[
                  { text: '🚀 Начать квест', web_app: { url: WEBAPP_URL } }
                ]]
              }
            );
          }
        }
      }

      return new Response('OK', { status: 200 });
    } catch (e) {
      console.error('Error:', e);
      return new Response('Error', { status: 500 });
    }
  }
};

async function sendMessage(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
