// index.js
const { Telegraf, Scenes, session } = require('telegraf');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Настройка сессий и сцены для 2FA
const stage = new Scenes.Stage();
const scene = new Scenes.BaseScene('verifyCode');

scene.enter((ctx) => {
  ctx.reply('🔐 Введите код из второго бота (@strrent_2fa_bot):');
});

scene.on('text', async (ctx) => {
  const inputCode = ctx.message.text.trim();
  const userId = ctx.from.id;
  const storedCode = ctx.session.twoFactorCode;

  if (inputCode === storedCode) {
    // Код верный — переходим к выбору типа
    await ctx.reply('✅ Верификация успешна!');
    await ctx.reply('Выберите тип оборудования:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'GC1', callback_data: 'create_GC1' }],
          [{ text: 'GC2', callback_data: 'create_GC2' }],
          [{ text: 'GC3', callback_data: 'create_GC3' }],
          [{ text: 'GC4', callback_data: 'create_GC4' }],
          [{ text: 'GC5', callback_data: 'create_GC5' }],
          [{ text: 'GC6', callback_data: 'create_GC6' }],
          [{ text: 'GC7', callback_data: 'create_GC7' }],
          [{ text: 'GC8', callback_data: 'create_GC8' }],
          [{ text: 'GC9', callback_data: 'create_GC9' }],
          [{ text: 'GC10', callback_data: 'create_GC10' }],
          [{ text: 'OQ21', callback_data: 'create_OQ21' }],
          [{ text: 'OQ22', callback_data: 'create_OQ22' }],
          [{ text: 'OQ3', callback_data: 'create_OQ3' }],
        ],
      },
    });
    return ctx.scene.leave();
  } else {
    return ctx.reply('❌ Неверный код. Попробуйте снова или нажмите /start.');
  }
});

stage.register(scene);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.use(session());
bot.use(stage.middleware());

// Список сотрудников
const ALLOWED_IDS = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => parseInt(id));

// Функция отправки кода через 2FA-бота
async function send2FACode(userId, code) {
  const url = `https://api.telegram.org/bot${process.env.TWO_FACTOR_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: userId,
    text: `🔒 Ваш одноразовый код для создания договора:\n\n<b>${code}</b>\n\nНе передавайте его никому!`,
    parse_mode: 'HTML'
  });
}

bot.command('start', (ctx) => {
  const userId = ctx.from.id;
  if (ALLOWED_IDS.includes(userId)) {
    return ctx.reply('Добро пожаловать! 👋\nНажмите кнопку ниже, чтобы создать договор:', {
      reply_markup: {
        keyboard: [[{ text: '📄 Создать договор' }]],
        resize_keyboard: true,
      },
    });
  } else {
    return ctx.reply('❌ Доступ запрещён.');
  }
});

bot.hears('📄 Создать договор', async (ctx) => {
  const userId = ctx.from.id;
  if (!ALLOWED_IDS.includes(userId)) return;

  // Генерируем 6-значный код
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  ctx.session.twoFactorCode = code;

  try {
    await send2FACode(userId, code);
    await ctx.reply('📩 Код отправлен в личные сообщения от @strrent_2fa_bot.\nВведите его здесь:');
    return ctx.scene.enter('verifyCode');
  } catch (error) {
    console.error('Ошибка отправки 2FA:', error.message);
    return ctx.reply('⚠️ Не удалось отправить код. Проверьте, написали ли вы @strrent_2fa_bot хотя бы раз.');
  }
});

// Обработка выбора типа оборудования
bot.on('callback_query', async (ctx) => {
  const data = ctx.update.callback_query.data;
  const userId = ctx.from.id;

  if (data.startsWith('create_')) {
    const type = data.replace('create_', '');

    try {
      const response = await axios.post(process.env.GOOGLE_SCRIPT_URL, {
        type: type,
        employee_id: userId
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const result = response.data;
      if (result.success) {
        await ctx.answerCbQuery(`✅ Договор ${result.contract_id} создан!`);
      } else {
        await ctx.answerCbQuery('❌ Ошибка при создании договора.');
      }
    } catch (error) {
      console.error('Ошибка Google Apps Script:', error.message);
      await ctx.answerCbQuery('⚠️ Не удалось сохранить договор.');
    }
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('✅ STRRENT Bot is running');
});

app.listen(port, () => {
  console.log(`HTTP сервер запущен на порту ${port}`);
  bot.launch().then(() => {
    console.log('🤖 Telegram бот запущен с 2FA');
  }).catch(console.error);
});
