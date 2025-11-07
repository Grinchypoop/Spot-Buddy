# 📋 Spot Buddy Quick Reference Guide

## File Organization

```
Spot/
├── src/
│   ├── index.js                          Main server
│   ├── bot/telegram.js                   Bot logic
│   ├── api/routes.js                     API endpoints
│   ├── api/controllers/workoutController.js  Workout operations
│   ├── api/controllers/groupController.js    Group operations
│   ├── db/supabase.js                    Database client
│   └── db/schema.sql                     Database setup
├── public/mini-app/
│   ├── index.html                        Web app structure
│   ├── styles.css                        Design
│   └── app.js                            Mini app logic
├── .env.example                          Template for .env
├── package.json                          Dependencies
├── README.md                             Full documentation
├── GETTING_STARTED.md                    Setup guide
├── QUICKSTART.md                         Quick setup
├── SETUP_CHECKLIST.md                    Setup checklist
└── ARCHITECTURE.md                       System design
```

## Commands

### Setup
```bash
npm install                    # Install dependencies
npm start                      # Start server (localhost:3000)
ngrok http 3000              # Expose to internet
```

### Update Telegram Webhook
```bash
curl -X POST https://api.telegram.org/botTOKEN/setWebhook -d "url=NGROK_URL"
```

## Environment Variables (.env)

```env
TELEGRAM_BOT_TOKEN=your_bot_token
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key
PORT=3000
NODE_ENV=development
MINI_APP_URL=https://ngrok_url
```

## Database Tables

### users
- `id`: Telegram ID (primary key)
- `telegram_id`: Telegram user ID (unique)
- `username`: Telegram username

### groups
- `id`: Chat ID (primary key)
- `telegram_chat_id`: Telegram group ID (unique)
- `title`: Group name

### group_members
- `user_id` → users
- `group_id` → groups

### workouts
- `user_id` → users
- `group_id` → groups
- `exercises`: JSON array
- `mood`: Emoji string
- `notes`: Optional text
- `timezone`: User timezone
- `date`: Workout timestamp

## API Endpoints

### Workouts
```
POST   /api/workouts
GET    /api/workouts/:userId
GET    /api/workouts/group/:groupId
PUT    /api/workouts/:workoutId
DELETE /api/workouts/:workoutId
```

### Groups
```
GET    /api/groups/:groupId/members
GET    /api/groups/:groupId/workouts/:date
```

## Mini App Tabs

### 💪 Log Workout
- Add multiple exercises
- Track sets, reps, duration
- Select mood (5 emojis)
- Add optional notes
- Submit to save

### 📊 Streaks
- Monthly calendar view
- Days with workouts highlighted
- Click date for details
- See all group members' workouts

## Workout Data Format

```json
{
  "user_id": 123456,
  "group_id": -789012,
  "exercises": [
    {
      "name": "Pullups",
      "sets": 3,
      "reps": 10,
      "duration": 15
    },
    {
      "name": "Pushups",
      "sets": 2,
      "reps": 15,
      "duration": null
    }
  ],
  "mood": "amazing",
  "notes": "Great session!",
  "timezone": "America/New_York",
  "date": "2024-11-07T16:30:00Z"
}
```

## Mood Emojis

| Emoji | Value | Meaning |
|-------|-------|---------|
| 😫 | terrible | Really bad |
| 😔 | bad | Not great |
| 😐 | okay | Average |
| 😊 | good | Good session |
| 🔥 | amazing | Excellent! |

## Common Tasks

### Add Bot to Group
1. Open Telegram group
2. Add member (+)
3. Search bot by username
4. Add bot to group
5. Type `/start` in group

### Log a Workout
1. Click "💪 Log Workout"
2. Add exercises (name, sets, reps)
3. Add mood and notes
4. Click "Save Workout"

### View Group Workouts
1. Click "📊 View Streaks"
2. See calendar with green dates
3. Click date to see details
4. View all members' workouts

### See Cross-Group Workouts
- Log in Group A
- It appears in Group B automatically
- (Only if you're a member of both)

## Troubleshooting Commands

```bash
# Check server status
curl http://localhost:3000/health

# Check logs
# (Look in Terminal 1 where npm start is running)

# Restart server
# (Stop with Ctrl+C, then npm start again)

# Check ngrok status
# (Look in ngrok Terminal window)

# Check Supabase tables
# (Go to Supabase SQL Editor)
```

## Browser DevTools (F12)

### Check Network Requests
1. Press F12
2. Go to Network tab
3. Refresh page
4. Look for failed requests (red)
5. Click request to see details

### Check Console Errors
1. Press F12
2. Go to Console tab
3. Look for red error messages
4. Read error description

## Database Query Examples

### Get all users
```sql
SELECT * FROM users;
```

### Get user's workouts
```sql
SELECT * FROM workouts
WHERE user_id = 123456
ORDER BY date DESC;
```

### Get group workouts for date
```sql
SELECT * FROM workouts
WHERE group_id = -789012
AND date::date = '2024-11-07';
```

## Key Features

✅ **Log Workouts**: Multiple exercises, sets, reps, duration
✅ **Track Mood**: 5 emoji options
✅ **Add Notes**: Optional notes for context
✅ **Calendar View**: Monthly view with navigation
✅ **Group Sync**: See all members' workouts
✅ **Cross-Group**: Workouts sync across groups you're in
✅ **Timezone Aware**: Automatic timezone detection
✅ **Edit/Delete**: Modify past workouts (coming soon)

## Security

- Row Level Security enabled on all tables
- Environment variables keep secrets safe
- No hardcoded credentials
- Input validation on forms
- Database prepared statements

## Performance

- Database indexes on key columns
- JSON storage for flexible data
- Efficient calendar queries
- Optimized for mobile
- Fast form submission

## Next Steps

1. Follow GETTING_STARTED.md
2. Complete SETUP_CHECKLIST.md
3. Test with friend
4. Deploy to Azure
5. Share with more friends

## Useful Links

- **Telegram**: https://telegram.org
- **Supabase**: https://supabase.com
- **ngrok**: https://ngrok.com
- **Node.js**: https://nodejs.org
- **Express**: https://expressjs.com
- **Telegraf**: https://telegraf.js.org

## File Sizes

```
Backend: ~5KB
Frontend: ~15KB
Database: Schema only (no data)
Total: ~20KB before dependencies
```

## Port Info

| Service | Port | URL |
|---------|------|-----|
| Node Server | 3000 | http://localhost:3000 |
| ngrok | auto | https://xxx.ngrok.io |
| Mini App | 3000 | http://localhost:3000/mini-app |

## Environment Summary

| Setting | Local | Production |
|---------|-------|------------|
| Server | localhost:3000 | Azure App Service |
| Database | Supabase | Supabase (cloud) |
| Tunnel | ngrok | Direct HTTPS |
| Webhook | ngrok URL | Azure URL |

## Git Workflow (Optional)

```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

(Recommended .gitignore is included)

## Deployment Timeline

- **Local Testing**: 15 minutes
- **Friend Testing**: 30 minutes
- **Azure Deployment**: 30 minutes
- **Production Ready**: 1-2 hours total

## Support Resources

1. **GETTING_STARTED.md** - Step-by-step guide
2. **README.md** - Full features & docs
3. **ARCHITECTURE.md** - System design
4. **QUICKSTART.md** - Quick reference
5. **Terminal Logs** - Error messages and debug info

## Success Checklist

- ✅ Bot responds to `/start`
- ✅ Mini app opens in Telegram
- ✅ Can log workout with exercises
- ✅ Can see calendar with workouts
- ✅ Friend can see your workouts
- ✅ You can see friend's workouts

---

**You're ready to build!** 💪

Start with GETTING_STARTED.md and follow along.
