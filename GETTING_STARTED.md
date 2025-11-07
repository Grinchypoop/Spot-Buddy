# 🚀 Getting Started with Spot Buddy

Welcome! Your Telegram gym buddy tracker is ready to build. Follow these steps to get it running.

## Prerequisites

Before you start, make sure you have:
- **Node.js** (v14+) - [Download here](https://nodejs.org/)
- **A Telegram account**
- **Supabase account** - [Sign up free](https://supabase.com)
- **ngrok** (for local testing) - [Download here](https://ngrok.com)
- **Code editor** (VS Code recommended)

## Step 1: Create Your Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow the prompts:
   - Enter bot name (e.g., "SpotBuddy")
   - Enter username (e.g., "spotbuddy_bot")
4. Copy the **token** - you'll need this!

Example token: `123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh`

## Step 2: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to **SQL Editor** and paste the entire contents of `src/db/schema.sql`
4. Click **Run** to create all tables
5. Go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 3: Configure Your Environment

1. In the project root, copy the template:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=eyJhbGci...long_key_here
   PORT=3000
   NODE_ENV=development
   MINI_APP_URL=http://localhost:3000
   ```

## Step 4: Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`.

## Step 5: Start the Server

```bash
npm start
```

You should see:
```
Server running on port 3000
Mini-app available at http://localhost:3000/mini-app
Telegram bot started
```

## Step 6: Expose Your Server with ngrok

Open a **new terminal** and run:

```bash
ngrok http 3000
```

You'll see something like:
```
Forwarding    https://abcd1234.ngrok.io → http://localhost:3000
```

**Copy the HTTPS URL** - you'll use this next!

## Step 7: Update Your .env File

In your original `.env` file, update `MINI_APP_URL`:

```env
MINI_APP_URL=https://abcd1234.ngrok.io
```

(Replace `abcd1234` with your actual ngrok URL)

## Step 8: Connect Bot to Telegram

In a terminal, run this command (replace placeholders):

```bash
curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook \
  -d "url=https://YOUR_NGROK_URL"
```

**Example:**
```bash
curl -X POST https://api.telegram.org/bot123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh/setWebhook \
  -d "url=https://abcd1234.ngrok.io"
```

You should see:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

## Step 9: Test Your Bot

1. Open Telegram
2. Find your bot (search by username like `@spotbuddy_bot`)
3. **Create a group** or **add bot to existing group**
   - Open group settings
   - Click **Add members**
   - Search and add your bot
4. In the group, type `/start`
5. You should see a message with two buttons:
   - 💪 Log Workout
   - 📊 View Streaks

## Step 10: Log Your First Workout

1. Click the **💪 Log Workout** button
2. The mini app will open! Fill in:
   - Exercise name (e.g., "Pullups")
   - Sets (e.g., "3")
   - Reps (e.g., "10")
   - Duration in minutes (optional)
   - Click **+ Add Exercise** to add more
3. Select your mood (😫 to 🔥)
4. Add optional notes
5. Click **Save Workout**

## Step 11: View Your Streaks

1. Click the **📊 View Streaks** button
2. You'll see a calendar for the current month
3. Days with workouts are highlighted in green
4. Click any date to see details

## Troubleshooting

### Bot not responding?
- Check your Telegram token in `.env`
- Make sure ngrok tunnel is running (window still open?)
- Check terminal for errors and search README.md

### Mini app not opening?
- Verify ngrok URL matches in `.env` and is still active
- Try refreshing Telegram
- Check browser console (F12) for JavaScript errors

### Workouts not saving?
- Check Supabase credentials are correct
- Verify database schema was created (check Supabase SQL Editor)
- Look for errors in server terminal

### Database doesn't exist?
- Go to Supabase > SQL Editor
- Copy entire contents of `src/db/schema.sql`
- Paste and click **Run**

## Next Steps

### 1. Add Your Friend
- Invite your friend to add your bot to the group
- They send `/start` too
- Now you both can see each other's workouts!

### 2. Customize (Optional)
- Edit colors in `public/mini-app/styles.css`
- Change mood emojis in `public/mini-app/app.js`
- Modify exercise tracking fields

### 3. Deploy (When Ready)
- Follow deployment guide in README.md
- Deploy to Azure App Service
- Update Telegram webhook to Azure URL

## Project Structure

```
Spot/
├── src/
│   ├── index.js              ← Main server
│   ├── bot/
│   │   └── telegram.js       ← Bot logic
│   ├── api/
│   │   ├── routes.js         ← API paths
│   │   └── controllers/      ← API functions
│   ├── db/
│   │   ├── supabase.js       ← Database client
│   │   └── schema.sql        ← Database setup
│   └── utils/                ← Helper functions
│
├── public/
│   └── mini-app/
│       ├── index.html        ← Web app structure
│       ├── styles.css        ← Design
│       └── app.js            ← Mini app logic
│
├── package.json              ← Dependencies
├── .env.example              ← Template
├── README.md                 ← Full docs
├── QUICKSTART.md             ← Quick start
└── ARCHITECTURE.md           ← System design
```

## Common Questions

**Q: Can I add the bot to multiple groups?**
A: Yes! Your workouts will automatically sync across all groups you're in.

**Q: Will my friend see my workouts if she's not in the group?**
A: No, she'll only see workouts in groups where you're both members.

**Q: Can I edit or delete workouts?**
A: Yes! Each workout has edit/delete options (coming in next update).

**Q: Is my data private?**
A: Yes, data is stored in your own Supabase database and only visible to group members.

**Q: Can I deploy to production?**
A: Yes! See ARCHITECTURE.md and README.md for Azure deployment steps.

## Get Help

- **Full Documentation**: See `README.md`
- **Architecture Details**: See `ARCHITECTURE.md`
- **Quick Reference**: See `QUICKSTART.md`
- **Issues**: Check the terminal output and documentation

## You're All Set! 💪

Your Spot Buddy gym tracker is ready to use. Start logging workouts and tracking your fitness journey with friends!

---

**Happy lifting!** 🏋️

Questions? Check the docs or open an issue in GitHub.
