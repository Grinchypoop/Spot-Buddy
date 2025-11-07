const { Telegraf } = require('telegraf');
const { getSupabaseClient } = require('../db/supabase');

let bot;

function initializeTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  bot = new Telegraf(token);

  // Set up bot commands for all scopes
  const setupCommands = async () => {
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

      // Set commands for private chats
      await bot.telegram.setMyCommands(commands, { scope: { type: 'default' } });

      // Set commands for group chats
      await bot.telegram.setMyCommands(commands, { scope: { type: 'all_group_chats' } });

      console.log('Bot commands set successfully for all scopes');
    } catch (err) {
      console.error('Error setting commands:', err);
    }
  };

  setupCommands();

  // Start command - opens mini app
  bot.command('start', async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const userId = ctx.from.id;
      const chatType = ctx.chat.type;
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
  });

  // Help command
  bot.command('help', async (ctx) => {
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
  });

  // Handle incoming messages from mini app
  bot.on('web_app_data', async (ctx) => {
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
  });

  // Error handling
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  console.log('Telegram bot initialized');
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

module.exports = {
  initializeTelegramBot,
};
