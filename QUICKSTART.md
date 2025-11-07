# Spot Buddy - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Get Your Telegram Bot Token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow the prompts to create your bot
4. Copy the bot token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to **SQL Editor** > **New Query**
4. Copy the entire contents of `src/db/schema.sql` and paste it
5. Click **Run**
6. Go to **Settings** > **API** and copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_KEY)

### Step 3: Configure Environment

1. Create `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...your_key_here
PORT=3000
MINI_APP_URL=http://localhost:3000
```

### Step 4: Install & Run

```bash
# Install dependencies
npm install

# Start the server
npm start
```

You should see:
```
Server running on port 3000
Mini-app available at http://localhost:3000/mini-app
Telegram bot started
```

### Step 5: Expose to Internet with ngrok

In a new terminal:

```bash
# Download ngrok from https://ngrok.com
# Then run:
ngrok http 3000
```

You'll see something like:
```
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

### Step 6: Connect Bot to Telegram

```bash
# Replace YOUR_BOT_TOKEN with your actual token
# Replace YOUR_NGROK_URL with the https URL from ngrok
curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook \
  -d "url=YOUR_NGROK_URL"
```

Example:
```bash
curl -X POST https://api.telegram.org/bot123456:ABC-DEF1234/setWebhook \
  -d "url=https://abc123.ngrok.io"
```

### Step 7: Test the Bot

1. Open Telegram
2. Find your bot (search for its name)
3. Or add it to a group (right-click group > Add member > search bot)
4. Send `/start`
5. Click the **💪 Log Workout** button
6. Fill in your workout and submit!

---

## 📁 Project Structure

```
Spot/
├── src/
│   ├── index.js                 # Main server file
│   ├── bot/
│   │   └── telegram.js          # Bot command handlers
│   ├── api/
│   │   ├── routes.js            # API endpoints
│   │   └── controllers/
│   │       ├── workoutController.js
│   │       └── groupController.js
│   ├── db/
│   │   ├── supabase.js          # DB connection
│   │   └── schema.sql           # Database tables
│   └── utils/
├── public/
│   └── mini-app/
│       ├── index.html           # Web app UI
│       ├── styles.css           # Styling
│       └── app.js               # Mini app logic
├── .env.example                 # Environment template
├── package.json
├── README.md
└── QUICKSTART.md
```

---

## 🛠️ Troubleshooting

### Bot not responding?
- Check your bot token in `.env`
- Make sure ngrok is running and webhook is set
- Check logs with: `npm start`

### Mini app not opening?
- Update `MINI_APP_URL` in `.env` with your ngrok URL
- Make sure ngrok tunnel is active
- Try refreshing Telegram app

### Workouts not saving?
- Check Supabase credentials
- Verify database schema was created (check SQL Editor)
- Open DevTools (F12) to see any errors

### Database not created?
- Go to Supabase > SQL Editor
- Paste content of `src/db/schema.sql`
- Click **Run** to execute

---

## 📝 Next Steps

1. **Customize**: Edit `styles.css` to match your theme
2. **Deploy**: Once working locally, deploy to Azure
3. **Invite Friends**: Add the bot to group chats
4. **Start Tracking**: Log your first workout!

---

## 🎯 How It Works

1. **User adds bot to group** → `/start` command triggered
2. **User clicks "Log Workout"** → Mini app opens
3. **User fills form** → Exercises, mood, notes
4. **Submit** → Data sent to Supabase
5. **View Streaks** → See calendar with all group members' workouts

---

## 🚀 Deploy to Azure (Later)

When you're ready for production:

1. Push code to GitHub
2. Create Azure App Service
3. Connect GitHub repo
4. Set environment variables in Azure
5. Update `MINI_APP_URL` to your Azure URL
6. Update Telegram webhook to your Azure URL

---

Need help? Check README.md for detailed documentation!

Good luck with Spot Buddy! 💪🏋️
