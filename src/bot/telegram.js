const { Telegraf } = require('telegraf');
const { getSupabaseClient } = require('../db/supabase');

let bot;

// Handler function for start command
async function handleStartCommand(ctx) {
  try {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || 'User';

    // Save group and user to database
    await saveGroupAndUser(chatId, userId, ctx.from.username, ctx.chat.title);

    const miniAppLink = `${process.env.MINI_APP_URL}/mini-app?user_id=${userId}&chat_id=${chatId}`;

    // Create welcome message with instructions
    const welcomeMessage = `
👋 Welcome to Spot Buddy, ${userName}!

🏋️ *Track Your Workouts* - Log exercises, sets, reps, duration, mood & notes
📱 *Stay Motivated* - See your gym buddy's workouts in real-time
🎯 *Multiple Groups* - Use it for yourself or with friends

*How to Use:*
1️⃣ Tap below to open the app
2️⃣ Log your workouts
3️⃣ *Add to a group* to see your friends' workouts and keep each other accountable
4️⃣ Track progress together! 💪

*Commands:*
/start - Open Spot Buddy
/help - Get help

*Solo or Group?*
• Use it solo to track your personal workouts
• Add to group to see all member's workouts and motivate each other
`;

    // Send welcome message with button
    await ctx.telegram.sendMessage(
      chatId,
      welcomeMessage,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💪 Open Spot Buddy',
                url: miniAppLink
              }
            ],
            [
              {
                text: '➕ Add to Group',
                url: `https://t.me/${(await ctx.telegram.getMe()).username}?startgroup=true`
              }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Error in start command:', error);
    ctx.reply('Error starting app. Please try again.');
  }
}

// Handler function for help command
async function handleHelpCommand(ctx) {
  try {
    const helpMessage = `
*Spot Buddy Help* 💪

*Features:*
📝 Log Workouts - Record exercises with sets, reps, duration
😊 Mood Tracking - Rate how you felt during workout
📝 Add Notes - Write down any observations
👥 Group Tracking - See all group members' workouts
📅 Calendar View - Visual calendar of all workouts

*How it Works:*
1. Use */start* to open the app
2. Click "Log" tab to add a new workout
3. Click "Leaderboard" to see group workouts on calendar
4. Click any date to see who worked out that day

*Tips:*
💡 Add bot to your group to track workouts together
💡 Workouts sync across all your groups
💡 Use colored circles to see who's been active

Need more help? Check the app interface!
`;

    ctx.replyWithMarkdown(helpMessage);
  } catch (error) {
    console.error('Error in help command:', error);
    ctx.reply('Error getting help. Please try again.');
  }
}

// Handler function for web app data
async function handleWebAppData(ctx) {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    console.log('Received web app data:', data);

    // Notify group about the workout
    if (data.action === 'workout_logged') {
      const message = `${ctx.from.first_name} just logged a workout!\n${data.summary}`;
      await ctx.reply(message);
    }

    ctx.answerWebAppQuery(data.alert_id, { type: 'notification', notification_id: '123' });
  } catch (error) {
    console.error('Error handling web app data:', error);
  }
}

function initializeTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  bot = new Telegraf(token);

  // Register all handlers FIRST before setting up webhook
  // This ensures handlers are ready when updates come in
  console.log('Registering bot handlers...');

  // Use both command() and hears() to ensure commands are caught
  bot.command('start', (ctx) => {
    console.log('[Handler] /start command triggered');
    return handleStartCommand(ctx);
  });
  bot.hears('/start', (ctx) => {
    console.log('[Handler] /start heard');
    return handleStartCommand(ctx);
  });

  bot.command('help', (ctx) => {
    console.log('[Handler] /help command triggered');
    return handleHelpCommand(ctx);
  });
  bot.hears('/help', (ctx) => {
    console.log('[Handler] /help heard');
    return handleHelpCommand(ctx);
  });

  bot.on('web_app_data', (ctx) => {
    console.log('[Handler] web_app_data received');
    return handleWebAppData(ctx);
  });

  // Error handling
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  // Log all updates for debugging
  bot.use((ctx, next) => {
    console.log('[Bot] Update received:', {
      message: ctx.message?.text,
      type: ctx.updateType,
      chatType: ctx.chat?.type,
      chatId: ctx.chat?.id,
      from: ctx.from?.first_name
    });
    return next();
  });

  // Set up bot commands and start polling for all scopes
  // Polling is more reliable than webhooks on Azure
  const setupBotAndPolling = async () => {
    try {
      const commands = [
        {
          command: 'start',
          description: '🏋️ Start Spot Buddy - Track your gym workouts'
        },
        {
          command: 'help',
          description: '❓ Get help and learn how to use Spot Buddy'
        }
      ];

      // Set a timeout for the entire setup
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Bot setup timeout after 30 seconds')), 30000)
      );

      const setupPromise = (async () => {
        console.log('Setting up bot commands...');
        try {
          // Set commands for private chats
          await bot.telegram.setMyCommands(commands, { scope: { type: 'default' } });

          // Set commands for group chats
          await bot.telegram.setMyCommands(commands, { scope: { type: 'all_group_chats' } });

          console.log('Bot commands set successfully for all scopes');
        } catch (cmdErr) {
          console.warn('Could not set bot commands:', cmdErr.message);
        }

        // Delete any existing webhook and switch to polling
        try {
          console.log('Removing webhook and switching to polling mode...');
          await bot.telegram.deleteWebhook({ drop_pending_updates: false });
          console.log('Webhook deleted, polling mode enabled');
        } catch (err) {
          console.warn('Could not delete webhook:', err.message);
        }
      })();

      await Promise.race([setupPromise, timeoutPromise]);
    } catch (err) {
      console.error('Error during bot setup:', err.message);
    }
  };

  // Start setup in background with no awaiting
  setImmediate(setupBotAndPolling);

  // Start polling for updates
  bot.launch();

  console.log('Telegram bot initialized successfully');
  return bot;
}

async function saveGroupAndUser(chatId, userId, username, groupTitle) {
  try {
    const supabase = getSupabaseClient();

    // Save user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({ telegram_id: userId, username }, { onConflict: 'telegram_id' });

    if (userError) {
      console.error('Error saving user:', userError);
    }

    // Save group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .upsert({ telegram_chat_id: chatId, title: groupTitle }, { onConflict: 'telegram_chat_id' });

    if (groupError) {
      console.error('Error saving group:', groupError);
    }

    // Save group membership
    const { error: memberError } = await supabase.from('group_members').upsert(
      { user_id: userId, group_id: chatId },
      { onConflict: 'user_id,group_id' }
    );

    if (memberError) {
      console.error('Error saving group membership:', memberError);
    }
  } catch (error) {
    console.error('Error in saveGroupAndUser:', error);
  }
}

function getBot() {
  return bot;
}

module.exports = {
  initializeTelegramBot,
  getBot,
};
