# ✅ Spot Buddy Setup Checklist

Use this checklist to track your setup progress.

## 🎯 Pre-Setup (5 minutes)

- [ ] Install Node.js v14+ from [nodejs.org](https://nodejs.org)
- [ ] Download and install ngrok from [ngrok.com](https://ngrok.com)
- [ ] Create Telegram account (if needed)
- [ ] Create Supabase account at [supabase.com](https://supabase.com)

## 🤖 Telegram Bot Setup (5 minutes)

- [ ] Open Telegram and find @BotFather
- [ ] Send `/newbot` command
- [ ] Enter bot name (e.g., "SpotBuddy")
- [ ] Enter bot username (e.g., "spotbuddy_bot")
- [ ] **Save your bot token** (write it down or copy to .env)
- [ ] Optional: Customize bot settings with BotFather

## 🗄️ Supabase Database Setup (5 minutes)

- [ ] Create new Supabase project
- [ ] Wait for project to initialize
- [ ] Go to SQL Editor
- [ ] Open file `src/db/schema.sql`
- [ ] Copy entire SQL file contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click **Run** to execute
- [ ] Verify all tables created (check Tables in left sidebar)
- [ ] Go to Settings → API
- [ ] Copy **Project URL** (e.g., `https://xxxxx.supabase.co`)
- [ ] Copy **anon public** key
- [ ] **Save both values** (you'll need them in .env)

## 📦 Project Setup (2 minutes)

- [ ] Navigate to project folder: `cd /Users/mehtaz/Spot`
- [ ] Copy `.env.example` to `.env`: `cp .env.example .env`
- [ ] Open `.env` file in your editor
- [ ] Fill in:
  - [ ] `TELEGRAM_BOT_TOKEN=` (from BotFather)
  - [ ] `SUPABASE_URL=` (from Supabase Settings)
  - [ ] `SUPABASE_KEY=` (from Supabase Settings)
  - [ ] `MINI_APP_URL=` (will update later with ngrok URL)
- [ ] Save `.env` file
- [ ] Install dependencies: `npm install`

## 🚀 Local Deployment (5 minutes)

### Terminal 1: Start Node Server
- [ ] In project folder, run: `npm start`
- [ ] Wait for message: "Server running on port 3000"
- [ ] **Keep this terminal open**

### Terminal 2: Start ngrok
- [ ] Open new terminal
- [ ] Run: `ngrok http 3000`
- [ ] Copy the HTTPS URL (e.g., `https://abcd1234.ngrok.io`)
- [ ] **Keep this terminal open**

### Terminal 3: Update .env & Connect Bot
- [ ] Open `.env` file again
- [ ] Update `MINI_APP_URL=https://your-ngrok-url` (from ngrok Terminal)
- [ ] Save `.env`
- [ ] Open new terminal (Terminal 3)
- [ ] Run this command (replace placeholders):
  ```bash
  curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook \
    -d "url=https://YOUR_NGROK_URL"
  ```
- [ ] You should see: `{"ok":true,"result":true}`

## 🧪 Testing (5 minutes)

- [ ] Open Telegram app
- [ ] Search for your bot (`@spotbuddy_bot` or your username)
- [ ] Create a new group chat or find existing group
- [ ] Add the bot to the group
  - [ ] Open group
  - [ ] Add member
  - [ ] Search and add your bot
- [ ] In group chat, type: `/start`
- [ ] Bot should reply with welcome message
- [ ] You should see two buttons:
  - [ ] 💪 Log Workout
  - [ ] 📊 View Streaks

## 💪 Test Logging Workout

- [ ] Click "💪 Log Workout" button
- [ ] Mini app opens (blue header, 2 tabs)
- [ ] Fill in workout:
  - [ ] Exercise name: "Pushups"
  - [ ] Sets: "3"
  - [ ] Reps: "10"
  - [ ] Duration: "10"
  - [ ] Click "Add Exercise" (optional)
- [ ] Select mood emoji (e.g., 😊)
- [ ] Add optional note: "Great workout!"
- [ ] Click "Save Workout"
- [ ] Should see: "Workout saved successfully!"
- [ ] Form resets

## 📊 Test Calendar View

- [ ] Click "📊 View Streaks" button
- [ ] Calendar should appear with current month
- [ ] Today's date should be highlighted in green
- [ ] See navigation arrows to change month
- [ ] Click on a date with workout
- [ ] See detailed view with your workout info

## ✨ Advanced Testing (Optional)

- [ ] Add bot to **another group chat**
- [ ] Log workout in that group
- [ ] Log into **first group**
- [ ] Check that new workout appears in both groups' calendars
- [ ] Verify calendar shows correct user names
- [ ] Test mood emoji display
- [ ] Test notes display

## 🚀 Ready for More Friends!

- [ ] Share bot with a friend
- [ ] Add friend to same group
- [ ] Friend sends `/start`
- [ ] Friend logs workout
- [ ] Verify you can see friend's workouts in calendar
- [ ] Verify friend can see your workouts

## 📝 Documentation Review

- [ ] Read `GETTING_STARTED.md` (new user guide)
- [ ] Read `README.md` (full features & setup)
- [ ] Read `QUICKSTART.md` (quick reference)
- [ ] Read `ARCHITECTURE.md` (how it works)

## 🌐 Production Deployment (Later)

When you're ready to go live:

- [ ] Create Azure App Service account
- [ ] Connect GitHub repository
- [ ] Set environment variables in Azure
- [ ] Deploy code to Azure
- [ ] Update `MINI_APP_URL` in Azure settings
- [ ] Update Telegram webhook to Azure URL
- [ ] Test in production
- [ ] Share with friends!

## 🆘 Troubleshooting Checklist

If something doesn't work:

### Server not starting?
- [ ] Check if port 3000 is available
- [ ] Check `.env` file syntax
- [ ] Check all required env variables are filled
- [ ] Check Terminal 1 for error messages

### Bot not responding?
- [ ] Verify bot token is correct
- [ ] Check ngrok tunnel is active (Terminal 2)
- [ ] Check webhook was set successfully
- [ ] Restart bot with `npm start` in Terminal 1

### Mini app won't load?
- [ ] Check ngrok URL is correct
- [ ] Verify `MINI_APP_URL` in `.env` matches ngrok
- [ ] Check browser console for errors (F12)
- [ ] Try refreshing Telegram app

### Workouts not saving?
- [ ] Verify Supabase credentials in `.env`
- [ ] Check database tables exist in Supabase
- [ ] Check browser network tab for API errors
- [ ] Check Terminal 1 for server errors

### Database tables not created?
- [ ] Go to Supabase SQL Editor
- [ ] Verify `src/db/schema.sql` was executed
- [ ] Check "Tables" section in left sidebar
- [ ] Re-run schema if needed

## 📊 Success Indicators

You're ready to use the app when:

- ✅ Bot responds to `/start` in groups
- ✅ Buttons open mini app in Telegram
- ✅ Can log exercises and save workouts
- ✅ Calendar shows logged workouts
- ✅ Can see details by clicking dates
- ✅ Multiple users can log in same group
- ✅ Each user sees all group members' workouts

## 🎉 Congratulations!

You've successfully set up **Spot Buddy**!

You can now:
- 💪 Log workouts with exercises, sets, reps
- 👥 Track with friends in Telegram groups
- 📊 View history in a minimalistic calendar
- 😊 Track your mood during workouts
- 📝 Add notes to your sessions

## 📞 Need Help?

1. Check `GETTING_STARTED.md` for step-by-step guide
2. Check `README.md` for feature details
3. Check terminal output for error messages
4. Review `ARCHITECTURE.md` for technical details

---

**You're all set! Time to start training.** 💪🏋️

Next: Add your gym buddy to the group and start logging workouts together!
