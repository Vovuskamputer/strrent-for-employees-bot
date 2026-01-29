// index.js
const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Список разрешённых ID (добавь свой и других сотрудников через запятую)
const ALLOWED_IDS = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => parseInt(id));

// Health check endpoint — обязательно для Render
app.get('/', (req, res) => {
  res.send('✅ STRRENT Bot is running');
});

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
    return ctx.reply('❌ Доступ запрещён. Обратитесь к администратору.');
  }
});

bot.hears('📄 Создать договор', async (ctx) => {
  const userId = ctx.from.id;
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
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.update.callback_query.data;
  if (data.startsWith('create_')) {
    const type = data.replace('create_', '');
    await ctx.answerCbQuery(`✅ Договор ${type}-1 создан!`);
  }
});

// Запуск бота + сервера
app.listen(port, () => {
  console.log(`HTTP сервер запущен на порту ${port}`);
  bot.launch().then(() => {
    console.log('🤖 Telegram бот запущен (polling)');
  }).catch(console.error);
});
