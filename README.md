# Spot Buddy - Gym Workout Tracker Bot

A Telegram bot that helps you and your friends track gym workouts together, even when you're far apart!

## Features

- 💪 **Log Workouts**: Add exercises with sets, reps, and duration
- 😊 **Mood Tracking**: Select how you're feeling during your workout
- 📝 **Notes**: Add notes about your workout session
- 📊 **Streaks**: View a minimalistic calendar with workout history
- 👥 **Group-based**: Track with friends in Telegram groups
- 🌍 **Timezone-aware**: Logs are saved according to your timezone
- ✏️ **Edit/Delete**: Modify or remove past workouts

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Bot Framework**: Telegraf
- **Frontend**: HTML/CSS/JavaScript (Mini App)
- **Deployment**: ngrok (local testing), Azure (production)

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- npm
- Telegram Bot Token (from @BotFather)
- Supabase Account and Project
- ngrok account (for local testing)

### 2. Create a Telegram Bot

1. Open Telegram and chat with @BotFather
2. Use `/newbot` command to create a new bot
3. Follow the instructions and get your bot token
4. Enable inline mode: `/setinline`
5. Set web app support: `/setinlinequerymode` then choose "query_only"

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the queries from `src/db/schema.sql`
4. Get your Supabase URL and anon key from Settings > API

### 4. Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development
MINI_APP_URL=your_ngrok_url_or_production_url
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Locally with ngrok

1. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

2. In a new terminal, start ngrok:
```bash
ngrok http 3000
```

3. Copy the ngrok URL and update `MINI_APP_URL` in `.env`

4. Register the webhook with Telegram:
```bash
curl -F "url=https://your-ngrok-url/api/telegram" https://api.telegram.org/botYOUR_TOKEN/setWebhook
```

### 7. Test the Bot

1. Add the bot to a Telegram group
2. Type `/start` in the group
3. Click on "Log Workout" or "View Streaks" buttons
4. The mini app will open!

## API Endpoints

### Workouts
- `POST /api/workouts` - Create a new workout
- `GET /api/workouts/:userId` - Get user's workouts
- `GET /api/workouts/group/:groupId` - Get group workouts
- `PUT /api/workouts/:workoutId` - Update a workout
- `DELETE /api/workouts/:workoutId` - Delete a workout

### Groups
- `GET /api/groups/:groupId/members` - Get group members
- `GET /api/groups/:groupId/workouts/:date` - Get workouts for a specific date

## Database Schema

### users
- `id` (PK): Telegram user ID
- `telegram_id`: Unique telegram ID
- `username`: Telegram username
- `created_at`: Timestamp
- `updated_at`: Timestamp

### groups
- `id` (PK): Telegram chat ID
- `telegram_chat_id`: Unique telegram chat ID
- `title`: Group name
- `created_at`: Timestamp
- `updated_at`: Timestamp

### group_members
- `id` (PK): Primary key
- `user_id` (FK): References users
- `group_id` (FK): References groups
- `joined_at`: When user joined the group

### workouts
- `id` (PK): Primary key
- `user_id` (FK): References users
- `group_id` (FK): References groups
- `exercises` (JSONB): Array of exercise objects
- `mood`: User's mood emoji/value
- `notes`: Workout notes
- `timezone`: User's timezone
- `date`: Workout date/time
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Workout Data Format

```json
{
  "exercises": [
    {
      "name": "Pullups",
      "sets": 3,
      "reps": 10,
      "duration": 15
    }
  ],
  "mood": "amazing",
  "notes": "Great workout!",
  "timezone": "America/New_York"
}
```

## Group-based Visibility

- **Same group**: If you log a workout in Group A, it will also show in Group A's calendar
- **Different groups**: If you're in Group A and Group B separately, your workouts will appear in both groups' calendars (since you're a member)
- **Cross-group**: Your friend's workouts only show in groups where they're a member

## Calendar Features

- Monthly view with navigation (previous/next month)
- Days with workouts are highlighted in green
- Click any date to see detailed workout logs from group members
- Timezone-aware date calculations
- Shows all group members' workouts for selected date

## Deployment (Production)

### Using Azure

1. Create an Azure App Service
2. Connect your GitHub repository
3. Set environment variables in Azure Portal:
   - `TELEGRAM_BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `MINI_APP_URL` (your Azure App Service URL)
   - `NODE_ENV=production`

4. Deploy and set the webhook:
```bash
curl -F "url=https://your-azure-url/api/telegram" https://api.telegram.org/botYOUR_TOKEN/setWebhook
```

## Troubleshooting

### Bot not responding
- Check if bot token is correct in `.env`
- Verify webhook is properly set
- Check server logs for errors

### Mini app not loading
- Ensure `MINI_APP_URL` is correct and publicly accessible
- Check browser console for errors
- Verify files are served correctly

### Workouts not saving
- Check Supabase connection
- Verify database schema is created
- Check browser network requests in DevTools

### Timezone issues
- The bot captures user's timezone automatically
- Calendar is adjusted based on user's timezone
- Check system timezone settings

## Future Enhancements

- [ ] Friend requests system
- [ ] Leaderboards
- [ ] Personal stats and analytics
- [ ] Photo support for workouts
- [ ] Workout templates
- [ ] Push notifications for friend's workouts
- [ ] Integration with fitness wearables
- [ ] Social features (comments, likes)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License

## Support

For issues or questions, open an issue on GitHub or contact the developer.

---

Made with 💪 for gym buddies everywhere!
